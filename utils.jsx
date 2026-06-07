/* ── Noise & Helpers ──────────────────────────────── */
function _hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) & 0xFFFF) / 0xFFFF;
}

function _smoothNoise(x, y, scale) {
  const sx = x / scale, sy = y / scale;
  const ix = Math.floor(sx), iy = Math.floor(sy);
  const fx = sx - ix, fy = sy - iy;
  const a = _hash(ix, iy), b = _hash(ix+1, iy);
  const c = _hash(ix, iy+1), d = _hash(ix+1, iy+1);
  return (a+(b-a)*fx) + ((c+(d-c)*fx) - (a+(b-a)*fx)) * fy;
}

function fractalNoise(x, y) {
  return _smoothNoise(x,y,40)*0.5 + _smoothNoise(x,y,20)*0.25 +
         _smoothNoise(x,y,10)*0.125 + _smoothNoise(x,y,5)*0.0625;
}

/* ── Colormaps ───────────────────────────────────── */
function _makeCmap(stops) {
  return function(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 0; i < stops.length - 1; i++) {
      if (t <= stops[i+1][0]) {
        const f = (t - stops[i][0]) / (stops[i+1][0] - stops[i][0] || 1);
        return [
          stops[i][1] + f*(stops[i+1][1]-stops[i][1]),
          stops[i][2] + f*(stops[i+1][2]-stops[i][2]),
          stops[i][3] + f*(stops[i+1][3]-stops[i][3])
        ];
      }
    }
    const s = stops[stops.length-1];
    return [s[1], s[2], s[3]];
  };
}

const COLORMAPS = {
  grayscale: _makeCmap([[0,0,0,0],[1,255,255,255]]),
  bone: _makeCmap([[0,0,0,0],[0.35,80,80,112],[0.72,164,198,198],[1,255,255,255]]),
  hot: _makeCmap([[0,10,0,0],[0.35,200,0,0],[0.65,255,200,0],[1,255,255,255]]),
  cool: _makeCmap([[0,0,255,255],[1,255,0,255]]),
  jet: _makeCmap([[0,0,0,140],[0.12,0,0,255],[0.37,0,255,255],[0.5,0,255,0],[0.62,255,255,0],[0.87,255,0,0],[1,140,0,0]]),
  viridis: _makeCmap([[0,68,1,84],[0.25,59,82,139],[0.5,33,145,140],[0.75,94,201,98],[1,253,231,37]]),
  plasma: _makeCmap([[0,13,8,135],[0.25,126,3,168],[0.5,204,71,120],[0.75,248,149,64],[1,240,249,33]]),
  inferno: _makeCmap([[0,0,0,4],[0.25,87,16,110],[0.5,188,55,84],[0.75,249,142,9],[1,252,255,164]]),
};

const COLORMAP_NAMES = Object.keys(COLORMAPS);

/* ── Segmentation Colors ─────────────────────────── */
const SEGMENT_COLORS = [
  null,                       // 0: background
  [220, 80, 80, 140],         // 1: cortical gray matter
  [80, 120, 220, 140],        // 2: white matter
  [80, 200, 120, 140],        // 3: CSF
  [240, 200, 50, 140],        // 4: ventricles
  [200, 120, 50, 140],        // 5: deep gray (thalamus/caudate)
  [220, 60, 220, 140],        // 6: lesion/abnormality
];

const SEGMENT_LABELS = [
  'Background', 'Cortical GM', 'White Matter', 'CSF',
  'Ventricles', 'Deep Gray', 'Lesion'
];

/* ── Brain Slice Generation ──────────────────────── */
function generateBrainSlice(w, h, plane, position) {
  const data = new Float32Array(w * h);
  const labels = new Uint8Array(w * h);
  const cx = w / 2, cy = h / 2;
  const baseR = Math.min(w, h) * 0.44;
  const p = Math.max(0.04, Math.min(0.96, position));
  const scale = Math.sin(Math.PI * p);
  if (scale < 0.08) return { data, labels };

  let rxSkull, rySkull;
  if (plane === 'axial')    { rxSkull = 0.92*scale; rySkull = 0.76*scale; }
  else if (plane === 'coronal') { rxSkull = 0.92*scale; rySkull = 1.0*scale; }
  else                      { rxSkull = 0.78*scale; rySkull = 1.0*scale; }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / baseR;
      const ny = (y - cy) / baseR;
      const idx = y * w + x;

      // Distance from skull boundary
      const skullD = Math.sqrt((nx*nx)/(rxSkull*rxSkull) + (ny*ny)/(rySkull*rySkull));
      if (skullD > 1.08) continue;

      const noise = fractalNoise(x*1.3 + plane.charCodeAt(0)*100, y*1.3 + Math.round(p*100)*37);

      // Scalp
      if (skullD > 1.0) {
        data[idx] = 0.18 + noise * 0.04;
        continue;
      }
      // Skull bone
      if (skullD > 0.92) {
        data[idx] = 0.35 + noise * 0.03;
        continue;
      }

      // Brain boundary
      const brainScale = 0.92;
      const brainD = skullD / brainScale;

      // Interhemispheric fissure
      const fissW = 0.018 * (1.0 - brainD * 0.3);
      const inFissure = plane !== 'sagittal' && Math.abs(nx) < fissW * rxSkull && ny < rySkull * 0.55;
      if (inFissure) { data[idx] = 0.06; labels[idx] = 3; continue; }

      // Ventricles
      let inVent = false;
      const vs = scale * 0.85;
      if (plane === 'axial') {
        const vo = 0.11, vrx = 0.10*vs, vry = 0.045*vs;
        const lv = ((nx+vo)*(nx+vo))/(vrx*vrx) + ((ny+0.01)*(ny+0.01))/(vry*vry);
        const rv = ((nx-vo)*(nx-vo))/(vrx*vrx) + ((ny+0.01)*(ny+0.01))/(vry*vry);
        inVent = lv < 1 || rv < 1;
      } else if (plane === 'coronal') {
        const vo = 0.09, vrx = 0.05*vs, vry = 0.09*vs;
        const lv = ((nx+vo)*(nx+vo))/(vrx*vrx) + ((ny-0.04)*(ny-0.04))/(vry*vry);
        const rv = ((nx-vo)*(nx-vo))/(vrx*vrx) + ((ny-0.04)*(ny-0.04))/(vry*vry);
        inVent = lv < 1 || rv < 1;
      } else {
        const vrx = 0.13*vs, vry = 0.06*vs;
        inVent = (nx*nx)/(vrx*vrx) + ((ny-0.02)*(ny-0.02))/(vry*vry) < 1;
      }
      if (inVent) { data[idx] = 0.04 + noise*0.02; labels[idx] = 4; continue; }

      // Deep gray matter (thalamus region)
      const deepR = Math.sqrt(nx*nx*14 + (ny+0.01)*(ny+0.01)*18);
      if (deepR < 0.42*vs && plane !== 'sagittal') {
        data[idx] = 0.52 + noise * 0.08;
        labels[idx] = 5;
        continue;
      }

      // White vs Gray matter
      const wmRx = rxSkull * 0.58, wmRy = rySkull * 0.58;
      const wmD = Math.sqrt((nx*nx)/(wmRx*wmRx) + (ny*ny)/(wmRy*wmRy));

      if (wmD < 1) {
        // White matter
        data[idx] = 0.82 + noise * 0.10;
        labels[idx] = 2;
      } else {
        // Gray matter
        data[idx] = 0.52 + noise * 0.14;
        // Sulci simulation
        const sulcusNoise = _smoothNoise(x*2.5, y*2.5, 9);
        if (sulcusNoise > 0.62 && brainD > 0.75) {
          data[idx] *= 0.35;
          labels[idx] = 3; // CSF in sulcus
        } else {
          labels[idx] = 1;
        }
      }

      // Add a simulated lesion for demo (small bright spot)
      if (plane === 'axial' && p > 0.4 && p < 0.65) {
        const lx = 0.22, ly = -0.12, lr = 0.06 * scale;
        const ld = Math.sqrt((nx-lx)*(nx-lx) + (ny-ly)*(ny-ly));
        if (ld < lr) {
          data[idx] = 0.95 - ld/lr * 0.3 + noise*0.05;
          labels[idx] = 6;
        }
      }
    }
  }
  return { data, labels };
}

/* ── Render to ImageData ─────────────────────────── */
function renderToImageData(ctx, w, h, intensityData, colormapName, segLabels, showOverlay, overlayAlpha) {
  const imgData = ctx.createImageData(w, h);
  const px = imgData.data;
  const cmap = COLORMAPS[colormapName] || COLORMAPS.grayscale;

  for (let i = 0; i < w * h; i++) {
    const [r, g, b] = cmap(intensityData[i]);
    const j = i * 4;
    px[j] = r; px[j+1] = g; px[j+2] = b; px[j+3] = 255;

    if (showOverlay && segLabels && segLabels[i] > 0) {
      const sc = SEGMENT_COLORS[segLabels[i]];
      if (sc) {
        const a = (sc[3] / 255) * (overlayAlpha || 0.5);
        px[j]   = px[j]*(1-a) + sc[0]*a;
        px[j+1] = px[j+1]*(1-a) + sc[1]*a;
        px[j+2] = px[j+2]*(1-a) + sc[2]*a;
      }
    }
  }
  return imgData;
}

/* ── Model Architectures Data ────────────────────── */
const MODEL_ARCHITECTURES = {
  'U-Net': {
    type: 'encoder-decoder',
    params: '31.4M',
    encoder: [
      { name: 'Enc-1', ch: '1→64', res: '256³', layers: ['Conv3d(1,64,3)', 'BatchNorm3d', 'ReLU', 'Conv3d(64,64,3)', 'BatchNorm3d', 'ReLU'], color: '#3B82F6' },
      { name: 'Enc-2', ch: '64→128', res: '128³', layers: ['MaxPool3d(2)', 'Conv3d(64,128,3)', 'BatchNorm3d', 'ReLU', 'Conv3d(128,128,3)', 'BatchNorm3d', 'ReLU'], color: '#6366F1' },
      { name: 'Enc-3', ch: '128→256', res: '64³', layers: ['MaxPool3d(2)', 'Conv3d(128,256,3)', 'BatchNorm3d', 'ReLU', 'Conv3d(256,256,3)', 'BatchNorm3d', 'ReLU'], color: '#8B5CF6' },
      { name: 'Enc-4', ch: '256→512', res: '32³', layers: ['MaxPool3d(2)', 'Conv3d(256,512,3)', 'BatchNorm3d', 'ReLU', 'Conv3d(512,512,3)', 'BatchNorm3d', 'ReLU'], color: '#A855F7' },
    ],
    bottleneck: { name: 'Bottleneck', ch: '512→1024', res: '16³', layers: ['MaxPool3d(2)', 'Conv3d(512,1024,3)', 'BatchNorm3d', 'ReLU', 'Conv3d(1024,1024,3)', 'BatchNorm3d', 'ReLU'], color: '#EC4899' },
    decoder: [
      { name: 'Dec-4', ch: '1024→512', res: '32³', layers: ['ConvTranspose3d(1024,512,2)', 'Cat(skip-4)', 'Conv3d(1024,512,3)', 'BatchNorm3d', 'ReLU'], color: '#F97316' },
      { name: 'Dec-3', ch: '512→256', res: '64³', layers: ['ConvTranspose3d(512,256,2)', 'Cat(skip-3)', 'Conv3d(512,256,3)', 'BatchNorm3d', 'ReLU'], color: '#EAB308' },
      { name: 'Dec-2', ch: '256→128', res: '128³', layers: ['ConvTranspose3d(256,128,2)', 'Cat(skip-2)', 'Conv3d(256,128,3)', 'BatchNorm3d', 'ReLU'], color: '#22C55E' },
      { name: 'Dec-1', ch: '128→64', res: '256³', layers: ['ConvTranspose3d(128,64,2)', 'Cat(skip-1)', 'Conv3d(128,64,3)', 'BatchNorm3d', 'ReLU'], color: '#10B981' },
    ],
    output: { name: 'Output', ch: '64→C', layers: ['Conv3d(64,C,1)', 'Softmax'], color: '#06B6D4' },
  },
  'SwinUNETR': {
    type: 'transformer',
    params: '62.2M',
    encoder: [
      { name: 'Patch Embed', ch: '1→48', res: '128³', layers: ['PatchPartition(2)', 'LinearEmbed(48)'], color: '#3B82F6' },
      { name: 'Stage-1', ch: '48→48', res: '128³', layers: ['SwinBlock×2', 'W-MSA(heads=3)', 'SW-MSA(heads=3)', 'MLP(ratio=4)'], color: '#6366F1' },
      { name: 'Stage-2', ch: '96→96', res: '64³', layers: ['PatchMerge(96)', 'SwinBlock×2', 'W-MSA(heads=6)', 'SW-MSA(heads=6)'], color: '#8B5CF6' },
      { name: 'Stage-3', ch: '192→192', res: '32³', layers: ['PatchMerge(192)', 'SwinBlock×2', 'W-MSA(heads=12)', 'SW-MSA(heads=12)'], color: '#A855F7' },
    ],
    bottleneck: { name: 'Stage-4', ch: '384→384', res: '16³', layers: ['PatchMerge(384)', 'SwinBlock×2', 'W-MSA(heads=24)', 'SW-MSA(heads=24)'], color: '#EC4899' },
    decoder: [
      { name: 'Up-4', ch: '384→192', res: '32³', layers: ['Deconv(384,192,2)', 'Cat(skip)', 'ResBlock(384,192)'], color: '#F97316' },
      { name: 'Up-3', ch: '192→96', res: '64³', layers: ['Deconv(192,96,2)', 'Cat(skip)', 'ResBlock(192,96)'], color: '#EAB308' },
      { name: 'Up-2', ch: '96→48', res: '128³', layers: ['Deconv(96,48,2)', 'Cat(skip)', 'ResBlock(96,48)'], color: '#22C55E' },
      { name: 'Up-1', ch: '48→48', res: '256³', layers: ['Deconv(48,48,2)', 'ResBlock(48,48)'], color: '#10B981' },
    ],
    output: { name: 'Output', ch: '48→C', layers: ['Conv3d(48,C,1)', 'Softmax'], color: '#06B6D4' },
  },
  'nnU-Net': {
    type: 'encoder-decoder',
    params: '~30M (auto)',
    encoder: [
      { name: 'Enc-1', ch: '1→32', res: 'auto', layers: ['Conv3d(1,32,3)', 'InstanceNorm', 'LeakyReLU', 'Conv3d(32,32,3)', 'InstanceNorm', 'LeakyReLU'], color: '#3B82F6' },
      { name: 'Enc-2', ch: '32→64', res: 'auto/2', layers: ['StrideConv(32,64,3,s=2)', 'InstanceNorm', 'LeakyReLU', 'Conv3d(64,64,3)', 'InstanceNorm', 'LeakyReLU'], color: '#6366F1' },
      { name: 'Enc-3', ch: '64→128', res: 'auto/4', layers: ['StrideConv(64,128,3,s=2)', 'InstanceNorm', 'LeakyReLU', 'Conv3d(128,128,3)'], color: '#8B5CF6' },
      { name: 'Enc-4', ch: '128→256', res: 'auto/8', layers: ['StrideConv(128,256,3,s=2)', 'InstanceNorm', 'LeakyReLU', 'Conv3d(256,256,3)'], color: '#A855F7' },
    ],
    bottleneck: { name: 'Bottleneck', ch: '256→320', res: 'auto/16', layers: ['StrideConv(256,320,3,s=2)', 'InstanceNorm', 'LeakyReLU', 'Conv3d(320,320,3)'], color: '#EC4899' },
    decoder: [
      { name: 'Dec-4', ch: '320→256', res: 'auto/8', layers: ['ConvTranspose3d(320,256,2)', 'Cat(skip)', 'Conv3d(512,256,3)', 'InstanceNorm', 'LeakyReLU'], color: '#F97316' },
      { name: 'Dec-3', ch: '256→128', res: 'auto/4', layers: ['ConvTranspose3d(256,128,2)', 'Cat(skip)', 'Conv3d(256,128,3)'], color: '#EAB308' },
      { name: 'Dec-2', ch: '128→64', res: 'auto/2', layers: ['ConvTranspose3d(128,64,2)', 'Cat(skip)', 'Conv3d(128,64,3)'], color: '#22C55E' },
      { name: 'Dec-1', ch: '64→32', res: 'auto', layers: ['ConvTranspose3d(64,32,2)', 'Cat(skip)', 'Conv3d(64,32,3)'], color: '#10B981' },
    ],
    output: { name: 'Output', ch: '32→C', layers: ['Conv3d(32,C,1)'], color: '#06B6D4' },
  },
};

/* ── Task type config ────────────────────────────── */
const MODEL_TASKS = {
  'Segmentation':       { badge: 'badge-cyan',    icon: '⬡', description: 'Brain region / tumor segmentation' },
  'Classification':     { badge: 'badge-purple',  icon: '◆', description: 'Disease classification' },
  'Registration':       { badge: 'badge-green',   icon: '⊞', description: 'Image alignment & registration' },
  'Synthesis':          { badge: 'badge-amber',   icon: '◎', description: 'Image generation / translation' },
  'Anomaly Detection':  { badge: 'badge-magenta', icon: '△', description: 'Anomaly & outlier detection' },
  'Foundation Model':   { badge: 'badge-cyan',    icon: '◇', description: 'General-purpose foundation model' },
};

/* ── Export ───────────────────────────────────────── */
Object.assign(window, {
  fractalNoise, COLORMAPS, COLORMAP_NAMES, SEGMENT_COLORS, SEGMENT_LABELS,
  generateBrainSlice, renderToImageData,
  MODEL_ARCHITECTURES, MODEL_TASKS,
});

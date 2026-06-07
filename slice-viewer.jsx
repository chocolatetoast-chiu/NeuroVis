const { useState, useCallback, useMemo } = React;

function SliceViewer() {
  const [crosshair, setCrosshair] = useState({ x: 0.5, y: 0.5, z: 0.5 });
  const [colormap, setColormap] = useState('bone');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayAlpha, setOverlayAlpha] = useState(0.45);
  const [windowLevel, setWindowLevel] = useState({ w: 1.0, l: 0.5 });
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const handleCrosshairChange = useCallback((plane, mx, my) => {
    setCrosshair(prev => {
      if (plane === 'axial')    return { ...prev, x: mx, y: my };
      if (plane === 'coronal')  return { ...prev, x: mx, z: my };
      if (plane === 'sagittal') return { ...prev, y: mx, z: my };
      return prev;
    });
  }, []);

  const sliceInfo = useMemo(() => ({
    axial:    `Z: ${Math.round(crosshair.z * 155)}`,
    coronal:  `Y: ${Math.round(crosshair.y * 185)}`,
    sagittal: `X: ${Math.round(crosshair.x * 155)}`,
  }), [crosshair]);

  return (
    <div className="fade-in" style={{ display: 'flex', gap: 12, height: '100%' }}>
      {/* Brain grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="brain-grid" style={{ flex: 1 }}>
          {/* Axial */}
          <div className="brain-cell">
            <span className="brain-cell-label">Axial</span>
            <span className="brain-cell-info">{sliceInfo.axial}</span>
            <BrainCanvas
              plane="axial" slicePos={crosshair.z} colormap={colormap}
              showOverlay={showOverlay} overlayAlpha={overlayAlpha}
              crosshairX={crosshair.x} crosshairY={crosshair.y}
              onCrosshairChange={handleCrosshairChange}
            />
          </div>
          {/* Coronal */}
          <div className="brain-cell">
            <span className="brain-cell-label">Coronal</span>
            <span className="brain-cell-info">{sliceInfo.coronal}</span>
            <BrainCanvas
              plane="coronal" slicePos={crosshair.y} colormap={colormap}
              showOverlay={showOverlay} overlayAlpha={overlayAlpha}
              crosshairX={crosshair.x} crosshairY={crosshair.z}
              onCrosshairChange={handleCrosshairChange}
            />
          </div>
          {/* Sagittal */}
          <div className="brain-cell">
            <span className="brain-cell-label">Sagittal</span>
            <span className="brain-cell-info">{sliceInfo.sagittal}</span>
            <BrainCanvas
              plane="sagittal" slicePos={crosshair.x} colormap={colormap}
              showOverlay={showOverlay} overlayAlpha={overlayAlpha}
              crosshairX={crosshair.y} crosshairY={crosshair.z}
              onCrosshairChange={handleCrosshairChange}
            />
          </div>
          {/* Info quadrant */}
          <div className="brain-cell" style={{ background: 'var(--bg-surface)', padding: 14, alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <span className="brain-cell-label">Coordinates</span>
            <div style={{ marginTop: 28, width: '100%' }}>
              <CoordRow label="X (L-R)" value={Math.round(crosshair.x * 155)} max={155} color="var(--red)" />
              <CoordRow label="Y (A-P)" value={Math.round(crosshair.y * 185)} max={185} color="var(--green)" />
              <CoordRow label="Z (S-I)" value={Math.round(crosshair.z * 155)} max={155} color="var(--accent)" />

              <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>
                  REGION AT CROSSHAIR
                </div>
                <RegionTag crosshair={crosshair} />
              </div>

              <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>
                  VOLUME INFO
                </div>
                <InfoRow label="Dimensions" value="256 × 256 × 156" />
                <InfoRow label="Voxel size" value="1.0 × 1.0 × 1.0 mm" />
                <InfoRow label="Orientation" value="RAS+" />
                <InfoRow label="Format" value="NIfTI-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom slice sliders */}
        <div style={{ display: 'flex', gap: 12, padding: '8px 4px', alignItems: 'center' }}>
          <SliceSlider label="Z" value={crosshair.z} color="var(--accent)"
            onChange={v => setCrosshair(p => ({...p, z: v}))} />
          <SliceSlider label="Y" value={crosshair.y} color="var(--green)"
            onChange={v => setCrosshair(p => ({...p, y: v}))} />
          <SliceSlider label="X" value={crosshair.x} color="var(--red)"
            onChange={v => setCrosshair(p => ({...p, x: v}))} />
        </div>
      </div>

      {/* Right controls panel */}
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {/* Colormap */}
        <div className="panel">
          <div className="panel-header">Colormap</div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select className="select-control" value={colormap}
              onChange={e => setColormap(e.target.value)} style={{ width: '100%' }}>
              {window.COLORMAP_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ColormapPreview name={colormap} />
          </div>
        </div>

        {/* Overlay */}
        <div className="panel">
          <div className="panel-header">
            Segmentation Overlay
            <div style={{ marginLeft: 'auto' }}>
              <button className={`btn-icon ${showOverlay ? 'active' : ''}`}
                onClick={() => setShowOverlay(!showOverlay)} title="Toggle overlay">
                {showOverlay ? <IconEye size={15}/> : <IconEyeOff size={15}/>}
              </button>
            </div>
          </div>
          {showOverlay && (
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="text-xs text-dim">Opacity</span>
                <input type="range" min="0" max="1" step="0.05" value={overlayAlpha}
                  onChange={e => setOverlayAlpha(+e.target.value)} style={{ flex: 1 }} />
                <span className="text-mono text-xs" style={{ width: 28 }}>{Math.round(overlayAlpha*100)}%</span>
              </div>
              <SegmentLegend />
            </div>
          )}
        </div>

        {/* Models */}
        <div className="panel">
          <div className="panel-header">Active Model</div>
          <div className="panel-body">
            <select className="select-control" style={{ width: '100%' }}>
              <option>U-Net (baseline)</option>
              <option>SwinUNETR</option>
              <option>nnU-Net</option>
            </select>
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span className="badge badge-cyan">Segmentation</span>
              <span className="badge badge-green">Trained</span>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="upload-zone" style={{ padding: 18, marginTop: 'auto' }}>
          <IconUpload size={22} style={{ color: 'var(--text-3)', margin: '0 auto 6px' }} />
          <div className="text-sm text-dim">Drop NIfTI / .npy</div>
          <div className="text-xs text-dim" style={{ marginTop: 2 }}>or click to browse</div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────── */
function CoordRow({ label, value, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span className="text-mono text-xs" style={{ color, width: 42 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${(value/max)*100}%`, height: '100%', background: color, borderRadius: 2 }}></div>
      </div>
      <span className="text-mono text-xs" style={{ width: 24, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function RegionTag({ crosshair }) {
  // Simulate region lookup based on crosshair position
  const dist = Math.sqrt((crosshair.x-0.5)**2 + (crosshair.y-0.5)**2);
  let region = 'White Matter', idx = 2;
  if (dist > 0.35) { region = 'Cortical GM'; idx = 1; }
  if (dist > 0.42) { region = 'CSF'; idx = 3; }
  if (dist < 0.08) { region = 'Ventricles'; idx = 4; }
  if (dist < 0.15 && dist > 0.08) { region = 'Deep Gray'; idx = 5; }

  const c = window.SEGMENT_COLORS[idx];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: c ? `rgba(${c[0]},${c[1]},${c[2]},0.8)` : '#555' }}></div>
      <span className="text-mono text-sm">{region}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span className="text-xs text-dim">{label}</span>
      <span className="text-mono text-xs">{value}</span>
    </div>
  );
}

function SliceSlider({ label, value, onChange, color }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className="text-mono text-xs" style={{ color, width: 14 }}>{label}</span>
      <input type="range" min="0.02" max="0.98" step="0.005" value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ flex: 1, accentColor: color }} />
      <span className="text-mono text-xs" style={{ width: 24, textAlign: 'right', color: 'var(--text-3)' }}>
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

function ColormapPreview({ name }) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const cmap = window.COLORMAPS[name] || window.COLORMAPS.grayscale;
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1);
      const [r, g, b] = cmap(t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }, [name]);
  return <canvas ref={canvasRef} width={172} height={14}
    style={{ width: '100%', height: 14, borderRadius: 3 }} />;
}

function SegmentLegend() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {window.SEGMENT_LABELS.slice(1).map((label, i) => {
        const c = window.SEGMENT_COLORS[i + 1];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, flexShrink: 0,
              background: c ? `rgb(${c[0]},${c[1]},${c[2]})` : '#555' }}></div>
            <span className="text-xs text-dim">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { SliceViewer });

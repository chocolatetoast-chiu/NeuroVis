const { useState } = React;

function DashboardView({ onNavigate }) {
  const [uploadHover, setUploadHover] = useState(false);

  const models = [
    { name: 'U-Net (baseline)', task: 'Segmentation', status: 'online', params: '31.4M',
      dice: '0.923', dataset: 'BraTS 2023', modality: 'MRI T1' },
    { name: 'SwinUNETR', task: 'Segmentation', status: 'online', params: '62.2M',
      dice: '0.941', dataset: 'BraTS 2023', modality: 'MRI T1+T2' },
    { name: 'nnU-Net (auto)', task: 'Segmentation', status: 'online', params: '~30M',
      dice: '0.937', dataset: 'BraTS 2023', modality: 'Multi-modal' },
    { name: 'BrainDiff-v2', task: 'Synthesis', status: 'warning', params: '85.6M',
      dice: '—', dataset: 'ADNI', modality: 'MRI → PET' },
    { name: 'AnomalyNet', task: 'Anomaly Detection', status: 'online', params: '18.2M',
      dice: '—', dataset: 'CamCAN', modality: 'MRI T1' },
    { name: 'BrainMAE', task: 'Foundation Model', status: 'online', params: '304M',
      dice: '—', dataset: 'UK Biobank', modality: 'Multi-modal' },
  ];

  const recentData = [
    { name: 'sub-001_T1w.nii.gz', size: '14.2 MB', mod: 'MRI T1', time: '2 min ago' },
    { name: 'sub-001_seg.nii.gz', size: '1.8 MB', mod: 'Label', time: '2 min ago' },
    { name: 'sub-002_flair.nii.gz', size: '15.1 MB', mod: 'FLAIR', time: '15 min ago' },
    { name: 'atlas_mni152.nii.gz', size: '22.0 MB', mod: 'Template', time: '1 hr ago' },
  ];

  return (
    <div className="fade-in" style={{ overflow: 'auto', height: '100%' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <StatCard label="Models Loaded" value="6" accent="var(--accent)" />
        <StatCard label="Datasets" value="4" accent="var(--purple)" />
        <StatCard label="Total Params" value="531M" accent="var(--green)" />
        <StatCard label="GPU Memory" value="8.4 GB" accent="var(--amber)" />
      </div>

      {/* Models grid */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Registered Models</h3>
          <button className="btn" style={{ marginLeft: 'auto', fontSize: 11 }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add Model
          </button>
        </div>
        <div className="dash-grid">
          {models.map(m => {
            const taskInfo = window.MODEL_TASKS[m.task] || {};
            return (
              <div key={m.name} className="model-card" onClick={() => onNavigate && onNavigate('architecture')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div className="status-dot" style={{}} className={`status-dot ${m.status}`}></div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span className={`badge ${taskInfo.badge || 'badge-cyan'}`}>{m.task}</span>
                  <span className="badge badge-purple">{m.modality}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <MiniStat label="Params" value={m.params} />
                  <MiniStat label="Dice" value={m.dice} />
                  <MiniStat label="Dataset" value={m.dataset} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Recent data + Upload */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Recent data */}
        <div className="panel">
          <div className="panel-header">Recent Data</div>
          <div className="panel-body" style={{ padding: 0 }}>
            {recentData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="text-mono text-xs text-accent" style={{ fontSize: 9 }}>.nii</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div className="text-xs text-dim">{d.mod} · {d.size}</div>
                </div>
                <span className="text-xs text-dim">{d.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload zone */}
        <div className="upload-zone" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderColor: uploadHover ? 'var(--accent)' : undefined,
          background: uploadHover ? 'var(--accent-glow)' : undefined,
        }}
          onDragOver={e => { e.preventDefault(); setUploadHover(true); }}
          onDragLeave={() => setUploadHover(false)}
          onDrop={e => { e.preventDefault(); setUploadHover(false); }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <IconUpload size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            Upload Brain Data
          </div>
          <div className="text-sm text-dim">
            Drag & drop NIfTI, NumPy (.npy), or HDF5 files
          </div>
          <div className="text-xs text-dim" style={{ marginTop: 4 }}>
            Supports .nii, .nii.gz, .npy, .h5
          </div>
          <button className="btn-primary btn" style={{ marginTop: 14 }}>Browse Files</button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────── */
function StatCard({ label, value, accent }) {
  return (
    <div className="panel" style={{ padding: 14 }}>
      <div className="text-xs text-dim" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: accent }}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div className="text-xs text-dim" style={{ fontSize: 10 }}>{label}</div>
      <div className="text-mono text-xs">{value}</div>
    </div>
  );
}

Object.assign(window, { DashboardView });

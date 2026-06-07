const { useState, useEffect } = React;

const NAV_ITEMS = [
  { id: 'dashboard',    icon: IconDashboard, label: 'Dashboard' },
  { id: 'viewer',       icon: IconBrain,     label: 'Slice Viewer' },
  { id: 'compare',      icon: IconCompare,   label: 'Compare' },
  { id: 'architecture', icon: IconArch,      label: 'Architecture' },
  { id: 'multimodal',   icon: IconLayers,    label: 'Multi-Modal' },
];

const VIEW_TITLES = {
  dashboard:    ['Dashboard', 'Model overview & data management'],
  viewer:       ['Slice Viewer', '3-plane orthogonal brain viewer'],
  compare:      ['Model Comparison', 'Before / After analysis'],
  architecture: ['Architecture', 'Interactive model structure'],
  multimodal:   ['Multi-Modal', 'Cross-modality comparison'],
};

function App() {
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('neurovis-view') || 'dashboard'; }
    catch { return 'dashboard'; }
  });

  useEffect(() => {
    try { localStorage.setItem('neurovis-view', view); } catch {}
  }, [view]);

  const [title, subtitle] = VIEW_TITLES[view] || ['', ''];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo" title="NeuroVis">NV</div>

        {NAV_ITEMS.map(item => (
          <button key={item.id}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}>
            <item.icon size={19} />
            <span className="nav-tooltip">{item.label}</span>
          </button>
        ))}

        <div className="sidebar-spacer"></div>

        <button className="nav-item" title="Settings">
          <IconSettings size={18} />
          <span className="nav-tooltip">Settings</span>
        </button>
      </nav>

      {/* Main */}
      <main className="main-area">
        <header className="header-bar">
          <span className="view-title">{title}</span>
          <span className="view-subtitle">{subtitle}</span>
          <div className="header-sep"></div>
          <div className="header-actions">
            <StatusIndicator />
            <button className="btn" onClick={() => setView('viewer')}>
              <IconUpload size={14} /> Load Data
            </button>
          </div>
        </header>

        <div className="content-area">
          {view === 'dashboard'    && <DashboardView onNavigate={setView} />}
          {view === 'viewer'       && <SliceViewer />}
          {view === 'compare'      && <ComparisonView />}
          {view === 'architecture' && <ArchitectureViewer />}
          {view === 'multimodal'   && <MultiModalView />}
        </div>
      </main>
    </div>
  );
}

/* ── Multi-Modal View ─────────────────────────── */
function MultiModalView() {
  const [slicePos, setSlicePos] = useState(0.5);
  const [colormap, setColormap] = useState('bone');
  const [showOverlay, setShowOverlay] = useState(false);

  const modalities = [
    { key: 'mri_t1', label: 'MRI T1', cmap: 'bone', desc: 'T1-weighted structural' },
    { key: 'mri_t2', label: 'MRI T2 / FLAIR', cmap: 'grayscale', desc: 'T2 / FLAIR contrast' },
    { key: 'fmri', label: 'fMRI', cmap: 'hot', desc: 'Functional activation' },
    { key: 'dti', label: 'DTI / FA', cmap: 'plasma', desc: 'Fractional anisotropy' },
    { key: 'pet', label: 'PET', cmap: 'inferno', desc: 'Metabolic uptake' },
    { key: 'ct', label: 'CT', cmap: 'bone', desc: 'Computed tomography' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="text-sm text-dim">Showing all modalities at slice position</span>
        <input type="range" min="0.05" max="0.95" step="0.005" value={slicePos}
          onChange={e => setSlicePos(+e.target.value)} style={{ width: 200 }} />
        <span className="text-mono text-xs">{Math.round(slicePos * 155)}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={`btn-icon ${showOverlay ? 'active' : ''}`}
            onClick={() => setShowOverlay(!showOverlay)} title="Toggle overlay">
            {showOverlay ? <IconEye size={15}/> : <IconEyeOff size={15}/>}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: '1fr 1fr', gap: 2, background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {modalities.map(mod => (
          <div key={mod.key} className="brain-cell"
            style={{ flexDirection: 'column', padding: 0 }}>
            <span className="brain-cell-label">{mod.label}</span>
            <div style={{ position: 'absolute', bottom: 6, left: 8 }}>
              <span className="text-xs text-dim">{mod.desc}</span>
            </div>
            <BrainCanvas
              plane="axial" slicePos={slicePos} colormap={mod.cmap}
              showOverlay={showOverlay} overlayAlpha={0.4}
            />
          </div>
        ))}
      </div>

      {/* Modality info bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {modalities.map(mod => (
          <div key={mod.key} style={{ display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)' }}>
            <ColormapDot cmap={mod.cmap} />
            <span className="text-mono text-xs">{mod.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColormapDot({ cmap }) {
  const cmapFn = window.COLORMAPS[cmap] || window.COLORMAPS.grayscale;
  const [r, g, b] = cmapFn(0.65);
  return <div style={{ width: 8, height: 8, borderRadius: 2,
    background: `rgb(${r},${g},${b})` }}></div>;
}

function StatusIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-subtle)' }}>
      <div className="status-dot online"></div>
      <span className="text-mono text-xs text-dim">GPU: RTX 4090</span>
      <span className="text-mono text-xs" style={{ color: 'var(--green)' }}>8.4 / 24 GB</span>
    </div>
  );
}

/* ── Mount ────────────────────────────────────── */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

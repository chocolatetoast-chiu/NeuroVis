const { useState, useRef, useCallback, useEffect } = React;

function ComparisonView() {
  const [mode, setMode] = useState('slider'); // slider | sideBySide | overlay
  const [sliderPos, setSliderPos] = useState(0.5);
  const [slicePos, setSlicePos] = useState(0.5);
  const [colormap, setColormap] = useState('bone');
  const [modelA] = useState('Original');
  const [modelB, setModelB] = useState('U-Net Segmented');
  const [overlayBlend, setOverlayBlend] = useState(0.5);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const handleSliderDrag = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setSliderPos(x);
  }, []);

  useEffect(() => {
    const onMove = (e) => { if (dragging.current) handleSliderDrag(e); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [handleSliderDrag]);

  // Simulated metrics
  const metrics = [
    { label: 'Dice Score', value: '0.923', good: true },
    { label: 'IoU (Jaccard)', value: '0.871', good: true },
    { label: 'HD95 (mm)', value: '1.34', good: true },
    { label: 'Sensitivity', value: '0.951', good: true },
    { label: 'Specificity', value: '0.987', good: true },
    { label: 'Volume Diff', value: '2.3%', good: true },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', gap: 12, height: '100%' }}>
      {/* Main comparison area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Mode tabs + model selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="tab-bar">
            {[['slider','Slider'],['sideBySide','Side-by-Side'],['overlay','Overlay']].map(([m,l]) => (
              <button key={m} className={`tab-item ${mode===m?'active':''}`}
                onClick={() => setMode(m)}>{l}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="text-xs text-dim">Model:</span>
            <select className="select-control" value={modelB}
              onChange={e => setModelB(e.target.value)}>
              <option>U-Net Segmented</option>
              <option>SwinUNETR Segmented</option>
              <option>nnU-Net Segmented</option>
              <option>Diffusion Synthesized</option>
            </select>
          </div>
        </div>

        {/* Comparison canvas */}
        {mode === 'slider' && (
          <div ref={containerRef} className="comparison-wrap"
            style={{ position: 'relative', background: '#000', cursor: 'ew-resize' }}
            onMouseDown={(e) => { dragging.current = true; handleSliderDrag(e); }}>
            {/* Left: Original */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <BrainCanvas plane="axial" slicePos={slicePos} colormap={colormap}
                showOverlay={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {/* Right: Segmented (clipped) */}
            <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${sliderPos*100}%)`, overflow: 'hidden' }}>
              <BrainCanvas plane="axial" slicePos={slicePos} colormap={colormap}
                showOverlay={true} overlayAlpha={0.55}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {/* Divider */}
            <div className="comparison-divider" style={{ left: `${sliderPos*100}%`, transform: 'translateX(-50%)' }}></div>
            {/* Labels */}
            <div style={{ position: 'absolute', top: 10, left: 12, fontFamily: 'var(--font-mono)',
              fontSize: 11, color: 'var(--text-2)', zIndex: 2 }}>Original</div>
            <div style={{ position: 'absolute', top: 10, right: 12, fontFamily: 'var(--font-mono)',
              fontSize: 11, color: 'var(--accent)', zIndex: 2 }}>{modelB}</div>
          </div>
        )}

        {mode === 'sideBySide' && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
            background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div className="brain-cell">
              <span className="brain-cell-label">Original</span>
              <BrainCanvas plane="axial" slicePos={slicePos} colormap={colormap}
                showOverlay={false} />
            </div>
            <div className="brain-cell">
              <span className="brain-cell-label" style={{ color: 'var(--magenta)' }}>{modelB}</span>
              <BrainCanvas plane="axial" slicePos={slicePos} colormap={colormap}
                showOverlay={true} overlayAlpha={0.55} />
            </div>
          </div>
        )}

        {mode === 'overlay' && (
          <div style={{ flex: 1, position: 'relative', background: '#000',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <BrainCanvas plane="axial" slicePos={slicePos} colormap={colormap}
              showOverlay={true} overlayAlpha={overlayBlend}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.7)',
              padding: '6px 14px', borderRadius: 20 }}>
              <span className="text-xs text-dim">Blend</span>
              <input type="range" min="0" max="1" step="0.05" value={overlayBlend}
                onChange={e => setOverlayBlend(+e.target.value)} style={{ width: 120 }} />
              <span className="text-mono text-xs">{Math.round(overlayBlend*100)}%</span>
            </div>
          </div>
        )}

        {/* Slice slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <span className="text-mono text-xs text-dim">Slice</span>
          <input type="range" min="0.05" max="0.95" step="0.005" value={slicePos}
            onChange={e => setSlicePos(+e.target.value)} style={{ flex: 1 }} />
          <span className="text-mono text-xs">{Math.round(slicePos * 155)}</span>
          <select className="select-control" value={colormap}
            onChange={e => setColormap(e.target.value)}>
            {window.COLORMAP_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Right: Metrics panel */}
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <div className="panel">
          <div className="panel-header">Performance Metrics</div>
          <div className="panel-body">
            {metrics.map(m => (
              <div key={m.label} className="metric-row">
                <span className="metric-label">{m.label}</span>
                <span className="metric-value">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">Model Info</div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <InfoRow2 label="Architecture" value="3D U-Net" />
            <InfoRow2 label="Parameters" value="31.4M" />
            <InfoRow2 label="Input Size" value="256³" />
            <InfoRow2 label="Classes" value="7" />
            <InfoRow2 label="Optimizer" value="AdamW" />
            <InfoRow2 label="LR" value="1e-4" />
            <InfoRow2 label="Epochs" value="300" />
            <InfoRow2 label="Dataset" value="BraTS 2023" />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">Comparison</div>
          <div className="panel-body">
            <ComparisonBar label="U-Net" value={0.923} color="var(--accent)" />
            <ComparisonBar label="SwinUNETR" value={0.941} color="var(--purple)" />
            <ComparisonBar label="nnU-Net" value={0.937} color="var(--green)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow2({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
      <span className="text-xs text-dim">{label}</span>
      <span className="text-mono text-xs">{value}</span>
    </div>
  );
}

function ComparisonBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span className="text-xs text-dim">{label}</span>
        <span className="text-mono text-xs" style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value*100}%`, height: '100%', background: color, borderRadius: 2,
          transition: 'width 0.4s ease' }}></div>
      </div>
    </div>
  );
}

Object.assign(window, { ComparisonView });

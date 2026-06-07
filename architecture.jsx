const { useState } = React;

function ArchitectureViewer() {
  const [selectedModel, setSelectedModel] = useState('U-Net');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const arch = window.MODEL_ARCHITECTURES[selectedModel];

  const toggleExpand = (blockName) => {
    setExpandedBlocks(prev => ({ ...prev, [blockName]: !prev[blockName] }));
    setSelectedBlock(blockName);
  };

  const allBlocks = [
    ...arch.encoder.map(b => ({ ...b, section: 'encoder' })),
    { ...arch.bottleneck, section: 'bottleneck' },
    ...arch.decoder.map(b => ({ ...b, section: 'decoder' })),
    { ...arch.output, section: 'output' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', gap: 12, height: '100%' }}>
      {/* Main architecture area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Model selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="tab-bar">
            {Object.keys(window.MODEL_ARCHITECTURES).map(m => (
              <button key={m} className={`tab-item ${selectedModel===m?'active':''}`}
                onClick={() => { setSelectedModel(m); setSelectedBlock(null); setExpandedBlocks({}); }}>{m}</button>
            ))}
          </div>
          <span className="badge badge-cyan" style={{ marginLeft: 8 }}>{arch.type}</span>
          <span className="badge badge-purple">{arch.params} params</span>
        </div>

        {/* Architecture diagram */}
        <div className="panel" style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: 20, minHeight: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center' }}>
            <UNetDiagram arch={arch} selectedBlock={selectedBlock}
              expandedBlocks={expandedBlocks} onBlockClick={toggleExpand} />
          </div>
        </div>
      </div>

      {/* Right: Block details */}
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <div className="panel">
          <div className="panel-header">Model Summary</div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SummaryRow label="Architecture" value={selectedModel} />
            <SummaryRow label="Type" value={arch.type} />
            <SummaryRow label="Parameters" value={arch.params} />
            <SummaryRow label="Encoder Blocks" value={arch.encoder.length} />
            <SummaryRow label="Decoder Blocks" value={arch.decoder.length} />
            <SummaryRow label="Skip Connections" value={arch.encoder.length} />
          </div>
        </div>

        {selectedBlock && (
          <div className="panel fade-in">
            <div className="panel-header">
              <div style={{ width: 8, height: 8, borderRadius: 2,
                background: allBlocks.find(b => b.name === selectedBlock)?.color || '#888' }}></div>
              {selectedBlock}
            </div>
            <div className="panel-body">
              {(() => {
                const block = allBlocks.find(b => b.name === selectedBlock);
                if (!block) return null;
                return (
                  <div>
                    <SummaryRow label="Channels" value={block.ch} />
                    <SummaryRow label="Resolution" value={block.res} />
                    <SummaryRow label="Section" value={block.section} />
                    <div style={{ marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                      <div className="text-xs text-dim" style={{ marginBottom: 6 }}>LAYERS</div>
                      {block.layers.map((layer, i) => (
                        <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                          color: 'var(--text-1)', padding: '3px 8px', marginBottom: 2,
                          background: 'var(--bg-primary)', borderRadius: 4,
                          borderLeft: `2px solid ${block.color}` }}>
                          {layer}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {!selectedBlock && (
          <div className="panel">
            <div className="panel-body" style={{ textAlign: 'center', padding: 24 }}>
              <div className="text-sm text-dim">Click any block in the diagram to see layer details</div>
            </div>
          </div>
        )}

        <div className="panel" style={{ marginTop: 'auto' }}>
          <div className="panel-header">Legend</div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <LegendItem color="#3B82F6" label="Encoder" />
            <LegendItem color="#EC4899" label="Bottleneck" />
            <LegendItem color="#F97316" label="Decoder (early)" />
            <LegendItem color="#10B981" label="Decoder (late)" />
            <LegendItem color="#06B6D4" label="Output Head" />
            <LegendItem color="var(--text-3)" label="Skip Connection" dashed />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── U-Net Diagram ─────────────────────────────── */
function UNetDiagram({ arch, selectedBlock, expandedBlocks, onBlockClick }) {
  const encLen = arch.encoder.length;
  const blockW = 90, blockH = 48, gapY = 16, gapX = 32;
  const stepDown = blockH + gapY;
  const totalW = (encLen * 2 + 1) * (blockW + gapX);
  const totalH = (encLen + 1) * stepDown + 80;

  // Positions: encoder goes down-left, decoder goes up-right
  const positions = [];

  // Encoder
  arch.encoder.forEach((block, i) => {
    positions.push({
      ...block, section: 'encoder', idx: i,
      x: i * (blockW + gapX), y: i * stepDown,
    });
  });

  // Bottleneck
  const bnX = encLen * (blockW + gapX);
  const bnY = encLen * stepDown;
  positions.push({
    ...arch.bottleneck, section: 'bottleneck', idx: -1,
    x: bnX, y: bnY,
  });

  // Decoder
  arch.decoder.forEach((block, i) => {
    positions.push({
      ...block, section: 'decoder', idx: i,
      x: (encLen + 1 + i) * (blockW + gapX),
      y: (encLen - 1 - i) * stepDown,
    });
  });

  // Output
  const outX = (encLen * 2 + 1) * (blockW + gapX);
  const outY = 0;

  return (
    <div style={{ position: 'relative', width: totalW + blockW + 20, height: totalH,
      margin: '0 auto', minWidth: 'fit-content' }}>
      {/* SVG for arrows */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Flow arrows: encoder → bottleneck → decoder */}
        {positions.slice(0, -1).map((p, i) => {
          const next = positions[i + 1];
          if (!next) return null;
          const x1 = p.x + blockW, y1 = p.y + blockH/2;
          const x2 = next.x, y2 = next.y + blockH/2;
          return (
            <g key={`flow-${i}`}>
              <line x1={x1+4} y1={y1} x2={x2-4} y2={y2}
                stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <polygon points={`${x2-4},${y2-4} ${x2-4},${y2+4} ${x2+2},${y2}`}
                fill="rgba(255,255,255,0.15)" />
            </g>
          );
        })}
        {/* Output arrow */}
        {arch.decoder.length > 0 && (() => {
          const lastDec = positions[positions.length - 1];
          return (
            <g>
              <line x1={lastDec.x + blockW + 4} y1={lastDec.y + blockH/2}
                x2={outX - 4} y2={outY + blockH/2}
                stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <polygon points={`${outX-4},${outY+blockH/2-4} ${outX-4},${outY+blockH/2+4} ${outX+2},${outY+blockH/2}`}
                fill="rgba(255,255,255,0.15)" />
            </g>
          );
        })()}
        {/* Skip connections */}
        {arch.encoder.map((enc, i) => {
          const decIdx = arch.decoder.length - 1 - i;
          if (decIdx < 0) return null;
          const ep = positions[i];
          const dp = positions[encLen + 1 + decIdx];
          if (!dp) return null;
          const y = ep.y + blockH / 2;
          return (
            <line key={`skip-${i}`}
              x1={ep.x + blockW} y1={y}
              x2={dp.x} y2={dp.y + blockH / 2}
              stroke="rgba(0,212,255,0.2)" strokeWidth="1" strokeDasharray="5,4" />
          );
        })}
      </svg>

      {/* Blocks */}
      {positions.map((block) => {
        const isSelected = selectedBlock === block.name;
        const isExpanded = expandedBlocks[block.name];
        return (
          <div key={block.name}
            className={`arch-block ${isSelected ? 'selected' : ''}`}
            style={{
              position: 'absolute', left: block.x, top: block.y,
              width: blockW, minHeight: blockH,
              borderLeftColor: block.color, borderLeftWidth: 3,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: isExpanded ? '8px 10px' : '6px 10px',
            }}
            onClick={() => onBlockClick(block.name)}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
              color: 'var(--text-1)', marginBottom: 2 }}>{block.name}</div>
            <div className="text-mono text-xs text-dim">{block.ch}</div>
            {isExpanded && (
              <div style={{ marginTop: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 4 }}>
                {block.layers.slice(0, 3).map((l, j) => (
                  <div key={j} className="text-mono" style={{ fontSize: 9, color: 'var(--text-3)',
                    lineHeight: 1.5 }}>{l}</div>
                ))}
                {block.layers.length > 3 && (
                  <div className="text-xs text-dim" style={{ marginTop: 2 }}>
                    +{block.layers.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Output block */}
      <div className={`arch-block ${selectedBlock === arch.output.name ? 'selected' : ''}`}
        style={{
          position: 'absolute', left: outX, top: outY,
          width: blockW, minHeight: blockH,
          borderLeftColor: arch.output.color, borderLeftWidth: 3,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}
        onClick={() => onBlockClick(arch.output.name)}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
          color: 'var(--text-1)', marginBottom: 2 }}>{arch.output.name}</div>
        <div className="text-mono text-xs text-dim">{arch.output.ch}</div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
      <span className="text-xs text-dim">{label}</span>
      <span className="text-mono text-xs">{value}</span>
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 14, height: 3, borderRadius: 1, flexShrink: 0,
        background: dashed ? 'none' : color,
        borderTop: dashed ? `2px dashed ${color}` : 'none' }}></div>
      <span className="text-xs text-dim">{label}</span>
    </div>
  );
}

Object.assign(window, { ArchitectureViewer });

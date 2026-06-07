const { useRef, useEffect, useCallback } = React;

const RENDER_SIZE = 256;

function BrainCanvas({ plane, slicePos, colormap, showOverlay, overlayAlpha,
  crosshairX, crosshairY, onCrosshairChange, style }) {
  const canvasRef = useRef(null);
  const cacheRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const w = RENDER_SIZE, h = RENDER_SIZE;

    // Generate or retrieve cached slice
    const key = `${plane}-${Math.round(slicePos * 200)}`;
    if (!cacheRef.current[key]) {
      cacheRef.current[key] = window.generateBrainSlice(w, h, plane, slicePos);
    }
    const { data: intensity, labels } = cacheRef.current[key];

    // Render with colormap + optional overlay
    const imgData = window.renderToImageData(
      ctx, w, h, intensity, colormap, labels, showOverlay, overlayAlpha ?? 0.45
    );
    ctx.putImageData(imgData, 0, 0);

    // Draw crosshair
    if (crosshairX != null && crosshairY != null) {
      const cx = crosshairX * w, cy = crosshairY * h;
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
      ctx.setLineDash([]);

      // Center dot
      ctx.fillStyle = 'rgba(0, 212, 255, 0.7)';
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }, [plane, slicePos, colormap, showOverlay, overlayAlpha, crosshairX, crosshairY]);

  const handleMouse = useCallback((e) => {
    if (!onCrosshairChange) return;
    if (e.buttons !== 1 && e.type !== 'click') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onCrosshairChange(plane, x, y);
  }, [plane, onCrosshairChange]);

  return (
    <canvas
      ref={canvasRef}
      width={RENDER_SIZE}
      height={RENDER_SIZE}
      onClick={handleMouse}
      onMouseDown={handleMouse}
      onMouseMove={handleMouse}
      style={{ width: '100%', height: '100%', objectFit: 'contain',
        cursor: 'crosshair', imageRendering: 'pixelated', ...style }}
    />
  );
}

/* ── SVG Icon Components ─────────────────────────── */
function Icon({ children, size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" {...props}>
      {children}
    </svg>
  );
}

function IconDashboard(p) { return <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Icon>; }
function IconBrain(p) { return <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M3.5 9h6M14.5 9h6M5 15h5M14 15h5"/></Icon>; }
function IconCompare(p) { return <Icon {...p}><rect x="3" y="3" width="8" height="18" rx="1.5"/><rect x="13" y="3" width="8" height="18" rx="1.5"/></Icon>; }
function IconArch(p) { return <Icon {...p}><rect x="4" y="2" width="16" height="5" rx="1.5"/><rect x="2" y="17" width="8" height="5" rx="1.5"/><rect x="14" y="17" width="8" height="5" rx="1.5"/><path d="M12 7v4M12 11L6 17M12 11l6 6"/></Icon>; }
function IconLayers(p) { return <Icon {...p}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/></Icon>; }
function IconUpload(p) { return <Icon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>; }
function IconSettings(p) { return <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></Icon>; }
function IconEye(p) { return <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>; }
function IconEyeOff(p) { return <Icon {...p}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></Icon>; }
function IconZoomIn(p) { return <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></Icon>; }
function IconReset(p) { return <Icon {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></Icon>; }
function IconChevron(p) { return <Icon size={14} {...p}><polyline points="6 9 12 15 18 9"/></Icon>; }

Object.assign(window, {
  BrainCanvas, RENDER_SIZE,
  IconDashboard, IconBrain, IconCompare, IconArch, IconLayers,
  IconUpload, IconSettings, IconEye, IconEyeOff, IconZoomIn, IconReset, IconChevron,
});

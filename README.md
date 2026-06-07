# NeuroVis — Brain AI Model Viewer

A web-based viewer for previewing brain AI model architectures and visualizing input/output results across multiple neuroimaging modalities.

> **Note:** NeuroVis is a **preview & visualization tool** — it does not perform training or inference. Model I/O visuals are either estimated previews or uploaded results from actual experiments.

## Features

- **Slice Viewer** — 3-plane orthogonal brain viewer (Axial / Coronal / Sagittal) with linked crosshairs
- **Model Comparison** — Before/After visualization with Slider, Side-by-Side, and Overlay modes
- **Architecture Viewer** — Interactive model architecture diagrams (U-Net, SwinUNETR, nnU-Net) with expandable layer details
- **Multi-Modal View** — Side-by-side comparison of MRI T1/T2, fMRI, DTI, PET, CT
- **Dashboard** — Model registry, data management, and GPU status overview

## Supported Modalities

| Modality | Description |
|----------|-------------|
| MRI T1/T2 | Structural imaging |
| fMRI | Functional activation maps |
| DTI / FA | Diffusion tensor / fractional anisotropy |
| PET | Metabolic uptake imaging |
| CT | Computed tomography |

## Supported Model Tasks

- Segmentation (brain region / tumor)
- Classification (disease)
- Registration (image alignment)
- Image Synthesis / Generation
- Anomaly Detection
- Foundation Models

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/NeuroVis.git
cd NeuroVis

# Open directly in browser (no build step needed)
open index.html
# or use a local server
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## File Structure

```
NeuroVis/
├── index.html            # Main entry point
├── styles.css            # Global dark theme styles
├── utils.jsx             # Colormaps, noise functions, brain generation, model data
├── brain-canvas.jsx      # Canvas rendering component
├── slice-viewer.jsx      # 3-plane slice viewer
├── comparison-view.jsx   # Before/After comparison modes
├── architecture.jsx      # Interactive model architecture diagrams
├── dashboard.jsx         # Dashboard overview
├── app.jsx               # Main app shell, routing, sidebar
└── README.md
```

## Extending NeuroVis

### Loading Real Data
Replace the procedural brain generation in `utils.jsx` with actual NIfTI / NumPy / HDF5 loaders:
- [nifti-reader-js](https://github.com/rii-mango/NIFTI-Reader-JS) for `.nii` / `.nii.gz`
- Custom ArrayBuffer parsing for `.npy`
- [jsfive](https://github.com/usnistgov/jsfive) for `.h5`

### Adding New Model Architectures
Edit `MODEL_ARCHITECTURES` in `utils.jsx` — each model is a JSON structure with encoder, bottleneck, decoder, and output blocks.

### Planned Features
- [ ] Attention Map / Grad-CAM overlay
- [ ] 3D volume rendering (Three.js)
- [ ] ROI annotation tool
- [ ] Training curve visualization
- [ ] Screenshot export
- [ ] Custom icon / branding

## Tech Stack

- React 18 (CDN, no build step)
- Babel (in-browser JSX transpilation)
- Canvas API (procedural brain rendering)
- Pure CSS (dark neuroimaging theme)

## License

MIT

## Contact

Sheng-Chieh Chiu, Ph.D.
scchiu.phd@gmail.com

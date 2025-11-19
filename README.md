# 3D Logo

A stunning 3D interactive logo created with Three.js, featuring dynamic lighting, particle effects, and smooth animations.

🌟 **[View Live Demo](https://ujhung.github.io/3d-logo/)**

## Concept

This 3D logo represents the synergy between people and technology at Pacston.

**Design Philosophy:**

- **Small Stars** - Each twinkling star represents an individual employee, symbolizing the collective brilliance of our team
- **Four Glowing Stars** - Represent our four core technological pillars that connect and empower the company:
  - Text Mining
  - AI & Machine Learning
  - Data Mining
  - Distributed Computing

The "M" logo at the center symbolizes how these technologies and talents converge to form a unified, powerful organization. The rotating animation represents continuous innovation and growth, while the interactive hover effect invites engagement and exploration.

## Features

### Interactive Effects

- **Hover/Touch Interaction** - Logo rotates faster when hovered (desktop) or touched (mobile)
- **Click Flash Effect** - Click anywhere to trigger a dramatic flash on the four glowing stars
  - Stars brighten up to 30x their normal intensity
  - Size increases by 50% during the flash
  - Smooth fade-out over 0.5 seconds
- **Continuous Flicker** - Subtle breathing effect on star lights for a natural, living appearance
- **Particle System** - Twinkling stars with randomized speeds for organic movement

### Visual Effects

- **Dynamic Lighting** - Point lights with color-matched to each star
- **Wireframe Geometry** - Semi-transparent M-shaped logo with emissive glow
- **Custom Shaders** - GLSL shaders for advanced star rendering and effects
- **Mobile Optimization** - Adjusted star sizes and effects for mobile devices

## Tech Stack

- **Three.js** (v0.169.0) - 3D graphics library
- **three-bvh-csg** (v0.0.17) - CSG operations for geometry manipulation
- **Shader Materials** - Custom GLSL shaders for advanced visual effects

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/3d-logo.git
cd 3d-logo
```

2. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)

No build process required - uses ES modules directly from CDN.

## Project Structure

```
3d-logo/
├── index.html          # Main HTML file
├── index.js            # Three.js scene setup and animations
├── style.css           # Styling
└── README.md           # Documentation
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires WebGL 2.0 support.

## Performance

The scene is optimized for performance:

### Rendering Optimizations

- Low-poly geometries for efficient rendering
- Efficient particle system using BufferGeometry
- Damped orbit controls for smooth interactions
- Post-processing with EffectComposer

### Memory Management

- Automatic resource cleanup on page unload
- Proper disposal of geometries, materials, and textures
- Renderer and composer cleanup to prevent memory leaks
- Event listener cleanup to avoid memory retention

The cleanup function ensures all WebGL resources are properly released:

- **Geometries**: BufferGeometry instances
- **Materials**: Standard and Shader materials
- **Textures**: Canvas textures for stars
- **Renderers**: WebGLRenderer and EffectComposer
- **Event Listeners**: Window resize and beforeunload handlers

## License

MIT License - feel free to use this project for your own purposes.

## Credits

Created with:

- [Three.js](https://threejs.org/)
- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)

# Pulley CAD

Web-based CAD tool for pulley systems with mechanical analysis capabilities.

## Tech Stack

- **React + TypeScript + Vite**
- **Konva.js** - Canvas rendering and interaction
- **Flatten-js** - 2D geometry calculations
- **Cassowary.js** - Constraint solving

## Features

### Interactive Canvas
- ✅ Pan and zoom with mouse wheel
- ✅ Snap-to-grid functionality
- ✅ Middle mouse button or left-click-drag for panning
- ✅ Component drag and drop

### Components
- ✅ **Pulleys** - Single, double, and triple sheave configurations
  - Adjustable diameter
  - Optional becket attachment
  - Rotation support
  - Multiple connection points per sheave
- ✅ **Anchors** - Fixed mounting points
- ✅ **Cleats** - Rope securing points
- ✅ **Person** - Human operator representation
- ✅ **Springs** - Elastic elements with adjustable stiffness
- ✅ **Ropes** - Automatic tangent-line routing between components

### Tools
- ✅ **Select Tool** - Click to select, drag to move
- ✅ **Rope Tool** - Click connection points to route ropes
- ✅ **Measurement Tool** - Click two points to measure distance

### User Interface
- ✅ **Toolbar** - Quick access to all tools and components
- ✅ **Properties Panel** - Edit component properties
  - Grid settings
  - Component-specific properties
  - Position and dimensions
- ✅ **Status Bar** - Shows current mode and keyboard shortcuts

### File Operations
- ✅ Save/Load system as JSON
- ✅ Export as SVG mechanical drawing
- ✅ Pre-built scenarios (3:1, 4:1, 5:1, 6:1 compound, 9:1 compound)

### Keyboard Shortcuts
- **Delete** - Remove selected component
- **Escape** - Cancel current operation or deselect

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx          # Main Konva canvas with pan/zoom
│   ├── Toolbar.tsx         # Tool selection and actions
│   ├── PropertiesPanel.tsx # Component property editor
│   └── shapes/             # Component renderers
│       ├── Pulley.tsx      # Pulley with multiple sheaves
│       ├── Anchor.tsx      # Fixed anchor point
│       ├── Rope.tsx        # Smart rope routing
│       ├── Cleat.tsx       # Cleat component
│       ├── Person.tsx      # Person representation
│       └── Spring.tsx      # Spring element
├── utils/
│   ├── geometry.ts         # Tangent calculations, rope paths
│   ├── importExport.ts     # File I/O and format conversion
│   └── scenarios.ts        # Pre-built pulley systems
├── types.ts                # TypeScript definitions
└── App.tsx                 # Main application
```

## Usage

1. **Add Components**: Click toolbar buttons to add pulleys, anchors, etc.
2. **Position Components**: Drag components on the canvas
3. **Connect Ropes**: 
   - Click the Rope button
   - Click a connection point on the first component
   - Click a connection point on the second component
4. **Edit Properties**: Select a component and use the properties panel
5. **Measure Distances**: Click the Measure tool, then click two points
6. **Delete Components**: Select a component and press Delete key
7. **Save/Load**: Use the toolbar buttons to save and load your designs

## Scenarios

The tool includes pre-built mechanical advantage scenarios:
- **3:1 Simple** - Standard Z-drag equivalent
- **4:1 Simple** - Using double pulleys
- **5:1 Simple** - Using double and triple pulleys  
- **6:1 Compound** - 3:1 system pulling on 2:1 system
- **9:1 Compound** - 3:1 system pulling on another 3:1 system

## Technical Notes

### Rope Routing
- Ropes automatically calculate tangent lines between circular pulleys
- Supports routing through multiple pulleys
- Arc paths around pulley circumference
- Real-time length calculation

### Geometry Engine
- External tangent calculation for pulley-to-pulley connections
- Arc generation with configurable segments
- Coordinate transformation for rotated components

### Future Enhancements
- Force analysis and tension calculations
- Animation of rope pull
- Copy/paste components
- Undo/redo functionality
- More component types (loads, force vectors)
- Constraint solving for mechanical advantage

## Related Projects

This project is designed to work alongside:
- **ag-pulley-simulator** - Full physics simulation with solver
- **ag-pulley-calc** - Mechanical advantage calculator

---

Built with React, TypeScript, and Konva.js

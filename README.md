# Pulley Deck Sketcher

Web-based mechanical sketching tool for pulley deck layouts with analysis capabilities.

## Tech Stack

- **React + TypeScript + Vite**
- **Konva.js** - Canvas rendering and interaction
- **Flatten-js** - 2D geometry calculations
- **Cassowary.js** - Constraint solving

## Features

- ✅ Interactive canvas with snap-to-grid
- ✅ Pulley components (single, double, triple)
- ✅ Anchor points
- ✅ Rope routing with tangent calculations
- ✅ Mechanical analysis (MA, forces, friction)
- ✅ Animation capabilities

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
│   ├── Canvas.tsx          # Main Konva canvas
│   ├── Toolbar.tsx         # Tool selection
│   ├── PropertiesPanel.tsx # Component properties
│   └── shapes/             # Pulley, Anchor, Rope components
├── utils/
│   ├── geometry.ts         # Flatten-js utilities
│   └── constraints.ts      # Cassowary.js utilities
├── types.ts                # TypeScript definitions
└── App.tsx                 # Main application
```

## Usage

1. Select a tool from the toolbar (Anchor, Pulley, or Rope)
2. Click on the canvas to place components
3. Drag components to reposition
4. Connect ropes between anchors and pulleys
5. Click "Analyze" to calculate forces and MA
6. Click "Animate" to visualize system motion

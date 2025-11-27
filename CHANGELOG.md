# Changelog

All notable changes to the Pulley Deck Sketcher project.

## [0.2.0] - 2025-11-26

### Added
- **Spring Component** - Full integration with rendering, properties, and toolbar button
- **Delete Functionality** - Delete button in toolbar and Delete keyboard shortcut
- **Keyboard Shortcuts System**
  - Delete key to remove selected component
  - Escape key to cancel operations or deselect
- **Status Bar** - Shows component count, selected item, current mode, and shortcuts
- **Visual Feedback Enhancements**
  - Button hover animations with translateY effect
  - Active tool glow effect with box-shadow
  - Disabled state styling for Delete button
  - Button press/active animation
- **Documentation**
  - Comprehensive README with feature list and usage guide
  - IMPROVEMENTS.md tracking all changes
  - SUMMARY.md for quick reference
  - Technical notes on rope routing and geometry

### Changed
- Updated README with complete feature documentation
- Improved button hover and active states in CSS
- Enhanced Anchor component click handling
- Better event propagation with cancelBubble
- Version bump to 0.2.0

### Fixed
- Spring component `snapToGrid` prop type (was boolean, now function)
- Spring component drag behavior now respects grid snapping
- TypeScript imports for SpringComponent across all files
- Canvas rendering order for Spring components
- Properties Panel now handles Spring properties correctly

### Technical
- Added React useEffect for keyboard event listeners
- Proper cleanup of event listeners on unmount
- Consistent type guards in Canvas component
- Improved state management for tool modes
- Better separation of concerns in event handling

---

## [0.1.0] - Initial Release

### Features
- Basic component library (Pulley, Anchor, Cleat, Person, Rope)
- Interactive Konva canvas with pan and zoom
- Rope drawing with connection point selection
- Measurement tool
- Properties panel for component editing
- Save/Load system state as JSON
- Export mechanical drawing as SVG
- Pre-built scenarios for common pulley systems
- Grid system with snap-to-grid
- Component drag and drop
- Basic toolbar with component buttons

### Components
- Pulley (single, double, triple sheaves)
- Anchor (fixed mounting points)
- Cleat (rope securing)
- Person (operator representation)
- Rope (automatic tangent routing)

### Known Issues
- Spring component not fully integrated (fixed in 0.2.0)
- No delete functionality (fixed in 0.2.0)
- No keyboard shortcuts (fixed in 0.2.0)
- Limited visual feedback (improved in 0.2.0)

---

## Upcoming Features

### [0.3.0] - Planned
- Copy/paste functionality (Ctrl+C, Ctrl+V)
- Undo/redo system (Ctrl+Z, Ctrl+Y)
- Multi-select with Shift+Click
- Load component with mass
- Force vector component
- Better rope routing algorithm

### [0.4.0] - Planned
- Force analysis calculations
- Mechanical advantage display
- Tension visualization on ropes
- Anchor force display
- Friction modeling

### [0.5.0] - Planned
- Animation system for rope pull
- Kinematic motion visualization
- Spring deformation animation
- Replay controls (play, pause, speed)

### [1.0.0] - Planned
- Full constraint solver integration
- Complete physics engine
- Professional export formats (PNG, PDF)
- Template library
- Cloud save/sync

---

**Maintainer:** GitHub Copilot  
**License:** Private  
**Repository:** pulley-deck-sketcher

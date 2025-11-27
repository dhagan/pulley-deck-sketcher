# Connection Points Guide

## Overview
Each component in the Pulley Deck Sketcher has specific connection points where ropes can attach. Understanding these points is crucial for creating accurate pulley systems.

---

## Pulley Component

### Visual Layout
```
          [Anchor Point - RED]
                 |
        ┌────────┴────────┐
   [In] ●─────( Sheave )─────● [Out]
        │                   │
        └───────────────────┘
              (Becket)
```

### Connection Points

#### 1. Anchor Point (Top)
- **Color:** 🔴 Red
- **Location:** Top center, above the pulley
- **Purpose:** Fixed attachment to ceiling/wall
- **ID Format:** `{pulleyId}-anchor`
- **Usage:** Connect to anchor components to fix pulley position

#### 2. Sheave Input Points (Left)
- **Color:** 🔵 Blue
- **Location:** Left side of each sheave
- **Purpose:** Rope entry point
- **ID Format:** `{pulleyId}-sheave-{index}-in`
- **Usage:** Rope enters pulley from this side
- **Arrow:** Points inward (→)

#### 3. Sheave Output Points (Right)
- **Color:** 🟡 Gold
- **Location:** Right side of each sheave
- **Purpose:** Rope exit point
- **ID Format:** `{pulleyId}-sheave-{index}-out`
- **Usage:** Rope leaves pulley from this side
- **Arrow:** Points outward (→)

#### 4. Becket Point (Optional)
- **Color:** 🔵 Blue
- **Location:** Side of pulley block
- **Purpose:** Fixed rope attachment
- **ID Format:** `{pulleyId}-becket`
- **Usage:** Starting point for rope in some configurations
- **Note:** Only available when "hasBecket" is enabled

### Multi-Sheave Pulleys

#### Single Sheave (1x)
```
[Anchor]
    |
   ●─────( O )─────●
  In              Out
```

#### Double Sheave (2x)
```
      [Anchor]
          |
   ●───( O )───●    ●───( O )───●
  In0       Out0   In1       Out1
```

#### Triple Sheave (3x)
```
           [Anchor]
               |
   ●─( O )─●    ●─( O )─●    ●─( O )─●
  In0   Out0  In1   Out1  In2   Out2
```

---

## Anchor Component

### Visual Layout
```
    ▼ (Fixed Point)
  ╱───╲
 ╱     ╲
╱       ╲
    ●
```

### Connection Point
- **Color:** ⚪ White/Red
- **Location:** Bottom of triangle, 8px below center
- **Purpose:** Rope attachment to fixed point
- **ID Format:** `{anchorId}` or `{anchorId}-center`
- **Usage:** Start/end point for ropes, fixed mounting

---

## Cleat Component

### Visual Layout
```
 ║       ║
 ╠═══════╣
 ║       ║
     ●
```

### Connection Point
- **Color:** ⚪ White/Brown
- **Location:** Center of cleat
- **Purpose:** Rope securing/tie-off point
- **ID Format:** `{cleatId}` or `{cleatId}-center`
- **Usage:** Rope end point for securing

---

## Person Component

### Visual Layout
```
     O   (Head)
    /|\  (Body/Arms)
    / \  (Legs)
     ● ← Connection Point
```

### Connection Point
- **Color:** 🔴 Red
- **Location:** At hand position
  - Normal stance: Center, -5px Y
  - Pulling: 15px X, 0 Y (extended arm)
- **Purpose:** Rope pulling point
- **ID Format:** `{personId}` or `{personId}-center`
- **Usage:** End point for rope being pulled

---

## Spring Component

### Visual Layout
```
     ● ← Top anchor
     /
    /
   /
  /
 /
● ← Bottom anchor
```

### Connection Points
- **Color:** ⚪ White/Red
- **Locations:**
  - Top: (0, 0) relative to component position
  - Bottom: (0, length) relative to component position
- **Purpose:** Elastic connection points
- **Usage:** Connect between two points to create elastic element

---

## Rope Component

### Connection Behavior

#### Simple Connection
```
[Anchor A] ──────────────── [Anchor B]
     ●                           ●
```
Ropes draw a straight line between two connection points.

#### Pulley Routing
```
[Anchor] ──╮
           │
       ●──( O )──●
      In  Out
           │
           ╰── [Load]
```
Ropes automatically calculate tangent lines to pulleys and wrap around the circumference.

#### Multi-Pulley System
```
[Anchor] ──┐
           │
       ╭──( O )──╮
       │   #1    │
       │         │
       ╰──( O )──╯
           #2
            │
         [Person]
```
Ropes can route through multiple pulleys via the `routeThrough` array.

---

## Best Practices

### 1. Pulley Connections
✅ **DO:**
- Use anchor point for fixed mounting
- Use sheave in/out for rope paths
- Use becket for rope start in mechanical advantage systems

❌ **DON'T:**
- Connect rope to center of pulley (use connection points)
- Cross ropes through pulley center

### 2. Rope Routing
✅ **DO:**
- Follow the natural flow: In → Out
- Use proper sheave indexing for multi-sheave pulleys
- Maintain consistent rope direction

❌ **DON'T:**
- Connect Out to Out directly
- Skip sheaves in sequence

### 3. System Building
✅ **DO:**
- Start with anchors and fixed points
- Add pulleys and connect to anchors
- Route ropes following mechanical advantage logic
- Test with measurement tool

❌ **DON'T:**
- Create disconnected components
- Forget to connect pulley anchors
- Create impossible rope paths

---

## Connection Point Selection

### In Rope Mode
1. Click the **Rope** tool button
2. Tool mode changes to "Rope Drawing"
3. Status shows "Rope (Select End)" after first click
4. Click first connection point
5. Click second connection point
6. Rope is created automatically
7. Returns to Select mode

### Visual Feedback
- **Hover:** Connection points may highlight (implementation dependent)
- **Selected:** Component shows cyan selection circle
- **Active:** Rope tool button has blue glow effect

---

## Advanced: Mechanical Advantage Systems

### 3:1 Simple System
```
[Ceiling Anchor]
       |
   [Top Pulley] ← becket starts here
       O
      / \
     /   \
    /     \
   O       ╲
[Bottom]    ╲
Pulley       [Pull Person]
```

Connection sequence:
1. Top pulley becket → Bottom pulley sheave-in
2. Bottom pulley sheave-out → Top pulley sheave-in
3. Top pulley sheave-out → Person

### 5:1 Compound System
More complex with triple pulleys and proper sheave indexing.

---

## Troubleshooting

### Rope Won't Connect
- Ensure you're clicking connection points (small circles), not component body
- Check that Rope mode is active (button highlighted)
- Verify both components have valid connection points

### Rope Path Looks Wrong
- Check sheave index in multi-sheave pulleys
- Verify In/Out connections follow natural flow
- Use measurement tool to validate distances

### Can't Select Connection Point
- Component may be overlapping
- Try zooming in for precise selection
- Ensure component is not being dragged

---

**Tip:** Use the pre-built scenarios to see working examples of connection point usage!

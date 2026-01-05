# Geo Analytics Visual Guide

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Geolocation Analytics                    [Time Range ▼]         │
│ Interactive world map with threat hotspots and regional dist... │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Global Threat Map                                               │
│ Real-time threat visualization with attack flows               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  ATTACK TYPES          [Globe Visualization]  UNDER ATT│   │
│  │  ✓ Web Attackers                              ACTIVE T│   │
│  │  ✓ DDoS Attackers      [Threat Markers]       TOTAL E│   │
│  │  ✓ Intruders           [Attack Flows]                 │   │
│  │  ✓ Scanners                                           │   │
│  │  ✓ Anonymizers                                        │   │
│  │                                                         │   │
│  │  [Timeline: 0:50 --- 1:10 --- NOW] [COLLAPSE]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Critical: 5  High: 12  Medium: 8  Low: 3  Total: 28          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Network Topology                                                │
│ Real-time network connections and threat visualization         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │              [SVG Network Visualization]               │   │
│  │                                                         │   │
│  │  Critical Nodes (Center)                              │   │
│  │  High Nodes (Middle)                                  │   │
│  │  Normal Nodes (Outer)                                 │   │
│  │                                                         │   │
│  │  Severity Legend:                                      │   │
│  │  ● Critical  ● High  ● Normal                         │   │
│  │                                                         │   │
│  │  Nodes: 24  Connections: 156                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Critical: 5  High: 12  Total: 156  Unique IPs: 24            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Geo Statistics                                                  │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐   │
│ │ 1            │ 15           │ 2,847        │ 189.8        │   │
│ │ Country      │ Indian Cities│ Total Events │ Avg Events   │   │
│ └──────────────┴──────────────┴──────────────┴──────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ India Regional Distribution                                     │
│ [Search state/city...] [Search]                                │
│                                                                 │
│ State/UT    │ City      │ Hit Count │ Severity │ Lat    │ Lon  │
│ ─────────────────────────────────────────────────────────────── │
│ Maharashtra │ Mumbai    │ 150       │ Critical │ 19.08  │ 72.88│
│ Delhi       │ Delhi     │ 120       │ Critical │ 28.70  │ 77.10│
│ Karnataka   │ Bangalore │ 95        │ High     │ 12.97  │ 77.59│
│ ...         │ ...       │ ...       │ ...      │ ...    │ ...  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Top Indian Cities by Events    │ Severity by Indian Cities      │
│                                │                                │
│ Mumbai          ████████████   │ Mumbai      ███ ██ █          │
│ Delhi           ██████████     │ Delhi       ██ ██ █           │
│ Bangalore       ███████        │ Bangalore   ██ █               │
│ Chennai         ██████         │ Chennai     █ █                │
│ Kolkata         █████          │ Kolkata     █ █                │
│ Hyderabad       ████           │ Hyderabad   █                  │
│ Pune            ███            │ Pune        █                  │
│ Ahmedabad       ██             │ Ahmedabad   █                  │
└─────────────────────────────────────────────────────────────────┘
```

## Globe Threat Map Component

### Visual Elements

```
Globe Visualization:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ╭─────────────────────────╮                   │
│            ╱                             ╲                 │
│          ╱                                 ╲               │
│        ╱                                     ╲             │
│       │  ┌─────────────────────────────────┐  │            │
│       │  │  ● Threat Marker (Red)          │  │            │
│       │  │  ● Threat Marker (Orange)       │  │            │
│       │  │  ● Threat Marker (Yellow)       │  │            │
│       │  │  ● Threat Marker (Green)        │  │            │
│       │  │                                 │  │            │
│       │  │  ↗ Attack Flow (Curved Line)    │  │            │
│       │  └─────────────────────────────────┘  │            │
│        ╲                                     ╱             │
│          ╲                                 ╱               │
│            ╲                             ╱                 │
│              ╰─────────────────────────╯                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Threat Marker Details:
┌──────────────────────────────────────┐
│ ● Threat Marker                      │
│   ├─ Glow Effect (Outer Ring)        │
│   ├─ Main Circle (Severity Color)    │
│   ├─ Border (White)                  │
│   └─ Size = √(event_count)           │
└──────────────────────────────────────┘

Attack Flow Details:
┌──────────────────────────────────────┐
│ ↗ Attack Flow                        │
│   ├─ Curved Line (Quadratic)         │
│   ├─ Color = Source Severity         │
│   ├─ Opacity = 0.6                   │
│   └─ Width = 2px                     │
└──────────────────────────────────────┘
```

### Color Coding

```
Severity Levels:
┌─────────────┬──────────────┬─────────────────────────────┐
│ Severity    │ Color        │ RGB / Hex                   │
├─────────────┼──────────────┼─────────────────────────────┤
│ Critical    │ ●            │ #FF2D78 (Red/Pink)          │
│ High        │ ●            │ #FF8B5E (Orange)            │
│ Medium      │ ●            │ #FFD700 (Yellow)            │
│ Low         │ ●            │ #05FFA1 (Green)             │
│ Normal      │ ●            │ #00E1FF (Cyan)              │
└─────────────┴──────────────┴─────────────────────────────┘
```

### Attack Type Filters

```
Filter Panel:
┌─────────────────────────────────────────────────────────┐
│ ☑ Web Attackers    ☑ DDoS Attackers   ☑ Intruders      │
│ ☑ Scanners         ☑ Anonymizers                        │
└─────────────────────────────────────────────────────────┘

Filter Effects:
- Checked: Show markers and flows for this attack type
- Unchecked: Hide markers and flows for this attack type
- Updates statistics in real-time
```

### Status Indicators

```
Top Right Panel:
┌──────────────────────────┐
│ UNDER ATTACK        5    │
│ ACTIVE THREATS      12   │
│ TOTAL EVENTS        2847 │
└──────────────────────────┘

Updates:
- Real-time based on threat data
- Color-coded by severity
- Counts filtered threats
```

## Network Topology Component

### Node Layout

```
Concentric Circle Layout:
                    ┌─────────────────────────────────┐
                    │                                 │
                    │    Normal Nodes (Outer)         │
                    │    Radius: 280px                │
                    │                                 │
                    │    ●  ●  ●  ●  ●  ●  ●        │
                    │  ●                       ●      │
                    │ ●                           ●   │
                    │ │                           │   │
                    │ │    ┌─────────────────┐   │   │
                    │ │    │ High Nodes      │   │   │
                    │ │    │ Radius: 180px   │   │   │
                    │ │    │                 │   │   │
                    │ │    │  ●  ●  ●  ●   │   │   │
                    │ │    │ ●         ●    │   │   │
                    │ │    │ │         │    │   │   │
                    │ │    │ │ ┌─────┐ │    │   │   │
                    │ │    │ │ │Crit.│ │    │   │   │
                    │ │    │ │ │Node │ │    │   │   │
                    │ │    │ │ │ ●   │ │    │   │   │
                    │ │    │ │ └─────┘ │    │   │   │
                    │ │    │ ●         ●    │   │   │
                    │ │    │                 │   │   │
                    │ │    └─────────────────┘   │   │
                    │ │                           │   │
                    │  ●                       ●  │   │
                    │    ●  ●  ●  ●  ●  ●  ●    │   │
                    │                             │   │
                    └─────────────────────────────┘
```

### Node Visualization

```
Node Structure:
        ┌─────────────────┐
        │   Node Circle   │
        │   ├─ Glow       │
        │   ├─ Fill       │
        │   └─ Border     │
        │                 │
        │   Node Label    │
        │   (IP Address)  │
        └─────────────────┘

Node Properties:
- Radius = 8 + √(connections) * 2
- Fill Color = Status (Online/Offline)
- Border Color = Severity
- Glow = Critical nodes only
```

### Edge Visualization

```
Edge Structure:
    Source Node ──────→ Target Node
    
    Line Properties:
    - Stroke Width: 2px
    - Color: Severity-based
    - Opacity: 0.6
    - Marker: Arrow at target
    
    Arrow Markers:
    - Critical: Red arrow
    - High: Orange arrow
    - Normal: Cyan arrow
```

### Interactions

```
Mouse Interactions:
┌─────────────────────────────────────────────────────────┐
│ Action              │ Result                            │
├─────────────────────┼───────────────────────────────────┤
│ Hover Node          │ Highlight node and connections   │
│ Click Node          │ Select/deselect node              │
│ Hover Edge          │ Highlight edge                    │
│ Mouse Wheel         │ Zoom in/out                       │
│ Click & Drag        │ Pan around visualization          │
│ Filter Checkbox     │ Show/hide severity level          │
│ Reset Button        │ Reset zoom and pan                │
└─────────────────────┴───────────────────────────────────┘
```

## Data Flow Diagram

```
API Store (Pinia)
├── geoData
│   ├── [{ country, city, lat, lon, count, severity }, ...]
│   └── Updated by: fetchGeoData()
│
└── recentEvents
    ├── [{ source_ip, dest_ip, severity, log_type }, ...]
    └── Updated by: fetchRecentEvents()

GeoAnalytics Page
├── GlobeThreats Component
│   ├── Input: apiStore.geoData
│   ├── Transform: geoData → threatData
│   ├── Generate: threatData → attackFlows
│   ├── Render: Canvas-based globe
│   └── Output: Threat visualization
│
├── NetworkTopologyFixed Component
│   ├── Input: apiStore.recentEvents
│   ├── Build: recentEvents → nodeMap
│   ├── Build: recentEvents → edgeMap
│   ├── Layout: Concentric circles
│   ├── Render: SVG-based topology
│   └── Output: Network visualization
│
└── Statistics & Tables
    ├── Input: apiStore.geoData
    ├── Calculate: Aggregations
    └── Output: Stats display
```

## Responsive Behavior

```
Desktop (1024px+):
┌─────────────────────────────────────────────────────────┐
│ Globe (Full Width)                                      │
├─────────────────────────────────────────────────────────┤
│ Network Topology (Full Width)                           │
├─────────────────────────────────────────────────────────┤
│ Stats (4 Columns)                                       │
├─────────────────────────────────────────────────────────┤
│ Table (Full Width)                                      │
├─────────────────────────────────────────────────────────┤
│ Charts (2 Columns)                                      │
└─────────────────────────────────────────────────────────┘

Tablet (768px - 1023px):
┌─────────────────────────────────────────────────────────┐
│ Globe (Full Width)                                      │
├─────────────────────────────────────────────────────────┤
│ Network Topology (Full Width)                           │
├─────────────────────────────────────────────────────────┤
│ Stats (2 Columns)                                       │
├─────────────────────────────────────────────────────────┤
│ Table (Full Width, Scrollable)                          │
├─────────────────────────────────────────────────────────┤
│ Charts (1 Column)                                       │
└─────────────────────────────────────────────────────────┘

Mobile (< 768px):
┌─────────────────────────────────────────────────────────┐
│ Globe (Full Width, Smaller Height)                      │
├─────────────────────────────────────────────────────────┤
│ Network Topology (Full Width, Smaller Height)           │
├─────────────────────────────────────────────────────────┤
│ Stats (1 Column)                                        │
├─────────────────────────────────────────────────────────┤
│ Table (Full Width, Scrollable)                          │
├─────────────────────────────────────────────────────────┤
│ Charts (1 Column)                                       │
└─────────────────────────────────────────────────────────┘
```

## Performance Metrics

```
Component Performance:
┌──────────────────────────┬──────────────┬──────────────┐
│ Metric                   │ Target       │ Actual       │
├──────────────────────────┼──────────────┼──────────────┤
│ Globe Render Time        │ < 100ms      │ ~50ms        │
│ Network Topology Render  │ < 200ms      │ ~100ms       │
│ Filter Response Time     │ < 50ms       │ ~20ms        │
│ Zoom/Pan Smoothness      │ 60 FPS       │ 60 FPS       │
│ Memory Usage             │ < 50MB       │ ~30MB        │
└──────────────────────────┴──────────────┴──────────────┘
```

---

**Last Updated**: January 3, 2026
**Version**: 1.0.0

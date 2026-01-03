# Global Threat Map - 3D Globe Features

## Overview
The new Global Threat Map provides a comprehensive 3D visualization of worldwide cybersecurity threats with real-time data and interactive features.

## Key Features

### 🌍 3D Globe Visualization
- **Realistic Earth Rendering**: High-resolution globe with continent outlines and country boundaries
- **Atmospheric Effects**: Multi-layer atmosphere with realistic glow effects
- **Smooth Rotation**: Auto-rotation with manual control options
- **Interactive Controls**: Mouse/touch controls for zoom, pan, and rotate

### 🎯 Threat Visualization
- **Country-wise Threat Distribution**: Threats aggregated by country with visual indicators
- **Severity-based Color Coding**:
  - 🔴 **Critical**: Red markers with pulsing animation
  - 🟠 **High**: Orange markers with enhanced visibility
  - 🟡 **Medium**: Yellow markers for moderate threats
  - 🟢 **Low**: Green markers for minimal threats

### ⚡ Real-time Attack Flows
- **Dynamic Flow Lines**: Animated attack paths between countries
- **Curved Trajectories**: Realistic arc paths following globe curvature
- **Flow Animation**: Pulsing and color-changing effects for active attacks
- **Severity-based Styling**: Flow appearance matches threat severity

### 📊 Interactive Elements
- **Hover Tooltips**: Detailed country information on mouse hover
- **Click Interactions**: Country selection for detailed analysis
- **Live Statistics**: Real-time counters for threats, countries, and flows
- **Filter Controls**: Toggle different threat types and visualization modes

### 🎮 Control Features
- **Auto-rotation Toggle**: Start/stop automatic globe rotation
- **View Mode Switching**: Toggle between heatmap, markers, and flow views
- **Reset Function**: Return to default view position
- **Responsive Design**: Adapts to different screen sizes

## Technical Implementation

### Technologies Used
- **Three.js**: 3D rendering and WebGL graphics
- **Vue 3**: Reactive UI components and state management
- **Canvas API**: Dynamic texture generation for globe surface
- **WebGL Shaders**: Custom atmosphere and glow effects

### Performance Optimizations
- **Efficient Rendering**: Optimized geometry and materials
- **Smart Updates**: Only re-render when data changes
- **Memory Management**: Proper cleanup of 3D objects
- **Responsive Throttling**: Adaptive update rates based on performance

### Data Sources
- **Real-time API**: Live threat data from security monitoring systems
- **Fallback Data**: Synthetic threat data for demonstration
- **Country Database**: Comprehensive world countries with coordinates
- **Geolocation Services**: IP-to-location mapping for threat origins

## Usage Instructions

### Basic Navigation
1. **Rotate**: Click and drag to rotate the globe
2. **Zoom**: Use mouse wheel or pinch gestures to zoom in/out
3. **Pan**: Right-click and drag to pan the view
4. **Reset**: Click the "Reset" button to return to default view

### Threat Analysis
1. **Hover**: Move mouse over threat markers to see country details
2. **Click**: Click on countries for detailed threat breakdown
3. **Filter**: Use the filter controls to focus on specific threat types
4. **Timeline**: Monitor real-time updates and threat evolution

### Customization
- **Auto-rotation**: Toggle automatic globe spinning
- **View Modes**: Switch between different visualization styles
- **Update Rate**: Adjust real-time data refresh frequency
- **Threat Filters**: Enable/disable specific attack types

## Data Interpretation

### Threat Markers
- **Size**: Larger markers indicate higher threat volumes
- **Color**: Represents maximum severity level in that country
- **Animation**: Pulsing indicates active critical threats
- **Position**: Accurate geographical placement

### Attack Flows
- **Direction**: Shows attack source and target countries
- **Curve Height**: Longer distances have higher arc trajectories
- **Animation Speed**: Faster pulsing indicates more active attacks
- **Color Intensity**: Matches the severity of the attack type

### Statistics Panel
- **Countries Affected**: Total number of countries with active threats
- **Active Threats**: Sum of critical and high-severity threats
- **Attack Flows**: Number of active attack paths being visualized
- **Update Rate**: Current data refresh interval

## Future Enhancements

### Planned Features
- **Historical Playback**: Timeline scrubbing to view threat evolution
- **Threat Prediction**: AI-powered threat forecasting visualization
- **Custom Overlays**: User-defined data layers and visualizations
- **Export Functions**: Save globe views and generate reports

### Advanced Analytics
- **Threat Correlation**: Visual connections between related attacks
- **Geographic Clustering**: Automatic grouping of nearby threats
- **Temporal Analysis**: Time-based threat pattern visualization
- **Risk Assessment**: Country-level risk scoring and visualization

## Troubleshooting

### Common Issues
1. **Performance**: Reduce marker count or disable animations for better performance
2. **Loading**: Check network connection for real-time data updates
3. **Interaction**: Ensure WebGL is supported in your browser
4. **Display**: Update graphics drivers for optimal rendering

### Browser Compatibility
- **Chrome**: Full support with hardware acceleration
- **Firefox**: Full support with WebGL enabled
- **Safari**: Supported with some performance limitations
- **Edge**: Full support on Windows 10+

## API Integration

### Endpoints Used
- `/api/geo/logs`: Geographic threat data
- `/api/logs/recent`: Recent attack logs
- `/api/geo/ip/{ip}`: IP geolocation lookup

### Data Format
```json
{
  "country": "United States",
  "lat": 39.8283,
  "lon": -98.5795,
  "totalThreats": 150,
  "maxSeverity": "Critical",
  "criticalCount": 25,
  "highCount": 45,
  "lastActivity": "2024-01-03T10:30:00Z"
}
```

This 3D globe provides an immersive and informative way to monitor global cybersecurity threats in real-time, making complex data accessible and actionable for security operations teams.
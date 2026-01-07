# Network Topology - Visual Guide

## What You Should See

### Phase 1: Loading (1-2 seconds)
```
┌─────────────────────────────────────────────────────┐
│  Network Topology                                   │
│  Static 2D star topology with endpoint data...      │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              ⟳ Loading Topology...                 │
│              Fetching 97601 logs from database     │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Phase 2: Loaded with 1 Endpoint
```
┌─────────────────────────────────────────────────────┐
│  Network Topology                                   │
│  Static 2D star topology with endpoint data...      │
│  [Updated: 15:39:45] [Search...] [Reset] [Filter]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│                        🖥️                          │
│                    Main Server                      │
│                         |                           │
│                         |                           │
│                    ╱─────┴─────╲                    │
│                   /             \                   │
│                  /               \                  │
│                 ●                 ●                 │
│          DESKTOP-UQJ2EBO    (other endpoints)      │
│          100.114.141.67                            │
│                                                     │
│  Legend:                    Stats:                 │
│  ● Online                   1 Agents               │
│  ● Offline                  1 Online               │
│  ● Degraded                 0 Offline              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Phase 3: Empty State (If No Endpoints)
```
┌─────────────────────────────────────────────────────┐
│  Network Topology                                   │
│  Static 2D star topology with endpoint data...      │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                      🔍                            │
│              No Endpoints in Logs                  │
│         Waiting for log data with endpoint info    │
│                                                     │
│              [Retry Fetch]                         │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Console Output

### Successful Load
```
🚀 Fetching endpoint names from logs...
📊 Total logs fetched: 97601
📋 Sample log structure: {
  endpoint: "DESKTOP-UQJ2EBO",
  metadata_endpoint: "DESKTOP-UQJ2EBO",
  metadata_hostname: "DESKTOP-UQJ2EBO",
  raw_endpoint: null,
  raw_hostname: "DESKTOP-UQJ2EBO"
}
✅ Extracted 1 unique endpoints from logs
  - DESKTOP-UQJ2EBO: 97601 events
🔄 Syncing endpoints to agents collection...
✅ Endpoints synced to agents collection: {
  success: true,
  message: "Synced 1/1 endpoints",
  results: [...]
}
```

### With Multiple Endpoints (Future)
```
🚀 Fetching endpoint names from logs...
📊 Total logs fetched: 97601
✅ Extracted 5 unique endpoints from logs
  - DESKTOP-UQJ2EBO: 50000 events
  - cyberpi.tail4c43e.ts.net: 20000 events
  - arunkasthuri-m.tail4c43e.ts.net: 15000 events
  - manjira-ubuntu.tail4c43e.ts.net: 10000 events
  - vaibhav-windows.tail4c43e.ts.net: 2601 events
🔄 Syncing endpoints to agents collection...
✅ Endpoints synced to agents collection: {
  success: true,
  message: "Synced 5/5 endpoints",
  results: [...]
}
```

---

## Topology with Multiple Endpoints

### Visual Layout (5 Endpoints)
```
                        🖥️
                    Main Server
                         
        ╱─────────────────┼─────────────────╲
       /                  |                  \
      /                   |                   \
     ●                    ●                    ●
  Endpoint 1          Endpoint 2          Endpoint 3
  
     ●                    ●
  Endpoint 4          Endpoint 5
```

### With Status Colors
```
                        🖥️ (Blue)
                    Main Server
                         
        ╱─────────────────┼─────────────────╲
       /                  |                  \
      /                   |                   \
     ● (Green)           ● (Green)           ● (Red)
  Online              Online              Offline
  
     ● (Amber)          ● (Green)
  Degraded            Online
```

---

## Interactions

### Hover Over Endpoint
```
Tooltip appears:
┌──────────────────────────────┐
│ DESKTOP-UQJ2EBO              │
│ ID: DESKTOP-UQJ2EBO          │
│ Hostname: DESKTOP-UQJ2EBO    │
│ IP: 100.114.141.67           │
│ OS: Windows                  │
│ Status: active               │
│ Last Seen: Just now          │
└──────────────────────────────┘
```

### Search
```
[Search agents...] → Type "DESKTOP"
↓
Shows only matching endpoints
```

### Filter
```
[Filter] → Toggle checkboxes
☑ Online
☑ Offline
☑ Degraded
↓
Shows only selected status endpoints
```

### Zoom/Pan
```
Mouse wheel: Zoom in/out
Click + drag: Pan around
[Reset]: Return to original view
```

---

## Data Sync to MongoDB

### Before Sync
```
MongoDB agents collection:
(empty or old data)
```

### After Sync
```
MongoDB agents collection:
{
  _id: ObjectId(...),
  agent_id: "DESKTOP-UQJ2EBO",
  endpoint_name: "DESKTOP-UQJ2EBO",
  hostname: "DESKTOP-UQJ2EBO",
  ip_address: "100.114.141.67",
  os_type: "Windows",
  status: "active",
  labels: ["auto-synced-from-logs"],
  last_seen: ISODate("2026-01-06T15:39:45.000Z"),
  first_registered: ISODate("2026-01-06T15:39:45.000Z")
}
```

---

## Performance Timeline

### Initial Load
```
0ms    ├─ Component mounts
       │
50ms   ├─ isLoading = true (spinner shows)
       │
100ms  ├─ fetchAgents() called
       │
150ms  ├─ API request sent
       │
1000ms ├─ API response received (500-2000ms network)
       │
1100ms ├─ Data processing (100-500ms)
       │
1200ms ├─ Endpoint sync (100-300ms)
       │
1300ms ├─ Layout calculation (10-50ms)
       │
1350ms ├─ Rendering (50-200ms)
       │
1400ms ├─ isLoading = false (spinner hidden)
       │
1450ms └─ Topology displayed
```

---

## Troubleshooting Checklist

### ✓ Loading spinner appears
- Component is mounting correctly
- Fetch is starting

### ✓ Spinner disappears after 1-2 seconds
- API request completed
- Data processing finished

### ✓ Endpoints show in topology
- Endpoint extraction working
- Layout calculation working
- Rendering working

### ✓ Console shows logs
- Debugging enabled
- Can track data flow

### ✓ Endpoints in agents collection
- Sync endpoint working
- MongoDB upsert working

---

## Expected Behavior

### Current (1 Endpoint)
- Load time: 1-2 seconds
- Shows 1 node + center
- All 97,601 events from DESKTOP-UQJ2EBO
- Topology displays correctly

### With Multiple Endpoints (Future)
- Load time: 1-3 seconds (slightly longer)
- Shows N nodes + center
- Events distributed across endpoints
- Topology shows star layout with all endpoints

### With Many Endpoints (100+)
- Load time: 2-4 seconds
- May need pagination
- Consider backend aggregation
- Performance still acceptable

---

## Success Indicators

✅ Loading spinner shows while fetching
✅ Console logs show endpoint extraction
✅ Endpoints appear in topology (or empty state)
✅ Endpoints synced to MongoDB agents collection
✅ Retry button works if needed
✅ Load time is 1-3 seconds
✅ No errors in browser console
✅ No errors in backend logs

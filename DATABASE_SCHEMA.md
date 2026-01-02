# SOC Dashboard - Database Schema Reference

## Core Collections

### 1. `users`
**Purpose**: User authentication and profile management
**Location**: `/backend/models/User.js`
**Required Indexes**:
- `email` (unique)
- `username` (unique)
- `role`
- `is_active`

**Sample Entry**:
```javascript
{
  "_id": ObjectId("5f8d0d55b54764421b6b3b1a"),
  "email": "admin@example.com",
  "password_hash": "$2a$10$N9qo8uLOickgx2ZMRZoMy...",
  "username": "admin",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "is_active": true,
  "last_login": ISODate("2025-12-02T05:30:00Z"),
  "created_at": ISODate("2025-12-01T00:00:00Z"),
  "updated_at": ISODate("2025-12-02T05:30:00Z")
}
```

### 2. `logs`
**Purpose**: Security event logging
**Location**: `/backend/models/Log.js`
**Required Indexes**:
- `timestamp` (TTL: 90 days)
- `source_ip` + `timestamp`
- `dest_ip` + `timestamp`
- `severity`
- `log_type`

**Sample Entry**:
```javascript
{
  "_id": ObjectId("5f8d0d55b54764421b6b3b1b"),
  "timestamp": ISODate("2025-12-02T10:15:30Z"),
  "source_ip": "192.168.1.100",
  "dest_ip": "8.8.8.8",
  "endpoint": "firewall-01",
  "severity": "High",
  "log_type": "Firewall",
  "geo": {
    "country": "IN",
    "city": "Mumbai",
    "lat": 19.0760,
    "lon": 72.8777
  },
  "raw": {
    "action": "BLOCK",
    "protocol": "TCP",
    "port": 443,
    "reason": "Suspicious activity"
  },
  "createdAt": ISODate("2025-12-02T10:15:30Z")
}
```

### 3. `taillogs`
**Purpose**: Tailscale network activity logs
**Location**: `/backend/models/TailscaleLog.js`
**Required Indexes**:
- `ts` (TTL: 90 days)
- `type`
- `node_id`
- `user`

**Sample Entry**:
```javascript
{
  "_id": ObjectId("5f8d0d55b54764421b6b3b1c"),
  "ts": ISODate("2025-12-02T10:20:45Z"),
  "type": "peer_connected",
  "node_id": "n1234567890",
  "user": "user@example.com",
  "device_name": "laptop-john",
  "device_os": "windows",
  "ip_address": "100.64.0.1",
  "createdAt": ISODate("2025-12-02T10:20:45Z")
}
```

## Supporting Collections

### 4. `blocked_ips`
**Purpose**: Track blocked IP addresses
**Location**: Referenced in seed data
**Schema**:
```javascript
{
  "_id": ObjectId(),
  "ip": "203.0.113.5",
  "reason": "Multiple failed login attempts",
  "severity": "High",
  "created_by": ObjectId("5f8d0d55b54764421b6b3b1a"), // user._id
  "created_at": ISODate("2025-12-01T15:30:00Z"),
  "expires_at": ISODate("2026-01-01T15:30:00Z"),
  "is_active": true
}
```

### 5. `safe_ips`
**Purpose**: Whitelisted IP addresses
**Schema**:
```javascript
{
  "_id": ObjectId(),
  "ip": "8.8.8.8",
  "notes": "Google DNS server",
  "confidence": "High",
  "tags": ["dns", "trusted"],
  "created_by": ObjectId("5f8d0d55b54764421b6b3b1a"),
  "created_at": ISODate("2025-12-01T10:00:00Z")
}
```

### 6. `alert_rules`
**Purpose**: Alert configuration
**Schema**:
```javascript
{
  "_id": ObjectId(),
  "name": "High Traffic Alert",
  "description": "Alert when IP generates high traffic",
  "condition": {
    "type": "traffic_threshold",
    "threshold": 1000,
    "time_window": 300 // seconds
  },
  "actions": [
    {
      "type": "notification",
      "severity": "High",
      "channels": ["email", "in_app"]
    }
  ],
  "is_active": true,
  "created_by": ObjectId("5f8d0d55b54764421b6b3b1a"),
  "created_at": ISODate("2025-12-01T09:00:00Z")
}
```

### 7. `alert_events`
**Purpose**: Generated alerts
**Schema**:
```javascript
{
  "_id": ObjectId(),
  "title": "Suspicious Activity Detected",
  "description": "Multiple failed login attempts from IP 203.0.113.5",
  "severity": "High",
  "source_ip": "203.0.113.5",
  "dest_ip": "192.168.1.10",
  "rule_id": ObjectId("5f8d0d55b54764421b6b3b1d"),
  "status": "open", // open, in_progress, resolved, false_positive
  "acknowledged_by": ObjectId("5f8d0d55b54764421b6b3b1a"),
  "created_at": ISODate("2025-12-02T11:15:00Z")
}
```

## Database Initialization Script

### 1. Create Admin User
```javascript
// Run in MongoDB shell or as part of your app initialization
use soc_logs;

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.users.insertOne({
  email: "admin@example.com",
  password_hash: "$2a$10$N9qo8uLOickgx2ZMRZoMy...", // Use bcrypt.hashSync("your_secure_password", 10)
  username: "admin",
  firstName: "Admin",
  lastName: "User",
  role: "admin",
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
});
```

### 2. Create Indexes for Logs
```javascript
// Logs collection indexes
db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
db.logs.createIndex({ source_ip: 1, timestamp: -1 });
db.logs.createIndex({ dest_ip: 1, timestamp: -1 });
db.logs.createIndex({ severity: 1 });
db.logs.createIndex({ log_type: 1 });

// Tailscale logs indexes
db.taillogs.createIndex({ ts: 1 }, { expireAfterSeconds: 7776000 });
db.taillogs.createIndex({ type: 1 });
db.taillogs.createIndex({ node_id: 1 });
db.taillogs.createIndex({ user: 1 });
```

## Database Maintenance

### Backup Command
```bash
mongodump --uri="mongodb://192.168.1.35:27017/soc_logs" --out=/backup/soc_dashboard_$(date +%Y%m%d)
```

### Restore Command
```bash
mongorestore --uri="mongodb://192.168.1.35:27017/soc_logs" /backup/soc_dashboard_20251202
```

### Check Database Status
```javascript
// In MongoDB shell
db.stats();

// Check collection sizes
db.getCollectionNames().forEach(c => {
  print(c + " - " + db[c].countDocuments() + " documents");
});
```

## Data Retention Policy

1. **Logs**: 90 days (enforced by TTL index)
2. **Audit Logs**: 1 year
3. **User Activity**: 2 years
4. **Alert History**: 1 year
5. **Blocked IPs**: 30 days after expiration
6. **Backups**: Keep 7 daily, 4 weekly, 12 monthly

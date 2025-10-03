# WebSocket Port Configuration Clarification

**Date**: 2025-10-03  
**Status**: ✅ Documented  
**Priority**: Low (Informational)

## Question

> "IN env i see WS_PORT=3001. Is 3001 correct? Cause the app is working on 3000"

## Answer

**Yes, WS_PORT=3001 is correct!** This is intentional and by design.

## Architecture

The application uses **two separate ports**:

### Port 3000 - Next.js Application
- **Purpose**: Main HTTP/HTTPS web server
- **Handles**: 
  - Page rendering (SSR/SSG)
  - API routes (`/api/*`)
  - Static assets
  - Client-side routing

### Port 3001 - WebSocket Server
- **Purpose**: Real-time event streaming
- **Handles**:
  - Agent execution events
  - Live progress updates
  - Bidirectional communication
  - Redis Pub/Sub integration

## Why Separate Ports?

### 1. **Architecture Separation**
- Next.js handles HTTP requests
- Standalone WebSocket server handles real-time events
- Clean separation of concerns

### 2. **Scalability**
- WebSocket server can be scaled independently
- Can run on different machines in production
- Load balancing flexibility

### 3. **Technology Stack**
- Next.js uses Node.js HTTP server
- WebSocket server uses `ws` library
- Different lifecycle management

### 4. **Development Flexibility**
- Can restart WebSocket server without restarting Next.js
- Easier debugging of real-time features
- Independent monitoring

## Configuration

### Environment Variables

```env
# Main Next.js application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WebSocket server
WS_PORT=3001
WS_HOST=localhost
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_RECONNECT_ATTEMPTS=5
```

### Client Connection

Frontend connects to WebSocket server:

```typescript
// src/providers/WebSocketProvider.tsx
const url = `ws://localhost:${process.env.NEXT_PUBLIC_WS_PORT || '3001'}`
```

### Server Initialization

```typescript
// src/lib/agents/events/websocket-server.ts
const server = new AgentWebSocketServer({
  port: parseInt(process.env.WS_PORT || '3001'),
  redisUrl: process.env.REDIS_URL,
})
```

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │   HTTP Client    │      │  WebSocket Client│       │
│  │  (fetch/axios)   │      │   (ws:// conn)   │       │
│  └────────┬─────────┘      └────────┬─────────┘       │
└───────────┼──────────────────────────┼─────────────────┘
            │                          │
            │ HTTP/HTTPS               │ WebSocket
            │ :3000                    │ :3001
            │                          │
┌───────────▼──────────────────────────▼─────────────────┐
│                      Server                             │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │   Next.js App    │      │  WebSocket Server│       │
│  │   Port 3000      │      │   Port 3001      │       │
│  │                  │      │                  │       │
│  │  - API Routes    │      │  - Event Stream  │       │
│  │  - SSR/SSG       │      │  - Redis Pub/Sub │       │
│  │  - Static Files  │      │  - Subscriptions │       │
│  └──────────────────┘      └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Usage Examples

### 1. API Request (Port 3000)
```typescript
// Sends message via HTTP
const response = await fetch('http://localhost:3000/api/v1/orchestrator/query', {
  method: 'POST',
  body: JSON.stringify({ content: 'Hello' })
})
```

### 2. WebSocket Connection (Port 3001)
```typescript
// Receives real-time updates
const ws = new WebSocket('ws://localhost:3001')

ws.addEventListener('open', () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    executionId: 'exec-123'
  }))
})

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)
  // Handle real-time agent events
})
```

## Production Deployment

### Option 1: Same Server, Different Ports
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
WS_PORT=3001
WS_HOST=0.0.0.0
```

Access:
- HTTP: `https://yourdomain.com`
- WebSocket: `wss://yourdomain.com:3001`

### Option 2: Separate Servers
```env
# Web server
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com

# WebSocket server
WS_PORT=3001
WS_HOST=ws.yourdomain.com
```

Access:
- HTTP: `https://app.yourdomain.com`
- WebSocket: `wss://ws.yourdomain.com:3001`

### Option 3: Reverse Proxy (Recommended)
```nginx
# Nginx configuration
server {
  listen 443 ssl;
  server_name yourdomain.com;

  # HTTP traffic to Next.js
  location / {
    proxy_pass http://localhost:3000;
  }

  # WebSocket traffic to WS server
  location /ws {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Access:
- HTTP: `https://yourdomain.com`
- WebSocket: `wss://yourdomain.com/ws`

## Common Issues

### Issue 1: WebSocket Connection Refused
**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:3001`

**Solution**: Ensure WebSocket server is started
```bash
# Check if server is running
curl http://localhost:3001

# Should return WebSocket server info
```

### Issue 2: CORS Errors
**Symptom**: `Access-Control-Allow-Origin` errors

**Solution**: Update CORS_ORIGINS in .env
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Issue 3: Port Already in Use
**Symptom**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**: Change WS_PORT or kill process using port
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

## Related Files

- `src/lib/agents/events/websocket-server.ts` - WebSocket server implementation
- `src/providers/WebSocketProvider.tsx` - Client-side WebSocket provider
- `src/app/api/ws/route.ts` - WebSocket API route
- `.env` - Environment configuration
- `docs/.env.reference.md` - Environment variable reference

## Summary

✅ **Port 3000** = Next.js HTTP server (main app)  
✅ **Port 3001** = WebSocket server (real-time events)  
✅ **Both are required** for full functionality  
✅ **This is standard practice** for real-time web applications  

The dual-port architecture is intentional and provides better separation, scalability, and maintainability.


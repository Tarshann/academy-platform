# Realtime Decision (Socket.IO on Vercel)

> Choose one option and record the implementation plan.

## Decision

- [x] Option A: Replace live Socket.IO with polling/SSE for Phase 1
- [ ] Option B: Move backend to a websocket-friendly host (Render/Fly/DO)
- [ ] Option C: Replace Socket.IO with a managed realtime layer (Pusher/Ably)

## Rationale

- Vercel serverless does not guarantee stable WebSocket support for long-lived Socket.IO connections.
- Phase 1 will ship with realtime chat disabled by default in production, with the option to re-enable when a websocket-friendly runtime is selected.

## Implementation Steps

1. Disable Socket.IO by default in production (set `ENABLE_SOCKET_IO=false` and `VITE_ENABLE_SOCKET_IO=false`).
2. Re-enable Socket.IO only when deploying to a websocket-capable runtime (set `ENABLE_SOCKET_IO=true` and `VITE_ENABLE_SOCKET_IO=true`).

## Risks

- Live chat is unavailable in production until a realtime strategy is selected.

## Rollback Plan

- Toggle `ENABLE_SOCKET_IO=true` and `VITE_ENABLE_SOCKET_IO=true` once a websocket-compatible runtime is available.

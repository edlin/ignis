const CHANNEL = "plugin:headless-sync";
const POLL_INTERVAL = 3000;
const LOG_KEEPALIVE_INTERVAL = 7000;

class WsListener {
  constructor() {
    this._callbacks = new Map();
    this._handler = null;
    this._rawHandler = null;
    this._pollTimer = null;
    this._currentWs = null;
    this._logSubInterval = null;
    this._logSubVaultId = null;
  }

  start() {
    this._attachToWs();

    this._pollTimer = setInterval(() => {
      this._attachToWs();
    }, POLL_INTERVAL);
  }

  stop() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }

    this.unsubscribeLogs();
    this._detachFromWs();
  }

  isConnected() {
    const ws = window.__ignisWs;
    return ws && ws.readyState === WebSocket.OPEN;
  }

  on(type, callback) {
    if (!this._callbacks.has(type)) {
      this._callbacks.set(type, []);
    }

    this._callbacks.get(type).push(callback);
  }

  off(type, callback) {
    const list = this._callbacks.get(type);

    if (!list) {
      return;
    }

    const idx = list.indexOf(callback);

    if (idx !== -1) {
      list.splice(idx, 1);
    }
  }

  // Listen for raw WebSocket messages (not channel-filtered).
  // Used by core-sync-guard to watch for file changes.
  onRaw(callback) {
    this._rawHandler = callback;
  }

  offRaw() {
    this._rawHandler = null;
  }

  send(type, payload) {
    const ws = window.__ignisWs;

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  // Subscribe to server log broadcasts for a vault.
  // Sends the initial subscribe message and keeps the subscription alive.
  subscribeLogs(vaultId) {
    // If already subscribed to this vault, no-op.
    if (this._logSubVaultId === vaultId && this._logSubInterval) {
      return;
    }

    this.unsubscribeLogs();
    this._logSubVaultId = vaultId;

    this.send("subscribe-logs", { vaultId });

    this._logSubInterval = setInterval(() => {
      this.send("subscribe-logs", { vaultId });
    }, LOG_KEEPALIVE_INTERVAL);
  }

  // Stop the log subscription keepalive.
  unsubscribeLogs() {
    if (this._logSubInterval) {
      clearInterval(this._logSubInterval);
      this._logSubInterval = null;
    }

    this._logSubVaultId = null;
  }

  _attachToWs() {
    const ws = window.__ignisWs;

    if (!ws || ws === this._currentWs) {
      return;
    }

    this._detachFromWs();
    this._currentWs = ws;

    this._handler = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Dispatch raw messages (for non-channel listeners like file watchers)
        if (this._rawHandler) {
          this._rawHandler(msg);
        }

        if (msg.channel !== CHANNEL) {
          return;
        }

        const listeners = this._callbacks.get(msg.type);

        if (listeners) {
          for (const cb of listeners) {
            cb(msg.payload);
          }
        }
      } catch {}
    };

    ws.addEventListener("message", this._handler);
  }

  _detachFromWs() {
    if (this._currentWs && this._handler) {
      this._currentWs.removeEventListener("message", this._handler);
    }

    this._currentWs = null;
    this._handler = null;
  }
}

module.exports = { WsListener };

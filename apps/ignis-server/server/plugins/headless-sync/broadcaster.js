const CHANNEL = "plugin:headless-sync";

class SyncBroadcaster {
  constructor(wss) {
    this._wss = wss;
    this._logSubscriptions = new Map();
  }

  subscribeToLogs(vaultId) {
    this._logSubscriptions.set(vaultId, { expires: Date.now() + 10000 });
  }

  broadcastLog(vaultId, line) {
    if (!this._wss?.clients) {
      return;
    }

    const sub = this._logSubscriptions.get(vaultId);

    if (!sub || Date.now() > sub.expires) {
      return;
    }

    this._send({
      channel: CHANNEL,
      type: "sync-log",
      payload: { vaultId, line },
    });
  }

  broadcastStatus(state) {
    if (!state) {
      return;
    }

    this._send({
      channel: CHANNEL,
      type: "sync-status",
      payload: state,
    });
  }

  _send(msg) {
    if (!this._wss?.clients) {
      return;
    }

    const data = JSON.stringify(msg);

    for (const client of this._wss.clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  }
}

module.exports = { SyncBroadcaster };

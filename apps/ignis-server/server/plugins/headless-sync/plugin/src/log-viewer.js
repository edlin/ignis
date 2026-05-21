const api = require("./api");

async function renderLogViewer(containerEl, vaultId, wsListener) {
  const details = containerEl.createEl("details", {
    cls: "ignis-log-details",
  });

  details.createEl("summary", { text: "Sync logs" });

  const logBox = details.createEl("pre", { cls: "ignis-log-terminal" });
  const codeEl = logBox.createEl("code");

  let logsData;

  try {
    logsData = await api.getLogs(vaultId, 50);
  } catch (e) {
    codeEl.textContent = `Failed to load logs: ${e.message}`;
    return () => {};
  }

  if (logsData.logs.length === 0) {
    codeEl.textContent = "No log entries yet.";
  } else {
    const lines = logsData.logs.map((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      return `[${time}] ${entry.line}`;
    });

    codeEl.textContent = lines.join("\n");
  }

  logBox.scrollTop = logBox.scrollHeight;

  if (!wsListener) {
    return () => {};
  }

  details.addEventListener("toggle", () => {
    if (details.open) {
      wsListener.subscribeLogs(vaultId);
    } else {
      wsListener.unsubscribeLogs();
    }
  });

  const onLog = (payload) => {
    if (payload.vaultId !== vaultId) {
      return;
    }

    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${payload.line}`;

    if (codeEl.textContent === "No log entries yet.") {
      codeEl.textContent = line;
    } else {
      codeEl.textContent += "\n" + line;
    }

    const isNearBottom =
      logBox.scrollHeight - logBox.scrollTop - logBox.clientHeight < 50;

    if (isNearBottom) {
      logBox.scrollTop = logBox.scrollHeight;
    }
  };

  wsListener.on("sync-log", onLog);

  return () => {
    wsListener.off("sync-log", onLog);
    wsListener.unsubscribeLogs();
  };
}

module.exports = { renderLogViewer };

const auth = require("./auth");
const obCli = require("./ob-cli");

function mountRoutes(router, plugin) {
  router.get("/status", (req, res) => {
    const ctx = plugin.getCtx();
    const obStatus = plugin.getObStatus();

    const tokenInfo = auth.getTokenInfo(ctx.dataDir);

    res.json({
      installed: obStatus?.installed || false,
      version: obStatus?.version || null,
      authenticated: auth.isAuthenticated(ctx.dataDir),
      email: tokenInfo?.email || null,
      name: tokenInfo?.name || null,
    });
  });

  router.post("/login", (req, res) => {
    const ctx = plugin.getCtx();
    const { token, email, name } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    try {
      auth.saveToken(ctx.dataDir, { token, email: email || null, name: name || null });
      ctx.log(`Auth token saved${email ? ` for ${email}` : ""}`);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/logout", (req, res) => {
    const ctx = plugin.getCtx();

    try {
      auth.clearToken(ctx.dataDir);
      ctx.log("Auth token cleared");
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/remote-vaults", async (req, res) => {
    const ctx = plugin.getCtx();

    if (!auth.isAuthenticated(ctx.dataDir)) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const result = await obCli.runCommand(["sync-list-remote"]);
      const vaults = parseRemoteVaults(result.stdout);
      res.json({ vaults });
    } catch (e) {
      ctx.log(`Failed to list remote vaults: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });
}

function parseRemoteVaults(stdout) {
  const lines = stdout.trim().split("\n");
  const vaults = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("Available")) {
      continue;
    }

    // Format: [vaultId]  "[vaultName]"  ([region])
    const match = trimmed.match(/^([a-f0-9]+)\s+"([^"]+)"/);

    if (match) {
      vaults.push({ id: match[1], name: match[2] });
    }
  }

  return vaults;
}

module.exports = { mountRoutes };

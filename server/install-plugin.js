const fs = require("fs");
const path = require("path");

async function installPluginInVault(vaultPath) {
  const obsidianDir = path.join(vaultPath, ".obsidian");
  const pluginDir = path.join(obsidianDir, "plugins", "ignis-bridge");

  if (!(await fs.promises.stat(obsidianDir).catch(() => null))) {
    return false;
  }

  if (!(await fs.promises.stat(pluginDir).catch(() => null))) {
    await fs.promises.mkdir(pluginDir, { recursive: true });

    const pluginSrcDir = path.join(__dirname, "..", "plugin");
    await fs.promises.copyFile(
      path.join(pluginSrcDir, "manifest.json"),
      path.join(pluginDir, "manifest.json"),
    );
    await fs.promises.copyFile(
      path.join(pluginSrcDir, "main.js"),
      path.join(pluginDir, "main.js"),
    );
  }

  const pluginsConfig = path.join(obsidianDir, "community-plugins.json");
  let plugins = [];

  if (await fs.promises.stat(pluginsConfig).catch(() => null)) {
    try {
      plugins = JSON.parse(await fs.promises.readFile(pluginsConfig, "utf8"));
    } catch (e) {
      plugins = [];
    }
  }

  if (!plugins.includes("ignis-bridge")) {
    plugins.push("ignis-bridge");
    await fs.promises.writeFile(pluginsConfig, JSON.stringify(plugins));
    return true;
  }

  return false;
}

async function installPluginInAllVaults(vaultRoot) {
  if (!(await fs.promises.stat(vaultRoot).catch(() => null))) {
    return;
  }

  const entries = await fs.promises.readdir(vaultRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const vaultPath = path.join(vaultRoot, entry.name);
      const installed = await installPluginInVault(vaultPath);

      if (installed) {
        console.log(`[ignis] Installed plugin in vault: ${entry.name}`);
      }
    }
  }
}

module.exports = { installPluginInVault, installPluginInAllVaults };

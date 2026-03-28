// Stub  -  will be replaced with real implementation in Phase 4
const { Plugin } = require("obsidian");

class IgnisHeadlessSyncPlugin extends Plugin {
  async onload() {
    console.log("[ignis-headless-sync] Loaded (stub)");
  }

  onunload() {
    console.log("[ignis-headless-sync] Unloaded (stub)");
  }
}

module.exports = IgnisHeadlessSyncPlugin;

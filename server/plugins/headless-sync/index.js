const path = require("path");
const obCli = require("./ob-cli");
const auth = require("./auth");

module.exports = {
  id: "headless-sync",
  name: "Headless Sync",
  description: "Server-side vault sync via obsidian-headless CLI",

  obsidianPlugin: path.join(__dirname, "plugin"),

  _ctx: null,
  _obStatus: null,

  async register(ctx) {
    this._ctx = ctx;

    this._obStatus = obCli.checkInstalled();

    if (this._obStatus.installed) {
      ctx.log(`ob CLI available (${this._obStatus.version})`);
    } else {
      ctx.log("ob CLI not found. Install obsidian-headless to enable sync.");
    }

    const token = auth.loadToken(ctx.dataDir);

    if (token) {
      ctx.log("Auth token loaded");
    }

    const { mountRoutes } = require("./routes");
    mountRoutes(ctx.router, this);
  },

  async shutdown() {
    this._ctx = null;
  },

  async onVaultEnabled(vaultId, vaultPath) {
    if (this._ctx) {
      this._ctx.log(`Vault enabled: ${vaultId}`);
    }
  },

  async onVaultDisabled(vaultId, vaultPath) {
    if (this._ctx) {
      this._ctx.log(`Vault disabled: ${vaultId}`);
    }
  },

  getObStatus() {
    return this._obStatus;
  },

  getCtx() {
    return this._ctx;
  },
};

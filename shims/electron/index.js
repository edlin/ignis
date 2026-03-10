// Electron module shim
// Returned when Obsidian calls: window.require('electron')

import { ipcRenderer } from "./ipc-renderer.js";
import { webFrame } from "./web-frame.js";
import { remoteShim } from "./remote/index.js";

export const electronShim = {
  ipcRenderer,
  webFrame,
  remote: remoteShim,

  // electron.webUtils  -  used for drag/drop file path extraction (desktop only)
  webUtils: {
    getPathForFile(file) {
      return "";
    },
  },

  // electron.deprecate  -  used by Obsidian to mark deprecated APIs
  deprecate: {
    function(fn, name) {
      return fn;
    },
    event(emitter, name) {},
    removeFunction(fn, name) {
      return fn;
    },
    log(message) {
      console.log("[electron:deprecate]", message);
    },
    warn(oldName, newName) {},
    promisify(fn) {
      return fn;
    },
    renameFunction(fn, newName) {
      return fn;
    },
  },
};

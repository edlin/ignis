const { Plugin, Notice, TFolder } = require("obsidian");

class IgnisBridgePlugin extends Plugin {
  async onload() {
    console.log("[ignis-bridge] Plugin loaded");

    this.addRibbonIcon("upload", "Upload file", () => {
      this.showFilePicker();
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle("Upload file")
              .setIcon("upload")
              .onClick(() => {
                this.showFilePicker(file);
              });
          });
        }
      })
    );
  }

  showFilePicker(targetFolder = null) {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.style.display = "none";

    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) return;

      const folder = targetFolder || this.app.vault.getRoot();
      const folderPath = folder.path;

      new Notice(`Uploading ${files.length} file(s)...`);

      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const targetPath = folderPath
            ? `${folderPath}/${file.name}`
            : file.name;

          await this.app.vault.createBinary(targetPath, arrayBuffer);
          successCount++;
        } catch (e) {
          console.error("[ignis-bridge] Upload failed:", file.name, e);
          errorCount++;
        }
      }

      if (successCount > 0) {
        new Notice(`Uploaded ${successCount} file(s) successfully`);
      }
      if (errorCount > 0) {
        new Notice(`Failed to upload ${errorCount} file(s)`, 5000);
      }

      input.remove();
    });

    document.body.appendChild(input);
    input.click();
  }

  onunload() {
    console.log("[ignis-bridge] Plugin unloaded");
  }
}

module.exports = IgnisBridgePlugin;

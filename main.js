const { Plugin, PluginSettingTab, Setting } = require("obsidian");

module.exports = class CursorPositionPlugin extends Plugin {
  async onload() {
    console.log("Cursor Position Plugin Loaded");
    await this.loadSettings();

    // Add plugin settings
    this.addSettingTab(new CursorPositionSettingTab(this.app, this));

    // Register observer for detecting Enter key on title
    this.registerDomEvent(document, "keydown", (event) => {
      if (event.key === "Enter") {
        const activeLeaf = this.app.workspace.activeLeaf;

        // Check if focus is on the note title input
        if (event.srcElement.classList.contains("inline-title")) {
          this.handleTitleEnter(activeLeaf);
        }
      }
    });
  }

  async handleTitleEnter(activeLeaf) {
    if (!activeLeaf) return;

    const editor = activeLeaf.view.sourceMode?.cmEditor;
    if (!editor) return;

    const cursorSetting = this.settings.cursorPosition || "default";

    if (cursorSetting === "beginning") {
      editor.setCursor(0, 0);
    } else if (cursorSetting === "end") {
      const lastLine = editor.lastLine();
      editor.setCursor(lastLine, editor.getLine(lastLine).length);
    }
    // Default behavior: do nothing
  }
  
  onunload() {
    console.log("Cursor Position Plugin Unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign(
      { cursorPosition: "default" },
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class CursorPositionSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    // Setting: Cursor Position
    new Setting(containerEl)
      .setName("Cursor position on title enter")
      .setDesc(
        "Choose the cursor behavior when when press enter on note title."
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption("default", "Last Known Cursor (Default)")
          .addOption("beginning", "Beginning of Note")
          .addOption("end", "Last Line of Note")
          .setValue(this.plugin.settings.cursorPosition)
          .onChange(async (value) => {
            this.plugin.settings.cursorPosition = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

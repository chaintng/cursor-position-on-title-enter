import { Plugin, PluginSettingTab, Setting, App, MarkdownFileInfo } from "obsidian";

interface CursorPositionPluginSettings {
  cursorPosition: string;
}

const DEFAULT_SETTINGS: CursorPositionPluginSettings = {
  cursorPosition: "default",
};

const FIND_INDEX_AFTER_3RD_CHARACTERS: number = 3;

export default class CursorPositionPlugin extends Plugin {
  settings: CursorPositionPluginSettings;

  async onload() {
    await this.loadSettings();

    // Add plugin settings
    this.addSettingTab(new CursorPositionSettingTab(this.app, this));

    // Register observer for detecting Enter key on title
    this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const activeEditor = this.app.workspace.activeEditor;

        // Check if focus is on the note title input
        if (event.target instanceof HTMLElement && event.target.classList.contains("inline-title")) {
          if (!activeEditor) return;
          this.handleTitleEnter(activeEditor);
        }
      }
    });
  }

  async handleTitleEnter(activeEditor: MarkdownFileInfo) {
    const editor = activeEditor.editor;
    if (!editor) return;

    const cursorSetting = this.settings.cursorPosition || "default";

    if (cursorSetting === "beginning") {
      const content = editor.getValue();
      const frontmatterEnd = content.indexOf('---', FIND_INDEX_AFTER_3RD_CHARACTERS); // Find the end of the frontmatter section

      if (frontmatterEnd !== -1) {
        const nextLine = editor.offsetToPos(frontmatterEnd + 3).line + 1;
        editor.setCursor(nextLine, 0);
      } else {
        editor.setCursor(0, 0); // Fallback to beginning if no frontmatter found
      }
    } else if (cursorSetting === "end") {
      const lastLine = editor.lastLine();
      editor.setCursor(lastLine, editor.getLine(lastLine).length);
    }
    // Default behavior: do nothing
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class CursorPositionSettingTab extends PluginSettingTab {
  plugin: CursorPositionPlugin;

  constructor(app: App, plugin: CursorPositionPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    // Setting: Cursor Position
    new Setting(containerEl)
      .setName("Cursor position on title enter")
      .setDesc("Choose the cursor behavior when when press enter on note title.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("default", "Last known cursor (default)")
          .addOption("beginning", "Beginning of note")
          .addOption("end", "Last line of note")
          .setValue(this.plugin.settings.cursorPosition)
          .onChange(async (value) => {
            this.plugin.settings.cursorPosition = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

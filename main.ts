import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Keymap, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		let postProc: MarkdownPostProcessor;

		postProc = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

			let linkElements = el.querySelectorAll('a.internal-link');
			let barIndex, aliasBefore,aliasAfter,comma,alias;

			for(let i = 0; i < linkElements.length; i++) {

				let linkAsHTML = (linkElements[i] as HTMLElement).innerText;

				barIndex = linkAsHTML.indexOf(">");
				if(barIndex < 0) continue;
				aliasBefore = linkAsHTML.substr(0,barIndex-1);
				aliasAfter = linkAsHTML.substr(barIndex+2);
				comma = ",";
				alias = "";
				alias = alias.concat(aliasBefore,comma,aliasAfter);
				/*alias = alias.concat(comma);*/
				/*alias = alias.concat(aliasAfter);*/
				//(linkElements[i] as HTMLElement).href = "link";
				(linkElements[i] as HTMLElement).innerText = alias;
				(linkElements[i] as HTMLElement).className = 'header-range-link'

			}
		}
		this.registerMarkdownPostProcessor(postProc);

		let hoverHeaderRange = (event: MouseEvent, target: HTMLElement) => {
			console.log("hoverHeaderRange")
			const p = document.createElement("p");
			p.textContent = "Hello, World!";
			//this.app.workspace.trigger("link-hover",{},target, "Target", "")
			this.app.workspace.trigger("hover-link",event,"header-range-link",this.parent,target, "Target", "")
		}

		let clickHeaderRange = async (event: MouseEvent, target: HTMLElement) => {
    		await this.app.workspace.openLinkText(target.getAttr("href"), "/",Keymap.isModifier(event, 'Mod') || 1 === event.button)
			// TODO : scroll and highlight in yellow the header range
		}

		// Show the header range when hovering on header-range-link
		document.on('mouseover', `.header-range-link`, hoverHeaderRange);
		// Copy internal-link behaviour when header-range-link is clicked
		document.on('click', `.header-range-link`, clickHeaderRange);

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

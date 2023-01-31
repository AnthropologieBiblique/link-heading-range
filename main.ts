import { App, Plugin, PluginSettingTab, Keymap, Setting } from 'obsidian';
import { buildCMViewPlugin } from './src/live-preview';
import { postProcessorBuilder } from './src/reading-mode';

import { Prec } from "@codemirror/state";
import { LinkHeadingRangePluginSettings, DEFAULT_SETTINGS } from 'src/plugin-settings';

// Remember to rename these classes and interfaces!


export default class LinkHeadingRange extends Plugin {
	settings: LinkHeadingRangePluginSettings;
	app: App;
	// hoverHeadingRangeFunc: (event: MouseEvent, target: HTMLElement) => void;
	// clickHeadingRangeFunc: (event: MouseEvent, target: HTMLElement) => void;

	async onload() {
		await this.loadSettings();
		console.log('current seettings', this.settings);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LinkHeadingRangeSettingTab(this.app, this));
		
		// Reader mode processor
		this.registerMarkdownPostProcessor(postProcessorBuilder(app, this.settings));

		// Live preview mode processor
		const ext = Prec.lowest(buildCMViewPlugin(this.app));
		this.registerEditorExtension(ext);

		document.on(`mouseover`, `.heading-range-link`, this.hoverHeaderRange.bind(this));
		document.on(`mouseover`, `.heading-range-preview-link`, this.hoverHeaderPreviewRange.bind(this));
		document.on('click', `.heading-range-link`, this.clickHeaderRange.bind(this));
	}

	onunload() {

		document.off(`mouseover`, `.heading-range-link`, this.hoverHeaderRange.bind(this));
		document.on(`mouseover`, `.heading-range-preview-link`, this.hoverHeaderPreviewRange.bind(this));
		document.off('click', `.heading-range-link`, this.clickHeaderRange.bind(this));

		// TODO : Option to loop through all files, 
		// and replace [[Page#HeaderA#HeaderB]] by [[Page#HeaderA]]-HeaderB ?
		// That would prevent the plugin from "beaking" notes
	}

	hoverHeaderPreviewRange(event: MouseEvent, target: HTMLElement) {
		let linkText = target.innerText;
		linkText = linkText.replace(`:`, `#`);
		
		this.app.workspace.trigger("link-hover",target,target, linkText, "",{scroll:parseInt(target.getAttribute("scrollline")!)})
	}

	hoverHeaderRange(event: MouseEvent, target: HTMLElement) {
		console.log('hover header range', target, target.innerText, target.getAttribute("linktext"));
		this.app.workspace.trigger("link-hover",target,target, target.getAttribute("linktext"), "",{scroll:parseInt(target.getAttribute("scrollline")!)})
		// Apparently nothing else from eState than "scroll" will be used by the hover preview internals (see Discord message)
		// TODO : Can I find a way to remove the yellow highlight ?
		// TODO : Can I find a way to scroll to first heading when clicking on the link tooltip ?
		// TODO : Can I find a way to display only the range in the popover instead of displaying the whole note and scroll to the first heading ?
	}

	async clickHeaderRange(event: MouseEvent, target: HTMLElement) {
		console.log('click header range');
		await this.app.workspace.openLinkText(target.getAttr("href")!, "/",Keymap.isModifier(event, 'Mod') || 1 === event.button)
		// TODO : scroll and highlight in yellow the heading range
		// Tried to pass an ephemeral state, but without success...
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class LinkHeadingRangeSettingTab extends PluginSettingTab {
	plugin: LinkHeadingRange;

	constructor(app: App, plugin: LinkHeadingRange) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Link Heading Range'});

		new Setting(containerEl)
			.setName('Page to heading divider')
			.setDesc('This divider will be used in preview mode in all links, between the page and the first heading')
			.addText(text => text
				.setPlaceholder('Enter a symbol')
				.setValue(this.plugin.settings.dividerP2H)
				.onChange(async (value) => {
					console.log('dividerP2H: ' + value);
					this.plugin.settings.dividerP2H = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Heading to heading divider')
			.setDesc('This divider will be used in preview mode in all links, between the first and the last heading')
			.addText(text => text
				.setPlaceholder('Enter a symbol')
				.setValue(this.plugin.settings.dividerH2H)
				.onChange(async (value) => {
					console.log('dividerH2H: ' + value);
					this.plugin.settings.dividerH2H = value;
					await this.plugin.saveSettings();
				}));
	}
}

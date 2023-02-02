import { App, Plugin, PluginSettingTab, Keymap, Setting } from 'obsidian';
import { buildCMViewPlugin } from './src/live-preview';
import { postProcessorBuilder } from './src/reading-mode';
import { HoverTargetFileProcessor } from './src/hover-target-file-processor';
import { LinkTextParser } from './src/link-text-parser';

import { Prec } from "@codemirror/state";
import { LinkHeadingRangePluginSettings, DEFAULT_SETTINGS } from 'src/plugin-settings';

export default class LinkHeadingRange extends Plugin {
	settings: LinkHeadingRangePluginSettings;
	app: App;
	hoverHeadingRangeReadingModeFunc: (event: MouseEvent, target: HTMLElement) => void;
	hoverHeadingRangeLiveModeFunc: (event: MouseEvent, target: HTMLElement) => void;
	// clickHeadingRangeFunc: (event: MouseEvent, target: HTMLElement) => void;

	async onload() {
		await this.loadSettings();
		console.log('current seettings', this.settings);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LinkHeadingRangeSettingTab(this.app, this));
		
		// Reader mode processor
		this.registerMarkdownPostProcessor(postProcessorBuilder(app, this.settings));

		// Live preview mode processor
		const ext = Prec.lowest(buildCMViewPlugin(this.app, this.settings));
		this.registerEditorExtension(ext);

		this.hoverHeadingRangeReadingModeFunc = this.hoverHeaderPreviewRange.bind(this);
		this.hoverHeadingRangeLiveModeFunc = this.hoverHeaderPreviewRange.bind(this);

		document.on(`mouseover`, `.heading-range-reading-link`, this.hoverHeadingRangeReadingModeFunc);
		document.on(`mouseover`, `.heading-range-live-link`, this.hoverHeadingRangeLiveModeFunc);
		//document.on('click', `.heading-range-link`, this.clickHeaderRange.bind(this));
	}

	onunload() {

		document.off(`mouseover`, `.heading-range-link`, this.hoverHeadingRangeReadingModeFunc);
		document.on(`mouseover`, `.heading-range-preview-link`, this.hoverHeadingRangeLiveModeFunc);
		//document.off('click', `.heading-range-link`, this.clickHeaderRange.bind(this));

		// TODO : Option to loop through all files, 
		// and replace [[Page#HeaderA#HeaderB]] by [[Page#HeaderA]]-HeaderB ?
		// That would prevent the plugin from "beaking" notes
	}

	hoverHeaderPreviewRange(event: MouseEvent, target: HTMLElement) {
		let linkText = target.innerText;
		linkText = linkText.replace(':', '#').replace('-', '>');

		const linkTextParseResult = LinkTextParser.parse(linkText);
		if (linkTextParseResult !== null) {
			const fileResult = HoverTargetFileProcessor.process(this.app, linkTextParseResult.fileName, linkTextParseResult.headingA);
			this.app.workspace.trigger("link-hover",target,target, linkTextParseResult.fileName, '',{ scroll: fileResult?.startLine })
		}
		else {
			this.app.workspace.trigger("link-hover",target,target, linkText, '', { scroll: 0 });
		}
	}

	hoverHeaderRange(event: MouseEvent, target: HTMLElement) {
		this.app.workspace.trigger("link-hover",target,target, target.getAttribute("linktext"), "",{scroll:parseInt(target.getAttribute("scrollline")!)})
		// Apparently nothing else from eState than "scroll" will be used by the hover preview internals (see Discord message)
		// TODO : Can I find a way to remove the yellow highlight ?
		// TODO : Can I find a way to scroll to first heading when clicking on the link tooltip ?
		// TODO : Can I find a way to display only the range in the popover instead of displaying the whole note and scroll to the first heading ?
	}

	async clickHeaderRange(event: MouseEvent, target: HTMLElement) {
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
					this.plugin.settings.dividerH2H = value;
					await this.plugin.saveSettings();
				}));
	}
}

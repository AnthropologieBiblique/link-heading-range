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
			let wikiLinkRegex = /([^\#\]\|\[]*)\#?([^\#\]\|\[]*)?\#?([^\|\]\[]*)?/;
			let barIndex, aliasBefore,aliasAfter,comma,alias;

			for(let i = 0; i < linkElements.length; i++) {
				let linkAsHTML = (linkElements[i] as HTMLElement).getAttribute('data-href')
				let matches = wikiLinkRegex.exec(linkAsHTML)
				/*
				console.log(matches);
				console.log("Page", matches[1]);
				console.log("Header A", matches[2]);
				console.log("Header B", matches[3]);
				*/

				if (matches[2] == undefined) {
					// console.log("Simple link, doing nothing")
					continue
				}

				if (matches[3] == undefined) {
					// console.log("Link with one header, only changing innerText")
					let page = matches[1];
					let header = matches[2];
					let dividerP2H = ",";
					let innerText = "";
					innerText = innerText.concat(page,dividerP2H,header);
					(linkElements[i] as HTMLElement).innerText = innerText;
					continue
				}

				// console.log("Link with two headers, changing innerText and className")
				// TODO : What should happen if user mistakenly inputs last header first ?

				//console.log(this.app.workspace.getActiveFile())
				console.log(this.app.metadataCache.getFileCache(this.app.workspace.getActiveFile()).toString())

				let page = matches[1];
				let headerA = matches[2];
				let headerB = matches[3];
				let dividerP2H = ",";
				let dividerH2H = "-"
				let innerText = "";
				let href = "";
				innerText = innerText.concat(page,dividerP2H,headerA,dividerH2H,headerB);
				(linkElements[i] as HTMLElement).innerText = innerText;
				(linkElements[i] as HTMLElement).href = href.concat(page,"#",headerA);
				(linkElements[i] as HTMLElement).className = 'header-range-link';
				(linkElements[i] as HTMLElement).setAttribute("linktext",page);
				(linkElements[i] as HTMLElement).setAttribute("scrollline",40);

				// TODO : Can we cache these elements ?

				continue
			}
		}

		this.registerMarkdownPostProcessor(postProc);

		let hoverHeaderRange = (event: MouseEvent, target: HTMLElement) => {
			this.app.workspace.trigger("link-hover",target,target, target.getAttribute("linktext"), "",{scroll:parseInt(target.getAttribute("scrollline"))})
			// Apparently nothing else from eState than "scroll" will be used by the hover preview internals (see Discord message)
			// TODO : Can I find a way to remove the yellow highlight ?
			// TODO : Can I find a way to scroll to first header when clicking on the link tooltip ?
			// TODO : Can I find a way to display only the range in the popover instead of displaying the whole note and scroll to the first header ?
		}

		let clickHeaderRange = async (event: MouseEvent, target: HTMLElement) => {
    		await this.app.workspace.openLinkText(target.getAttr("href"), "/",Keymap.isModifier(event, 'Mod') || 1 === event.button)
			// TODO : scroll and highlight in yellow the header range
			// Tried to pass an ephemeral state, but without success...
		}

		document.on('mouseover', `.header-range-link`, hoverHeaderRange);
		document.on('click', `.header-range-link`, clickHeaderRange);

	}

	onunload() {

		document.off('mouseover', `.header-range-link`, hoverHeaderRange);
		document.off('click', `.header-range-link`, clickHeaderRange);

		// TODO : Option to loop through all files, 
		// and replace [[Page#HeaderA#HeaderB]] by [[Page#HeaderA]]-HeaderB ?
		// That would prevent the plugin from "beaking" notes

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

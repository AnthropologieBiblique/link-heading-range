import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Keymap, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface LinkHeadingRangePluginSettings {
	dividerP2H: string;
	dividerH2H: string
}

const DEFAULT_SETTINGS: LinkHeadingRangePluginSettings = {
	dividerP2H: ' > ',
	dividerH2H: ' > ',
}

export default class LinkHeadingRange extends Plugin {
	settings: LinkHeadingRangePluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LinkHeadingRangeSettingTab(this.app, this));

		let postProc: MarkdownPostProcessor;

		postProc = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

			let linkElements = el.querySelectorAll('a.internal-link');
			let wikiLinkRegex = /([^\#\]\|\[]*)\#?([^\#\]\|\[]*)?\#?([^\|\]\[]*)?/;
			let barIndex, aliasBefore,aliasAfter,comma,alias;

			for(let i = 0; i < linkElements.length; i++) {
				let linkAsHTML = (linkElements[i] as HTMLElement).getAttribute('data-href')
				let matches = wikiLinkRegex.exec(linkAsHTML)

				if (matches[2] == undefined) {
					// console.log("Simple link, doing nothing")
					continue
				}

				let page = matches[1];
				let headingA = matches[2];
				let headingB = matches[3];
				let dividerP2H = this.settings.dividerP2H;
				let dividerH2H = this.settings.dividerH2H;
				let innerText = "";
				let href = "";

				let standardInnerText = "";
				standardInnerText = standardInnerText.concat(page," > ",headingA);

				if (headingB == undefined) {
					// console.log("Link with one heading, only changing innerText")
					if ((linkElements[i] as HTMLElement).innerText == standardInnerText){
						innerText = innerText.concat(page,dividerP2H,headingA);
						(linkElements[i] as HTMLElement).innerText = innerText;
					}
					continue
				}

				// console.log("Link with two headings, changing innerText and className")
				// TODO : What should happen if user mistakenly inputs last heading first ?

				let line = this.app.metadataCache.getFileCache(
					this.app.vault.getMarkdownFiles().filter(
						(file) => file.basename == matches[1])[0]
					)["headings"].filter(
						(heading) => heading.heading == matches[2]
					)[0].position.end.line;

				innerText = "";
				href = "";

				(linkElements[i] as HTMLElement).href = href.concat(page,"#",headingA);
				(linkElements[i] as HTMLElement).className = 'heading-range-link';
				(linkElements[i] as HTMLElement).setAttribute("linktext",page);
				(linkElements[i] as HTMLElement).setAttribute("scrollline",line);

				standardInnerText = "";
				standardInnerText = standardInnerText.concat(page," > ",headingA," > ",headingB);

				if ((linkElements[i] as HTMLElement).innerText == standardInnerText) {
					innerText = innerText.concat(page,dividerP2H,headingA,dividerH2H,headingB);
					(linkElements[i] as HTMLElement).innerText = innerText;
				}

				// TODO : Can we cache these elements ?

				continue
			}
		}

		this.registerMarkdownPostProcessor(postProc);

		let hoverHeaderRange = (event: MouseEvent, target: HTMLElement) => {
			this.app.workspace.trigger("link-hover",target,target, target.getAttribute("linktext"), "",{scroll:parseInt(target.getAttribute("scrollline"))})
			// Apparently nothing else from eState than "scroll" will be used by the hover preview internals (see Discord message)
			// TODO : Can I find a way to remove the yellow highlight ?
			// TODO : Can I find a way to scroll to first heading when clicking on the link tooltip ?
			// TODO : Can I find a way to display only the range in the popover instead of displaying the whole note and scroll to the first heading ?
		}

		let clickHeaderRange = async (event: MouseEvent, target: HTMLElement) => {
    		await this.app.workspace.openLinkText(target.getAttr("href"), "/",Keymap.isModifier(event, 'Mod') || 1 === event.button)
			// TODO : scroll and highlight in yellow the heading range
			// Tried to pass an ephemeral state, but without success...
		}

		document.on('mouseover', `.heading-range-link`, hoverHeaderRange);
		document.on('click', `.heading-range-link`, clickHeaderRange);

	}

	onunload() {

		document.off('mouseover', `.heading-range-link`, hoverHeaderRange);
		document.off('click', `.heading-range-link`, clickHeaderRange);

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

class LinkHeadingRangeSettingTab extends PluginSettingTab {
	plugin: LinkHeadingRange;

	constructor(app: App, plugin: LinkHeadingRange) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Link Heading Range plugin.'});

		new Setting(containerEl)
			.setName('Page to heading divider')
			.setDesc('This divider will be used in preview mode in all links, between the page and the heading')
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

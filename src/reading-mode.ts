import { App, MarkdownPostProcessor, MarkdownPostProcessorContext } from 'obsidian';
import { LinkHeadingRangePluginSettings } from './plugin-settings';

export function postProcessorBuilder(app: App, settings: LinkHeadingRangePluginSettings): MarkdownPostProcessor {

  let postProc: MarkdownPostProcessor = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    console.log('reading mode markdown processing', ctx.sourcePath);
    const linkElements = el.querySelectorAll('a.internal-link');
    const wikiLinkRegex = /([^#\]|[]*)#?([^#\]|[]*)?>?([^|\][]*)?/;
  
    for(let i = 0; i < linkElements.length; i++) {
      const linkAsHTML = (linkElements[i] as HTMLElement).getAttribute('data-href')
  
      if (linkAsHTML == null) {
        console.log('data-href is null', linkElements[i]);
        continue;
      }
  
      const matches = wikiLinkRegex.exec(linkAsHTML)
  
      if (matches == null) {
        console.log('no matches', linkAsHTML);
        continue;
      }
  
      if (matches[2] == undefined) {
        // console.log("Simple link, doing nothing")
        console.log('matches 2 undefined')
        continue
      }
  
      const page = matches[1];
      let headingA = matches[2];
      let headingB = matches[3];
      const dividerP2H = settings.dividerP2H;
      const dividerH2H = settings.dividerH2H;
      let innerText = "";
      let href = "";
  
      if (headingB == undefined) {
        if (headingA.contains('>')) {
          const headingSplit = headingA.split('>')
          headingA = headingSplit[0];
          headingB = headingSplit[1];
        }
      }

      let standardInnerText = "";
      standardInnerText = standardInnerText.concat(page, '#' ,headingA);
  
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
  
      const relevantMarkdownFiles = app.vault.getMarkdownFiles().filter((file) => file.basename == page);
      const cachedFile = app.metadataCache.getFileCache(relevantMarkdownFiles[0]);
  
      if (cachedFile == null) {
        continue;
      }
  
      // TODO EBS: Added this bang...can it be null?
      const matchingHeadings = cachedFile["headings"]!.filter((heading) => heading.heading == headingA);
      const line = matchingHeadings[0].position.end.line;
  
      innerText = "";
      href = "";

      (linkElements[i] as HTMLAnchorElement).href = href.concat(page,"#",headingA);
      (linkElements[i] as HTMLElement).className = 'heading-range-reading-link';
      (linkElements[i] as HTMLElement).setAttribute("linktext",page);
      (linkElements[i] as HTMLElement).setAttribute("scrollline",line.toString());
      (linkElements[i] as HTMLElement).innerText = ''.concat(page, dividerP2H, headingA, dividerH2H, headingB);
  
      standardInnerText = "";
      standardInnerText = standardInnerText.concat(page,":",headingA,"-",headingB);
  
      if ((linkElements[i] as HTMLElement).innerText === standardInnerText) {
        innerText = innerText.concat(page,dividerP2H,headingA,dividerH2H,headingB);
        (linkElements[i] as HTMLElement).innerText = innerText;
      }
  
      // TODO : Can we cache these elements ?
  
      continue
    }
  }

  return postProc;
}
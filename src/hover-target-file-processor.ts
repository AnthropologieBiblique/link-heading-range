import { App } from "obsidian";

export class HoverTargetFileProcessor {

  public static process(app: App, fileName: string, headingA: string): HoverTargetInfo | null {

    const relevantMarkdownFiles = app.vault.getMarkdownFiles().filter((file) => file.basename == fileName);
    const cachedFile = app.metadataCache.getFileCache(relevantMarkdownFiles[0]);

    if (cachedFile === null) {
      return null;
    }

    const matchingHeadings = cachedFile["headings"]!.filter((heading) => heading.heading == headingA);
    const line = matchingHeadings[0].position.end.line;
  
    return {
      startLine: line
    }
  }
}


export class HoverTargetInfo {
  startLine: number;
}
interface ParsedLink {
  fileName: string;
  headingA: string;
  headingB: string;
}

export class LinkTextParser {

  public static parse(linkText: string) : ParsedLink | null {
    if (linkText.contains('>') && linkText.contains('#')) {
      const headingSplit = linkText.split('#');
      const rangeSplit = headingSplit[1].split('>');
      
      return {
        fileName: headingSplit[0],
        headingA: rangeSplit[0],
        headingB: rangeSplit[1]
      }
    }

    return null;
  }

}
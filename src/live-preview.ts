import { App } from 'obsidian';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { syntaxTree, tokenClassNodeProp } from "@codemirror/language";
import { LinkHeadingRangePluginSettings } from './plugin-settings';

class CharacterOverwriteWidget extends WidgetType {

  private char: string;
  constructor(char: string) {
    super();
    this.char = char;
  }

  toDOM() {
    let el = document.createElement("span");
    el.innerText = this.char;
    el.style.textDecoration = 'underline';
    return el;
  }
}

export function buildCMViewPlugin(app: App, settings: LinkHeadingRangePluginSettings) {
  console.log('the codemirror plugin', app);

  const viewPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      decoratedRanges: Array<{ from: number, to: number }>;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view, null);
      }

      update(update: ViewUpdate) {
        let currentLocation = {
          from: update.state.selection.ranges[0].from,
          to: update.state.selection.ranges[0].to
        };
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view, currentLocation);
        }
        else {
          if (update.state.selection.ranges.length > 0) {
            this.decorations = this.buildDecorations(update.view, currentLocation);
          }
        }
      }

      buildDecorations(view: EditorView, location: { from: number, to: number } | null): DecorationSet {
        const replaceChars = true; // to be configurable later

        let builder = new RangeSetBuilder<Decoration>();

        const lastPassDecoratedRanges: Array<{from: number, to: number}> = this.decoratedRanges;
        this.decoratedRanges = [];

        const inLastPass = function(nodeStart: number, index: number | undefined): boolean {
          if (index === undefined) {
            return false;
          }

          for (let i in lastPassDecoratedRanges) {
            const rng = lastPassDecoratedRanges[i];

            if (rng.from == nodeStart && index >= rng.from && index <= rng.to) {
              return true;
            }
          }
          return false;
        }

        for (let {from, to} of view.visibleRanges) {
          syntaxTree(view.state).iterate({
            from,
            to,
            enter: (node) => {

              // Big thanks to Supercharged Links. Used your code as an example! https://github.com/mdelobelle/obsidian_supercharged_links
              
              const tokenProps = node.type.prop(tokenClassNodeProp);
              if (tokenProps) {
                const props = new Set(tokenProps.split(" "));
                const isLink = props.has("hmd-internal-link");
                const isAlias = props.has("link-alias");
                const isPipe = props.has("link-alias-pipe");
                
                const isMDUrl = props.has('url');
                
                                
                if (isLink && !isAlias && !isPipe || isMDUrl) {
                  let linkText = view.state.doc.sliceString(node.from, node.to);
                  
                  const indexOfHeaderMarker = linkText.indexOf('#') + node.from;
                  if (indexOfHeaderMarker >= node.from && indexOfHeaderMarker <= node.to) {

                    if (!inLastPass(node.from - 2, location?.from)) {
                      
                      let attributeDeco = Decoration.mark({
                        class: 'heading-range-live-link'
                      });
                      builder.add(node.from - 2, node.to + 2, attributeDeco);

                      if (replaceChars) {
                        let overrideP2HWidget = Decoration.widget({
                          widget: new CharacterOverwriteWidget(settings.dividerP2H),
                        });
                        builder.add(indexOfHeaderMarker, indexOfHeaderMarker + 1, overrideP2HWidget);  
                      }

                      const indexOfRangeMarker = linkText.indexOf('>') + node.from;
                      if (indexOfRangeMarker >= node.from && indexOfRangeMarker <= node.to) {
                        if (replaceChars) {
                          let overrideH2HWidget = Decoration.widget({
                            widget: new CharacterOverwriteWidget(settings.dividerH2H),
                          });
                          builder.add(indexOfRangeMarker, indexOfRangeMarker + 1, overrideH2HWidget);
                        }
                      }

                    }

                    this.decoratedRanges.push({
                      from: node.from - 2,
                      to: node.to + 2
                    });  
                  }
                  
                }
              }
            }
          })
        }

        return builder.finish();
      }
    },
    {
        decorations: v => v.decorations
    });

  return viewPlugin;
} 
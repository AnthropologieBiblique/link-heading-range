import { App } from 'obsidian';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { syntaxTree, tokenClassNodeProp } from "@codemirror/language";

class CoolWidget extends WidgetType {
  toDOM() {
    let el = document.createElement("span");
    el.innerText = ':';
    el.style.textDecoration = 'underline';
    return el;
  }
}

export function buildCMViewPlugin(app: App) {
  // console.log('the codemirror plugin', app);

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
          // console.log(update.state.selection.ranges[0].from, 'to', update.state.selection.ranges[0].to);
          // console.log('real update', update.docChanged, update.viewportChanged, update);
          this.decorations = this.buildDecorations(update.view, currentLocation);
        }
        else {
          if (update.state.selection.ranges.length > 0) {
            // console.log(update.state.selection.ranges[0].from, 'to', update.state.selection.ranges[0].to);
            // console.log('fake update');
            this.decorations = this.buildDecorations(update.view, currentLocation);
          }
        }
      }

      buildDecorations(view: EditorView, location: { from: number, to: number } | null): DecorationSet {
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
                  
                  const indexOfRangeMarker = linkText.indexOf('#') + node.from;
                  if (indexOfRangeMarker >= node.from && indexOfRangeMarker <= node.to) {

                    if (!inLastPass(node.from - 2, location?.from)) {
                      let deco = Decoration.mark({
                        class: "heading-range-preview-link"
                      });
                      console.log('node from and to', node.from, node.to);
                      builder.add(node.from - 2, node.to + 2, deco);

                      let myWidget = Decoration.widget({
                        widget: new CoolWidget(),
                      });
                      builder.add(indexOfRangeMarker, indexOfRangeMarker + 1, myWidget);  

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
# Obsidian Link Heading Range Plugin

This is a plugin for Obsidian (https://obsidian.md).
It allows linking to a heading range, in the [[Page#HeaderA#HeaderB]] or [[Page#HeaderA#HeaderB|Alias]] extended wikilink format.
We will call these extended wikilinks "heading range links" below.

## Demo

https://user-images.githubusercontent.com/24638389/199087148-0e7173e4-53ae-4bb6-9dde-53985dd6f130.mov

## Features

Features are still pretty basic :
- [[Page]], [[Page#Heading]], [[Page|Alias]], [[Page#Heading|Alias]] links will work exactly as normal
- Hovering on a heading range link will display the standard popover and scroll to the "HeaderA" location
- Clicking on a heading range link will jump to the linked page and scroll to the "HeaderA" location (⌘ key is supported)
- You can chose your "page to heading" and "heading to heading" divider symbols
- When a note is having a heading range link to another note, the link will be shown in the graph view

## Roadmap

This is still very much alpha and lots need to be done.
Any help is very much welcomed !
- Improve the popover on range links
  - Remove the yellow highlight
  - If possible, include only the paragraphs and headings within the range (not the whole note scrolled to HeaderA)
  - Have the page scrolling to the HeaderA location when clicking on the top right tooltip link
- Improve the click on range links
  - Have the yellow highlight covering the whole heading range section (not only HeaderA section)
  - Support ⌥ + ⌘ modifier
- Improve the plugin onloading (for example, provide an optional automatic reshaping of all range links [[Page#HeaderA#HeaderB]] to [[Page#HeaderA]] > HeaderB so that the vault is not left in a broken state ?)
- Support autocomplete in editor when typing the second heading [[Page#HeadingA#...
- Reorder headings if user mistakenly starts with the last one ? What happens if more than one heading with the same title (currently it takes the first)
- Support relevant search queries, such as "is that heading, in the middle of the range, linked to that note ?"

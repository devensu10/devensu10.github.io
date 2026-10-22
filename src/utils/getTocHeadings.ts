import type { MarkdownHeading } from "astro";

/**
 * Keep h2/h3 for the TOC sidebar, dropping the inline
 * "Table of contents" heading rendered by remark-toc.
 */
export function getTocHeadings(headings: MarkdownHeading[]): MarkdownHeading[] {
  return headings.filter(
    h => (h.depth === 2 || h.depth === 3) && h.text !== "Table of contents"
  );
}

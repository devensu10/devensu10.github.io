const CJK_REGEX =
  /[　-〿぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ]/g;

/**
 * Estimate reading time in minutes from raw markdown content.
 * CJK characters are counted per character (~300/min),
 * latin text per word (~200/min).
 */
export function getReadingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links keep text
    .replace(/<[^>]+>/g, " ") // html tags
    .replace(/^---[\s\S]*?---/, " "); // frontmatter

  const cjkCount = (text.match(CJK_REGEX) ?? []).length;
  const latinWordCount = text
    .replace(CJK_REGEX, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = cjkCount / 300 + latinWordCount / 200;
  return Math.max(1, Math.ceil(minutes));
}

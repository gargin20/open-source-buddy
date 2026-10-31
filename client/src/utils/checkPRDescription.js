const MIN_WORDS = 20;
const MAX_WORDS = 1000;

function getSections(description) {
  const headings = [...description.matchAll(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)];
  return headings.map((heading, index) => {
    const bodyStart = heading.index + heading[0].length;
    const bodyEnd = headings[index + 1]?.index ?? description.length;
    return { title: heading[1], body: description.slice(bodyStart, bodyEnd) };
  });
}

function hasDetails(sections, pattern) {
  return sections.some(({ title, body }) => {
    if (!pattern.test(title)) return false;
    const content = body
      .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, '')
      .replace(/^\s*[-*+]\s*$/gm, '')
      .replace(/\bcloses\s+#\d+\b/gi, '')
      .trim();
    return content.length >= 12 && (content.match(/\S+/g) || []).length >= 2;
  });
}

function countWords(description) {
  const content = description
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, '')
    .replace(/\bcloses\s+#\d+\b/gi, '');
  return (content.match(/\b[\p{L}\p{N}]+\b/gu) || []).length;
}

export function checkPRDescription(input) {
  const description = String(input || '').replace(/<!--[\s\S]*?-->/g, '');
  const sections = getSections(description);
  const wordCount = countWords(description);
  const hasWhyDetails =
    hasDetails(sections, /\b(?:why|motivation|reason|problem|purpose)\b/i) ||
    /\b(?:because|so that|in order to|to address|to fix|fixes|resolves|addresses|allows?|enables?|improves?|prevents?|reduces?)\b/i.test(
      description,
    );

  return [
    {
      id: 'closing-reference',
      label: 'Includes a valid issue-closing reference',
      passed: /\bcloses\s+#([1-9]\d*)\b/i.test(description),
      success: 'A valid Closes #N reference was found.',
      tip: 'Add a closing reference with the issue number, for example: Closes #24.',
    },
    {
      id: 'what',
      label: 'Explains what changed',
      passed: hasDetails(sections, /\b(?:what|summary|overview|changes?|description)\b/i),
      success: 'A section describing the change has useful details.',
      tip: 'Add a “## What does this PR do?” or “## Summary” section and describe the changes.',
    },
    {
      id: 'why',
      label: 'Explains why the change is needed',
      passed: hasWhyDetails,
      success: 'The description includes a reason or motivation for the change.',
      tip: 'Explain the problem or benefit in a “## Why?” section, or say what the change fixes or improves.',
    },
    {
      id: 'testing',
      label: 'Includes testing details',
      passed: hasDetails(sections, /\b(?:test|testing|tests|validation|verification)\b/i),
      success: 'A testing section includes details.',
      tip: 'Add a “## How did you test it?” section with commands or checks you ran. If you did not test it, say so.',
    },
    {
      id: 'length',
      label: 'Description length is reasonable',
      passed: wordCount >= MIN_WORDS && wordCount <= MAX_WORDS,
      success: `The description has ${wordCount} words, within the ${MIN_WORDS}–${MAX_WORDS} word guideline.`,
      tip:
        wordCount < MIN_WORDS
          ? `The description has ${wordCount} words. Add enough context to reach at least ${MIN_WORDS} words.`
          : `The description has ${wordCount} words. Shorten it to ${MAX_WORDS} words or fewer and keep the most relevant details.`,
    },
  ];
}

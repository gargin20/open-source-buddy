const MIN_LENGTH = 120;
const MAX_LENGTH = 8000;

const CLOSES_PATTERN = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+\b/i;
const WHY_PATTERN = /\b(because|so that|in order to|motivation|context|problem|bug|needed|currently|instead)\b/i;
const TESTING_PATTERN = /\b(test(?:ed|ing|s)?|verified|verification|ran|manual(?:ly)?|browser|steps?)\b/i;

export const EXAMPLE_DESCRIPTION = `## What does this PR do?

Adds a checklist to the PR Coach tab so contributors can review a pull request description before they submit it.

Closes #19

## Why is this needed?

New contributors often forget the issue link or the testing notes, and the checklist catches that before a maintainer has to ask.

## How did you test it?

Ran \`npm run dev\`, pasted a short description and a complete one, and checked that every checklist item updates. \`npm run build\` passes.`;

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitSections(text) {
  const sections = [];
  let current = { heading: '', body: [] };

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    if (match) {
      sections.push(current);
      current = { heading: match[1].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  sections.push(current);

  return sections.map((section) => ({
    heading: section.heading,
    body: section.body.join('\n').trim(),
  }));
}

function hasSection(sections, headingPattern, minimumWords) {
  return sections.some(
    (section) => headingPattern.test(section.heading) && wordCount(section.body) >= minimumWords,
  );
}

export function analyzePullRequest(text) {
  const trimmed = String(text || '').trim();
  const sections = splitSections(trimmed);
  const length = trimmed.length;

  const checks = [
    {
      id: 'closes',
      label: 'Links the issue with Closes #N',
      passed: CLOSES_PATTERN.test(trimmed),
      tip: 'Add a closing keyword and the issue number, for example Closes #12.',
    },
    {
      id: 'what',
      label: 'Explains what changed',
      passed:
        hasSection(sections, /what|summary|change/i, 4) || wordCount(sections[0].body) >= 10,
      tip: 'Add a short section such as "## What does this PR do?" and describe the change.',
    },
    {
      id: 'why',
      label: 'Explains why the change is needed',
      passed:
        hasSection(sections, /why|motivation|context|problem/i, 4) || WHY_PATTERN.test(trimmed),
      tip: 'Explain the problem this solves and why the change is needed.',
    },
    {
      id: 'testing',
      label: 'Describes how it was tested',
      passed:
        hasSection(sections, /test|verification|how did you test/i, 3) ||
        TESTING_PATTERN.test(trimmed),
      tip: 'List the commands or steps you ran, for example npm test or a manual browser check.',
    },
    {
      id: 'length',
      label: 'Length is appropriate',
      passed: length >= MIN_LENGTH && length <= MAX_LENGTH,
      tip:
        length < MIN_LENGTH
          ? `Add more detail. Aim for at least ${MIN_LENGTH} characters.`
          : `Shorten the description to under ${MAX_LENGTH.toLocaleString()} characters.`,
    },
  ];

  const passed = checks.filter((check) => check.passed).length;

  return {
    checks,
    passed,
    total: checks.length,
    complete: passed === checks.length,
    empty: length === 0,
    length,
  };
}

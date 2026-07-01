export function normalizeText(text) {
  if (text == null) {
    return "";
  }

  return String(text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function resumeJsonToSearchableText(resumeJson) {
  if (resumeJson == null) {
    return "";
  }

  let parsedResume = resumeJson;
  if (typeof resumeJson === "string") {
    try {
      parsedResume = JSON.parse(resumeJson);
    } catch {
      return normalizeText(resumeJson);
    }
  }

  const values = [];

  const collectText = (value) => {
    if (value == null || typeof value === "boolean" || typeof value === "number") {
      return;
    }

    if (typeof value === "string") {
      values.push(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collectText);
      return;
    }

    if (typeof value === "object") {
      Object.values(value).forEach(collectText);
    }
  };

  collectText(parsedResume);
  return normalizeText(values.join(" "));
}

export function getKeywordHints(jobDescription, resumeJson, keywords = []) {
  const jdText = normalizeText(jobDescription);
  if (!jdText || !Array.isArray(keywords) || keywords.length === 0) {
    return [];
  }

  const resumeText = resumeJsonToSearchableText(resumeJson);

  return keywords
    .filter((keyword) => keywordMatchesText(jdText, keyword))
    .map((keyword) => ({
      term: keyword.term,
      category: keyword.category || "General",
      covered: keywordMatchesText(resumeText, keyword),
    }));
}

export function groupKeywordHintsByCategory(hints) {
  return hints.reduce((groups, hint) => {
    if (!groups[hint.category]) {
      groups[hint.category] = [];
    }
    groups[hint.category].push(hint);
    return groups;
  }, {});
}

// This keyword matcher intentionally uses conservative token boundaries to avoid
// false positives from short terms such as UI in "build" or Go in "ongoing".
// It is a lightweight hint system, not semantic matching.
export function matchesTerm(text, term) {
  if (!text || !term) {
    return false;
  }

  return buildTermRegex(term).test(normalizeText(text));
}

export function keywordMatchesText(text, keyword) {
  const terms = [
    keyword?.term,
    ...(Array.isArray(keyword?.aliases) ? keyword.aliases : []),
  ].filter(Boolean);

  return terms.some((term) => matchesTerm(text, term));
}

export function buildTermRegex(term) {
  const normalizedTerm = normalizeText(term);
  const escaped = escapeRegExp(normalizedTerm);

  if (normalizedTerm === "C++") {
    return new RegExp(`(^|[^a-zA-Z0-9])${escaped}[0-9]*([^a-zA-Z0-9]|$)`, "i");
  }

  return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const IMPORTANT_TERMS = [
  { term: "Java", category: "Languages" },
  { term: "Python", category: "Languages" },
  { term: "JavaScript", category: "Languages" },
  { term: "TypeScript", category: "Languages" },
  { term: "C++", category: "Languages" },
  { term: "C", category: "Languages" },
  { term: "Go", category: "Languages" },
  { term: "Rust", category: "Languages" },
  { term: "SQL", category: "Languages" },
  { term: "Bash", category: "Languages" },

  { term: "React", category: "Frontend" },
  { term: "Next.js", category: "Frontend" },
  { term: "Node.js", category: "Frontend" },
  { term: "HTML", category: "Frontend" },
  { term: "CSS", category: "Frontend" },
  { term: "Tailwind CSS", category: "Frontend" },
  { term: "Vite", category: "Frontend" },
  { term: "Axios", category: "Frontend" },
  { term: "UI", category: "Frontend" },
  { term: "UX", category: "Frontend" },

  { term: "Spring Boot", category: "Backend" },
  { term: "Spring Security", category: "Backend" },
  { term: "REST API", category: "Backend" },
  { term: "REST APIs", category: "Backend" },
  { term: "MyBatis", category: "Backend" },
  { term: "JWT", category: "Backend" },
  { term: "BCrypt", category: "Backend" },
  { term: "Authentication", category: "Backend" },
  { term: "Authorization", category: "Backend" },
  { term: "Microservices", category: "Backend" },
  { term: "API integration", category: "Backend" },

  { term: "PostgreSQL", category: "Databases" },
  { term: "Postgres", category: "Databases" },
  { term: "MySQL", category: "Databases" },
  { term: "MongoDB", category: "Databases" },
  { term: "Redis", category: "Databases" },
  { term: "JSONB", category: "Databases" },
  { term: "pgvector", category: "Databases" },
  { term: "Relational database", category: "Databases" },
  { term: "Database design", category: "Databases" },
  { term: "SQL optimization", category: "Databases" },

  { term: "OpenAI API", category: "AI / ML" },
  { term: "LLM", category: "AI / ML" },
  { term: "LLMs", category: "AI / ML" },
  { term: "Embedding", category: "AI / ML" },
  { term: "Embeddings", category: "AI / ML" },
  { term: "RAG", category: "AI / ML" },
  { term: "Retrieval", category: "AI / ML" },
  { term: "Prompt engineering", category: "AI / ML" },
  { term: "Prompt construction", category: "AI / ML" },
  { term: "AI workflow orchestration", category: "AI / ML" },
  { term: "Response validation", category: "AI / ML" },
  { term: "Evaluation", category: "AI / ML" },
  { term: "Evals", category: "AI / ML" },
  { term: "Machine learning", category: "AI / ML" },
  { term: "Model integration", category: "AI / ML" },
  { term: "Guardrails", category: "AI / ML" },
  { term: "Latency", category: "AI / ML" },
  { term: "Cost optimization", category: "AI / ML" },

  { term: "Docker", category: "Infrastructure" },
  { term: "Kubernetes", category: "Infrastructure" },
  { term: "Git", category: "Infrastructure" },
  { term: "GitHub", category: "Infrastructure" },
  { term: "CI/CD", category: "Infrastructure" },
  { term: "Flyway", category: "Infrastructure" },
  { term: "Linux", category: "Infrastructure" },
  { term: "Cloud", category: "Infrastructure" },
  { term: "AWS", category: "Infrastructure" },
  { term: "Infrastructure as Code", category: "Infrastructure" },
  { term: "Monitoring", category: "Infrastructure" },
  { term: "Logging", category: "Infrastructure" },
  { term: "Container orchestration", category: "Infrastructure" },

  { term: "Data structures", category: "CS Fundamentals" },
  { term: "Algorithms", category: "CS Fundamentals" },
  { term: "Operating systems", category: "CS Fundamentals" },
  { term: "Computer networks", category: "CS Fundamentals" },
  { term: "TCP/IP", category: "CS Fundamentals" },
  { term: "Distributed systems", category: "CS Fundamentals" },
  { term: "Concurrency", category: "CS Fundamentals" },
  { term: "Multithreading", category: "CS Fundamentals" },
  { term: "Computer architecture", category: "CS Fundamentals" },

  { term: "Debugging", category: "Testing / Quality" },
  { term: "API debugging", category: "Testing / Quality" },
  { term: "Production debugging", category: "Testing / Quality" },
  { term: "Root cause analysis", category: "Testing / Quality" },
  { term: "Unit testing", category: "Testing / Quality" },
  { term: "Integration testing", category: "Testing / Quality" },
  { term: "Reliability", category: "Testing / Quality" },
  { term: "Scalability", category: "Testing / Quality" },
  { term: "Performance", category: "Testing / Quality" },

  { term: "Embedded systems", category: "Embedded / Hardware" },
  { term: "Microcontrollers", category: "Embedded / Hardware" },
  { term: "OpenMV", category: "Embedded / Hardware" },
  { term: "CC3200", category: "Embedded / Hardware" },
  { term: "UART", category: "Embedded / Hardware" },
  { term: "SPI", category: "Embedded / Hardware" },
  { term: "I2C", category: "Embedded / Hardware" },
  { term: "GPIO", category: "Embedded / Hardware" },
  { term: "PWM", category: "Embedded / Hardware" },
  { term: "PID control", category: "Embedded / Hardware" },
  { term: "PCB", category: "Embedded / Hardware" },
  { term: "FPGA", category: "Embedded / Hardware" },
  { term: "Verilog", category: "Embedded / Hardware" },
  { term: "SystemVerilog", category: "Embedded / Hardware" },
];

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

export function getKeywordHints(jobDescription, resumeJson) {
  const jdText = normalizeText(jobDescription);
  if (!jdText) {
    return [];
  }

  const resumeText = resumeJsonToSearchableText(resumeJson);

  return IMPORTANT_TERMS
    .filter(({ term }) => matchesTerm(jdText, term))
    .map(({ term, category }) => ({
      term,
      category,
      covered: matchesTerm(resumeText, term),
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

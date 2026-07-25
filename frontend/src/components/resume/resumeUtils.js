export function normalizeBullets(value, { includeEmpty = false } = {}) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item?.content || item?.text || ""))
      .filter((item) => includeEmpty || item);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter((item) => includeEmpty || item);
  }

  return [];
}

export function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "";
  return [startDate, endDate || "Present"].filter(Boolean).join(" - ");
}

export function formatDelimitedList(value, separator = " \u2022 ") {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.name || item?.label || item?.content || "";
      })
      .filter(Boolean)
      .join(separator);
  }

  return value || "";
}

export function buildResumePdfFilename(jobTitle) {
  const safeTitle = jobTitle
    ?.trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_");

  return safeTitle ? `Resume_${safeTitle}.pdf` : "Resume.pdf";
}

export function getResumeSectionTitle(type) {
  if (type.includes("experience")) return "Experience";
  if (type.includes("project")) return "Projects";
  if (type.includes("education")) return "Education";
  if (type.includes("skill")) return "Skills";
  return "Section";
}

export function getResumeSectionKey(section) {
  return section.id || `${section.type || "section"}-${section.order ?? ""}-${section.title || ""}`;
}

const RESUME_SECTION_PRIORITY = {
  education: 0,
  experience: 1,
  project: 2,
  skill: 3,
};

function getResumeSectionPriority(section) {
  const sectionType = String(section?.type || section?.id || "").toLowerCase();
  const matchedType = Object.keys(RESUME_SECTION_PRIORITY).find((type) =>
    sectionType.includes(type)
  );

  return matchedType == null
    ? Number.MAX_SAFE_INTEGER
    : RESUME_SECTION_PRIORITY[matchedType];
}

export function sortResumeSections(sections) {
  if (!Array.isArray(sections)) return [];

  return [...sections].sort((a, b) => {
    const priorityDifference =
      getResumeSectionPriority(a) - getResumeSectionPriority(b);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    if (getResumeSectionPriority(a) === Number.MAX_SAFE_INTEGER) {
      return (a?.order ?? Number.MAX_SAFE_INTEGER) -
        (b?.order ?? Number.MAX_SAFE_INTEGER);
    }

    return 0;
  });
}

export function updateFirstExistingField(item, fields, value) {
  const existingField = fields.find((field) =>
    Object.prototype.hasOwnProperty.call(item, field)
  );

  return {
    ...item,
    [existingField || fields[0]]: value,
  };
}

export function updateDateRangeFields(item, value) {
  const [startDate = "", endDate = ""] = value.split(/\s+-\s+/, 2);

  return {
    ...item,
    startDate: startDate.trim(),
    endDate: endDate.trim() === "Present" ? "" : endDate.trim(),
  };
}

export function updateEducationMetaFields(item, value) {
  const [location = "", dateRange = ""] = value.split("|").map((part) => part.trim());

  return {
    ...updateDateRangeFields(item, dateRange),
    location,
  };
}

export function updateEducationDetailFields(item, value) {
  const parts = value.split("|").map((part) => part.trim()).filter(Boolean);
  const [degreeMajor = "", gpaPart = ""] = parts;
  const [degree = "", major = ""] = degreeMajor.split(",").map((part) => part.trim());
  const gpa = gpaPart.replace(/^GPA:\s*/i, "").trim();

  return {
    ...item,
    degree,
    major,
    gpa,
  };
}

export function updateBulletField(item, bullets) {
  const field = ["bullets", "details", "description", "relevantCoursework"].find((name) =>
    Object.prototype.hasOwnProperty.call(item, name)
  ) || "bullets";
  const existingValue = item[field];
  // Empty bullets are allowed while editing, but persisted resume JSON should
  // contain only meaningful bullet text.
  const cleanedBullets = bullets.map((bullet) => bullet.trim()).filter(Boolean);

  return {
    ...item,
    [field]: Array.isArray(existingValue) ? cleanedBullets : cleanedBullets.join("\n"),
  };
}

export function appendEmptyBulletField(item) {
  const field = ["bullets", "details", "description", "relevantCoursework"].find((name) =>
    Object.prototype.hasOwnProperty.call(item, name)
  ) || "bullets";

  return {
    ...item,
    [field]: [...normalizeBullets(item[field], { includeEmpty: true }), ""],
  };
}

export function appendEmptySkillItem(section) {
  return {
    ...section,
    items: [
      ...(Array.isArray(section.items) ? section.items : []),
      { category: "", skills: [] },
    ],
  };
}

export function appendEmptyResumeSectionItem(section) {
  const type = String(section?.type || section?.id || "").toLowerCase();
  let item;

  if (type.includes("education")) {
    item = {
      school: "",
      degree: "",
      major: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      details: [""],
    };
  } else if (type.includes("experience")) {
    item = {
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
      visible: true,
      bullets: [""],
    };
  } else if (type.includes("project")) {
    item = {
      name: "",
      techStack: [],
      startDate: "",
      endDate: "",
      visible: true,
      bullets: [""],
    };
  } else {
    return section;
  }

  return {
    ...section,
    items: [
      ...(Array.isArray(section.items) ? section.items : []),
      item,
    ],
  };
}

export function parseDelimitedListLike(originalValue, value, preferredSeparator) {
  if (!Array.isArray(originalValue)) {
    return value;
  }

  const splitter = preferredSeparator === "," ? /,/ : /[\u2022,]/;

  return value
    .split(splitter)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getSkillFieldName(item) {
  return ["skills", "names", "items", "name"].find((field) =>
    Object.prototype.hasOwnProperty.call(item, field)
  ) || "skills";
}

export function sanitizeResumeBulletFields(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeResumeBulletFields(item))
      .filter((item) => !isEmptyResumeSectionItem(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (["bullets", "details", "description", "relevantCoursework", "additionalInfo"].includes(key)) {
        // Save Resume replaces the whole JSONB document, so recursively clean
        // editor-only empty bullet placeholders before sending it.
        const cleanedBullets = normalizeBullets(item);
        return [key, Array.isArray(item) ? cleanedBullets : cleanedBullets.join("\n")];
      }

      return [key, sanitizeResumeBulletFields(item)];
    })
  );
}

export function isEmptySkillItem(item) {
  if (!item || typeof item !== "object" || !Object.prototype.hasOwnProperty.call(item, "category")) {
    return false;
  }

  const skillField = ["skills", "names", "items", "name"].find((field) =>
    Object.prototype.hasOwnProperty.call(item, field)
  );
  const skillValue = skillField ? item[skillField] : "";
  const skillText = Array.isArray(skillValue)
    ? skillValue.map((skill) => (typeof skill === "string" ? skill : skill?.name || skill?.label || "")).join("")
    : String(skillValue || "");

  return !String(item.category || "").trim() && !skillText.trim();
}

export function isEmptyResumeSectionItem(item, sectionType = "") {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return false;
  }

  const type = String(sectionType || "").toLowerCase();
  if (type.includes("skill") || (!type && Object.prototype.hasOwnProperty.call(item, "category"))) {
    return isEmptySkillItem(item);
  }

  let fields;
  if (
    type.includes("education") ||
    (!type && ["school", "schoolName", "degree", "major", "gpa"].some((field) =>
      Object.prototype.hasOwnProperty.call(item, field)
    ))
  ) {
    fields = [
      "school",
      "schoolName",
      "degree",
      "major",
      "location",
      "startDate",
      "endDate",
      "gpa",
      "details",
      "relevantCoursework",
      "description",
      "bullets",
    ];
  } else if (
    type.includes("experience") ||
    (!type && ["company", "companyName", "position", "role"].some((field) =>
      Object.prototype.hasOwnProperty.call(item, field)
    ))
  ) {
    fields = [
      "company",
      "companyName",
      "title",
      "position",
      "role",
      "location",
      "startDate",
      "endDate",
      "bullets",
      "details",
      "description",
    ];
  } else if (
    type.includes("project") ||
    (!type && ["projectName", "techStack"].some((field) =>
      Object.prototype.hasOwnProperty.call(item, field)
    ))
  ) {
    fields = [
      "name",
      "projectName",
      "techStack",
      "startDate",
      "endDate",
      "bullets",
      "details",
      "description",
      "url",
      "projectUrl",
      "project_url",
      "demoUrl",
      "demo_url",
      "githubUrl",
      "github_url",
      "link",
    ];
  } else {
    return false;
  }

  return !fields.some((field) => hasMeaningfulResumeValue(item[field]));
}

function hasMeaningfulResumeValue(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulResumeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasMeaningfulResumeValue(item));
  }

  return value != null && String(value).trim() !== "";
}

export function deepClone(value) {
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepClone(item)])
    );
  }

  return value;
}

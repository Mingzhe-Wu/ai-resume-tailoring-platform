import assert from "node:assert/strict";
import test from "node:test";

import {
  appendEmptyResumeSectionItem,
  isEmptyResumeSectionItem,
  sanitizeResumeBulletFields,
  sortResumeSections,
} from "./resumeUtils.js";

test("sortResumeSections uses the fixed resume display order", () => {
  const sections = [
    { id: "skills", type: "skills", order: 1 },
    { id: "projects", type: "projects", order: 2 },
    { id: "education", type: "education", order: 4 },
    { id: "experience", type: "experience", order: 3 },
  ];

  assert.deepEqual(
    sortResumeSections(sections).map((section) => section.id),
    ["education", "experience", "projects", "skills"]
  );
});

test("sortResumeSections recognizes section id and keeps unknown sections last", () => {
  const sections = [
    { id: "certifications", order: 2 },
    { id: "project", order: 4 },
    { id: "experience", order: 1 },
    { id: "education", order: 3 },
    { id: "awards", order: 1 },
    { id: "skill", order: 2 },
  ];

  assert.deepEqual(
    sortResumeSections(sections).map((section) => section.id),
    ["education", "experience", "project", "skill", "awards", "certifications"]
  );
});

test("appendEmptyResumeSectionItem creates editable placeholders for each evidence type", () => {
  const education = appendEmptyResumeSectionItem({ type: "education", items: [] });
  const experience = appendEmptyResumeSectionItem({ type: "experience", items: [] });
  const projects = appendEmptyResumeSectionItem({ type: "projects", items: [] });

  assert.deepEqual(education.items[0].details, [""]);
  assert.equal(education.items[0].school, "");
  assert.deepEqual(experience.items[0].bullets, [""]);
  assert.equal(experience.items[0].company, "");
  assert.deepEqual(projects.items[0].bullets, [""]);
  assert.deepEqual(projects.items[0].techStack, []);
});

test("isEmptyResumeSectionItem removes an evidence item only after all content is blank", () => {
  assert.equal(
    isEmptyResumeSectionItem(
      { company: "", title: "", location: "", bullets: [""] },
      "experience"
    ),
    true
  );
  assert.equal(
    isEmptyResumeSectionItem(
      { company: "", title: "Engineer", location: "", bullets: [""] },
      "experience"
    ),
    false
  );
  assert.equal(
    isEmptyResumeSectionItem(
      { name: "", techStack: [], bullets: ["Implemented APIs"] },
      "projects"
    ),
    false
  );
});

test("sanitizeResumeBulletFields removes blank evidence placeholders before save", () => {
  const resume = {
    sections: [
      {
        type: "education",
        items: [
          { school: "", degree: "", details: [""] },
          { school: "State University", degree: "B.S.", details: ["", "Coursework"] },
        ],
      },
    ],
  };

  assert.deepEqual(sanitizeResumeBulletFields(resume), {
    sections: [
      {
        type: "education",
        items: [
          { school: "State University", degree: "B.S.", details: ["Coursework"] },
        ],
      },
    ],
  });
});

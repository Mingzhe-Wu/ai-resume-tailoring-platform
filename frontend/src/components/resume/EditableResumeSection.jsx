import EditableEducationItem from "./EditableEducationItem.jsx";
import EditableExperienceItem from "./EditableExperienceItem.jsx";
import EditableProjectItem from "./EditableProjectItem.jsx";
import EditableSkillItem from "./EditableSkillItem.jsx";
import {
  appendEmptyResumeSectionItem,
  appendEmptySkillItem,
  getResumeSectionTitle,
  isEmptyResumeSectionItem,
} from "./resumeUtils.js";

export default function EditableResumeSection({ section, onChange }) {
  const items = Array.isArray(section.items)
    ? section.items.filter((item) => item.visible !== false)
    : [];
  const type = String(section.type || "").toLowerCase();
  const isEducation = type.includes("education");
  const isExperience = type.includes("experience");
  const isProject = type.includes("project");
  const isSkill = type.includes("skill");
  const canAddItem = isEducation || isExperience || isProject || isSkill;

  if (items.length === 0 && !canAddItem) return null;

  const updateItem = (item, nextItem) => {
    onChange({
      ...section,
      items: (section.items || [])
        .map((sectionItem) =>
          sectionItem === item || (item.id != null && sectionItem.id === item.id)
            ? nextItem
            : sectionItem
        )
        .filter((sectionItem) => !isEmptyResumeSectionItem(sectionItem, type)),
    });
  };

  const addItem = () => {
    onChange(
      isSkill
        ? appendEmptySkillItem(section)
        : appendEmptyResumeSectionItem(section)
    );
  };

  const itemLabel = isEducation
    ? "education"
    : isExperience
      ? "experience"
      : isProject
        ? "project"
        : "skill category";

  return (
    <section className="ats-section">
      <h2 className="ats-section-heading">
        <span>{section.title || getResumeSectionTitle(type)}</span>
        {canAddItem && (
          <button
            type="button"
            className="ats-add-bullet-button ats-add-skill-button"
            onClick={addItem}
            aria-label={`Add ${itemLabel}`}
            title={`Add ${itemLabel}`}
          >
            +
          </button>
        )}
      </h2>

      {isExperience && items.map((item, index) => (
        <EditableExperienceItem
          key={item.id || index}
          item={item}
          onChange={(nextItem) => updateItem(item, nextItem)}
        />
      ))}

      {isProject && items.map((item, index) => (
        <EditableProjectItem
          key={item.id || index}
          item={item}
          onChange={(nextItem) => updateItem(item, nextItem)}
        />
      ))}

      {isEducation && items.map((item, index) => (
        <EditableEducationItem
          key={item.id || index}
          item={item}
          onChange={(nextItem) => updateItem(item, nextItem)}
        />
      ))}

      {isSkill && items.map((item, index) => (
        <EditableSkillItem
          key={item.id || index}
          item={item}
          onChange={(nextItem) => updateItem(item, nextItem)}
        />
      ))}
    </section>
  );
}

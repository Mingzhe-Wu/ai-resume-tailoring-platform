import { useEffect, useState } from "react";
import { getSkillKeywords } from "../../api.js";
import EditableResumePreview from "./EditableResumePreview.jsx";
import ResumeBuilderToolbar from "./ResumeBuilderToolbar.jsx";
import {
  getKeywordHints,
  groupKeywordHintsByCategory,
} from "../../utils/keywordHints.js";

export default function ResumePreviewPanel({
  selectedJob,
  generatedResume,
  resumeContent,
  selectedResumeMethod,
  onResumeMethodChange,
  resumeLoading,
  resumeGenerating,
  resumePanelError,
  resumePanelMessage,
  onSaveResume,
  onExportPdf,
  onSummaryToggle,
  onSectionToggle,
  onResumeChange,
  resumePreviewRef,
}) {
  const [resumeOutOfBoundary, setResumeOutOfBoundary] = useState(false);
  const [skillKeywords, setSkillKeywords] = useState([]);
  const [keywordHintsLoading, setKeywordHintsLoading] = useState(false);
  const [keywordHintsError, setKeywordHintsError] = useState("");
  const selectedMethodLabel = selectedResumeMethod === "RAG" ? "RAG" : "Normal";
  const keywordHints = getKeywordHints(selectedJob?.jobDescription, resumeContent, skillKeywords);
  const coveredKeywordGroups = groupKeywordHintsByCategory(
    keywordHints.filter((hint) => hint.covered)
  );
  const missingKeywordGroups = groupKeywordHintsByCategory(
    keywordHints.filter((hint) => !hint.covered)
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchSkillKeywords() {
      try {
        setKeywordHintsLoading(true);
        setKeywordHintsError("");

        const response = await getSkillKeywords();
        if (isMounted) {
          setSkillKeywords(response.data || []);
        }
      } catch {
        if (isMounted) {
          setSkillKeywords([]);
          setKeywordHintsError("Keyword hints are unavailable right now.");
        }
      } finally {
        if (isMounted) {
          setKeywordHintsLoading(false);
        }
      }
    }

    fetchSkillKeywords();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedJob) {
      setResumeOutOfBoundary(false);
      return;
    }

    const checkResumeBoundary = () => {
      const resumeElement = resumePreviewRef.current;
      setResumeOutOfBoundary(
        Boolean(resumeElement && resumeElement.scrollHeight > resumeElement.clientHeight + 1)
      );
    };

    const frameId = requestAnimationFrame(checkResumeBoundary);
    window.addEventListener("resize", checkResumeBoundary);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", checkResumeBoundary);
    };
  }, [resumeContent, generatedResume?.id, selectedJob?.id, resumePreviewRef]);

  return (
    <div className="resume-preview-panel">
      <div className="resume-preview-card">
        <div className="resume-preview-header">
          <div className="resume-preview-spacer" />
          <div className="resume-preview-title">
            <h2>Resume Preview</h2>
            <p>
              {selectedJob
                ? `${selectedJob.title || "Selected job"} at ${selectedJob.company || "Company"}`
                : "No job selected"}
            </p>
          </div>
          {generatedResume && resumeContent && (
            <div className="resume-header-actions">
              <button
                type="button"
                className="primary-button resume-save-button"
                onClick={onSaveResume}
              >
                Save Resume
              </button>
              <button
                type="button"
                className="secondary-button resume-export-button"
                onClick={onExportPdf}
              >
                Export PDF
              </button>
            </div>
          )}
        </div>

        {selectedJob && (
          <div className="resume-method-selector" aria-label="Resume version selector">
            <button
              type="button"
              className={selectedResumeMethod === "NORMAL" ? "active" : ""}
              onClick={() => onResumeMethodChange("NORMAL")}
            >
              Normal
            </button>
            <button
              type="button"
              className={selectedResumeMethod === "RAG" ? "active" : ""}
              onClick={() => onResumeMethodChange("RAG")}
            >
              RAG
            </button>
          </div>
        )}

        {!selectedJob ? (
          <div className="resume-empty-state">
            <h3>Select a job</h3>
            <p>Select a job to view or generate a resume.</p>
          </div>
        ) : resumeGenerating ? (
          <div className="resume-empty-state">
            <h3>Generating {selectedMethodLabel} resume...</h3>
            <p>This panel will update when the resume is ready.</p>
          </div>
        ) : resumePanelError ? (
          <div className="resume-empty-state resume-error-state">
            <h3>Resume unavailable</h3>
            <p>{resumePanelError}</p>
          </div>
        ) : generatedResume ? (
          <div className="resume-preview-body">
            {resumePanelMessage && (
              <p className="resume-panel-message">{resumePanelMessage}</p>
            )}

            {resumeOutOfBoundary && (
              <p className="resume-boundary-warning">
                Out of boundary, only the part inside paper will be shown on the resume!
              </p>
            )}

            <KeywordHintsPanel
              keywordHints={keywordHints}
              coveredKeywordGroups={coveredKeywordGroups}
              missingKeywordGroups={missingKeywordGroups}
              loading={keywordHintsLoading}
              error={keywordHintsError}
            />

            <ResumeBuilderToolbar
              resume={resumeContent}
              onSummaryToggle={onSummaryToggle}
              onSectionToggle={onSectionToggle}
            />

            <EditableResumePreview
              resume={resumeContent}
              onChange={onResumeChange}
              resumeRef={resumePreviewRef}
              outOfBoundary={resumeOutOfBoundary}
            />
          </div>
        ) : resumeLoading ? (
          <div className="resume-empty-state">
            <h3>Loading {selectedMethodLabel} resume...</h3>
            <p>Checking the selected resume version.</p>
          </div>
        ) : (
          <div className="resume-empty-state">
            <h3>No {selectedMethodLabel} resume generated yet.</h3>
            <p>
              Click {selectedResumeMethod === "RAG" ? "Generate with RAG" : "Generate Resume"} to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function KeywordHintsPanel({
  keywordHints,
  coveredKeywordGroups,
  missingKeywordGroups,
  loading,
  error,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasHints = keywordHints.length > 0;
  const coveredCount = keywordHints.filter((hint) => hint.covered).length;
  const missingCount = keywordHints.length - coveredCount;

  return (
    <div className="keyword-hints-panel">
      <button
        type="button"
        className="keyword-hints-toggle"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span>JD Keyword Hints</span>
        <span className="keyword-hints-toggle-meta">
          {hasHints
            ? `${coveredCount} covered / ${missingCount} not found`
            : "No tracked keywords"}
        </span>
        <span className="keyword-hints-toggle-icon">{isExpanded ? "Hide" : "Show"}</span>
      </button>

      {isExpanded && (
        <div className="keyword-hints-content">
          <p className="keyword-hints-subtitle">
            Simple keyword hints only. Use them as a manual review checklist.
          </p>

          {loading ? (
            <p className="keyword-hints-empty">Loading keyword hints...</p>
          ) : error ? (
            <p className="keyword-hints-empty">{error}</p>
          ) : !hasHints ? (
            <p className="keyword-hints-empty">No tracked JD keywords detected yet.</p>
          ) : (
            <>
              <KeywordHintsSection
                title="Covered terms"
                groups={coveredKeywordGroups}
                chipType="covered"
                emptyText="No tracked terms covered yet."
              />
              <KeywordHintsSection
                title="Not found in current resume"
                groups={missingKeywordGroups}
                chipType="missing"
                emptyText="All tracked JD terms are covered."
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function KeywordHintsSection({ title, groups, chipType, emptyText }) {
  const categories = Object.keys(groups);

  return (
    <div className="keyword-hints-section">
      <h4 className="keyword-hints-section-title">{title}</h4>
      {categories.length === 0 ? (
        <p className="keyword-hints-empty">{emptyText}</p>
      ) : (
        categories.map((category) => (
          <div className="keyword-hints-category" key={category}>
            <span className="keyword-hints-category-label">{category}</span>
            <div className="keyword-hints-chip-row">
              {groups[category].map((hint) => (
                <span
                  className={`keyword-hints-chip ${chipType}`}
                  key={`${category}-${hint.term}`}
                >
                  {hint.term}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

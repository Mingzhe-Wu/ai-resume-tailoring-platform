import { useEffect, useState } from "react";
import EditableResumePreview from "./EditableResumePreview.jsx";
import ResumeBuilderToolbar from "./ResumeBuilderToolbar.jsx";

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
  const selectedMethodLabel = selectedResumeMethod === "RAG" ? "RAG" : "Normal";

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

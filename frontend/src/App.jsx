import { useEffect, useRef, useState } from "react";
import api, { getApiErrorMessage } from "./api";
import ResumePreviewPanel from "./components/resume/ResumePreviewPanel.jsx";
import { exportResumeElementToPdf } from "./components/resume/resumePdfExport.js";
import {
  buildResumePdfFilename,
  deepClone,
  getResumeSectionKey,
} from "./components/resume/resumeUtils.js";
import "./App.css";

const TOAST_DISPLAY_MS = 3000;
const TOAST_EXIT_MS = 140;
const RESUME_METHOD_NORMAL = "NORMAL";
const RESUME_METHOD_RAG = "RAG";

function ResumeGenerationHelp({ className = "" }) {
  return (
    <div className={`resume-method-help ${className}`.trim()}>
      <button
        type="button"
        className="resume-method-help-trigger"
        aria-label="How to choose resume generation mode"
      >
        ?
      </button>
      <div className="resume-method-tooltip" role="tooltip">
        <strong>Normal</strong>
        <p>Best for most users and early drafts. AI uses your full profile to organize, expand, compress, and shape a polished resume.</p>
        <strong>RAG</strong>
        <p>Best when factual grounding and JD-specific evidence selection matter more than creative rewriting. Works best when your profile already contains many detailed, well-written bullets.</p>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);
  const toastIdRef = useRef(0);
  const toastDismissTimerRef = useRef(null);
  const toastReplaceTimerRef = useRef(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileTab, setProfileTab] = useState("profile");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    contactEmail: "",
    linkedinUrl: "",
    githubUrl: "",
    location: "",
    summary: "",
  });

  const emptyForms = {
    education: {
      schoolName: "",
      degree: "",
      major: "",
      startDate: "",
      endDate: "",
      gpa: "",
      relevantCoursework: "",
      description: "",
    },
    experience: {
      companyName: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    },
    project: {
      projectName: "",
      techStack: "",
      startDate: "",
      endDate: "",
      description: "",
    },
    skill: {
      category: "",
      name: "",
    },
  };

  const [educations, setEducations] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [skillSearchName, setSkillSearchName] = useState("");
  const [skillSearchCategory, setSkillSearchCategory] = useState("");

  const [editingItem, setEditingItem] = useState(null);
  const [sectionError, setSectionError] = useState("");
  const [sectionForm, setSectionForm] = useState(emptyForms.education);
  const [showSectionAddModal, setShowSectionAddModal] = useState(false);
  const [sectionAddType, setSectionAddType] = useState("education");
  const [sectionAddForm, setSectionAddForm] = useState(emptyForms.education);

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobError, setJobError] = useState("");
  const [jobSearchKeyword, setJobSearchKeyword] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("");

  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    jobDescription: "",
    sourceUrl: "",
    status: 1,
    interviewTime: "",
    priority: "",
    notes: "",
  });

  const [selectedJobForm, setSelectedJobForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    jobDescription: "",
    sourceUrl: "",
    status: 1,
    interviewTime: "",
    priority: "",
    notes: "",
  });

  const statusMap = {
    1: "Saved",
    2: "Applied",
    3: "Interviewing",
    4: "Offer",
    5: "Rejected",
  };

  const hasJobFilters =
    jobSearchKeyword.trim() !== "" || jobStatusFilter !== "";

  const canSaveProfile = profileForm.fullName.trim() !== "";

  const canCreateJob =
    jobForm.title.trim() !== "" &&
    jobForm.company.trim() !== "" &&
    isValidOptionalPriority(jobForm.priority);

  const canUpdateJob =
    selectedJobForm.title.trim() !== "" &&
    selectedJobForm.company.trim() !== "" &&
    isValidOptionalPriority(selectedJobForm.priority);

  const [generatingJobId, setGeneratingJobId] = useState(null);
  const [generatingResumeMethod, setGeneratingResumeMethod] = useState(null);
  const [selectedResumeMethod, setSelectedResumeMethod] = useState(RESUME_METHOD_NORMAL);
  const [resumeVersions, setResumeVersions] = useState({
    [RESUME_METHOD_NORMAL]: null,
    [RESUME_METHOD_RAG]: null,
  });
  const [resumeContent, setResumeContent] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumePanelError, setResumePanelError] = useState("");
  const [resumePanelMessage, setResumePanelMessage] = useState("");
  const didMountJobFilters = useRef(false);
  const resumePreviewRef = useRef(null);
  const generatedResume = resumeVersions[selectedResumeMethod];
  const isAnyGenerating = generatingJobId !== null;
  const isSelectedResumeGenerating =
    selectedJob?.id === generatingJobId &&
    selectedResumeMethod === generatingResumeMethod;

  const setResumeVersion = (generationMethod, resume) => {
    setResumeVersions((currentVersions) => ({
      ...currentVersions,
      [generationMethod]: resume,
    }));
  };

  const handleGenerateResume = async (jobId) => {
    const confirmed = window.confirm(
      "Generate a new resume for this job? This may overwrite or replace the existing generated resume."
    );
    if (!confirmed) return;
    
    try {
      setError("");
      setMessage("");
      setResumePanelError("");
      setResumePanelMessage("");
      setResumeLoading(true);
      setGeneratingJobId(jobId);
      setGeneratingResumeMethod(RESUME_METHOD_NORMAL);
      setSelectedResumeMethod(RESUME_METHOD_NORMAL);

      await api.post(`/api/resume/generate-async/${jobId}`);

      showToast("Resume generation started.");

      pollGeneratedResume(jobId);
    } catch (err) {
      const backendMessage = getApiErrorMessage(err, "Failed to start resume generation.");
      if (backendMessage === "Resume is already up to date.") {
        showToast(backendMessage, "danger");
        setResumePanelMessage(backendMessage);
        fetchResumeForJob(jobId, true, RESUME_METHOD_NORMAL);
      } else {
        showErrorToast(backendMessage);
        setResumePanelError(backendMessage);
      }
      setResumeLoading(false);
      setGeneratingJobId(null);
      setGeneratingResumeMethod(null);
    }
  };

  const handleGenerateResumeWithRag = async (jobId) => {
    const confirmed = window.confirm(
      "Generate a RAG-tailored resume for this job? This may overwrite or replace the existing generated resume."
    );
    if (!confirmed) return;

    try {
      setError("");
      setMessage("");
      setResumePanelError("");
      setResumePanelMessage("");
      setResumeLoading(true);
      setGeneratingJobId(jobId);
      setGeneratingResumeMethod(RESUME_METHOD_RAG);
      setSelectedResumeMethod(RESUME_METHOD_RAG);

      await api.post(`/api/resume/generate-rag/${jobId}`);

      await fetchResumeForJob(jobId, false, RESUME_METHOD_RAG);
      showToast("RAG resume generated successfully.");
    } catch (err) {
      const backendMessage = getApiErrorMessage(err, "Failed to generate RAG resume.");
      if (backendMessage === "Resume is already up to date.") {
        showToast(backendMessage, "danger");
        setResumePanelMessage(backendMessage);
        fetchResumeForJob(jobId, true, RESUME_METHOD_RAG);
      } else {
        showErrorToast(backendMessage);
        setResumePanelError(backendMessage);
      }
    } finally {
      setResumeLoading(false);
      setGeneratingJobId(null);
      setGeneratingResumeMethod(null);
    }
  };

  const pollGeneratedResume = (jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await api.get(`/api/resume/fetch/${jobId}`, {
          params: { generationMethod: RESUME_METHOD_NORMAL },
        });

        if (res.data && res.data.needGenerate === false) {
          clearInterval(intervalId);
          setResumeVersion(RESUME_METHOD_NORMAL, res.data);
          setResumeContent(deepClone(res.data.generatedContent));
          setResumeLoading(false);
          setResumePanelError("");
          setResumePanelMessage("");
          setGeneratingJobId(null);
          setGeneratingResumeMethod(null);
          showToast("Resume generated successfully.");
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          clearInterval(intervalId);
          setGeneratingJobId(null);
          setGeneratingResumeMethod(null);
          setResumeLoading(false);
          const errorMessage = getApiErrorMessage(err, "Failed to check generated resume.");
          setResumePanelError(errorMessage);
          showErrorToast(errorMessage);
        }
      }
    }, 3000);
  };

  useEffect(() => {
    if (token && user) {
      fetchJobs();
      fetchProfileForGreeting();
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    if (!didMountJobFilters.current) {
      didMountJobFilters.current = true;
      return;
    }

    const timeoutId = setTimeout(() => {
      searchJobs(selectedJob?.id);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [jobSearchKeyword, jobStatusFilter]);

  useEffect(() => {
    return () => {
      clearToastTimers();
    };
  }, []);

  useEffect(() => {
    if (profileTab !== "skill" || !profile?.id) {
      return;
    }

    fetchSkillCategories(profile.id);
  }, [profileTab, profile?.id]);

  useEffect(() => {
    if (profileTab !== "skill" || !profile?.id) {
      return;
    }

    const timeoutId = setTimeout(() => {
      refreshSkillSearch(skillSearchName, skillSearchCategory);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [skillSearchName]);

  useEffect(() => {
    if (!selectedJob) {
      setResumeVersions({
        [RESUME_METHOD_NORMAL]: null,
        [RESUME_METHOD_RAG]: null,
      });
      setResumeContent(null);
      setResumeLoading(false);
      setResumePanelError("");
      setResumePanelMessage("");
      return;
    }

    fetchResumeForJob(selectedJob.id, false, selectedResumeMethod);
  }, [selectedJob?.id, selectedResumeMethod]);

  useEffect(() => {
    const currentResume = resumeVersions[selectedResumeMethod];
    setResumeContent(currentResume ? deepClone(currentResume.generatedContent) : null);
  }, [selectedResumeMethod, resumeVersions]);

  async function fetchResumeForJob(
    jobId,
    keepMessage = false,
    generationMethod = selectedResumeMethod
  ) {
    try {
      if (!keepMessage) {
        setResumePanelError("");
        setResumePanelMessage("");
      }
      setResumeLoading(true);

      const response = await api.get(`/api/resume/fetch/${jobId}`, {
        params: { generationMethod },
      });

      if (response.data) {
        setResumeVersion(generationMethod, response.data);
        if (generationMethod === selectedResumeMethod) {
          setResumeContent(deepClone(response.data.generatedContent));
        }
      } else {
        setResumeVersion(generationMethod, null);
        if (generationMethod === selectedResumeMethod) {
          setResumeContent(null);
        }
      }
    } catch (err) {
      setResumeVersion(generationMethod, null);
      if (generationMethod === selectedResumeMethod) {
        setResumeContent(null);
      }

      if (err.response?.status !== 404) {
        setResumePanelError(getApiErrorMessage(err, "Failed to fetch generated resume."));
      }
    } finally {
      setResumeLoading(false);
    }
  }

  async function saveResumeContent() {
    if (!generatedResume || !resumeContent) return;

    try {
      setResumePanelError("");

      await api.put(`/api/resume/update/${generatedResume.id}`, {
        generatedContent: JSON.stringify(resumeContent),
      });

      setResumeVersion(selectedResumeMethod, {
        ...generatedResume,
        generatedContent: deepClone(resumeContent),
      });
      showToast("Generated resume saved.");
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "Failed to save resume."));
    }
  }

  async function exportResumePdf() {
    if (!resumePreviewRef.current) return;

    try {
      await exportResumeElementToPdf(
        resumePreviewRef.current,
        buildResumePdfFilename(selectedJob?.title)
      );
      showToast("Resume PDF exported.");
    } catch (err) {
      showErrorToast("Failed to export resume PDF.");
    }
  }

  function updateSummaryVisibility(visible) {
    setResumeContent((currentContent) => {
      if (!currentContent) return currentContent;

      return {
        ...currentContent,
        summary: {
          ...(currentContent.summary || {}),
          visible,
        },
      };
    });
  }

  function updateResumeSectionVisibility(sectionId, visible) {
    setResumeContent((currentContent) => {
      if (!currentContent || !Array.isArray(currentContent.sections)) {
        return currentContent;
      }

      return {
        ...currentContent,
        sections: currentContent.sections.map((section) =>
          getResumeSectionKey(section) === sectionId
            ? { ...section, visible }
            : section
        ),
      };
    });
  }

  function clearToastTimers() {
    if (toastDismissTimerRef.current) {
      clearTimeout(toastDismissTimerRef.current);
      toastDismissTimerRef.current = null;
    }

    if (toastReplaceTimerRef.current) {
      clearTimeout(toastReplaceTimerRef.current);
      toastReplaceTimerRef.current = null;
    }
  }

  function scheduleToastExit(toastId) {
    toastDismissTimerRef.current = setTimeout(() => {
      setToast((currentToast) =>
        currentToast?.id === toastId
          ? { ...currentToast, exiting: true }
          : currentToast
      );

      toastReplaceTimerRef.current = setTimeout(() => {
        setToast((currentToast) =>
          currentToast?.id === toastId ? null : currentToast
        );
        toastReplaceTimerRef.current = null;
      }, TOAST_EXIT_MS);

      toastDismissTimerRef.current = null;
    }, TOAST_DISPLAY_MS);
  }

  function showToast(text, type = "success") {
    const nextToast = {
      id: toastIdRef.current + 1,
      message: text,
      type,
      exiting: false,
    };
    toastIdRef.current = nextToast.id;

    clearToastTimers();

    if (toast) {
      setToast((currentToast) =>
        currentToast ? { ...currentToast, exiting: true } : currentToast
      );

      toastReplaceTimerRef.current = setTimeout(() => {
        setToast(nextToast);
        toastReplaceTimerRef.current = null;
        scheduleToastExit(nextToast.id);
      }, TOAST_EXIT_MS);
      return;
    }

    setToast(nextToast);
    scheduleToastExit(nextToast.id);
  }

  function showErrorToast(text) {
    showToast(text, "danger");
  }

  function fillSelectedJobForm(job) {
    setSelectedJobForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      jobDescription: job.jobDescription || "",
      sourceUrl: job.sourceUrl || "",
      status: job.status || 1,
      interviewTime: formatDateTimeForInput(job.interviewTime),
      priority: job.priority ?? "",
      notes: job.notes || "",
    });
  }

  function fillProfileForm(profileData) {
    setProfileForm({
      fullName: profileData.fullName || "",
      phone: profileData.phone || "",
      contactEmail: profileData.contactEmail || "",
      linkedinUrl: profileData.linkedinUrl || "",
      githubUrl: profileData.githubUrl || "",
      location: profileData.location || "",
      summary: profileData.summary || "",
    });
  }

  function resetProfileForm() {
    setProfileForm({
      fullName: "",
      phone: "",
      contactEmail: user?.email || "",
      linkedinUrl: "",
      githubUrl: "",
      location: "",
      summary: "",
    });
  }

  async function login() {
    try {
      setError("");
      setMessage("");

      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setToken(response.data.token);
      setUser(response.data.user);

      setEmail("");
      setPassword("");
      setRegisterFullName("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed"));
    }
  }

  async function register() {
    try {
      setError("");
      setMessage("");

      await api.post("/api/auth/register", {
        email,
        password,
        fullName: registerFullName,
      });

      setAuthMode("login");
      setPassword("");
      setRegisterFullName("");
      setMessage("Register success. Please login.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Register failed"));
    }
  }

  async function fetchJobs(preferredJobId = null) {
    try {
      setJobError("");

      const response = await api.get(`/api/job/fetch/${user.id}`);
      applyJobList(response.data, preferredJobId);
    } catch (err) {
      setJobError(getApiErrorMessage(err, "Failed to fetch jobs"));
    }
  }

  async function fetchProfileForGreeting() {
    try {
      const response = await api.get(`/api/profile/fetch/${user.id}`);

      setProfile(response.data);
      fillProfileForm(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
        return;
      }
    }
  }

  async function searchJobs(preferredJobId = null) {
    try {
      setJobError("");

      const response = await api.post("/api/job/search", {
        userId: user.id,
        keyword: jobSearchKeyword.trim(),
        status: jobStatusFilter ? Number(jobStatusFilter) : null,
      });
      applyJobList(response.data, preferredJobId);
    } catch (err) {
      setJobError(getApiErrorMessage(err, "Failed to fetch jobs"));
    }
  }

  function applyJobList(jobList, preferredJobId = null) {
    setJobs(jobList);

    if (jobList.length > 0) {
      const nextSelectedJob =
        jobList.find((job) => job.id === preferredJobId) ||
        jobList[0];
      setSelectedJob(nextSelectedJob);
      fillSelectedJobForm(nextSelectedJob);
    } else {
      setSelectedJob(null);
    }
  }

  async function deleteSection(type, itemId) {
  if (!profile || !itemId) return;

  const confirmed = window.confirm(`Delete this ${type}?`);
  if (!confirmed) return;

  try {
    setSectionError("");

    await api.delete(`/api/${type}/delete/${itemId}`);

    if (editingItem?.id === itemId) {
      setEditingItem(null);
      setSectionForm(emptyForms[type]);
    }

    await fetchProfileSections(profile.id);
    if (type === "skill") {
      await fetchSkillCategories(profile.id);
      await refreshSkillSearch(skillSearchName, skillSearchCategory);
    }
    await fetchJobs(selectedJob?.id);
    showToast(`${getSectionLabel(type)} deleted.`, "danger");
  } catch (err) {
    const errorMessage = getApiErrorMessage(err, `Failed to delete ${type}`);
    setSectionError(errorMessage);
    showErrorToast(errorMessage);
  }
}

  function openJobModal() {
    setJobError("");
    setJobForm({
      title: "",
      company: "",
      location: "",
      salary: "",
      jobDescription: "",
      sourceUrl: "",
      status: 1,
      interviewTime: "",
      priority: "",
      notes: "",
    });
    setShowJobModal(true);
  }

  function handleJobChange(e) {
    const { name, value } = e.target;

    setJobForm({
      ...jobForm,
      [name]: name === "status" ? Number(value) : value,
    });
  }

  function handleSelectedJobChange(e) {
    const { name, value } = e.target;

    setSelectedJobForm({
      ...selectedJobForm,
      [name]: name === "status" ? Number(value) : value,
    });
  }

  function formatDateTimeForInput(value) {
    return value ? String(value).slice(0, 16) : "";
  }

  function isValidOptionalPriority(value) {
    return value === "" || Number(value) >= 0;
  }

  function displayableName(value) {
    const name = value?.trim();
    return name && name !== "Anonymous User" ? name : "";
  }

  function normalizeSectionPayload(type, form, includeProfileId = false) {
    const payload = includeProfileId ? { profileId: profile.id, ...form } : { ...form };

    if (type === "education" && payload.gpa === "") {
      payload.gpa = null;
    }

    if (["education", "experience", "project"].includes(type)) {
      payload.startDate = payload.startDate || null;
      payload.endDate = payload.endDate || null;
    }

    return payload;
  }

  async function createJob() {
    if (!canCreateJob) return;

    try {
      setJobError("");

      const response = await api.post("/api/job/create", {
        userId: user.id,
        ...jobForm,
        interviewTime: jobForm.interviewTime || null,
        priority: jobForm.priority === "" ? null : Number(jobForm.priority),
      });

      setJobs([response.data, ...jobs]);
      setSelectedJob(response.data);
      fillSelectedJobForm(response.data);
      setShowJobModal(false);
      await fetchJobs(response.data.id);
      showToast("Job created.");
    } catch (err) {
      setJobError(getApiErrorMessage(err, "Failed to create job"));
    }
  }

  async function updateJob() {
    if (!selectedJob || !canUpdateJob) return;

    try {
      setJobError("");

      const response = await api.put(`/api/job/update/${selectedJob.id}`, {
        ...selectedJobForm,
        interviewTime: selectedJobForm.interviewTime || null,
        priority:
          selectedJobForm.priority === ""
            ? null
            : Number(selectedJobForm.priority),
      });

      setSelectedJob(response.data);
      fillSelectedJobForm(response.data);

      setJobs(
        jobs.map((job) => (job.id === response.data.id ? response.data : job))
      );
      await fetchJobs(response.data.id);
      showToast("Job saved.");
    } catch (err) {
      setJobError(getApiErrorMessage(err, "Failed to update job"));
    }
  }

  async function deleteJob() {
  if (!selectedJob) return;

  const confirmed = window.confirm("Delete this job?");
  if (!confirmed) return;

  try {
    setJobError("");

    await api.delete(`/api/job/delete/${selectedJob.id}`);

    const updatedJobs = jobs.filter(
      (job) => job.id !== selectedJob.id
    );

    setJobs(updatedJobs);

    if (updatedJobs.length > 0) {
      setSelectedJob(updatedJobs[0]);
      fillSelectedJobForm(updatedJobs[0]);
    } else {
      setSelectedJob(null);
    }

    await fetchJobs(updatedJobs[0]?.id);
    showToast("Job deleted.", "danger");
  } catch (err) {
    setJobError(getApiErrorMessage(err, "Failed to delete job"));
  }
}

  async function openProfileModal() {
    setShowProfileModal(true);
    setProfileError("");
    setSectionError("");
    setProfileTab("profile");
    setEditingItem(null);

    try {
      const response = await api.get(`/api/profile/fetch/${user.id}`);

      setProfile(response.data);
      fillProfileForm(response.data);
      fetchProfileSections(response.data.id);
      await fetchJobs(selectedJob?.id);
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
        resetProfileForm();
      } else {
        setProfile(null);
        setProfileError(getApiErrorMessage(err, "Failed to fetch profile"));
      }
    }
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;

    setProfileForm({
      ...profileForm,
      [name]: value,
    });
  }

  async function createProfile() {
    if (!canSaveProfile) return;

    try {
      setProfileError("");

      const response = await api.post("/api/profile/create", {
        userId: user.id,
        ...profileForm,
      });

      setProfile(response.data);
      fillProfileForm(response.data);
      fetchProfileSections(response.data.id);
      showToast("Profile saved.");
      await fetchJobs(selectedJob?.id);
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Failed to create profile"));
    }
  }

  async function updateProfile() {
    if (!canSaveProfile) return;

    try {
      setProfileError("");

      const response = await api.put(`/api/profile/update/${user.id}`, {
        ...profileForm,
      });

      setProfile(response.data);
      fillProfileForm(response.data);
      fetchProfileSections(response.data.id);
      showToast("Profile saved.");
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Failed to update profile"));
    }
  }

  async function fetchProfileSections(profileId) {
    try {
      setSectionError("");

      const [eduRes, expRes, projectRes, skillRes] = await Promise.all([
        api.get(`/api/education/fetch/${profileId}`),
        api.get(`/api/experience/fetch/${profileId}`),
        api.get(`/api/project/fetch/${profileId}`),
        api.get(`/api/skill/fetch/${profileId}`),
      ]);

      setEducations(eduRes.data);
      setExperiences(expRes.data);
      setProjects(projectRes.data);
      setSkills(skillRes.data);
    } catch (err) {
      setSectionError(getApiErrorMessage(err, "Failed to fetch profile sections"));
    }
  }

  async function fetchSkillCategories(profileId) {
    try {
      const response = await api.get(`/api/skill/categories/${profileId}`);
      setSkillCategories(response.data);
    } catch (err) {
      setSectionError(getApiErrorMessage(err, "Failed to fetch skill categories"));
    }
  }

  async function refreshSkillSearch(name = skillSearchName, category = skillSearchCategory) {
    if (!profile?.id) return;

    try {
      setSectionError("");

      const trimmedName = name.trim();
      const trimmedCategory = category.trim();

      if (trimmedName === "" && trimmedCategory === "") {
        const response = await api.get(`/api/skill/fetch/${profile.id}`);
        setSkills(response.data);
        return;
      }

      const response = await api.post("/api/skill/search", {
        profileId: profile.id,
        name: trimmedName,
        category: trimmedCategory,
      });
      setSkills(response.data);
    } catch (err) {
      setSectionError(getApiErrorMessage(err, "Failed to search skills"));
    }
  }

  function handleSkillCategorySearchChange(value) {
    setSkillSearchCategory(value);
    refreshSkillSearch(skillSearchName, value);
  }

  function switchProfileTab(tab) {
    setProfileTab(tab);
    setEditingItem(null);
    setSectionError("");

    if (tab !== "profile") {
      setSectionForm(emptyForms[tab]);
    }
  }

  function handleSectionChange(e) {
    const { name, value } = e.target;

    setSectionForm({
      ...sectionForm,
      [name]: value,
    });
  }

  function handleSectionAddChange(e) {
    const { name, value } = e.target;

    setSectionAddForm({
      ...sectionAddForm,
      [name]: value,
    });
  }

  function openSectionAddModal(type) {
    setSectionAddType(type);
    setSectionAddForm(emptyForms[type]);
    setSectionError("");
    setShowSectionAddModal(true);
  }

  function startEditSection(type, item) {
    if (editingItem?.id === item.id && profileTab === type) {
      setEditingItem(null);
      setSectionForm(emptyForms[type]);
      return;
    }

    setProfileTab(type);
    setEditingItem(item);
    setSectionError("");

    if (type === "education") {
      setSectionForm({
        schoolName: item.schoolName || "",
        degree: item.degree || "",
        major: item.major || "",
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        gpa: item.gpa || "",
        relevantCoursework: item.relevantCoursework || "",
        description: item.description || "",
      });
    }

    if (type === "experience") {
      setSectionForm({
        companyName: item.companyName || "",
        position: item.position || "",
        location: item.location || "",
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        description: item.description || "",
      });
    }

    if (type === "project") {
      setSectionForm({
        projectName: item.projectName || "",
        techStack: item.techStack || "",
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        description: item.description || "",
      });
    }

    if (type === "skill") {
      setSectionForm({
        category: item.category || "",
        name: item.name || "",
      });
    }
  }

  function canSaveSectionForm(type, form) {
    if (type === "education") {
      return form.schoolName.trim() !== "";
    }

    if (type === "experience") {
      return (
        form.companyName.trim() !== "" &&
        form.position.trim() !== ""
      );
    }

    if (type === "project") {
      return form.projectName.trim() !== "";
    }

    if (type === "skill") {
      return form.name.trim() !== "";
    }

    return false;
  }

  async function addSection() {
    if (!profile || !canSaveSectionForm(sectionAddType, sectionAddForm)) return;

    const payload = normalizeSectionPayload(sectionAddType, sectionAddForm, true);

    try {
      setSectionError("");

      await api.post(`/api/${sectionAddType}/create`, payload);

      setShowSectionAddModal(false);
      setSectionAddForm(emptyForms[sectionAddType]);
      await fetchProfileSections(profile.id);
      if (sectionAddType === "skill") {
        await fetchSkillCategories(profile.id);
        await refreshSkillSearch(skillSearchName, skillSearchCategory);
      }
      await fetchJobs(selectedJob?.id);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, `Failed to add ${sectionAddType}`);
      setSectionError(errorMessage);
      showErrorToast(errorMessage);
    }
  }

  async function importSkillsCsv(file) {
    if (!profile || !file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setSectionError("");

      const response = await api.post(
        `/api/skill/import/${profile.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      await fetchProfileSections(profile.id);
      await fetchSkillCategories(profile.id);
      await refreshSkillSearch(skillSearchName, skillSearchCategory);
      await fetchJobs(selectedJob?.id);

      showToast(
        `Imported ${response.data.successCount} skills, failed ${response.data.failedCount} rows.`
      );
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, "Failed to import skills CSV");
      setSectionError(errorMessage);
      showErrorToast(errorMessage);
    }
  }

  async function updateSection() {
    if (!profile || !editingItem || !canSaveSectionForm(profileTab, sectionForm)) {
      return;
    }

    const payload = normalizeSectionPayload(profileTab, sectionForm);

    try {
      setSectionError("");

      await api.put(`/api/${profileTab}/update/${editingItem.id}`, payload);

      setEditingItem(null);
      setSectionForm(emptyForms[profileTab]);
      await fetchProfileSections(profile.id);
      if (profileTab === "skill") {
        await fetchSkillCategories(profile.id);
        await refreshSkillSearch(skillSearchName, skillSearchCategory);
      }
      await fetchJobs(selectedJob?.id);
      showToast(`${getSectionLabel(profileTab)} saved.`);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, `Failed to update ${profileTab}`);
      setSectionError(errorMessage);
      showErrorToast(errorMessage);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setProfile(null);
    setShowProfileModal(false);
    setShowJobModal(false);
    setShowSectionAddModal(false);
    setJobs([]);
    setSelectedJob(null);
  }

  const greetingName =
    displayableName(profile?.fullName) ||
    displayableName(user?.fullName) ||
    user?.email ||
    "User";

  if (token) {
    return (
      <div className="dashboard-page">
        <div className="top-greeting-row">
          <div className="top-greeting">Hi, {greetingName}</div>
          <ResumeGenerationHelp className="greeting-help" />
        </div>

        <div className="top-right">
          <button className="email-button" onClick={openProfileModal}>
            Your Profile
          </button>

          <button className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>

        {toast && (
          <div className="dashboard-alert">
            <p
              key={toast.id}
              className={`${toast.type === "danger" ? "danger-text" : "success-text"} ${
                toast.exiting ? "toast-exit" : "toast-enter"
              }`}
            >
              {toast.message}
            </p>
          </div>
        )}

        <div className="dashboard-layout">
          <div className="job-list-panel">
            <div className="panel-header">
              <h2>Job List</h2>
              <button
                className="primary-button small-button"
                onClick={openJobModal}
              >
                Add Job
              </button>
            </div>

            <div className="job-filter-row">
              <input
                className="job-search-input"
                placeholder="Search jobs..."
                value={jobSearchKeyword}
                onChange={(e) => setJobSearchKeyword(e.target.value)}
              />
              <select
                className="job-status-filter"
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="1">Saved</option>
                <option value="2">Applied</option>
                <option value="3">Interviewing</option>
                <option value="4">Offer</option>
                <option value="5">Rejected</option>
              </select>
            </div>

            {jobError && <p className="error-text">{jobError}</p>}

            {jobs.length === 0 ? (
              <p className="empty-text">
                {hasJobFilters ? "No jobs found." : "No jobs yet. Add your first job."}
              </p>
            ) : (
              jobs.map((job) => (
                <button
                  key={job.id}
                  className={
                    selectedJob?.id === job.id
                      ? "job-card active-job"
                      : "job-card"
                  }
                  onClick={() => {
                    setSelectedJob(job);
                    fillSelectedJobForm(job);
                  }}
                >
                  <h3>{job.title}</h3>
                  <p>{job.company}</p>
                  <span>{statusMap[job.status] || "Unknown"}</span>
                </button>
              ))
            )}
          </div>

          <div className="job-detail-panel">
            {selectedJob ? (
              <div className="job-detail-card">
                <div className="job-detail-heading">
                  <div>
                    <h2>Edit Job Detail</h2>
                    <p>{selectedJob.company || "Company"} | {statusMap[selectedJob.status] || "Unknown"}</p>
                  </div>
                  <div className="generate-heading-actions">
                    <button
                      type="button"
                      className="primary-button generate-heading-button"
                      onClick={() => handleGenerateResume(selectedJob.id)}
                      disabled={isAnyGenerating}
                    >
                      {isAnyGenerating ? "Generating..." : "Generate Resume"}
                    </button>
                    <button
                      type="button"
                      className="secondary-button generate-heading-button"
                      onClick={() => handleGenerateResumeWithRag(selectedJob.id)}
                      disabled={isAnyGenerating}
                    >
                      {isAnyGenerating ? "Generating..." : "Generate with RAG"}
                    </button>
                  </div>
                </div>

                {jobError && <p className="error-text">{jobError}</p>}

                <div className="job-field-grid">
                  <div className="form-field">
                    <label>Title <span className="required-marker">*</span></label>
                    <input
                      name="title"
                      value={selectedJobForm.title}
                      onChange={handleSelectedJobChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Company <span className="required-marker">*</span></label>
                    <input
                      name="company"
                      value={selectedJobForm.company}
                      onChange={handleSelectedJobChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Location</label>
                    <input
                      name="location"
                      value={selectedJobForm.location}
                      onChange={handleSelectedJobChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Salary</label>
                    <input
                      name="salary"
                      value={selectedJobForm.salary}
                      onChange={handleSelectedJobChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Status</label>
                    <select
                      name="status"
                      value={selectedJobForm.status}
                      onChange={handleSelectedJobChange}
                    >
                      <option value={1}>Saved</option>
                      <option value={2}>Applied</option>
                      <option value={3}>Interview</option>
                      <option value={4}>Offer</option>
                      <option value={5}>Rejected</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Source URL</label>
                    <input
                      name="sourceUrl"
                      value={selectedJobForm.sourceUrl}
                      onChange={handleSelectedJobChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Interview Time</label>
                    <input
                      type="datetime-local"
                      name="interviewTime"
                      value={selectedJobForm.interviewTime}
                      onChange={handleSelectedJobChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Priority</label>
                    <input
                      type="number"
                      min="0"
                      name="priority"
                      value={selectedJobForm.priority}
                      onChange={handleSelectedJobChange}
                    />
                  </div>
                </div>

                <div className="form-field full-row">
                  <label>Job Description</label>
                  <textarea
                    className="job-description-input"
                    name="jobDescription"
                    value={selectedJobForm.jobDescription}
                    onChange={handleSelectedJobChange}
                  />
                </div>

                <div className="form-field full-row">
                  <label>Notes</label>
                  <textarea
                    className="job-notes-input"
                    name="notes"
                    value={selectedJobForm.notes}
                    onChange={handleSelectedJobChange}
                  />
                </div>

                <div className="job-action-row">
                  <button
                    className="primary-button"
                    disabled={!canUpdateJob}
                    onClick={updateJob}
                  >
                    Save Job
                  </button>
                  <button
                    className="secondary-button danger-button"
                    onClick={deleteJob}
                  >
                    Delete Job
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-detail">
                <h2>No job selected</h2>
                <p>Add or select a job to view details.</p>
              </div>
            )}
          </div>

          <ResumePreviewPanel
            selectedJob={selectedJob}
            generatedResume={generatedResume}
            resumeContent={resumeContent}
            selectedResumeMethod={selectedResumeMethod}
            onResumeMethodChange={setSelectedResumeMethod}
            resumeLoading={resumeLoading}
            resumeGenerating={isSelectedResumeGenerating}
            resumePanelError={resumePanelError}
            resumePanelMessage={resumePanelMessage}
            onSaveResume={saveResumeContent}
            onExportPdf={exportResumePdf}
            onSummaryToggle={updateSummaryVisibility}
            onSectionToggle={updateResumeSectionVisibility}
            onResumeChange={setResumeContent}
            resumePreviewRef={resumePreviewRef}
          />
        </div>

        {showJobModal && (
          <div
            className="modal-overlay"
          >
            <div
              className="profile-modal create-job-modal"
            >
              <button
                className="close-button"
                onClick={() => setShowJobModal(false)}
              >
                &times;
              </button>

              <div className="job-detail-heading">
                <div>
                  <h2>Create Job</h2>
                  <p>Add a new opportunity to your tracker.</p>
                </div>
              </div>

              {jobError && <p className="error-text">{jobError}</p>}

              <div className="job-field-grid">
                <div className="form-field">
                  <label>Title <span className="required-marker">*</span></label>
                  <input
                    name="title"
                    value={jobForm.title}
                    onChange={handleJobChange}
                  />
                </div>

                <div className="form-field">
                  <label>Company <span className="required-marker">*</span></label>
                  <input
                    name="company"
                    value={jobForm.company}
                    onChange={handleJobChange}
                  />
                </div>

                <div className="form-field">
                  <label>Location</label>
                  <input
                    name="location"
                    value={jobForm.location}
                    onChange={handleJobChange}
                  />
                </div>

                <div className="form-field">
                  <label>Salary</label>
                  <input
                    name="salary"
                    value={jobForm.salary}
                    onChange={handleJobChange}
                  />
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select
                    name="status"
                    value={jobForm.status}
                    onChange={handleJobChange}
                  >
                    <option value={1}>Saved</option>
                    <option value={2}>Applied</option>
                    <option value={3}>Interview</option>
                    <option value={4}>Offer</option>
                    <option value={5}>Rejected</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Source URL</label>
                  <input
                    name="sourceUrl"
                    value={jobForm.sourceUrl}
                    onChange={handleJobChange}
                  />
                </div>

                <div className="form-field">
                  <label>Interview Time</label>
                  <input
                    type="datetime-local"
                    name="interviewTime"
                    value={jobForm.interviewTime}
                    onChange={handleJobChange}
                  />
                </div>

                <div className="form-field">
                  <label>Priority</label>
                  <input
                    type="number"
                    min="0"
                    name="priority"
                    value={jobForm.priority}
                    onChange={handleJobChange}
                  />
                </div>
              </div>

              <div className="form-field full-row">
                <label>Job Description</label>
                <textarea
                  className="job-description-input"
                  name="jobDescription"
                  value={jobForm.jobDescription}
                  onChange={handleJobChange}
                />
              </div>

              <div className="form-field full-row">
                <label>Notes</label>
                <textarea
                  className="job-notes-input"
                  name="notes"
                  value={jobForm.notes}
                  onChange={handleJobChange}
                />
              </div>

              <div className="modal-action-row">
                <button
                  className="primary-button"
                  disabled={!canCreateJob}
                  onClick={createJob}
                >
                  Create Job
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfileModal && (
          <div
            className="modal-overlay"
          >
            <div
              className="profile-modal large-modal"
            >
              <button
                className="close-button"
                onClick={() => setShowProfileModal(false)}
              >
                &times;
              </button>

              <div className="profile-modal-layout">
                <div className="profile-sidebar">
                  {profile ? (
                    <>
                      <button onClick={() => switchProfileTab("profile")}>
                        Profile
                      </button>

                      <button onClick={() => switchProfileTab("education")}>
                        Education
                      </button>

                      <button onClick={() => switchProfileTab("experience")}>
                        Experience
                      </button>

                      <button onClick={() => switchProfileTab("project")}>
                        Project
                      </button>

                      <button onClick={() => switchProfileTab("skill")}>
                        Skill
                      </button>
                    </>
                  ) : (
                    <div className="empty-sidebar" />
                  )}
                </div>

                <div className="profile-content">
                  {profileTab === "profile" && (
                    <ProfileForm
                      profile={profile}
                      profileError={profileError}
                      profileForm={profileForm}
                      canSaveProfile={canSaveProfile}
                      handleProfileChange={handleProfileChange}
                      createProfile={createProfile}
                      updateProfile={updateProfile}
                    />
                  )}

                  {profile && profileTab !== "profile" && (
                    <SectionManager
  type={profileTab}
  items={getSectionItems(profileTab, {
    educations,
    experiences,
    projects,
    skills,
  })}
  editingItem={editingItem}
  sectionForm={sectionForm}
  sectionError={sectionError}
  handleSectionChange={handleSectionChange}
  startEditSection={startEditSection}
  openSectionAddModal={openSectionAddModal}
  updateSection={updateSection}
  deleteSection={deleteSection}
  canUpdateSection={canSaveSectionForm(profileTab, sectionForm)}
  importSkillsCsv={importSkillsCsv}
  skillSearchName={skillSearchName}
  setSkillSearchName={setSkillSearchName}
  skillSearchCategory={skillSearchCategory}
  handleSkillCategorySearchChange={handleSkillCategorySearchChange}
  skillCategories={skillCategories}
/>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showSectionAddModal && (
          <div
            className="modal-overlay"
          >
            <div
              className="profile-modal"
            >
              <button
                className="close-button"
                onClick={() => setShowSectionAddModal(false)}
              >
                &times;
              </button>

              <h2>Add {capitalize(sectionAddType)}</h2>

              {sectionError && <p className="error-text">{sectionError}</p>}

              <SectionFields
                type={sectionAddType}
                form={sectionAddForm}
                handleChange={handleSectionAddChange}
              />

              <button
                className="primary-button"
                disabled={!canSaveSectionForm(sectionAddType, sectionAddForm)}
                onClick={addSection}
              >
                Add
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="page">
      <div className="auth-card">
        <div className="brand-section">
          <h1>AI Resume Tailor</h1>
          <p>Sign in to manage your resume tailoring workspace.</p>
        </div>

        <div className="tab-row">
          <button
            className={authMode === "login" ? "tab active" : "tab"}
            onClick={() => {
              setAuthMode("login");
              setError("");
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            className={authMode === "register" ? "tab active" : "tab"}
            onClick={() => {
              setAuthMode("register");
              setError("");
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <div className="form-section">
          <label>Email</label>
          <input
            type="email"
            placeholder="test@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {authMode === "register" && (
            <>
              <label>Full Name</label>
              <input
                placeholder="Optional"
                value={registerFullName}
                onChange={(e) => setRegisterFullName(e.target.value)}
              />
            </>
          )}

          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}

          {authMode === "login" ? (
            <button className="primary-button" onClick={login}>
              Login
            </button>
          ) : (
            <button className="primary-button" onClick={register}>
              Create Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileForm({
  profile,
  profileError,
  profileForm,
  canSaveProfile,
  handleProfileChange,
  createProfile,
  updateProfile,
}) {
  return (
    <>
      <h2>{profile ? "Edit Profile" : "Create Profile"}</h2>

      {profileError && <p className="error-text">{profileError}</p>}

      <label>Full Name *</label>
      <input
        name="fullName"
        value={profileForm.fullName}
        onChange={handleProfileChange}
      />

      <label>Phone</label>
      <input
        name="phone"
        value={profileForm.phone}
        onChange={handleProfileChange}
      />

      <label>Contact Email</label>
      <input
        type="email"
        name="contactEmail"
        value={profileForm.contactEmail}
        onChange={handleProfileChange}
      />

      <label>LinkedIn URL</label>
      <input
        name="linkedinUrl"
        value={profileForm.linkedinUrl}
        onChange={handleProfileChange}
      />

      <label>GitHub URL</label>
      <input
        name="githubUrl"
        value={profileForm.githubUrl}
        onChange={handleProfileChange}
      />

      <label>Location</label>
      <input
        name="location"
        value={profileForm.location}
        onChange={handleProfileChange}
      />

      <label>Summary</label>
      <textarea
        name="summary"
        value={profileForm.summary}
        onChange={handleProfileChange}
      />

      <button
        className="primary-button"
        disabled={!canSaveProfile}
        onClick={profile ? updateProfile : createProfile}
      >
        {profile ? "Save Profile" : "Create Profile"}
      </button>
    </>
  );
}

function SectionManager({
  type,
  items,
  editingItem,
  sectionForm,
  sectionError,
  handleSectionChange,
  startEditSection,
  openSectionAddModal,
  updateSection,
  canUpdateSection,
  importSkillsCsv,
  deleteSection,
  skillSearchName,
  setSkillSearchName,
  skillSearchCategory,
  handleSkillCategorySearchChange,
  skillCategories,
}) {
  return (
    <>
      <h2>{capitalize(type)}</h2>

      {type === "skill" && (
        <div className="csv-import-box">
          <label>Import Skills from CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                importSkillsCsv(file);
                e.target.value = "";
              }
            }}
          />
          <button
            type="button"
            className="csv-template-button"
            onClick={downloadSkillCsvTemplate}
          >
            Download CSV template
          </button>
        </div>
      )}

      {type === "skill" && (
        <div className="skill-search-row">
          <div className="form-field">
            <label>Search Name</label>
            <input
              value={skillSearchName}
              onChange={(e) => setSkillSearchName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Category</label>
            <select
              value={skillSearchCategory}
              onChange={(e) => handleSkillCategorySearchChange(e.target.value)}
            >
              <option value="">All Categories</option>
              {skillCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {sectionError && <p className="error-text">{sectionError}</p>}

      <SectionList
  items={items}
  type={type}
  startEditSection={startEditSection}
  editingItem={editingItem}
  sectionForm={sectionForm}
  handleSectionChange={handleSectionChange}
  updateSection={updateSection}
  deleteSection={deleteSection}
  canUpdateSection={canUpdateSection}
  headerAction={
    type === "skill" ? (
      <button
        className="section-add-inline-button"
        onClick={() => openSectionAddModal(type)}
      >
        +
      </button>
    ) : null
  }
/>

      

      {type !== "skill" && (
        <button
          className="section-add-card"
          onClick={() => openSectionAddModal(type)}
        >
          +
        </button>
      )}
    </>
  );
}

function SectionFields({ type, form, handleChange }) {
  if (type === "education") {
    return (
      <>
        <label>School Name *</label>
        <input
          name="schoolName"
          value={form.schoolName}
          onChange={handleChange}
        />

        <label>Degree</label>
        <input name="degree" value={form.degree} onChange={handleChange} />

        <label>Major</label>
        <input name="major" value={form.major} onChange={handleChange} />

        <label>Start Date</label>
        <input
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
        />

        <label>End Date</label>
        <input
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={handleChange}
        />

        <label>GPA</label>
        <input name="gpa" value={form.gpa} onChange={handleChange} />

        <label>Relevant Coursework</label>
        <textarea
          name="relevantCoursework"
          value={form.relevantCoursework}
          onChange={handleChange}
        />

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </>
    );
  }

  if (type === "experience") {
    return (
      <>
        <label>Company Name *</label>
        <input
          name="companyName"
          value={form.companyName}
          onChange={handleChange}
        />

        <label>Position *</label>
        <input name="position" value={form.position} onChange={handleChange} />

        <label>Location</label>
        <input name="location" value={form.location} onChange={handleChange} />

        <label>Start Date</label>
        <input
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
        />

        <label>End Date</label>
        <input
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={handleChange}
        />

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </>
    );
  }

  if (type === "project") {
    return (
      <>
        <label>Project Name *</label>
        <input
          name="projectName"
          value={form.projectName}
          onChange={handleChange}
        />

        <label>Tech Stack</label>
        <input
          name="techStack"
          value={form.techStack}
          onChange={handleChange}
        />

        <label>Start Date</label>
        <input
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
        />

        <label>End Date</label>
        <input
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={handleChange}
        />

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </>
    );
  }

  if (type === "skill") {
    return (
      <>
        <label>Name *</label>
        <input name="name" value={form.name} onChange={handleChange} />

        <label>Category</label>
        <input name="category" value={form.category} onChange={handleChange} />
      </>
    );
  }

  return null;
}

function SectionList({
  items,
  type,
  startEditSection,
  editingItem,
  sectionForm,
  handleSectionChange,
  updateSection,
  canUpdateSection,
  deleteSection,
  headerAction,
}) {
  return (
    <div className="section-list">
      <div className="section-list-header">
        <h3>Existing Records</h3>
        {headerAction}
      </div>

      {items && items.length > 0 ? (
        items.map((item) => (
          <div key={item.id}>
            <button
              className="section-list-card"
              onClick={() => startEditSection(type, item)}
            >
              <strong>{getSectionTitle(type, item)}</strong>
              <span>{getSectionSubtitle(type, item)}</span>
            </button>

            {editingItem?.id === item.id && (
  <div className="section-edit-panel">
    <h3>Edit {capitalize(type)}</h3>

    <SectionFields
      type={type}
      form={sectionForm}
      handleChange={handleSectionChange}
    />

    <div className="section-action-row">
  <button
    className="primary-button section-action-button"
    disabled={!canUpdateSection}
    onClick={updateSection}
  >
    Save
  </button>

  <button
    type="button"
    className="primary-button section-action-button"
    onClick={() => deleteSection(type, item.id)}
  >
    Delete
  </button>
</div>
  </div>
)}
          </div>
        ))
      ) : (
        <p className="empty-text">No records yet.</p>
      )}
    </div>
  );
}

function getSectionTitle(type, item) {
  if (type === "education") return item.schoolName;
  if (type === "experience") return item.position;
  if (type === "project") return item.projectName;
  if (type === "skill") return item.name;
  return "Item";
}

function getSectionSubtitle(type, item) {
  if (type === "education") {
    return [item.degree, item.major].filter(Boolean).join(" | ") || "Education";
  }

  if (type === "experience") {
    return item.companyName || "Experience";
  }

  if (type === "project") {
    return item.techStack || "Project";
  }

  if (type === "skill") {
    return item.category || "Skill";
  }

  return "";
}

function getSectionItems(type, collections) {
  if (type === "education") return collections.educations;
  if (type === "experience") return collections.experiences;
  if (type === "project") return collections.projects;
  if (type === "skill") return collections.skills;
  return [];
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getSectionLabel(type) {
  const labels = {
    education: "Education",
    experience: "Experience",
    project: "Project",
    skill: "Skill",
  };

  return labels[type] || capitalize(type);
}

function downloadSkillCsvTemplate() {
  const csvContent = "category,name\r\nexample_category_1,example_name_1\r\nexample_category_2,example_name_2\r\n";
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "skill_import_template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default App;



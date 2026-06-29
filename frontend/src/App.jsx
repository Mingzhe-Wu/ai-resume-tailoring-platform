import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "./api";
import "./App.css";

const TOAST_DISPLAY_MS = 3000;
const TOAST_EXIT_MS = 140;

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
  const [generatedResume, setGeneratedResume] = useState(null);
  const [resumeContent, setResumeContent] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumePanelError, setResumePanelError] = useState("");
  const [resumePanelMessage, setResumePanelMessage] = useState("");
  const [resumeOutOfBoundary, setResumeOutOfBoundary] = useState(false);
  const didMountJobFilters = useRef(false);
  const resumePreviewRef = useRef(null);

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

      await api.post(`/api/resume/generate-async/${jobId}`);

      showToast("Resume generation started.");

      pollGeneratedResume(jobId);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      if (backendMessage === "Resume is already up to date.") {
        showToast(backendMessage, "danger");
        setResumePanelMessage(backendMessage);
        fetchResumeForJob(jobId, true);
      } else {
        showErrorToast(backendMessage || "Failed to start resume generation.");
        setResumePanelError(backendMessage || "Failed to start resume generation.");
      }
      setResumeLoading(false);
      setGeneratingJobId(null);
    }
  };

  const pollGeneratedResume = (jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await api.get(`/api/resume/fetch/${jobId}`);

        if (res.data && res.data.needGenerate === false) {
          clearInterval(intervalId);
          setGeneratedResume(res.data);
          setResumeContent(deepClone(res.data.generatedContent));
          setResumeLoading(false);
          setResumePanelError("");
          setResumePanelMessage("");
          setGeneratingJobId(null);
          showToast("Resume generated successfully.");
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          clearInterval(intervalId);
          setGeneratingJobId(null);
          setResumeLoading(false);
          setResumePanelError("Failed to check generated resume.");
          showErrorToast("Failed to check generated resume.");
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
      setGeneratedResume(null);
      setResumeContent(null);
      setResumeOutOfBoundary(false);
      setResumeLoading(false);
      setResumePanelError("");
      setResumePanelMessage("");
      return;
    }

    fetchResumeForJob(selectedJob.id);
  }, [selectedJob?.id]);

  useEffect(() => {
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
  }, [resumeContent, generatedResume?.id, selectedJob?.id]);

  async function fetchResumeForJob(jobId, keepMessage = false) {
    try {
      if (!keepMessage) {
        setResumePanelError("");
        setResumePanelMessage("");
      }
      setResumeLoading(true);

      const response = await api.get(`/api/resume/fetch/${jobId}`);

      if (response.data) {
        setGeneratedResume(response.data);
        setResumeContent(deepClone(response.data.generatedContent));
      } else {
        setGeneratedResume(null);
        setResumeContent(null);
      }
    } catch (err) {
      setGeneratedResume(null);
      setResumeContent(null);

      if (err.response?.status !== 404) {
        setResumePanelError(
          err.response?.data?.message || "Failed to fetch generated resume."
        );
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

      setGeneratedResume({
        ...generatedResume,
        generatedContent: deepClone(resumeContent),
      });
      showToast("Generated resume saved.");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to save resume.");
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
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Login failed"
      );
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
      setError(err.response?.data?.message || "Register failed");
    }
  }

  async function fetchJobs(preferredJobId = null) {
    try {
      setJobError("");

      const response = await api.get(`/api/job/fetch/${user.id}`);
      applyJobList(response.data, preferredJobId);
    } catch (err) {
      setJobError(err.response?.data?.message || "Failed to fetch jobs");
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
      setJobError(err.response?.data?.message || "Failed to fetch jobs");
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
    setSectionError(
      err.response?.data?.message || `Failed to delete ${type}`
    );
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
      setJobError(err.response?.data?.message || "Failed to create job");
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
      setJobError(err.response?.data?.message || "Failed to update job");
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
    setJobError(
      err.response?.data?.message || "Failed to delete job"
    );
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
        setProfileError(
          err.response?.data?.message || "Failed to fetch profile"
        );
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
      setProfileError(err.response?.data?.message || "Failed to create profile");
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
      setProfileError(err.response?.data?.message || "Failed to update profile");
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
      setSectionError("Failed to fetch profile sections");
    }
  }

  async function fetchSkillCategories(profileId) {
    try {
      const response = await api.get(`/api/skill/categories/${profileId}`);
      setSkillCategories(response.data);
    } catch (err) {
      setSectionError(
        err.response?.data?.message || "Failed to fetch skill categories"
      );
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
      setSectionError(err.response?.data?.message || "Failed to search skills");
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
      setSectionError(
        err.response?.data?.message || `Failed to add ${sectionAddType}`
      );
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
      setSectionError(
        err.response?.data?.message || "Failed to import skills CSV"
      );
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
      setSectionError(
        err.response?.data?.message || `Failed to update ${profileTab}`
      );
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
        <div className="top-greeting">Hi, {greetingName}</div>

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
                    <p>{selectedJob.company || "Company"} · {statusMap[selectedJob.status] || "Unknown"}</p>
                  </div>
                  <button
                    type="button"
                    className="primary-button generate-heading-button"
                    onClick={() => handleGenerateResume(selectedJob.id)}
                    disabled={generatingJobId === selectedJob.id}
                  >
                    {generatingJobId === selectedJob.id
                      ? "Generating..."
                      : "Generate Resume"}
                  </button>
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

          <div className="resume-preview-panel">
            <div className="resume-preview-card">
              <div className="resume-preview-header">
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
                      onClick={saveResumeContent}
                    >
                      Save Resume
                    </button>
                    <button
                      type="button"
                      className="secondary-button resume-export-button"
                      onClick={exportResumePdf}
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>

              {!selectedJob ? (
                <div className="resume-empty-state">
                  <h3>Select a job</h3>
                  <p>Select a job to view or generate a resume.</p>
                </div>
              ) : resumeLoading ? (
                <div className="resume-empty-state">
                  <h3>Generating resume...</h3>
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
                    onSummaryToggle={updateSummaryVisibility}
                    onSectionToggle={updateResumeSectionVisibility}
                  />

                  <EditableResumePreview
                    resume={resumeContent}
                    onChange={setResumeContent}
                    resumeRef={resumePreviewRef}
                    outOfBoundary={resumeOutOfBoundary}
                  />
                </div>
              ) : (
                <div className="resume-empty-state">
                  <h3>No resume generated yet.</h3>
                  <p>Click Generate Resume to create one.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showJobModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowJobModal(false)}
          >
            <div
              className="profile-modal create-job-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-button"
                onClick={() => setShowJobModal(false)}
              >
                ×
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
            onClick={() => setShowProfileModal(false)}
          >
            <div
              className="profile-modal large-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-button"
                onClick={() => setShowProfileModal(false)}
              >
                ×
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
            onClick={() => setShowSectionAddModal(false)}
          >
            <div
              className="profile-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-button"
                onClick={() => setShowSectionAddModal(false)}
              >
                ×
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

function ResumeBuilderToolbar({ resume, onSummaryToggle, onSectionToggle }) {
  if (!resume || typeof resume !== "object") return null;

  const sections = Array.isArray(resume.sections)
    ? [...resume.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  return (
    <div className="resume-builder-toolbar">
      <label>
        <input
          type="checkbox"
          checked={resume.summary?.visible !== false}
          onChange={(e) => onSummaryToggle(e.target.checked)}
        />
        Summary
      </label>

      {sections.map((section) => {
        const type = String(section.type || "").toLowerCase();
        const sectionKey = getResumeSectionKey(section);

        return (
          <label key={sectionKey}>
            <input
              type="checkbox"
              checked={section.visible !== false}
              onChange={(e) => onSectionToggle(sectionKey, e.target.checked)}
            />
            {section.title || getResumeSectionTitle(type)}
          </label>
        );
      })}
    </div>
  );
}

function EditableResumePreview({ resume, onChange, resumeRef, outOfBoundary = false }) {
  if (!resume || typeof resume !== "object") {
    return (
      <div className="resume-empty-state">
        <h3>Resume preview unavailable</h3>
        <p>The generated resume content is not in the expected structured format.</p>
      </div>
    );
  }

  const contact = resume.contact || {};
  const sections = Array.isArray(resume.sections)
    ? [...resume.sections]
        .filter((section) => section.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  const contactFields = [
    ["location", contact.location],
    ["email", contact.email],
    ["phone", contact.phone],
    ["linkedin", contact.linkedin],
    ["github", contact.github],
  ];

  const updateContact = (field, value) => {
    onChange({
      ...resume,
      contact: {
        ...(resume.contact || {}),
        [field]: value,
      },
    });
  };

  const updateSummary = (value) => {
    onChange({
      ...resume,
      summary: {
        ...(resume.summary || {}),
        content: value,
      },
    });
  };

  const updateSection = (nextSection) => {
    onChange({
      ...resume,
      sections: (resume.sections || []).map((section) =>
        getResumeSectionKey(section) === getResumeSectionKey(nextSection)
          ? nextSection
          : section
      ),
    });
  };

  return (
    <article
      className={outOfBoundary ? "ats-resume ats-resume-out-of-boundary" : "ats-resume"}
      ref={resumeRef}
    >
      <header className="ats-contact">
        <h1>
          <EditableText
            value={contact.name || ""}
            placeholder="Candidate Name"
            onSave={(value) => updateContact("name", value)}
          />
        </h1>

        <p className="ats-contact-line">
          {contactFields.map(([field, value], index) => (
            <span className="ats-contact-part" key={field}>
              {index > 0 && <span className="ats-contact-separator">•</span>}
              <EditableText
                value={value || ""}
                placeholder={field}
                onSave={(nextValue) => updateContact(field, nextValue)}
              />
            </span>
          ))}
        </p>
      </header>

      {resume.summary?.visible !== false && (
        <section className="ats-section">
          <h2>Summary</h2>
          <EditableText
            as="p"
            className="ats-summary"
            value={resume.summary?.content || ""}
            placeholder="Summary"
            onSave={updateSummary}
          />
        </section>
      )}

      {sections.map((section) => (
        <EditableResumeSection
          key={getResumeSectionKey(section)}
          section={section}
          onChange={updateSection}
        />
      ))}
    </article>
  );
}

function EditableResumeSection({ section, onChange }) {
  const items = Array.isArray(section.items)
    ? section.items.filter((item) => item.visible !== false)
    : [];
  const type = String(section.type || "").toLowerCase();

  if (items.length === 0) return null;

  const updateItem = (item, nextItem) => {
    onChange({
      ...section,
      items: (section.items || []).map((sectionItem) =>
        sectionItem === item || (item.id != null && sectionItem.id === item.id)
          ? nextItem
          : sectionItem
      ),
    });
  };

  return (
    <section className="ats-section">
      <h2>{section.title || getResumeSectionTitle(type)}</h2>

      {type.includes("experience") && items.map((item, index) => (
        <EditableExperienceItem
          key={item.id || index}
          item={item}
          onChange={(nextItem) => updateItem(item, nextItem)}
        />
      ))}

      {type.includes("project") && items.map((item, index) => (
        <EditableProjectItem
          key={item.id || index}
          item={item}
          onChange={(nextItem) => updateItem(item, nextItem)}
        />
      ))}

      {type.includes("education") && items.map((item, index) => (
        <EditableEducationItem
          key={item.id || index}
          item={item}
          onChange={(nextItem) => updateItem(item, nextItem)}
        />
      ))}

      {type.includes("skill") && items.map((item, index) => (
        <EditableSkillItem
          key={item.id || index}
          item={item}
          onChange={(nextItem) => updateItem(item, nextItem)}
        />
      ))}
    </section>
  );
}

function EditableExperienceItem({ item, onChange }) {
  const title = item.title || item.position || item.role;
  const company = item.company || item.companyName;

  return (
    <div className="ats-item">
      <div className="ats-item-heading">
        <strong className="ats-item-title">
          <EditableText
            value={company || ""}
            placeholder="Company"
            onSave={(value) => onChange(updateFirstExistingField(item, ["company", "companyName"], value))}
          />
          <span className="ats-inline-separator"> | </span>
          <EditableText
            value={title || ""}
            placeholder="Title"
            onSave={(value) => onChange(updateFirstExistingField(item, ["title", "position", "role"], value))}
          />
        </strong>
        <span className="ats-item-date">
          <EditableText
            value={formatDateRange(item.startDate, item.endDate)}
            placeholder="Date range"
            onSave={(value) => onChange(updateDateRangeFields(item, value))}
          />
        </span>
      </div>
      <EditableText
        as="p"
        className="ats-meta"
        value={item.location || ""}
        placeholder="Location"
        onSave={(value) => onChange({ ...item, location: value })}
      />
      <EditableBulletList
        bullets={item.bullets || item.details || item.description}
        onSave={(bullets) => onChange(updateBulletField(item, bullets))}
      />
    </div>
  );
}

function EditableProjectItem({ item, onChange }) {
  const name = item.name || item.projectName;
  const techStack = formatDelimitedList(item.techStack, " • ");

  return (
    <div className="ats-item">
      <div className="ats-item-heading">
        <strong className="ats-item-title">
          <EditableText
            value={name || ""}
            placeholder="Project name"
            onSave={(value) => onChange(updateFirstExistingField(item, ["name", "projectName"], value))}
          />
        </strong>
        <span className="ats-item-date">
          <EditableText
            value={formatDateRange(item.startDate, item.endDate)}
            placeholder="Date range"
            onSave={(value) => onChange(updateDateRangeFields(item, value))}
          />
        </span>
      </div>
      <EditableText
        as="p"
        className="ats-meta"
        value={techStack}
        placeholder="Tech stack"
        onSave={(value) => onChange({
          ...item,
          techStack: parseDelimitedListLike(item.techStack, value, "•"),
        })}
      />
      <EditableBulletList
        bullets={item.bullets || item.details || item.description}
        onSave={(bullets) => onChange(updateBulletField(item, bullets))}
      />
    </div>
  );
}

function EditableEducationItem({ item, onChange }) {
  const school = item.school || item.schoolName;
  const degreeLine = [item.degree, item.major].filter(Boolean).join(", ");
  const dateLine = [item.location, formatDateRange(item.startDate, item.endDate)]
    .filter(Boolean)
    .join(" | ");
  const detailLine = [degreeLine, item.gpa ? `GPA: ${item.gpa}` : ""]
    .filter(Boolean)
    .join(" | ");

  return (
    <div className="ats-item">
      <div className="ats-item-heading">
        <strong className="ats-item-title">
          <EditableText
            value={school || ""}
            placeholder="School"
            onSave={(value) => onChange(updateFirstExistingField(item, ["school", "schoolName"], value))}
          />
        </strong>
        <span className="ats-item-date">
          <EditableText
            value={dateLine}
            placeholder="Location | Date range"
            onSave={(value) => onChange(updateEducationMetaFields(item, value))}
          />
        </span>
      </div>
      <EditableText
        as="p"
        className="ats-meta"
        value={detailLine}
        placeholder="Degree, Major | GPA"
        onSave={(value) => onChange(updateEducationDetailFields(item, value))}
      />
      <EditableBulletList
        bullets={item.details || item.relevantCoursework || item.description}
        onSave={(bullets) => onChange(updateBulletField(item, bullets))}
      />
    </div>
  );
}

function EditableSkillItem({ item, onChange }) {
  const skills = item.skills || item.names || item.items || item.name;
  const skillText = formatDelimitedList(skills, ", ");

  return (
    <p className="ats-skill-line">
      <strong>
        <EditableText
          value={item.category || ""}
          placeholder="Category"
          onSave={(value) => onChange({ ...item, category: value })}
        />
        {": "}
      </strong>
      <EditableText
        value={skillText}
        placeholder="skill1, skill2, skill3"
        onSave={(value) => onChange({
          ...item,
          [getSkillFieldName(item)]: parseDelimitedListLike(skills, value, ","),
        })}
      />
    </p>
  );
}

function EditableBulletList({ bullets, onSave }) {
  const normalizedBullets = normalizeBullets(bullets);

  if (normalizedBullets.length === 0) return null;

  return (
    <ul className="ats-bullets">
      {normalizedBullets.map((bullet, index) => (
        <li key={index}>
          <EditableText
            value={bullet}
            onSave={(value) => {
              const nextBullets = [...normalizedBullets];
              nextBullets[index] = value;
              onSave(nextBullets);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

function EditableText({ value, onSave, placeholder = "", as: Tag = "span", className = "", multiline = false }) {
  const displayValue = value || "";

  if (multiline) {
    return (
      <textarea
        className={`ats-editable ats-editable-textarea ${className}`}
        value={displayValue}
        placeholder={placeholder}
        onChange={(e) => onSave(e.target.value)}
      />
    );
  }

  return (
    <Tag
      className={`ats-editable ${className}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onSave(e.currentTarget.textContent.trim())}
    >
      {displayValue}
    </Tag>
  );
}

function ResumePreview({ resume }) {
  if (!resume || typeof resume !== "object") {
    return (
      <div className="resume-empty-state">
        <h3>Resume preview unavailable</h3>
        <p>The generated resume content is not in the expected structured format.</p>
      </div>
    );
  }

  const contact = resume.contact || {};
  const sections = Array.isArray(resume.sections)
    ? [...resume.sections]
        .filter((section) => section.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  const contactParts = [
    contact.location,
    contact.email,
    contact.phone,
    contact.linkedin,
    contact.github,
  ].filter(Boolean);

  return (
    <article className="ats-resume">
      <header className="ats-contact">
        <h1>{contact.name || "Candidate Name"}</h1>
        {contactParts.length > 0 && (
          <p>{contactParts.join(" • ")}</p>
        )}
      </header>

      {resume.summary?.visible !== false && resume.summary?.content && (
        <section className="ats-section">
          <h2>Summary</h2>
          <p className="ats-summary">{resume.summary.content}</p>
        </section>
      )}

      {sections.map((section) => (
        <ResumeSection key={section.id || `${section.type}-${section.order}`} section={section} />
      ))}
    </article>
  );
}

function ResumeSection({ section }) {
  const items = Array.isArray(section.items)
    ? section.items.filter((item) => item.visible !== false)
    : [];
  const type = String(section.type || "").toLowerCase();

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="ats-section">
      <h2>{section.title || getResumeSectionTitle(type)}</h2>

      {type.includes("experience") && items.map((item, index) => (
        <ExperienceResumeItem key={item.id || index} item={item} />
      ))}

      {type.includes("project") && items.map((item, index) => (
        <ProjectResumeItem key={item.id || index} item={item} />
      ))}

      {type.includes("education") && items.map((item, index) => (
        <EducationResumeItem key={item.id || index} item={item} />
      ))}

      {type.includes("skill") && <SkillResumeItems items={items} />}
    </section>
  );
}

function ExperienceResumeItem({ item }) {
  const title = item.title || item.position || item.role;
  const company = item.company || item.companyName;
  const heading = [company, title].filter(Boolean).join(" | ");
  const dateRange = formatDateRange(item.startDate, item.endDate);

  return (
    <div className="ats-item">
      <div className="ats-item-heading">
        <strong className="ats-item-title">{heading}</strong>
        {dateRange && <span className="ats-item-date">{dateRange}</span>}
      </div>
      {item.location && <p className="ats-meta">{item.location}</p>}
      <BulletList bullets={item.bullets || item.details || item.description} />
    </div>
  );
}

function ProjectResumeItem({ item }) {
  const name = item.name || item.projectName;
  const dateRange = formatDateRange(item.startDate, item.endDate);
  const techStack = formatDelimitedList(item.techStack);

  return (
    <div className="ats-item">
      <div className="ats-item-heading">
        <strong className="ats-item-title">{name}</strong>
        {dateRange && <span className="ats-item-date">{dateRange}</span>}
      </div>
      {techStack && <p className="ats-meta">{techStack}</p>}
      <BulletList bullets={item.bullets || item.details || item.description} />
    </div>
  );
}

function EducationResumeItem({ item }) {
  const school = item.school || item.schoolName;
  const degreeLine = [item.degree, item.major].filter(Boolean).join(", ");
  const details = item.details || item.relevantCoursework || item.description;
  const dateRange = formatDateRange(item.startDate, item.endDate);

  return (
    <div className="ats-item">
      <div className="ats-item-heading">
        <strong className="ats-item-title">{school}</strong>
        {[item.location, dateRange].filter(Boolean).length > 0 && (
          <span className="ats-item-date">{[item.location, dateRange].filter(Boolean).join(" | ")}</span>
        )}
      </div>
      {(degreeLine || item.location || item.gpa) && (
        <p className="ats-meta">
          {[degreeLine, item.gpa ? `GPA: ${item.gpa}` : ""]
            .filter(Boolean)
            .join(" | ")}
        </p>
      )}
      <BulletList bullets={details} />
    </div>
  );
}

function SkillResumeItems({ items }) {
  return (
    <div className="ats-skills">
      {items.map((item, index) => {
        const skills = item.skills || item.names || item.items || item.name;
        const skillText = formatDelimitedList(skills, ", ");

        if (!skillText) return null;

        return (
          <p key={item.id || index}>
            {item.category && <strong>{item.category}: </strong>}
            {skillText}
          </p>
        );
      })}
    </div>
  );
}

function BulletList({ bullets }) {
  const normalizedBullets = normalizeBullets(bullets);

  if (normalizedBullets.length === 0) {
    return null;
  }

  return (
    <ul className="ats-bullets">
      {normalizedBullets.map((bullet, index) => (
        <li key={index}>{bullet}</li>
      ))}
    </ul>
  );
}

function normalizeBullets(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item?.content || item?.text || ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "";
  return [startDate, endDate || "Present"].filter(Boolean).join(" - ");
}

function formatDelimitedList(value, separator = " • ") {
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

async function exportResumeElementToPdf(element, filename) {
  await document.fonts?.ready;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollX: -window.scrollX,
    scrollY: -window.scrollY,
    logging: false,
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(
    imageData,
    "PNG",
    0,
    0,
    pdf.internal.pageSize.getWidth(),
    pdf.internal.pageSize.getHeight()
  );
  pdf.save(filename);
}

function buildResumePdfFilename(jobTitle) {
  const safeTitle = jobTitle
    ?.trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_");

  return safeTitle ? `Resume_${safeTitle}.pdf` : "Resume.pdf";
}

function getResumeSectionTitle(type) {
  if (type.includes("experience")) return "Experience";
  if (type.includes("project")) return "Projects";
  if (type.includes("education")) return "Education";
  if (type.includes("skill")) return "Skills";
  return "Section";
}

function deepClone(value) {
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

function getResumeSectionKey(section) {
  return section.id || `${section.type || "section"}-${section.order ?? ""}-${section.title || ""}`;
}

function updateFirstExistingField(item, fields, value) {
  const existingField = fields.find((field) =>
    Object.prototype.hasOwnProperty.call(item, field)
  );

  return {
    ...item,
    [existingField || fields[0]]: value,
  };
}

function updateDateRangeFields(item, value) {
  const [startDate = "", endDate = ""] = value.split(/\s+-\s+/, 2);

  return {
    ...item,
    startDate: startDate.trim(),
    endDate: endDate.trim() === "Present" ? "" : endDate.trim(),
  };
}

function updateEducationMetaFields(item, value) {
  const [location = "", dateRange = ""] = value.split("|").map((part) => part.trim());

  return {
    ...updateDateRangeFields(item, dateRange),
    location,
  };
}

function updateEducationDetailFields(item, value) {
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

function updateBulletField(item, bullets) {
  const field = ["bullets", "details", "description", "relevantCoursework"].find((name) =>
    Object.prototype.hasOwnProperty.call(item, name)
  ) || "bullets";
  const existingValue = item[field];

  return {
    ...item,
    [field]: Array.isArray(existingValue) ? bullets : bullets.join("\n"),
  };
}

function parseDelimitedListLike(originalValue, value, preferredSeparator) {
  if (!Array.isArray(originalValue)) {
    return value;
  }

  const splitter = preferredSeparator === "," ? /,/ : /•|,/;

  return value
    .split(splitter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSkillFieldName(item) {
  return ["skills", "names", "items", "name"].find((field) =>
    Object.prototype.hasOwnProperty.call(item, field)
  ) || "skills";
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
    return [item.degree, item.major].filter(Boolean).join(" · ") || "Education";
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

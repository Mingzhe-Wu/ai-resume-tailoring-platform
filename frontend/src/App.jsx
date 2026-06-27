import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
    priorResume: "",
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

  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    jobDescription: "",
    sourceUrl: "",
    status: 1,
    interviewTime: "",
  });

  const [selectedJobForm, setSelectedJobForm] = useState({
    title: "",
    company: "",
    jobDescription: "",
    sourceUrl: "",
    status: 1,
    interviewTime: "",
  });

  const statusMap = {
    1: "Saved",
    2: "Applied",
    3: "Interview",
    4: "Offer",
    5: "Rejected",
  };

  const canSaveProfile =
    profileForm.fullName.trim() !== "" &&
    profileForm.contactEmail.trim() !== "";

  const canCreateJob =
    jobForm.title.trim() !== "" && jobForm.company.trim() !== "";

  const canUpdateJob =
    selectedJobForm.title.trim() !== "" &&
    selectedJobForm.company.trim() !== "";

  const [generatingJobId, setGeneratingJobId] = useState(null);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeForm, setResumeForm] = useState("");

  const handleGenerateResume = async (jobId) => {
    const confirmed = window.confirm(
      "Generate a new resume for this job? This may overwrite or replace the existing generated resume."
    );
    if (!confirmed) return;
    
    try {
      setError("");
      setMessage("");
      setGeneratingJobId(jobId);

      await api.post(`/api/resume/generate-async/${jobId}`);

      setMessage("Resume generation started.");

      pollGeneratedResume(jobId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start resume generation.");
      setGeneratingJobId(null);
    }
  };

  const pollGeneratedResume = (jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await api.get(`/api/resume/fetch/${jobId}`);

        if (res.data) {
          clearInterval(intervalId);
          setGeneratedResume(res.data);
          setResumeForm(res.data.generatedContent || "");
          setGeneratingJobId(null);
          setMessage("Resume generated successfully.");
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          clearInterval(intervalId);
          setGeneratingJobId(null);
          setError("Failed to check generated resume.");
        }
      }
    }, 3000);
  };

  useEffect(() => {
    if (token && user) {
      fetchJobs();
    }
  }, [token, user]);

  function fillSelectedJobForm(job) {
    setSelectedJobForm({
      title: job.title || "",
      company: job.company || "",
      jobDescription: job.jobDescription || "",
      sourceUrl: job.sourceUrl || "",
      status: job.status || 1,
      interviewTime: job.interviewTime || "",
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
      priorResume: profileData.priorResume || "",
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
      priorResume: "",
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
      });

      setAuthMode("login");
      setPassword("");
      setMessage("Register success. Please login.");
    } catch (err) {
      setError(err.response?.data?.message || "Register failed");
    }
  }

  async function fetchJobs() {
    try {
      setJobError("");

      const response = await api.get(`/api/job/fetch/${user.id}`);
      setJobs(response.data);

      if (response.data.length > 0) {
        setSelectedJob(response.data[0]);
        fillSelectedJobForm(response.data[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      setJobError(err.response?.data?.message || "Failed to fetch jobs");
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
    setMessage(`${capitalize(type)} deleted successfully.`);
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
      jobDescription: "",
      sourceUrl: "",
      status: 1,
      interviewTime: "",
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

  async function createJob() {
    if (!canCreateJob) return;

    try {
      setJobError("");

      const response = await api.post("/api/job/create", {
        userId: user.id,
        ...jobForm,
        interviewTime: jobForm.interviewTime || null,
      });

      setJobs([response.data, ...jobs]);
      setSelectedJob(response.data);
      fillSelectedJobForm(response.data);
      setShowJobModal(false);
    } catch (err) {
      setJobError(err.response?.data?.message || "Failed to create job");
    }
  }

  async function updateJob() {
    if (!selectedJob || !canUpdateJob) return;

    try {
      setJobError("");

      const response = await api.put(`/api/job/update/${selectedJob.id}`, {
        userId: user.id,
        ...selectedJobForm,
        interviewTime: selectedJobForm.interviewTime || null,
      });

      setSelectedJob(response.data);
      fillSelectedJobForm(response.data);

      setJobs(
        jobs.map((job) => (job.id === response.data.id ? response.data : job))
      );
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

    setMessage("Job deleted successfully.");
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
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to create profile");
    }
  }

  async function updateProfile() {
    if (!canSaveProfile) return;

    try {
      setProfileError("");

      const response = await api.put(`/api/profile/update/${user.id}`, {
        userId: user.id,
        ...profileForm,
      });

      setProfile(response.data);
      fillProfileForm(response.data);
      fetchProfileSections(response.data.id);
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
        form.position.trim() !== "" &&
        form.startDate.trim() !== ""
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

    const payload = {
      profileId: profile.id,
      ...sectionAddForm,
    };

    if (payload.gpa === "") {
      payload.gpa = null;
    }

    try {
      setSectionError("");

      await api.post(`/api/${sectionAddType}/create`, payload);

      setShowSectionAddModal(false);
      setSectionAddForm(emptyForms[sectionAddType]);
      fetchProfileSections(profile.id);
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

      setMessage(
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

    const payload = {
      profileId: profile.id,
      ...sectionForm,
    };

    if (payload.gpa === "") {
      payload.gpa = null;
    }

    try {
      setSectionError("");

      await api.put(`/api/${profileTab}/update/${editingItem.id}`, payload);

      setEditingItem(null);
      setSectionForm(emptyForms[profileTab]);
      fetchProfileSections(profile.id);
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

  if (token) {
    return (
      <div className="dashboard-page">
        <div className="top-right">
          <button className="email-button" onClick={openProfileModal}>
            {user?.email}
          </button>

          <button className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>

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

            {jobError && <p className="error-text">{jobError}</p>}

            {jobs.length === 0 ? (
              <p className="empty-text">No jobs yet. Add your first job.</p>
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
              <>
                <h2>Edit Job Detail</h2>

                {jobError && <p className="error-text">{jobError}</p>}

                <label>Title *</label>
                <input
                  name="title"
                  value={selectedJobForm.title}
                  onChange={handleSelectedJobChange}
                />

                <label>Company *</label>
                <input
                  name="company"
                  value={selectedJobForm.company}
                  onChange={handleSelectedJobChange}
                />

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

                <label>Source URL</label>
                <input
                  name="sourceUrl"
                  value={selectedJobForm.sourceUrl}
                  onChange={handleSelectedJobChange}
                />

                <label>Interview Time</label>
                <input
                  type="datetime-local"
                  name="interviewTime"
                  value={selectedJobForm.interviewTime}
                  onChange={handleSelectedJobChange}
                />

                <label>Job Description</label>
                <textarea
                  name="jobDescription"
                  value={selectedJobForm.jobDescription}
                  onChange={handleSelectedJobChange}
                />

                <button
                  className="primary-button"
                  disabled={!canUpdateJob}
                  onClick={updateJob}
                >
                  Save Job
                </button>
                <button
    className="primary-button"
    onClick={deleteJob}
  >
    Delete Job
  </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleGenerateResume(selectedJob.id)}
                  disabled={generatingJobId === selectedJob.id}
                >
                  {generatingJobId === selectedJob.id
                    ? "Generating..."
                    : "Generate Resume"}
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={async () => {
                    try {
                      setError("");

                      const res = await api.get(
                        `/api/resume/fetch/${selectedJob.id}`
                      );

                      if (!res.data) {
                        alert("This job does not have a generated resume yet.");
                        return;
                      }

                      setGeneratedResume(res.data);
                      setResumeForm(res.data.generatedContent || "");
                      setShowResumeModal(true);
                    } catch (err) {
                      alert(
                        err.response?.data?.message ||
                          "This job does not have a generated resume yet."
                      );
                    }
                  }}
                >
                  View / Edit Generated Resume
                </button>
              </>
            ) : (
              <div className="empty-detail">
                <h2>No job selected</h2>
                <p>Add or select a job to view details.</p>
              </div>
            )}
          </div>
        </div>

        {showJobModal && (
          <div className="modal-overlay">
            <div className="profile-modal">
              <button
                className="close-button"
                onClick={() => setShowJobModal(false)}
              >
                ×
              </button>

              <h2>Create Job</h2>

              {jobError && <p className="error-text">{jobError}</p>}

              <label>Title *</label>
              <input
                name="title"
                value={jobForm.title}
                onChange={handleJobChange}
              />

              <label>Company *</label>
              <input
                name="company"
                value={jobForm.company}
                onChange={handleJobChange}
              />

              <label>Job Description</label>
              <textarea
                name="jobDescription"
                value={jobForm.jobDescription}
                onChange={handleJobChange}
              />

              <label>Source URL</label>
              <input
                name="sourceUrl"
                value={jobForm.sourceUrl}
                onChange={handleJobChange}
              />

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

              <label>Interview Time</label>
              <input
                type="datetime-local"
                name="interviewTime"
                value={jobForm.interviewTime}
                onChange={handleJobChange}
              />

              <button
                className="primary-button"
                disabled={!canCreateJob}
                onClick={createJob}
              >
                Create Job
              </button>
            </div>
          </div>
        )}

        {showProfileModal && (
          <div className="modal-overlay">
            <div className="profile-modal large-modal">
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
/>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showSectionAddModal && (
          <div className="modal-overlay">
            <div className="profile-modal">
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

        {showResumeModal && (
          <div className="modal-overlay">
            <div className="profile-modal large-modal">
              <h2>Generated Resume</h2>

              <textarea
                value={resumeForm}
                onChange={(e) => setResumeForm(e.target.value)}
                rows={30}
                style={{ width: "100%", minHeight: "600px" }}
              />

              <button
                type="button"
                className="primary-button"
                onClick={async () => {
                  await api.put(`/api/resume/update/${generatedResume.id}`, {
                    generatedContent: resumeForm,
                  });

                  setGeneratedResume({
                    ...generatedResume,
                    generatedContent: resumeForm,
                  });

                  setShowResumeModal(false);
                  setMessage("Resume saved successfully.");
                }}
              >
                Save Resume
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowResumeModal(false)}
              >
                Close
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

      <label>Contact Email *</label>
      <input
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

      <label>Prior Resume</label>
      <textarea
        name="priorResume"
        value={profileForm.priorResume}
        onChange={handleProfileChange}
        rows={12}
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
          <p className="empty-text">CSV format: category,name</p>
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
/>

      

      <button
        className="section-add-card"
        onClick={() => openSectionAddModal(type)}
      >
        +
      </button>
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

        <label>Start Date *</label>
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
}) {
  return (
    <div className="section-list">
      <h3>Existing Records</h3>

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

export default App;
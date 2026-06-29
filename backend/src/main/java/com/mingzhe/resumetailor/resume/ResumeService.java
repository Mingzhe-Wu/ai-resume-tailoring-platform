package com.mingzhe.resumetailor.resume;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mingzhe.resumetailor.OpenAiService;
import com.mingzhe.resumetailor.education.Education;
import com.mingzhe.resumetailor.education.EducationMapper;
import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.exceptions.ResourceNotFoundException;
import com.mingzhe.resumetailor.experience.Experience;
import com.mingzhe.resumetailor.experience.ExperienceMapper;
import com.mingzhe.resumetailor.job.Job;
import com.mingzhe.resumetailor.job.JobMapper;
import com.mingzhe.resumetailor.profile.Profile;
import com.mingzhe.resumetailor.profile.ProfileMapper;
import com.mingzhe.resumetailor.project.Project;
import com.mingzhe.resumetailor.project.ProjectMapper;
import com.mingzhe.resumetailor.skill.Skill;
import com.mingzhe.resumetailor.skill.SkillMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business logic for validating and managing Resume records.
 */
@Service
public class ResumeService {

    private final JobMapper jobMapper;
    private final ProfileMapper profileMapper;
    private final ExperienceMapper experienceMapper;
    private final EducationMapper educationMapper;
    private final ProjectMapper projectMapper;
    private final SkillMapper skillMapper;
    private final ResumeMapper resumeMapper;
    private final ObjectMapper objectMapper;

    private final OpenAiService openAiService;

    private static final Logger log = LoggerFactory.getLogger(ResumeService.class);

    public ResumeService(JobMapper jobMapper, ProfileMapper profileMapper, ExperienceMapper experienceMapper, EducationMapper educationMapper, ProjectMapper projectMapper, SkillMapper skillMapper, ResumeMapper resumeMapper, ObjectMapper objectMapper, OpenAiService openAiService) {
        this.jobMapper = jobMapper;
        this.profileMapper = profileMapper;
        this.experienceMapper = experienceMapper;
        this.educationMapper = educationMapper;
        this.projectMapper = projectMapper;
        this.skillMapper = skillMapper;
        this.resumeMapper = resumeMapper;
        this.objectMapper = objectMapper;
        this.openAiService = openAiService;
    }

    public Resume createResume(CreateResumeDTO request) {
        Job job = jobMapper.findById(request.getJobId());
        if (job == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        if (request.getMatchScore() != null && !isValidMatchScore(request.getMatchScore())) {
            throw new BadRequestException("matchScore must be between 0 and 100");
        }

        Resume resume = new Resume();
        resume.setJobId(request.getJobId());
        resume.setMatchScore(request.getMatchScore());
        resume.setGeneratedContent(request.getGeneratedContent());

        resumeMapper.insert(resume);
        return resume;
    }

    public ResumeResponseDTO fetchResumesByJobId(Long jobId) {
        Job job = jobMapper.findById(jobId);
        if (job == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        Resume resume = resumeMapper.findByJobId(jobId);
        if (resume == null) {
            return null;
        }

        ResumeResponseDTO dto = new ResumeResponseDTO();

        dto.setId(resume.getId());
        dto.setJobId(resume.getJobId());
        dto.setMatchScore(resume.getMatchScore());
        dto.setNeedGenerate(resume.getNeedGenerate());
        dto.setCreatedAt(resume.getCreatedAt());
        dto.setUpdatedAt(resume.getUpdatedAt());
        try {
            dto.setGeneratedContent(objectMapper.readTree(resume.getGeneratedContent()));
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Stored resume JSON is invalid.");
        }

        return dto;
    }

    public Resume updateResume(Long id, UpdateResumeDTO request) {
        Resume existingResume = resumeMapper.findById(id);
        if (existingResume == null) {
            throw new ResourceNotFoundException("Resume not found");
        }

        if (request.getMatchScore() != null && !isValidMatchScore(request.getMatchScore())) {
            throw new BadRequestException("matchScore must be between 0 and 100");
        }

        Resume update = new Resume();
        update.setId(id);
        update.setMatchScore(request.getMatchScore());
        update.setGeneratedContent(request.getGeneratedContent());

        resumeMapper.updateById(update);
        return resumeMapper.findById(id);
    }

    public void deleteResume(Long id) {
        Resume existingResume = resumeMapper.findById(id);
        if (existingResume == null) {
            throw new ResourceNotFoundException("Resume not found");
        }

        resumeMapper.deleteById(id);
    }

    private boolean isValidMatchScore(Integer matchScore) {
        return matchScore != null && matchScore >= 0 && matchScore <= 100;
    }

    @Async
    public void generateResumeAsync(Long jobId) {
        log.info("Async resume generation started for jobId={}, thread={}",
                jobId, Thread.currentThread().getName());

        try {
            String result = generateResume(jobId);
            log.info("Async resume generation finished for jobId={}, result={}", jobId, result);
        } catch (Exception e) {
            log.error("Async resume generation failed for jobId={}: {}", jobId, e.getMessage(), e);
        }
    }

    public String generateResume(Long jobId) {
        // fetch resume context with given job id
        ResumeGenerationContext context = fetchResumeContext(jobId);
        ensureGenerationAllowed(jobId);

        // build structured prompt for calling OpenAI api with the context
        String prompt = buildPrompt(context);

        // call OpenAi api up to three times to generate resume
        String aiResponse = callLlmWithRetry(prompt);

        // construct resume and save to database
        Resume resume = new Resume();
        resume.setJobId(jobId);
        resume.setMatchScore(null);
        resume.setNeedGenerate(false);

        String json;
        try {
            JsonNode node = objectMapper.readTree(aiResponse);
            json = objectMapper.writeValueAsString(node);
            resume.setGeneratedContent(json);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("AI returned invalid resume JSON");
        }

        Resume existingResume = resumeMapper.findByJobId(jobId);

        if (existingResume == null) {
            resumeMapper.insert(resume);
        } else {
            resume.setId(existingResume.getId());
            resumeMapper.updateById(resume);
        }

        return "Resume Generated";
    }

    public void ensureGenerationAllowed(Long jobId) {
        Job job = jobMapper.findById(jobId);
        if (job == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        Resume existingResume = resumeMapper.findByJobId(jobId);
        if (existingResume != null && !Boolean.TRUE.equals(existingResume.getNeedGenerate())) {
            throw new BadRequestException("Resume is already up to date.");
        }
    }

    private String callLlmWithRetry(String prompt) {
        int maxAttempts = 3;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.info("LLM attempt {} started", attempt);

                // call OpenAi api to generate a response
                String aiResponse = openAiService.generate(prompt);

                // validate the response
                validateGeneratedResume(aiResponse);

                log.info("LLM attempt {} succeeded", attempt);
                return aiResponse;

            } catch (Exception e) {
                log.warn("LLM attempt {} failed: {}", attempt, e.getMessage());

                if (attempt == maxAttempts) {
                    throw new RuntimeException("Resume generation failed after " + maxAttempts + " attempts", e);
                }

                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Retry interrupted", ie);
                }
            }
        }

        throw new RuntimeException("Unexpected retry failure");
    }

    private ResumeGenerationContext fetchResumeContext(Long jobId) {
        Job job = jobMapper.findById(jobId);
        if (job == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        Profile profile = profileMapper.findByUserId(job.getUserId());
        if (profile == null) {
            throw new ResourceNotFoundException("Profile not found for user id: " + job.getUserId());
        }

        ResumeGenerationContext context = new ResumeGenerationContext();
        context.setJob(job);
        context.setProfile(profile);
        context.setExperiences(experienceMapper.findByProfileId(profile.getId()));
        context.setEducations(educationMapper.findByProfileId(profile.getId()));
        context.setProjects(projectMapper.findByProfileId(profile.getId()));
        context.setSkills(skillMapper.findByProfileId(profile.getId()));

        return context;
    }

    private String buildPrompt(ResumeGenerationContext context) {

        Job job = context.getJob();
        Profile profile = context.getProfile();
        List<Experience> experiences = context.getExperiences();
        List<Education> educations = context.getEducations();
        List<Project> projects = context.getProjects();
        List<Skill> skills = context.getSkills();

        StringBuilder sb = new StringBuilder();

// =========================================================================
// Core Identity & Output Contract
// =========================================================================

        sb.append("""
                You are a senior software engineering resume writer.
                
                Generate a concise, ATS-friendly, technically credible software engineering resume tailored to the target job description and candidate background.
                
                The resume should feel realistic, polished, and intentionally curated for the target role while remaining believable for a strong new graduate software engineering candidate.
                
                Output only valid JSON that strictly follows the required schema.
                Do not output Markdown, explanations, comments, or plain resume text.
                
                """);

// =========================================================================
// Resume Generation Policy
// =========================================================================

        sb.append("""
                Resume Generation Policy:
                
                Realism & Anti-Hallucination:
                - Resume realism is more important than maximizing keyword matching.
                - Do not invent entirely new projects, engineering domains, technologies, or work experiences.
                - Only strengthen, reorganize, compress, expand, or rewrite experiences explicitly supported by the provided candidate data.
                - Avoid synthesizing large technical narratives from isolated skills, coursework, or weak signals.
                - Prefer omission over exaggeration.
                - Avoid inflated or unrealistic engineering claims.
                - Ground technical claims in concrete implementation details.
                - Resume content should sound believable to experienced software engineers conducting technical interviews.
                
                Writing Style:
                - Write concise, technically dense, engineering-oriented bullet points.
                - Keep most bullets around 20-35 words.
                - Use strong action verbs such as Developed, Built, Designed, Implemented, Automated, Integrated, Diagnosed, Refined, and Debugged.
                - Use past tense for completed work.
                - Prefer implementation details, debugging, workflows, APIs, persistence, automation, testing, integration, and operational behavior over abstract business summaries.
                - Avoid weak phrases such as Responsible for, Worked on, Helped with, Assisted with, or Participated in.
                - Avoid overly repetitive bullet structures.
                - Avoid excessive buzzwords or keyword stuffing.
                - Avoid mechanically stacking too many technologies into a single bullet.
                - Prefer natural engineering language commonly used in real production environments.
                
                Prioritization:
                - Prioritize the most role-relevant experiences, projects, and skills.
                - Allocate more space to highly relevant engineering work.
                - Compress low-relevance content aggressively.
                - Reorder experiences, projects, and skills based on the target role.
                - AI-related claims should remain implementation-focused rather than research-focused unless explicitly supported.
                - Prefer concise, information-dense writing over verbose descriptions.
                - Avoid repeating the same technologies or accomplishments across multiple sections.
                
                Length Optimization:
                - Optimize the resume for a one-page software engineering resume.
                - Allocate space dynamically based on relevance to the target role.
                - Keep the overall content concise rather than maximizing every section.
                - Prioritize preserving the strongest evidence of engineering ability over fitting every piece of information.
                - Compress lower-priority descriptions before removing high-impact technical accomplishments.
                - Prefer fewer, stronger, information-dense sentences over many repetitive bullet points.
                - Prefer less than 450 words for the entire resume.
                
                Bullet Allocation:
                - Allocate bullet points dynamically based on relevance and available space.
                - The entire resume should typically contain approximately 8–10 bullet points in total.
                - Highly relevant experiences or projects may receive additional bullet points only if lower-priority sections are compressed accordingly.
                - Prefer merging related accomplishments into a single stronger bullet rather than creating many short bullets.
                - Avoid excessive bullet lists for any single experience or project.
                
                Summary:
                - The summary is optional.
                - If experience and projects require more space, compress the summary to 1-2 lines.
                - If there is sufficient space, the summary may be expanded, but should never exceed 3 lines.
                
                Experience & Projects:
                - Preserve enough bullet points to clearly communicate the candidate's strongest technical achievements.
                - Do not arbitrarily reduce bullet points.
                - Compress or merge redundant information instead.
                - Preserve the most impactful technical accomplishments whenever possible.
                
                Skills:
                - Keep the Skills section concise, curated, and relevant.
                - Do not treat the Skills section as a complete inventory.
                - Instead, highlight the technologies most relevant to the target job description.
                - Curate the skills section instead of listing every available skill.
                - Include at most 5 skill categories.
                - Include approximately 15 of the most relevant technical skills, preferring the most desired from job description.
                - Remove outdated, redundant, or low-value skills.
                - Prefer quality over quantity.
                - Skill category names do not need to follow any predefined list.
                - Generate meaningful skill categories that best organize the selected skills for the target role.
                
                """);

// =========================================================================
// Dynamic Role Focus
// =========================================================================

        String jdText = (
                (job.getTitle() == null ? "" : job.getTitle()) + " " +
                        (job.getJobDescription() == null ? "" : job.getJobDescription())
        ).toLowerCase();

        if (
                jdText.contains("embedded") ||
                        jdText.contains("robotics") ||
                        jdText.contains("autonomous") ||
                        jdText.contains("linux") ||
                        jdText.contains("hardware") ||
                        jdText.contains("sensor") ||
                        jdText.contains("c++")
        ) {

            sb.append("""
                    Detected Role Focus:
                    This appears to be a systems, embedded, robotics, or low-level engineering role.
                    Prioritize embedded systems, C/C++, Linux, networking, runtime debugging, hardware-software integration, sensor processing, and performance-related engineering work.
                    Emphasize systems-oriented projects more than generic web applications.
                    
                    """);
        }

        if (
                jdText.contains("ai") ||
                        jdText.contains("llm") ||
                        jdText.contains("openai") ||
                        jdText.contains("prompt") ||
                        jdText.contains("agent") ||
                        jdText.contains("machine learning")
        ) {

            sb.append("""
                    Detected Role Focus:
                    This appears to be an AI application or AI-adjacent software engineering role.
                    Prioritize API integration, structured workflows, automation, backend orchestration, debugging, prompt construction, persistence workflows, and reliable service behavior.
                    Avoid overstating ML research or distributed AI infrastructure.
                    
                    """);
        }

        if (
                jdText.contains("backend") ||
                        jdText.contains("api") ||
                        jdText.contains("spring") ||
                        jdText.contains("java") ||
                        jdText.contains("database")
        ) {

            sb.append("""
                    Detected Role Focus:
                    This appears to be a backend or service-oriented engineering role.
                    Prioritize Java, Spring Boot, REST APIs, MyBatis, MySQL, validation, persistence, debugging, operational workflows, and backend service logic.
                    
                    """);
        }

// =========================================================================
// Required JSON Schema
// =========================================================================

        sb.append("""
                Required JSON Output Schema:
                
                {
                  "template": "ATS",
                  "contact": {
                    "name": "",
                    "location": "",
                    "email": "",
                    "phone": "",
                    "linkedin": "",
                    "github": ""
                  },
                  "summary": {
                    "visible": true,
                    "content": ""
                  },
                  "sections": [
                    {
                      "id": "education",
                      "type": "education",
                      "title": "Education",
                      "visible": true,
                      "order": 1,
                      "items": [
                        {
                          "school": "",
                          "degree": "",
                          "major": "",
                          "location": "",
                          "startDate": "",
                          "endDate": "",
                          "gpa": "",
                          "details": []
                        }
                      ]
                    },
                    {
                      "id": "experience",
                      "type": "experience",
                      "title": "Experience",
                      "visible": true,
                      "order": 2,
                      "items": [
                        {
                          "company": "",
                          "title": "",
                          "location": "",
                          "startDate": "",
                          "endDate": "",
                          "visible": true,
                          "bullets": []
                        }
                      ]
                    },
                    {
                      "id": "projects",
                      "type": "projects",
                      "title": "Projects",
                      "visible": true,
                      "order": 3,
                      "items": [
                        {
                          "name": "",
                          "techStack": [],
                          "startDate": "",
                          "endDate": "",
                          "visible": true,
                          "bullets": []
                        }
                      ]
                    },
                    {
                      "id": "skills",
                      "type": "skills",
                      "title": "Skills",
                      "visible": true,
                      "order": 4,
                      "items": [
                        {
                          "category": "",
                          "skills": []
                        }
                      ]
                    }
                  ]
                }
                
                JSON Rules:
                - Return exactly one JSON object.
                - Do not wrap the JSON in Markdown code fences.
                - Do not include any text before or after the JSON.
                - Use double quotes for all JSON keys and string values.
                - Use arrays for bullets, details, skills, techStack, sections, and items.
                - Exclude null or empty fields when possible.
                - Do not include trailing commas.
                - Do not include null values.
                - Do not include empty strings if the field is unavailable.
                - If a section has no usable content, omit that section.
                - Section order should reflect the best resume layout for the target job.
                - Each section and item should include "visible": true.
                - Keep "template" as "ATS".
                - The renderer will determine visual formatting.
                - Focus on producing semantically correct resume content rather than presentation.
                - The JSON must be directly parseable by Jackson ObjectMapper.
                
                """);

// =========================================================================
// Target Job
// =========================================================================

        sb.append("<TargetJob>\\n");

        appendIfPresent(sb, "Title: ", job.getTitle());
        appendIfPresent(sb, "Company: ", job.getCompany());

        if (hasText(job.getJobDescription())) {
            sb.append("Description:\\n")
                    .append(job.getJobDescription())
                    .append("\\n");
        }

        sb.append("</TargetJob>\\n\\n");

// =========================================================================
// Candidate Profile
// =========================================================================

        sb.append("<CandidateProfile>\\n");

        appendIfPresent(sb, "Full Name: ", profile.getFullName());
        appendIfPresent(sb, "Location: ", profile.getLocation());
        appendIfPresent(sb, "Email: ", profile.getContactEmail());
        appendIfPresent(sb, "Phone: ", profile.getPhone());
        appendIfPresent(sb, "LinkedIn: ", profile.getLinkedinUrl());
        appendIfPresent(sb, "GitHub: ", profile.getGithubUrl());

        sb.append("</CandidateProfile>\\n\\n");

// =========================================================================
// Experiences
// =========================================================================

        if (experiences != null && !experiences.isEmpty()) {

            sb.append("<Experiences>\\n");

            for (Experience exp : experiences) {

                sb.append("- Experience\\n");

                appendIfPresent(sb, "  Company: ", exp.getCompanyName());
                appendIfPresent(sb, "  Position: ", exp.getPosition());
                appendIfPresent(sb, "  Location: ", exp.getLocation());
                appendIfPresent(sb, "  Start Date: ", exp.getStartDate());
                appendIfPresent(sb, "  End Date: ", exp.getEndDate());
                appendIfPresent(sb, "  Description: ", exp.getDescription());

                sb.append("\\n");
            }

            sb.append("</Experiences>\\n\\n");
        }

// =========================================================================
// Educations
// =========================================================================

        if (educations != null && !educations.isEmpty()) {

            sb.append("<Educations>\\n");

            for (Education edu : educations) {

                sb.append("- Education\\n");

                appendIfPresent(sb, "  School: ", edu.getSchoolName());
                appendIfPresent(sb, "  Degree: ", edu.getDegree());
                appendIfPresent(sb, "  Major: ", edu.getMajor());
                appendIfPresent(sb, "  GPA: ", edu.getGpa());
                appendIfPresent(sb, "  Relevant Coursework: ", edu.getRelevantCoursework());

                sb.append("\\n");
            }

            sb.append("</Educations>\\n\\n");
        }

// =========================================================================
// Projects
// =========================================================================

        if (projects != null && !projects.isEmpty()) {

            sb.append("<Projects>\\n");

            for (Project project : projects) {

                sb.append("- Project\\n");

                appendIfPresent(sb, "  Project Name: ", project.getProjectName());
                appendIfPresent(sb, "  Tech Stack: ", project.getTechStack());
                appendIfPresent(sb, "  Start Date: ", project.getStartDate());
                appendIfPresent(sb, "  End Date: ", project.getEndDate());
                appendIfPresent(sb, "  Description: ", project.getDescription());

                sb.append("\\n");
            }

            sb.append("</Projects>\\n\\n");
        }

// =========================================================================
// Skills
// =========================================================================

        if (skills != null && !skills.isEmpty()) {

            sb.append("<Skills>\\n");

            for (Skill skill : skills) {

                if (hasText(skill.getCategory()) && hasText(skill.getName())) {

                    sb.append("- ")
                            .append(skill.getCategory())
                            .append(": ")
                            .append(skill.getName())
                            .append("\\n");
                }
            }

            sb.append("</Skills>\\n\\n");
        }

// =========================================================================
// Final Reminder
// =========================================================================

        sb.append("""
                Final Reminder:
                Output only the JSON object.
                Do not include Markdown, commentary, explanations, or plain resume text.
                The response must be valid JSON and directly parseable by Jackson ObjectMapper.
                """);

        return sb.toString();
    }


    private void appendIfPresent(StringBuilder sb, String label, Object value) {
        if (value != null && hasText(String.valueOf(value))) {
            sb.append(label).append(value).append("\n");
        }
    }

    private void appendBlockIfPresent(StringBuilder sb, String label, Object value) {
        if (value != null && hasText(String.valueOf(value))) {
            sb.append(label).append("\n").append(value).append("\n");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank() && !"null".equalsIgnoreCase(value.trim());
    }

    public void validateGeneratedResume(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Generated resume is empty");
        }

        if (content.length() < 100) {
            throw new IllegalArgumentException("Generated resume is too short");
        }

        String lower = content.toLowerCase();

        if (lower.contains("i'm sorry") || lower.contains("cannot help with")) {
            throw new IllegalArgumentException("Generated resume contains failure-like text");
        }

        boolean hasExperience = lower.contains("experience");
        boolean hasProject = lower.contains("project");
        boolean hasSkills = lower.contains("skills");

        if ((!hasExperience && !hasProject) || !hasSkills) {
            throw new IllegalArgumentException("Generated resume is missing expected sections");
        }
    }

}

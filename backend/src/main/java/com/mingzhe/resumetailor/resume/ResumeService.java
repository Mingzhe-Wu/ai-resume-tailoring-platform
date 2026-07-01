package com.mingzhe.resumetailor.resume;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mingzhe.resumetailor.education.Education;
import com.mingzhe.resumetailor.education.EducationMapper;
import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.exceptions.ResourceNotFoundException;
import com.mingzhe.resumetailor.experience.Experience;
import com.mingzhe.resumetailor.experience.ExperienceMapper;
import com.mingzhe.resumetailor.job.Job;
import com.mingzhe.resumetailor.job.JobMapper;
import com.mingzhe.resumetailor.openai.ChunkEmbeddingService;
import com.mingzhe.resumetailor.openai.OpenAiResumeService;
import com.mingzhe.resumetailor.profile.Profile;
import com.mingzhe.resumetailor.profile.ProfileMapper;
import com.mingzhe.resumetailor.prompttemplate.PromptTemplateService;
import com.mingzhe.resumetailor.prompttemplate.PromptTemplateType;
import com.mingzhe.resumetailor.project.Project;
import com.mingzhe.resumetailor.project.ProjectMapper;
import com.mingzhe.resumetailor.rag.ProfileEmbeddingChunkService;
import com.mingzhe.resumetailor.rag.ResumeContextBuilderService;
import com.mingzhe.resumetailor.rag.ResumeRetrievalResultDTO;
import com.mingzhe.resumetailor.rag.SemanticRetrievalService;
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

    private final OpenAiResumeService openAiResumeService;
    private final ChunkEmbeddingService  chunkEmbeddingService;
    private final ProfileEmbeddingChunkService profileEmbeddingChunkService;
    private final SemanticRetrievalService semanticRetrievalService;
    private final ResumeContextBuilderService resumeContextBuilderService;
    private final PromptTemplateService promptTemplateService;

    private static final Logger log = LoggerFactory.getLogger(ResumeService.class);

    private static final int EXP_AND_PROJECT_TOP_K = 11;
    private static final int SKILL_TOP_K = 5;

    public ResumeService(
            JobMapper jobMapper,
            ProfileMapper profileMapper,
            ExperienceMapper experienceMapper,
            EducationMapper educationMapper,
            ProjectMapper projectMapper,
            SkillMapper skillMapper,
            ResumeMapper resumeMapper,
            ObjectMapper objectMapper,
            OpenAiResumeService openAiResumeService,
            ChunkEmbeddingService chunkEmbeddingService,
            ProfileEmbeddingChunkService profileEmbeddingChunkService,
            SemanticRetrievalService semanticRetrievalService,
            ResumeContextBuilderService resumeContextBuilderService,
            PromptTemplateService promptTemplateService
    ) {
        this.jobMapper = jobMapper;
        this.profileMapper = profileMapper;
        this.experienceMapper = experienceMapper;
        this.educationMapper = educationMapper;
        this.projectMapper = projectMapper;
        this.skillMapper = skillMapper;
        this.resumeMapper = resumeMapper;
        this.objectMapper = objectMapper;
        this.openAiResumeService = openAiResumeService;
        this.chunkEmbeddingService = chunkEmbeddingService;
        this.profileEmbeddingChunkService = profileEmbeddingChunkService;
        this.semanticRetrievalService = semanticRetrievalService;
        this.resumeContextBuilderService = resumeContextBuilderService;
        this.promptTemplateService = promptTemplateService;
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
        resume.setGenerationMethod(ResumeGenerationMethod.NORMAL);

        resumeMapper.insert(resume);
        return resume;
    }

    public ResumeResponseDTO fetchResumesByJobId(Long jobId) {
        return fetchResumesByJobId(jobId, null);
    }

    public ResumeResponseDTO fetchResumesByJobId(Long jobId, ResumeGenerationMethod generationMethod) {
        Job job = jobMapper.findById(jobId);
        if (job == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        Resume resume = generationMethod == null
                ? resumeMapper.findByJobId(jobId)
                : resumeMapper.findByJobIdAndGenerationMethod(jobId, generationMethod);
        if (resume == null) {
            return null;
        }

        return toResponseDTO(resume);
    }

    private ResumeResponseDTO toResponseDTO(Resume resume) {
        ResumeResponseDTO dto = new ResumeResponseDTO();

        dto.setId(resume.getId());
        dto.setJobId(resume.getJobId());
        dto.setMatchScore(resume.getMatchScore());
        dto.setNeedGenerate(resume.getNeedGenerate());
        dto.setGenerationMethod(resume.getGenerationMethod());
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
        resume.setGenerationMethod(ResumeGenerationMethod.NORMAL);

        String json;
        try {
            JsonNode node = objectMapper.readTree(aiResponse);
            json = objectMapper.writeValueAsString(node);
            resume.setGeneratedContent(json);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("AI returned invalid resume JSON");
        }

        Resume existingResume = resumeMapper.findByJobIdAndGenerationMethod(
                jobId,
                ResumeGenerationMethod.NORMAL
        );

        if (existingResume == null) {
            resumeMapper.insert(resume);
        } else {
            resume.setId(existingResume.getId());
            resumeMapper.updateById(resume);
        }

        return "Resume Generated";
    }

    public String generateResumeWithRag(Long jobId) {
        Job job = jobMapper.findById(jobId);
        if (job == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        ensureGenerationAllowed(jobId, ResumeGenerationMethod.RAG);

        Long userId = job.getUserId();
        if (userId == null) {
            throw new BadRequestException("Job user id is missing.");
        }

        if (!hasText(job.getJobDescription())) {
            throw new BadRequestException("Job description cannot be blank for RAG resume generation.");
        }

        log.info("RAG resume generation started for jobId={}, userId={}", jobId, userId);
        profileEmbeddingChunkService.syncAllProfileChunks(userId);
        chunkEmbeddingService.embedPendingChunksByUserId(userId);

        ResumeRetrievalResultDTO retrievalResult =
                semanticRetrievalService.retrieveResumeRelevantChunks(
                        userId,
                        job.getJobDescription(),
                        SKILL_TOP_K,
                        EXP_AND_PROJECT_TOP_K
                );

        int skillChunkCount = retrievalResult.getSkills() == null ? 0 : retrievalResult.getSkills().size();
        int evidenceChunkCount = retrievalResult.getExperienceAndProjects() == null
                ? 0
                : retrievalResult.getExperienceAndProjects().size();

        log.info("RAG retrieval completed for jobId={}, skillChunks={}, experienceProjectChunks={}",
                jobId, skillChunkCount, evidenceChunkCount);

        if (skillChunkCount == 0 && evidenceChunkCount == 0) {
            throw new BadRequestException("No relevant resume chunks found for this job.");
        }

        String resumeContext = resumeContextBuilderService.buildResumeContext(userId, retrievalResult, false);
        // log.info("RAG resume context for jobId={}:\n{}", jobId, resumeContext);

        String prompt = buildRagPrompt(job, resumeContext);
        String aiResponse = callLlmWithRetry(prompt);

        Resume resume = new Resume();
        resume.setJobId(jobId);
        resume.setMatchScore(null);
        resume.setNeedGenerate(false);
        resume.setGenerationMethod(ResumeGenerationMethod.RAG);

        String json;
        try {
            JsonNode node = objectMapper.readTree(aiResponse);
            json = objectMapper.writeValueAsString(node);
            resume.setGeneratedContent(json);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("AI returned invalid resume JSON");
        }

        Resume existingResume = resumeMapper.findByJobIdAndGenerationMethod(
                jobId,
                ResumeGenerationMethod.RAG
        );

        if (existingResume == null) {
            resumeMapper.insert(resume);
        } else {
            resume.setId(existingResume.getId());
            resumeMapper.updateById(resume);
        }

        return "RAG Resume Generated";
    }

    public void ensureGenerationAllowed(Long jobId) {
        ensureGenerationAllowed(jobId, ResumeGenerationMethod.NORMAL);
    }

    public void ensureGenerationAllowed(Long jobId, ResumeGenerationMethod generationMethod) {
        Job job = jobMapper.findById(jobId);
        if (job == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        Resume existingResume = resumeMapper.findByJobIdAndGenerationMethod(jobId, generationMethod);
        if (existingResume != null && !Boolean.TRUE.equals(existingResume.getNeedGenerate())) {
            throw new BadRequestException("Resume is already up to date.");
        }
    }

    public void markExistingResumeDirtyForGeneration(Long jobId) {
        markExistingResumeDirtyForGeneration(jobId, ResumeGenerationMethod.NORMAL);
    }

    public void markExistingResumeDirtyForGeneration(Long jobId, ResumeGenerationMethod generationMethod) {
        resumeMapper.markResumeDirtyByJobIdAndGenerationMethod(jobId, generationMethod);
    }

    private String callLlmWithRetry(String prompt) {
        int maxAttempts = 3;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.info("LLM attempt {} started", attempt);

                // call OpenAi api to generate a response
                String aiResponse = openAiResumeService.generate(prompt);

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
        if (context == null) {
            throw new IllegalArgumentException("Resume generation context is null");
        }

        Long userId = context.getJob() == null ? null : context.getJob().getUserId();
        String template = promptTemplateService.getEffectivePromptContent(userId, PromptTemplateType.NORMAL);

        return template
                .replace("{{roleFocus}}", buildRoleFocus(context.getJob()))
                .replace("{{targetJob}}", buildTargetJob(context.getJob()))
                .replace("{{candidateProfile}}", buildCandidateProfile(context.getProfile()))
                .replace("{{experiences}}", buildExperiences(context.getExperiences()))
                .replace("{{educations}}", buildEducations(context.getEducations()))
                .replace("{{projects}}", buildProjects(context.getProjects()))
                .replace("{{skills}}", buildSkills(context.getSkills()));
    }

    public String buildRagPrompt(Job job, String resumeContext) {
        if (job == null) {
            throw new IllegalArgumentException("Job cannot be null.");
        }

        if (!hasText(resumeContext)) {
            throw new IllegalArgumentException("Resume context cannot be blank.");
        }

        String template = promptTemplateService.getEffectivePromptContent(job.getUserId(), PromptTemplateType.RAG);

        return template
                .replace("{{roleFocus}}", buildRoleFocus(job))
                .replace("{{targetJob}}", buildTargetJob(job))
                .replace("{{resumeContext}}", resumeContext);
    }

    private String buildRoleFocus(Job job) {
        if (job == null) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
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

        return sb.toString();
    }

    private String buildTargetJob(Job job) {
        if (job == null) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<TargetJob>\\n");

        appendIfPresent(sb, "Title: ", job.getTitle());
        appendIfPresent(sb, "Company: ", job.getCompany());

        if (hasText(job.getJobDescription())) {
            sb.append("Description:\\n")
                    .append(job.getJobDescription())
                    .append("\\n");
        }

        sb.append("</TargetJob>\\n\\n");
        return sb.toString();
    }

    private String buildCandidateProfile(Profile profile) {
        if (profile == null) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<CandidateProfile>\\n");

        appendIfPresent(sb, "Full Name: ", profile.getFullName());
        appendIfPresent(sb, "Location: ", profile.getLocation());
        appendIfPresent(sb, "Email: ", profile.getContactEmail());
        appendIfPresent(sb, "Phone: ", profile.getPhone());
        appendIfPresent(sb, "LinkedIn: ", profile.getLinkedinUrl());
        appendIfPresent(sb, "GitHub: ", profile.getGithubUrl());

        sb.append("</CandidateProfile>\\n\\n");
        return sb.toString();
    }

    private String buildExperiences(List<Experience> experiences) {
        if (experiences == null || experiences.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
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
        return sb.toString();
    }

    private String buildEducations(List<Education> educations) {
        if (educations == null || educations.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
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
        return sb.toString();
    }

    private String buildProjects(List<Project> projects) {
        if (projects == null || projects.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
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
        return sb.toString();
    }

    private String buildSkills(List<Skill> skills) {
        if (skills == null || skills.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
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


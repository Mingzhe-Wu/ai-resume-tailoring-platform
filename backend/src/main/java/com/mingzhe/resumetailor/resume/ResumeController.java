package com.mingzhe.resumetailor.resume;

import com.mingzhe.resumetailor.generationhistory.GenerationMethod;
import com.mingzhe.resumetailor.generationhistory.GenerationStatusResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for managing Resume records.
 */
@RestController
@RequestMapping("/api/resume")
@CrossOrigin(origins = "http://localhost:5173")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/create")
    public ResponseEntity<Resume> createResume(@RequestBody @Valid CreateResumeDTO request) {
        Resume createdResume = resumeService.createResume(request);
        return ResponseEntity.status(201).body(createdResume);
    }

    @GetMapping("/fetch/{jobId}")
    public ResponseEntity<ResumeResponseDTO> getResumesByJobId(
            @PathVariable Long jobId,
            @RequestParam(required = false) ResumeGenerationMethod generationMethod
    ) {
        return ResponseEntity.ok(resumeService.fetchResumesByJobId(jobId, generationMethod));
    }

    @GetMapping("/generation-status/{jobId}")
    public ResponseEntity<GenerationStatusResponseDTO> getGenerationStatus(
            @PathVariable Long jobId,
            @RequestParam(required = false) ResumeGenerationMethod generationMethod
    ) {
        return ResponseEntity.ok(resumeService.fetchGenerationStatus(jobId, generationMethod));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Resume> updateResume(@PathVariable Long id,
                                               @RequestBody @Valid UpdateResumeDTO request) {
        return ResponseEntity.ok(resumeService.updateResume(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteResume(@PathVariable Long id) {
        resumeService.deleteResume(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate/{jobId}")
    public ResponseEntity<String> generateResume(@PathVariable Long jobId) {
        return ResponseEntity.ok(resumeService.generateResume(jobId));
    }

    @PostMapping("/generate-rag/{jobId}")
    public ResponseEntity<String> generateResumeWithRag(@PathVariable Long jobId) {
        return ResponseEntity.ok(resumeService.generateResumeWithRag(jobId));
    }

    @PostMapping("/generate-async/{jobId}")
    public ResponseEntity<String> generateResumeAsync(@PathVariable Long jobId) {
        resumeService.ensureGenerationAllowed(jobId, ResumeGenerationMethod.NORMAL);
        Long userId = resumeService.checkAndIncreaseGenerationQuota(jobId);
        Long generationHistoryId =
                resumeService.recordAsyncGenerationRunning(userId, jobId, GenerationMethod.NORMAL);
        resumeService.generateResumeAsync(jobId, false, generationHistoryId);
        return ResponseEntity.ok("Resume generation started asynchronously");
    }

    @PostMapping("/generate-rag-async/{jobId}")
    public ResponseEntity<String> generateResumeWithRagAsync(@PathVariable Long jobId) {
        resumeService.ensureGenerationAllowed(jobId, ResumeGenerationMethod.RAG);
        Long userId = resumeService.checkAndIncreaseGenerationQuota(jobId);
        Long generationHistoryId =
                resumeService.recordAsyncGenerationRunning(userId, jobId, GenerationMethod.RAG);
        resumeService.generateResumeWithRagAsync(jobId, false, generationHistoryId);
        return ResponseEntity.ok("RAG resume generation started asynchronously");
    }

}

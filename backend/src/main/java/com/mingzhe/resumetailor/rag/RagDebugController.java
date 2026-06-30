package com.mingzhe.resumetailor.rag;

import com.mingzhe.resumetailor.job.Job;
import com.mingzhe.resumetailor.job.JobMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class RagDebugController {

    private final SemanticRetrievalService semanticRetrievalService;
    private final JobMapper jobMapper;

    public RagDebugController(
            SemanticRetrievalService semanticRetrievalService,
            JobMapper jobMapper
    ) {
        this.semanticRetrievalService = semanticRetrievalService;
        this.jobMapper = jobMapper;
    }

    @GetMapping("/api/debug/retrieval")
    public List<RetrievedChunkDTO> retrieve(
            @RequestParam Long userId,
            @RequestParam Long jobId,
            @RequestParam(defaultValue = "10") Integer topK
    ) {
        Job job = jobMapper.findById(jobId);

        if (job == null) {
            throw new IllegalArgumentException("Job not found.");
        }

        List<RetrievedChunkDTO> chunks = semanticRetrievalService.retrieveTopKChunks(
                userId,
                job.getJobDescription(),
                topK
        );

        for (RetrievedChunkDTO chunk : chunks) {
            System.out.println(
                    "distance=" + chunk.getDistance()
                            + ", sourceType=" + chunk.getSourceType()
                            + ", sourceId=" + chunk.getSourceId()
                            + ", text=" + chunk.getContentText()
            );
        }

        System.out.println("chunks=" + chunks);
        return chunks;
    }

    @GetMapping("/api/debug/retrieval/resume")
    public ResumeRetrievalResultDTO retrieveForResume(
            @RequestParam Long userId,
            @RequestParam Long jobId,
            @RequestParam(defaultValue = "5") Integer skillTopK,
            @RequestParam(defaultValue = "10") Integer evidenceTopK
    ) {
        Job job = jobMapper.findById(jobId);

        if (job == null) {
            throw new IllegalArgumentException("Job not found.");
        }

        ResumeRetrievalResultDTO result =
                semanticRetrievalService.retrieveResumeRelevantChunks(
                        userId,
                        job.getJobDescription(),
                        skillTopK,
                        evidenceTopK
                );

        System.out.println("===== EXPERIENCE + PROJECT TOP " + evidenceTopK + " =====");
        for (int i = 0; i < result.getExperienceAndProjects().size(); i++) {
            RetrievedChunkDTO chunk = result.getExperienceAndProjects().get(i);
            System.out.println(
                    "[" + (i + 1) + "] distance=" + chunk.getDistance()
                            + ", sourceType=" + chunk.getSourceType()
                            + ", sourceId=" + chunk.getSourceId()
                            + "\ntext=" + chunk.getContentText()
                            + "\n"
            );
        }

        System.out.println("===== SKILL TOP " + skillTopK + " =====");
        for (int i = 0; i < result.getSkills().size(); i++) {
            RetrievedChunkDTO chunk = result.getSkills().get(i);
            System.out.println(
                    "[" + (i + 1) + "] distance=" + chunk.getDistance()
                            + ", sourceType=" + chunk.getSourceType()
                            + ", sourceId=" + chunk.getSourceId()
                            + "\ntext=" + chunk.getContentText()
                            + "\n"
            );
        }

        return result;
    }
}
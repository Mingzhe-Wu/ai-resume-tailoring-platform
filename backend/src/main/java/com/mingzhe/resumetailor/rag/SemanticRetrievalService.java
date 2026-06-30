package com.mingzhe.resumetailor.rag;

import com.mingzhe.resumetailor.openai.ChunkEmbeddingService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SemanticRetrievalService {

    private static final int DEFAULT_TOP_K = 10;
    private static final int MAX_TOP_K = 30;

    private final ChunkEmbeddingService chunkEmbeddingService;
    private final ProfileEmbeddingChunkMapper profileEmbeddingChunkMapper;

    public SemanticRetrievalService(
            ChunkEmbeddingService chunkEmbeddingService,
            ProfileEmbeddingChunkMapper profileEmbeddingChunkMapper
    ) {
        this.chunkEmbeddingService = chunkEmbeddingService;
        this.profileEmbeddingChunkMapper = profileEmbeddingChunkMapper;
    }



    public List<RetrievedChunkDTO> retrieveTopKChunks(
            Long userId,
            String jobDescription,
            Integer topK
    ) {
        validateRetrievalInput(userId, jobDescription);

        int resolvedTopK = resolveTopK(topK);

        float[] queryEmbedding = chunkEmbeddingService.createEmbedding(jobDescription);

        return profileEmbeddingChunkMapper.findTopKReadyChunksByEmbedding(
                userId,
                queryEmbedding,
                resolvedTopK
        );
    }

    public ResumeRetrievalResultDTO retrieveResumeRelevantChunks(
            Long userId,
            String jobDescription,
            Integer skillTopK,
            Integer experienceAndProjectTopK
    ) {
        validateRetrievalInput(userId, jobDescription);

        int resolvedSkillTopK = resolveTopK(skillTopK);
        int resolvedEvidenceTopK = resolveTopK(experienceAndProjectTopK);

        float[] queryEmbedding = chunkEmbeddingService.createEmbedding(jobDescription);

        List<RetrievedChunkDTO> skills =
                profileEmbeddingChunkMapper.findTopKReadySkillChunksByEmbedding(
                        userId,
                        queryEmbedding,
                        resolvedSkillTopK
                );

        List<RetrievedChunkDTO> experienceAndProjects =
                profileEmbeddingChunkMapper.findTopKReadyExperienceAndProjectChunksByEmbedding(
                        userId,
                        queryEmbedding,
                        resolvedEvidenceTopK
                );

        return new ResumeRetrievalResultDTO(
                skills,
                experienceAndProjects
        );
    }

    private void validateRetrievalInput(Long userId, String jobDescription) {
        if (userId == null) {
            throw new IllegalArgumentException("User id cannot be null.");
        }

        if (jobDescription == null || jobDescription.isBlank()) {
            throw new IllegalArgumentException("Job description cannot be blank.");
        }
    }

    private int resolveTopK(Integer topK) {
        if (topK == null || topK <= 0) {
            return DEFAULT_TOP_K;
        }

        return Math.min(topK, MAX_TOP_K);
    }
}
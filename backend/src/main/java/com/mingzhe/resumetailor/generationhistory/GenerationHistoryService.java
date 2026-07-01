package com.mingzhe.resumetailor.generationhistory;

import com.mingzhe.resumetailor.exceptions.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class GenerationHistoryService {

    private static final Logger log = LoggerFactory.getLogger(GenerationHistoryService.class);

    private final GenerationHistoryMapper generationHistoryMapper;
    private final GenerationCostService generationCostService;

    public GenerationHistoryService(
            GenerationHistoryMapper generationHistoryMapper,
            GenerationCostService generationCostService
    ) {
        this.generationHistoryMapper = generationHistoryMapper;
        this.generationCostService = generationCostService;
    }

    public void recordSuccess(
            Long userId,
            Long jobId,
            Long resumeVersionId,
            GenerationMethod generationMethod,
            Long promptTemplateId,
            String modelName,
            Integer inputTokenCount,
            Integer outputTokenCount
    ) {
        record(
                userId,
                jobId,
                resumeVersionId,
                generationMethod,
                promptTemplateId,
                modelName,
                GenerationStatus.SUCCESS,
                null,
                inputTokenCount,
                outputTokenCount
        );
    }

    public void recordFailure(
            Long userId,
            Long jobId,
            GenerationMethod generationMethod,
            Long promptTemplateId,
            String modelName,
            String errorMessage
    ) {
        record(
                userId,
                jobId,
                null,
                generationMethod,
                promptTemplateId,
                modelName,
                GenerationStatus.FAILED,
                errorMessage,
                null,
                null
        );
    }

    public Long recordRunning(
            Long userId,
            Long jobId,
            GenerationMethod generationMethod,
            String modelName
    ) {
        GenerationHistory generationHistory = new GenerationHistory();
        generationHistory.setUserId(userId);
        generationHistory.setJobId(jobId);
        generationHistory.setGenerationMethod(generationMethod);
        generationHistory.setModelName(modelName);
        generationHistory.setStatus(GenerationStatus.RUNNING);
        generationHistory.setStartedAt(LocalDateTime.now());

        generationHistoryMapper.insert(generationHistory);
        return generationHistory.getId();
    }

    public void markSuccess(
            Long generationHistoryId,
            Long resumeVersionId,
            Long promptTemplateId,
            Integer inputTokenCount,
            Integer outputTokenCount
    ) {
        if (generationHistoryId == null) {
            return;
        }

        GenerationHistory generationHistory = new GenerationHistory();
        generationHistory.setId(generationHistoryId);
        generationHistory.setResumeVersionId(resumeVersionId);
        generationHistory.setPromptTemplateId(promptTemplateId);
        generationHistory.setStatus(GenerationStatus.SUCCESS);
        generationHistory.setErrorMessage(null);
        generationHistory.setInputTokenCount(inputTokenCount);
        generationHistory.setOutputTokenCount(outputTokenCount);
        generationHistory.setEstimatedCostUsd(
                generationCostService.estimateCostUsd(inputTokenCount, outputTokenCount)
        );

        generationHistoryMapper.updateCompletion(generationHistory);
    }

    public void markFailure(
            Long generationHistoryId,
            Long promptTemplateId,
            String errorMessage
    ) {
        if (generationHistoryId == null) {
            return;
        }

        GenerationHistory generationHistory = new GenerationHistory();
        generationHistory.setId(generationHistoryId);
        generationHistory.setPromptTemplateId(promptTemplateId);
        generationHistory.setStatus(GenerationStatus.FAILED);
        generationHistory.setErrorMessage(safeErrorMessage(errorMessage));

        generationHistoryMapper.updateCompletion(generationHistory);
    }

    public GenerationStatusResponseDTO findLatestStatus(Long jobId, GenerationMethod generationMethod) {
        GenerationHistory generationHistory =
                generationHistoryMapper.findLatestByJobIdAndMethod(jobId, generationMethod);
        if (generationHistory == null) {
            throw new ResourceNotFoundException("Generation status not found");
        }

        GenerationStatusResponseDTO response = new GenerationStatusResponseDTO();
        response.setStatus(generationHistory.getStatus());
        response.setErrorMessage(generationHistory.getErrorMessage());
        response.setStartedAt(generationHistory.getStartedAt());
        response.setCompletedAt(generationHistory.getCompletedAt());
        return response;
    }

    private void record(
            Long userId,
            Long jobId,
            Long resumeVersionId,
            GenerationMethod generationMethod,
            Long promptTemplateId,
            String modelName,
            GenerationStatus status,
            String errorMessage,
            Integer inputTokenCount,
            Integer outputTokenCount
    ) {
        if (userId == null || generationMethod == null || status == null) {
            log.warn("Skipping generation history record due to missing required fields: userId={}, method={}, status={}",
                    userId, generationMethod, status);
            return;
        }

        try {
            GenerationHistory generationHistory = new GenerationHistory();
            generationHistory.setUserId(userId);
            generationHistory.setJobId(jobId);
            generationHistory.setResumeVersionId(resumeVersionId);
            generationHistory.setGenerationMethod(generationMethod);
            generationHistory.setPromptTemplateId(promptTemplateId);
            generationHistory.setModelName(modelName);
            generationHistory.setStatus(status);
            generationHistory.setErrorMessage(errorMessage);
            generationHistory.setInputTokenCount(inputTokenCount);
            generationHistory.setOutputTokenCount(outputTokenCount);
            generationHistory.setEstimatedCostUsd(
                    generationCostService.estimateCostUsd(inputTokenCount, outputTokenCount)
            );
            if (status == GenerationStatus.SUCCESS || status == GenerationStatus.FAILED) {
                generationHistory.setCompletedAt(LocalDateTime.now());
            }

            generationHistoryMapper.insert(generationHistory);
        } catch (Exception ex) {
            log.warn("Failed to record generation history", ex);
        }
    }

    private String safeErrorMessage(String errorMessage) {
        if (errorMessage == null || errorMessage.isBlank()) {
            return "Resume generation failed. Please try again.";
        }

        String trimmed = errorMessage.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }
}

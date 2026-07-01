package com.mingzhe.resumetailor.prompttemplate;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import org.springframework.stereotype.Service;

@Service
public class PromptTemplateService {

    private final PromptTemplateMapper promptTemplateMapper;

    public PromptTemplateService(PromptTemplateMapper promptTemplateMapper) {
        this.promptTemplateMapper = promptTemplateMapper;
    }

    public String findActiveTemplate(PromptTemplateType type) {
        PromptTemplate promptTemplate = promptTemplateMapper.findActiveByType(type.name());
        if (promptTemplate == null || promptTemplate.getContent() == null || promptTemplate.getContent().isBlank()) {
            throw new IllegalStateException("No active default prompt template found for type: " + type);
        }
        return promptTemplate.getContent();
    }

    public PromptTemplate getEffectivePrompt(Long userId, PromptTemplateType type) {
        validateUserId(userId);
        validateType(type);

        PromptTemplate promptTemplate = promptTemplateMapper.findEffectivePromptByType(userId, type.name());
        if (promptTemplate == null) {
            throw new IllegalStateException("No prompt template found for type: " + type);
        }

        return promptTemplate;
    }

    public String getEffectivePromptContent(Long userId, PromptTemplateType type) {
        PromptTemplate promptTemplate = getEffectivePrompt(userId, type);
        if (promptTemplate.getContent() == null || promptTemplate.getContent().isBlank()) {
            throw new IllegalStateException("Prompt template content is blank for type: " + type);
        }
        return promptTemplate.getContent();
    }

    public PromptTemplate saveUserPrompt(Long userId, PromptTemplateType type, String content) {
        validateUserId(userId);
        validateType(type);
        validateContent(type, content);

        PromptTemplate promptTemplate = new PromptTemplate();
        promptTemplate.setUserId(userId);
        promptTemplate.setType(type.name());
        promptTemplate.setName(type.name() + " Resume Prompt");
        promptTemplate.setVersion(1);
        promptTemplate.setContent(content);
        promptTemplate.setActive(true);

        int updatedRows = promptTemplateMapper.updateUserPrompt(promptTemplate);
        if (updatedRows == 0) {
            promptTemplateMapper.insertUserPrompt(promptTemplate);
        }

        return promptTemplateMapper.findUserPromptByType(userId, type.name());
    }

    public void resetUserPrompt(Long userId, PromptTemplateType type) {
        validateUserId(userId);
        validateType(type);

        promptTemplateMapper.deleteUserPrompt(userId, type.name());
    }

    private void validateUserId(Long userId) {
        if (userId == null) {
            throw new BadRequestException("User id is required.");
        }
    }

    private void validateType(PromptTemplateType type) {
        if (type == null) {
            throw new BadRequestException("Prompt template type is required.");
        }
    }

    private void validateContent(PromptTemplateType type, String content) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Prompt content is required.");
        }

        if (type == PromptTemplateType.NORMAL) {
            requirePlaceholder(content, "{{roleFocus}}");
            requirePlaceholder(content, "{{targetJob}}");
            requirePlaceholder(content, "{{candidateProfile}}");
            requirePlaceholder(content, "{{experiences}}");
            requirePlaceholder(content, "{{educations}}");
            requirePlaceholder(content, "{{projects}}");
            requirePlaceholder(content, "{{skills}}");
        }

        if (type == PromptTemplateType.RAG) {
            requirePlaceholder(content, "{{roleFocus}}");
            requirePlaceholder(content, "{{targetJob}}");
            requirePlaceholder(content, "{{resumeContext}}");
        }
    }

    private void requirePlaceholder(String content, String placeholder) {
        if (!content.contains(placeholder)) {
            throw new BadRequestException("Prompt content must include " + placeholder + ".");
        }
    }

}

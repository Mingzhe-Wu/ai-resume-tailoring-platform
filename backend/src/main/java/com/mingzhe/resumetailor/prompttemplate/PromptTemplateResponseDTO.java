package com.mingzhe.resumetailor.prompttemplate;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PromptTemplateResponseDTO {
    private Long id;
    private Long userId;
    private String name;
    private String type;
    private Integer version;
    private String content;
    private Boolean active;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PromptTemplateResponseDTO from(PromptTemplate promptTemplate) {
        PromptTemplateResponseDTO response = new PromptTemplateResponseDTO();
        response.setId(promptTemplate.getId());
        response.setUserId(promptTemplate.getUserId());
        response.setName(promptTemplate.getName());
        response.setType(promptTemplate.getType());
        response.setVersion(promptTemplate.getVersion());
        response.setContent(promptTemplate.getContent());
        response.setActive(promptTemplate.getActive());
        response.setIsDefault(promptTemplate.getUserId() == null);
        response.setCreatedAt(promptTemplate.getCreatedAt());
        response.setUpdatedAt(promptTemplate.getUpdatedAt());
        return response;
    }
}

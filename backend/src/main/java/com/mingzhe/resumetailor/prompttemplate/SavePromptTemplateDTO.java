package com.mingzhe.resumetailor.prompttemplate;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SavePromptTemplateDTO {
    @NotBlank(message = "Prompt content is required")
    private String content;
}

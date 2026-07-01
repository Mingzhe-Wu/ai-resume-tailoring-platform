package com.mingzhe.resumetailor.prompttemplate;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PromptTemplate {
    private Long id;
    private String name;
    private String type;
    private Integer version;
    private String content;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long userId;
}

package com.mingzhe.resumetailor.resume;

import lombok.Data;

/**
 * Request body used when updating Resume records.
 */
@Data
public class UpdateResumeDTO {

    private Integer matchScore;

    private String generatedContent;

    private String pdfFilePath;

}

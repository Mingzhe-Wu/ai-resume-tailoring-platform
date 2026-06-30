package com.mingzhe.resumetailor.rag;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ResumeRetrievalResultDTO {

    private List<RetrievedChunkDTO> skills;
    private List<RetrievedChunkDTO> experienceAndProjects;

}

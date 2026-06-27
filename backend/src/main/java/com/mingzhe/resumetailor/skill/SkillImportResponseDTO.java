package com.mingzhe.resumetailor.skill;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response returned after importing Skill records from CSV.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillImportResponseDTO {

    private int successCount;

    private int failedCount;

}

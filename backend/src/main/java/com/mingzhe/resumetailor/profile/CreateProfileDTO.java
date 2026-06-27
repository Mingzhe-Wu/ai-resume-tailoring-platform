package com.mingzhe.resumetailor.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

// DTO for profile creation
// userID, fullName, and contactEmail required

/**
 * Request body used when creating Profile records.
 */
@Data
public class CreateProfileDTO {

    @NotNull(message = "userId is required for profile")
    private Long userId;

    @NotBlank(message = "fullName is required for profile")
    private String fullName;

    private String phone;

    @NotBlank(message = "contactEmail is required for profile")
    private String contactEmail;

    private String linkedinUrl;

    private String githubUrl;

    private String location;

    private String summary;

    private String priorResume;

}

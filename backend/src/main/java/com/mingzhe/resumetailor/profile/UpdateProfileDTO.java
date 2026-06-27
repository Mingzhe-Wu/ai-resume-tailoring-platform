package com.mingzhe.resumetailor.profile;

import lombok.Data;

// DTO for profile update
// fullName, and contactEmail required

/**
 * Request body used when updating Profile records.
 */
@Data
public class UpdateProfileDTO {

    private String fullName;

    private String phone;

    private String contactEmail;

    private String linkedinUrl;

    private String githubUrl;

    private String location;

    private String summary;

    private String priorResume;

}

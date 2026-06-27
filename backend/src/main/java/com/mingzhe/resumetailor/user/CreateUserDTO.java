package com.mingzhe.resumetailor.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body used when creating User records.
 */
@Data
public class CreateUserDTO {

    @NotBlank(message = "email is required")
    private String email;

    @NotBlank(message = "password is required")
    private String password;

}

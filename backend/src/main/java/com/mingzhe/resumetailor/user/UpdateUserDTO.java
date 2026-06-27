package com.mingzhe.resumetailor.user;

import lombok.Data;

/**
 * Request body used when updating User records.
 */
@Data
public class UpdateUserDTO {

    private String email;

    private String password;

}

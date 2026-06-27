package com.mingzhe.resumetailor.exceptions;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

/**
 * Represents the JSON body returned for API errors.
 */
@Data
@AllArgsConstructor
public class ErrorResponse {
    private String message;
    private Map<String, String> errors;
}

package com.mingzhe.resumetailor.exceptions;

/**
 * Signals that a request failed validation or contains invalid data.
 */
public class BadRequestException extends RuntimeException{
    public BadRequestException(String message) {
        super(message);
    }
}

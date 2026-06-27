package com.mingzhe.resumetailor.exceptions;

/**
 * Signals that a requested resource could not be found.
 */
public class ResourceNotFoundException extends RuntimeException{
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

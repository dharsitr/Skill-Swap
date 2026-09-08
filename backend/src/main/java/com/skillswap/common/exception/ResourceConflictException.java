package com.skillswap.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceConflictException extends ApiException {

    public ResourceConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}

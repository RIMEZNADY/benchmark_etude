package com.benchmarking.rest.exception;

import java.time.OffsetDateTime;

public class ApiError {

    private final OffsetDateTime timestamp = OffsetDateTime.now();
    private final int status;
    private final String message;
    private final String path;

    public ApiError(int status, String message, String path) {
        this.status = status;
        this.message = message;
        this.path = path;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }
}


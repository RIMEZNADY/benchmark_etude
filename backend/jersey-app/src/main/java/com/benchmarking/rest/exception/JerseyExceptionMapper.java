package com.benchmarking.rest.exception;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class JerseyExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        if (exception instanceof ResourceNotFoundException notFoundException) {
            return buildResponse(Response.Status.NOT_FOUND, notFoundException.getMessage());
        }
        if (exception instanceof ResourceConflictException conflictException) {
            return buildResponse(Response.Status.CONFLICT, conflictException.getMessage());
        }
        return buildResponse(Response.Status.INTERNAL_SERVER_ERROR, "Erreur interne du serveur");
    }

    private Response buildResponse(Response.Status status, String message) {
        ApiError error = new ApiError(status.getStatusCode(), status.getReasonPhrase(), message);
        return Response.status(status)
                .entity(error)
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}


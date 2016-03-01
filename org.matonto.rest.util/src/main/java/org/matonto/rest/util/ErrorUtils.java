package org.matonto.rest.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

public class ErrorUtils {
    private static final Logger logger = LoggerFactory.getLogger(ErrorUtils.class);

    /**
     * Logs the HTTP error and throws a WebApplicationException with the error status,
     * message, and original exception.
     *
     * @param thw the original exception thrown
     * @param msg the message to be displayed about the error
     * @param status the HTTP status code for the error
     * @return a WebApplicationException with the HTTP error status and message
     */
    public static WebApplicationException sendError(Throwable thw, String msg, Response.Status status)
            throws WebApplicationException {
        logger.error(String.format("%d: %s", status.getStatusCode(), msg), thw);
        return new WebApplicationException(msg, thw, status);
    }

    /**
     * Logs the HTTP error and throws a WebApplicationException with the error status
     * and message.
     *
     * @param msg the message to be displayed about the error
     * @param status the HTTP status code for the error
     * @return a WebApplicationException with the HTTP error status and message
     */
    public static WebApplicationException sendError(String msg, Response.Status status) throws WebApplicationException {
        logger.error(String.format("%d: %s", status.getStatusCode(), msg));
        return new WebApplicationException(msg, status);
    }
}

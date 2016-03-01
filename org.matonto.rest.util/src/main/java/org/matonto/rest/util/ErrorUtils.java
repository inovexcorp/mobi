package org.matonto.rest.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.core.Response;

public class ErrorUtils {
    private static final Logger logger = LoggerFactory.getLogger(ErrorUtils.class);

    /**
     * Logs the HTTP error and returns a WebApplicationException with the error status,
     * message, and original exception.
     *
     * @param thw the original exception thrown
     * @param msg the message to be displayed about the error
     * @param status the HTTP status code for the error
     * @return a MatOntoWebException with the HTTP error status and message
     */
    public static MatOntoWebException sendError(Throwable thw, String msg, Response.Status status)
            throws MatOntoWebException {
        logger.error(String.format("%d: %s", status.getStatusCode(), msg), thw);
        return new MatOntoWebException(msg, thw, status);
    }

    /**
     * Logs the HTTP error and returns a WebApplicationException with the error status
     * and message.
     *
     * @param msg the message to be displayed about the error
     * @param status the HTTP status code for the error
     * @return a MatOntoWebException with the HTTP error status and message
     */
    public static MatOntoWebException sendError(String msg, Response.Status status)
            throws MatOntoWebException {
        logger.error(String.format("%d: %s", status.getStatusCode(), msg));
        return new MatOntoWebException(msg, status);
    }
}

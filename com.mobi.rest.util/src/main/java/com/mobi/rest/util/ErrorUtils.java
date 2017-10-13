package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

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
     * @return a MobiWebException with the HTTP error status and message
     */
    public static MobiWebException sendError(Throwable thw, String msg, Response.Status status)
            throws MobiWebException {
        logger.error(String.format("%d: %s", status.getStatusCode(), msg), thw);
        return new MobiWebException(msg, thw, status);
    }

    public static MobiWebException sendError(Throwable thw, String msg, Response response)
            throws MobiWebException {
        logger.error(String.format("%d: %s", response.getStatus(), msg), thw);
        return new MobiWebException(msg, thw, response);
    }

    /**
     * Logs the HTTP error and returns a WebApplicationException with the error status
     * and message.
     *
     * @param msg the message to be displayed about the error
     * @param status the HTTP status code for the error
     * @return a MobiWebException with the HTTP error status and message
     */
    public static MobiWebException sendError(String msg, Response.Status status)
            throws MobiWebException {
        logger.error(String.format("%d: %s", status.getStatusCode(), msg));
        return new MobiWebException(msg, status);
    }
}

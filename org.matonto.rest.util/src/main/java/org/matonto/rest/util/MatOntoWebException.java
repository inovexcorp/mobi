package org.matonto.rest.util;

/*-
 * #%L
 * org.matonto.rest.util
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

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status.Family;
import javax.ws.rs.core.Response.StatusType;

/**
 * Class for all JAX-RS exceptions that allows for custom response text.
 */
public class MatOntoWebException extends WebApplicationException {

    public static class CustomStatus implements StatusType {
        private final int statusCode;
        private final String reasonPhrase;

        /**
         * Creates a new custom StatusType that allows you to set the response
         * text for the HTTP Error.
         *
         * @param statusCode the HTTP error code
         * @param reasonPhrase the error text for the HTTP error
         */
        public CustomStatus(int statusCode, String reasonPhrase) {
            super();

            this.statusCode = statusCode;
            this.reasonPhrase = reasonPhrase;
        }

        @Override
        public int getStatusCode() {
            return statusCode;
        }

        @Override
        public Family getFamily() {
            return Family.familyOf(statusCode);
        }

        @Override
        public String getReasonPhrase() {
            return reasonPhrase;
        }
    }

    public MatOntoWebException() {
        super();
    }

    public MatOntoWebException(int status) {
        super(status);
    }

    public MatOntoWebException(Response response) {
        super(response);
    }

    public MatOntoWebException(Response.Status status) {
        super(status);
    }

    public MatOntoWebException(String message, Response response) {
        super(message, response);
    }

    public MatOntoWebException(String message) {
        this(message, Response.Status.INTERNAL_SERVER_ERROR.getStatusCode());
    }
    
    public MatOntoWebException(String message, Throwable ex) {
        this(message, ex, Response.Status.INTERNAL_SERVER_ERROR.getStatusCode());
    }

    public MatOntoWebException(String message, Response.Status status) {
        this(message, status.getStatusCode());
    }

    public MatOntoWebException(String message, Throwable ex, Response.Status status) {
        this(message, ex, status.getStatusCode());
    }

    public MatOntoWebException(String message, int status) {
        super(message, Response.status(new CustomStatus(status, message)).build());
    }

    public MatOntoWebException(String message, Throwable ex, int status) {
        super(message, ex, Response.status(new CustomStatus(status, message)).build());
    }

    public MatOntoWebException(final String message, final Throwable cause, final Response response) {
        super(message, cause, response);
    }
}
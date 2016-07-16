package org.matonto.ontology.rest;

/*-
 * #%L
 * org.matonto.ontology.rest
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

import aQute.bnd.annotation.component.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
@Component(immediate = true)
public class ResponseLoggingFilter implements ContainerResponseFilter {

    private final Logger log = LoggerFactory.getLogger(ResponseLoggingFilter.class);

    @Override
    public void filter(ContainerRequestContext containerRequestContext, ContainerResponseContext
            containerResponseContext) throws IOException {
        if (log.isDebugEnabled() && containerRequestContext != null && containerResponseContext != null) {
            long start = (long) containerRequestContext.getProperty(Filters.REQ_START_TIME);
            long responseTime = System.currentTimeMillis() - start;

            String path = containerRequestContext.getUriInfo().getPath();
            String method = containerRequestContext.getMethod();
            int statusCode = containerResponseContext.getStatusInfo().getStatusCode();
            String statusMsg = containerResponseContext.getStatusInfo().getReasonPhrase();

            log.debug(String.format("%s: %s -> %d: %s (%dms)", method, path, statusCode, statusMsg, responseTime));
        }
    }
}
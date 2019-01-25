package com.mobi.rest.util.logging;

/*-
 * #%L
 * com.mobi.rest.util
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import java.io.IOException;
import javax.annotation.Priority;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Context;
import javax.ws.rs.ext.Provider;

@Provider
@Component(immediate = true)
@Priority(10000)
public class RequestLoggingFilter implements ContainerRequestFilter {

    private final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Context
    private ResourceInfo resourceInfo;

    @Override
    public void filter(ContainerRequestContext containerRequestContext) throws IOException {
        Class<?> resourceClass = resourceInfo.getResourceClass();

        if (log.isInfoEnabled() && containerRequestContext != null && resourceClass != null) {
            Logger resourceLog = LoggerFactory.getLogger(resourceClass);

            if (resourceLog.isInfoEnabled()) {
                containerRequestContext.setProperty(Filters.REQ_START_TIME, System.currentTimeMillis());

                String path = containerRequestContext.getUriInfo().getPath();
                String method = containerRequestContext.getMethod();
                resourceLog.debug(String.format("%s: %s", method, path));
            }
        }
    }
}

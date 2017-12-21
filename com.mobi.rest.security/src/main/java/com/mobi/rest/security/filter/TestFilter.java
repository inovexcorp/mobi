package com.mobi.rest.security.filter;

/*-
 * #%L
 * com.mobi.rest.security
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
import java.lang.reflect.Method;
import java.util.Arrays;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Context;
import javax.ws.rs.ext.Provider;

@Provider
@Component(immediate = true)
public class TestFilter implements ContainerRequestFilter {

    private final Logger log = LoggerFactory.getLogger(TestFilter.class);

    @Context
    ResourceInfo resourceInfo;

    @Override
    public void filter(ContainerRequestContext containerRequestContext) throws IOException {
        Class<?> resourceClass = resourceInfo.getResourceClass();
        RolesAllowed classAnnotation = resourceClass.getAnnotation(RolesAllowed.class);
        if (classAnnotation != null) {
            log.error("Found annotation on class: " + Arrays.toString(classAnnotation.value()));
        }

        Method resourceMethod = resourceInfo.getResourceMethod();
        RolesAllowed methodAnnotation = resourceMethod.getAnnotation(RolesAllowed.class);
        if (methodAnnotation != null) {
            log.error("Found annotation on method: " + Arrays.toString(methodAnnotation.value()));
        }
    }
}

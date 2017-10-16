package com.mobi.ontology.rest;

/*-
 * #%L
 * com.mobi.ontology.rest
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

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Response;

@Path("/imported-ontologies")
@Api(value = "/imported-ontologies")
public interface ImportedOntologyRest {
    /**
     * Checks to see if the provided URL is resolvable.
     *
     * @param url the String representing the URL to verify
     * @return OK if the provided URL is resolvable. BAD_REQUEST if the URL is not resolvable. INTERNAL_SERVER_ERROR if
     *         a HttpURLConnection cannot be made.
     */
    @GET
    @Path("{url}")
    @RolesAllowed("user")
    @ApiOperation("Checks to see if the provided URL is resolvable.")
    Response verifyUrl(@PathParam("url") String url);
}

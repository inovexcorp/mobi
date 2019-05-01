package com.mobi.jaas.rest;

/*-
 * #%L
 * com.mobi.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/session")
public interface AuthRest {

    /**
     * Retrieves the current User session as a JSON response. If there is no User session, returns an anonymous User
     * session.
     *
     * @return a JSON response representing the current User session
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    Response getCurrentUser(@Context ContainerRequestContext containerRequestContext);

    /**
     * Attempts to login to Mobi using the provided username and password and create a new session. If successful,
     * returns the new User session as a JSON response.
     *
     * @return a JSON response representing the newly created User session
     */
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    Response login(@Context ContainerRequestContext containerRequestContext,
                   @QueryParam("username") String username,
                   @QueryParam("password") String password);

    /**
     * Logs out of Mobi by removing the current User session. Returns an anonymous User session.
     *
     * @return a JSON response representing anonymous User session
     */
    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    Response logout(@Context ContainerRequestContext containerRequestContext);
}

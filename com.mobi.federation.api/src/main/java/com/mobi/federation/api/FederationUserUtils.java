package com.mobi.federation.api;

/*-
 * #%L
 * federation.api
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

// import com.mobi.jaas.api.ontologies.usermanagement.User;

import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;

public interface FederationUserUtils {
//    /**
//     * Adds a User to the user replicated map for the identified federation.
//     *
//     * @param service The FederationService to add the user to.
//     * @param user The User to add to the map.
//     */
//    void addUser(FederationService service, User user);

    /**
     * Creates the map entry for this node in the replicated user map for the federation.
     *
     * @param service The FederationService to update.
     */
    void createMapEntry(FederationService service);

    /**
     * Validates that the user exists in the identified federation.
     *
     * @param service The FederationService to search.
     * @param username The username to validate.
     * @throws FailedLoginException Thrown if the user does not exist.
     */
    void verifyUser(FederationService service, String username) throws FailedLoginException;

    /**
     * Validates that the user exists on the identified node in the identified federation.
     *
     * @param service The FederationService to search.
     * @param username The username to validate.
     * @param nodeId The node ID.
     * @throws FailedLoginException Thrown if the user does not exist.
     */
    void verifyUser(FederationService service, String username, String nodeId) throws LoginException;
}

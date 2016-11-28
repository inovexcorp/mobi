package org.matonto.platform.config.api.state;

/*-
 * #%L
 * org.matonto.platform.config.api
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

import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

import java.util.Map;
import java.util.Set;

public interface StateManager {
    /**
     * Determines whether a State with the passed ID exists in the repository.
     *
     * @param stateId the ID of the State to look for NOTE: Assumes ID represents an IRI unless String
     *      begins with "_:".
     * @return true if the State object exists; false otherwise
     * @throws MatOntoException if a connection to the repository could not be made
     */
    boolean stateExists(Resource stateId) throws MatOntoException;

    /**
     * Stores the passed Model in the repository as a new State for the User with the passed username.
     * Every subject in the Model will be added to the new State object.
     *
     * @param newState a collection of statements to link to the new State
     * @param username the username of the User to associate with the new State
     * @throws MatOntoException if the User could not be found or a connection to the repository could
     *      not be made
     */
    void storeState(Model newState, String username) throws MatOntoException;

    /**
     * Stores the passed Model in the repository as a new ApplicationState for the User with the passed
     * username and the application with the passed ID. Every subject in the Model will be added to the
     * new ApplicationState object.
     *
     * @param newState a collection of statements to link to the new State
     * @param username the username of the User to associate with the new State
     * @param applicationId the ID of the Application to attach the new State to
     * @throws MatOntoException if the User could not be found, the Application could not be found, or
     *      a connection to the repository could not be made
     */
    void storeState(Model newState, String username, String applicationId) throws MatOntoException;

    /**
     * Removes State with the passed ID from the repository.
     *
     * @param stateId the ID of the State to remove from the repository NOTE: Assumes ID represents an
     *      IRI unless String begins with "_:".
     * @throws MatOntoException if the State could not be found or a connection to the repository could
     *      not be made
     */
    void deleteState(Resource stateId) throws MatOntoException;

    /**
     * Updates the State with the passed ID with the passed new Model of statements.
     *
     * @param stateId the ID of the State to update NOTE: Assumes ID represents an IRI unless String
     *      begins with "_:".
     * @param newState the new Model of statements to associate with the State
     * @throws MatOntoException if the State could not be found or a connection to the repository could
     *      not be made
     */
    void updateState(Resource stateId, Model newState) throws MatOntoException;

    /**
     * Retrieves all State IDs with Models of all associated statements for the User with the passed
     * username and matching the other passed filters. Can filter by associated application ID and by
     * associated subjects.
     *
     * @param username the username of the User to retrieve State for
     * @param applicationId the ID of the Application to filter State by
     * @param subjects a Set of subject IRIs to filter the State by
     * @return a Map of State IDs to Models of all the associated statements for all State for the
     *      specified User and matching the filter criteria
     */
    Map<String, Model> getStates(String username, String applicationId, Set<Resource> subjects);

    /**
     * Retrieves a State Model by the passed State ID.
     *
     * @param stateId the ID of the State to retrieve
     * @return a Model of all the statements associated with the specified State
     * @throws MatOntoException if the State could not be found or a connection to the repository could
     *      not be made
     */
    Model getState(Resource stateId) throws MatOntoException;
}

package com.mobi.platform.config.api.state;

/*-
 * #%L
 * com.mobi.platform.config.api
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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;

import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;

public interface StateManager {
    /**
     * Determines whether a State with the passed ID exists in the repository.
     *
     * @param stateId the ID of the State to look for NOTE: Assumes ID represents an IRI unless String
     *      begins with "_:".
     * @return true if the State object exists; false otherwise
     */
    boolean stateExists(Resource stateId);

    /**
     * Determines whether a State with the passed ID is for the User with the passed username.
     *
     * @param stateId the ID of the State to check NOTE: Assumes ID represents an IRI unless String
     *      begins with "_:".
     * @param username the username of a User in Mobi
     * @return true if the State is for the User; false otherwise
     * @throws IllegalArgumentException Thrown if the State or User could not be found
     */
    boolean stateExistsForUser(Resource stateId, String username);

    /**
     * Stores the passed Model in the repository as a new State for the User with the passed username.
     * Every subject in the Model will be added to the new State object.
     *
     * @param newState a collection of statements to link to the new State
     * @param username the username of the User to associate with the new State
     * @return The IRI of the new State
     * @throws IllegalArgumentException Thrown if the User could not be found
     */
    Resource storeState(Model newState, String username);

    /**
     * Stores the passed Model in the repository as a new ApplicationState for the User with the passed
     * username and the application with the passed ID. Every subject in the Model will be added to the
     * new ApplicationState object.
     *
     * @param newState a collection of statements to link to the new State
     * @param username the username of the User to associate with the new State
     * @param applicationId the ID of the Application to attach the new State to
     * @return The IRI of the new ApplicationState
     * @throws IllegalArgumentException Thrown if the User or Application could not be found
     */
    Resource storeState(Model newState, String username, String applicationId);

    /**
     * Removes State with the passed ID from the repository. Removes all associated statements unless
     * their subjects are related to other States.
     *
     * @param stateId the ID of the State to remove from the repository NOTE: Assumes ID represents an
     *      IRI unless String begins with "_:".
     * @throws IllegalArgumentException Thrown if the State could not be found
     */
    void deleteState(Resource stateId);

    /**
     * Updates the State with the passed ID with the passed new Model of statements.
     *
     * @param stateId the ID of the State to update NOTE: Assumes ID represents an IRI unless String
     *      begins with "_:".
     * @param newState the new Model of statements to associate with the State
     * @throws IllegalArgumentException Thrown if the State could not be found
     */
    void updateState(Resource stateId, Model newState);

    /**
     * Retrieves all State IDs with Models of all associated statements for States that match the passed filters.
     * Can filter by the associated User with the passed username, associated application ID, and associated subjects.
     *
     * @param username the optional username of a User to filter State by
     * @param applicationId the optional ID of the Application to filter State by
     * @param subjects a Set of subject IRIs to filter the State by
     * @return a Map of State IDs to Models of all the associated statements for all State matching the filter criteria
     * @throws IllegalArgumentException Thrown if the User or Application could not be found
     */
    Map<Resource, Model> getStates(@Nullable String username, @Nullable String applicationId,
                                   Set<Resource> subjects);

    /**
     * Retrieves a State Model by the passed State ID.
     *
     * @param stateId the ID of the State to retrieve
     * @return a Model of all the statements associated with the specified State
     * @throws IllegalArgumentException Thrown if the State could not be found
     */
    Model getState(Resource stateId);
}

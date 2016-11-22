package org.matonto.platform.config.api.state;

import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

public interface StateManager {
    /**
     * Determines whether a State with the passed id exists in the repository.
     *
     * @param stateId the id of the State to look for
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
     * username and the application with the passed id. Every subject in the Model will be added to the
     * new ApplicationState object.
     *
     * @param newState a collection of statements to link to the new State
     * @param username the username of the User to associate with the new State
     * @param applicationId the id of the Application to attach the new State to
     * @throws MatOntoException if the User could not be found, the Application could not be found, or
     *      a connection to the repository could not be made
     */
    void storeState(Model newState, String username, String applicationId) throws MatOntoException;

    /**
     * Removes State with the passed id from the repository.
     *
     * @param stateId the id of the State to remove from the repository
     * @throws MatOntoException if the State could not be found or a connection to the repository could
     *      not be made
     */
    void deleteState(Resource stateId) throws MatOntoException;

    /**
     * Updates the State with the passed id with the passed new Model of statements.
     *
     * @param stateId the id of the State to eupdate
     * @param newState the new Model of statements to associate with the State
     * @throws MatOntoException if the State could not be found or a connection to the repository could
     *      not be made
     */
    void updateState(Resource stateId, Model newState) throws MatOntoException;

    /**
     * Retrieves all State Models associated with the User with the passed username.
     *
     * @param username the username of the User to retrieve State for
     * @return a Model of all the statements associated with all State for the specified User
     * @throws MatOntoException if the User could not be found or a connection to the repository could
     *      not be made
     */
    Model getStates(String username) throws MatOntoException;

    /**
     * Retrieves all ApplicationState Models associated with the User with the passed username and the
     * Application with the passed id.
     *
     * @param username the username of the User to retrieve State for
     * @param applicationId the id of the Application to find ApplicationState for
     * @return a Model of all the statements associated with all ApplicationStates for the specified User
     *      for the specified Application
     * @throws MatOntoException if the User could not be found, the Application could not be found, or
     *      a connection to the repository could not be made
     */
    Model getStates(String username, String applicationId) throws MatOntoException;
}

package org.matonto.platform.config.api.application;

import org.matonto.platform.config.api.ontologies.platformconfig.Application;

public interface ApplicationManager {

    /**
     * Tests whether an Application with the passed id exists as a service.
     *
     * @param applicationid The id to search for an Application that matches
     * @return true if an Application exists with the passed id; false otherwise
     */
    boolean applicationExists(String applicationid);

    /**
     * Returns the Application object for the Application service with the passed id.
     *
     * @param applicationid The id of the Application to retrieve
     * @return the Application specified by the passed id
     */
    Application getApplication(String applicationid);
}

package org.matonto.platform.config.api.application;

import org.matonto.platform.config.api.ontologies.platformconfig.Application;

import java.util.Map;

public interface ApplicationWrapper {
    /**
     * Validates a set of configurations for an application to ensure the correct
     * properties have been set.
     *
     * @param props a collection of key-value configurations for an Application
     * @throws IllegalArgumentException if configuration is invalid or missing properties
     */
    void validateConfig(Map<String, Object> props);

    /**
     * Returns the id of the application.
     *
     * @return a string representing the id of the application
     */
    String getId();

    /**
     * Returns the Application object for the application retrieved from the repository.
     *
     * @return an Application object representing the application
     */
    Application getApplication();
}

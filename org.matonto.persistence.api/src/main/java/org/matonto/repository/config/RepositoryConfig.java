package org.matonto.repository.config;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

public interface RepositoryConfig {

    /**
     * Gets the subject Resource that identifies this configuration.
     *
     * @return the subject Resource that identifies this configuration.
     */
    Resource getResource();

    /**
     * Export this configuration to its RDF representation.
     *
     * @return the Model containing the RDF representation of this configuration identified by its subject Resource.
     */
    Model export();

    /**
     * Reads the properties of this configuration from the supplied Model and sets them accordingly.
     *
     * @param model - a Model containing repository configuration data.
     * @param resource - the subject Resource that identifies the configuration in the Model.
     * @throws RepositoryConfigException - if the configuration data could not be read from the supplied Model.
     */
    void parse(Model model, Resource resource) throws RepositoryConfigException;

    /**
     * Validates this configuration. A RepositoryConfigException is thrown when either of the configurations
     * are invalid. The exception should contain an error message that indicates why the configuration is invalid.
     *
     * @throws RepositoryConfigException - if the configuration is invalid.
     */
    void validate() throws RepositoryConfigException;
}

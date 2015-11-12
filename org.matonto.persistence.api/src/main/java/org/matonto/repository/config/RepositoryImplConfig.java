package org.matonto.repository.config;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

public interface RepositoryImplConfig {

    /**
     * Export this RepositoryImplConfig to its RDF representation.
     *
     * @return the Model containing the RDF representation of this configuration identified by its subject Resource.
     */
    Model export();

    /**
     * Gets the subject Resource that identifies this RepositoryImplConfig.
     *
     * @return the subject Resource that identifies this RepositoryImplConfig.
     */
    Resource getResource();

    /**
     * Gets the type of the RepositoryImplConfig.
     *
     * @return the String representing the RepositoryImplConfig type.
     */
    String getType();

    /**
     * Reads the properties of this RepositoryImplConfig from the supplied Model and sets them accordingly.
     *
     * @param model - a Model containing repository configuration data.
     * @param resource - the subject Resource that identifies the RepositoryImplConfig in the Model.
     * @throws RepositoryConfigException - if the configuration data could not be read from the supplied Model.
     */
    void parse(Model model, Resource resource) throws RepositoryConfigException;

    /**
     * Validates this configuration. A RepositoryConfigException is thrown when the configuration is invalid.
     * The exception should contain an error message that indicates why the configuration is invalid.
     *
     * @throws RepositoryConfigException - if the configuration is invalid.
     */
    void validate() throws RepositoryConfigException;
}

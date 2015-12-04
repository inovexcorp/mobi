package org.matonto.repository.config;

import aQute.bnd.annotation.metatype.Meta;

/**
 * Base configuration for Repository Objects.
 */
@Meta.OCD
public interface RepositoryConfig {

    /**
     * The Repository ID
     *
     * @return The String representing the Repository ID
     */
    String id();

    /**
     * The Repository Title
     *
     * @return The String representing the Repository Title
     */
    String title();

    /**
     * The data directory where the repository data is stored. NOTE: This is
     * an optional property as some repositories do not store data in a single
     * directory.
     *
     * @return The String representing the directory where the repository data is
     * stored, if applicable.
     */
    @Meta.AD(required = false)
    String dataDir();
}

package org.matonto.repository.config;

import org.matonto.semantic.service.SemanticServiceConfig;

public interface RepositoryServiceConfig extends SemanticServiceConfig {

    /**
     * Gets the type of the RepositoryServiceConfig.
     *
     * @return the String representing the RepositoryServiceConfig type.
     */
    String getType();
}

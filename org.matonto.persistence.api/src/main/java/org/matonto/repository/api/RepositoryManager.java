package org.matonto.repository.api;

import java.util.Map;
import java.util.Optional;

public interface RepositoryManager {

    /**
     * Gets the repository that is known by the specified ID from this manager.
     *
     * @param id - A repository ID.
     * @return An initialized Repository object, or Optional.empty if no repository was known for the specified ID.
     */
    Optional<Repository> getRepository(String id);

    /**
     * Returns all configured repositories.
     *
     * @return The Map of all initialized repository IDs mapped to their Repository objects.
     */
    Map<String, Repository> getAllRepositories();
}

package org.matonto.repository.api;

public interface DelegatingRepository extends Repository {

    /**
     * Gets the Repository wrapped by this DelegatingRepository.
     *
     * @return the Repository wrapped by this DelegatingRepository.
     */
    Repository getDelegate();

    /**
     * Sets the Repository wrapped by this DelegatingRepository.
     *
     * @param delegate - The Repository to be wrapped by this DelegatingRepository.
     */
    void setDelegate(Repository delegate);

    /**
     * Returns the ID of this Repository Object.
     *
     * @return The String representing the ID of this Repository Object.
     */
    String getRepositoryID();
}

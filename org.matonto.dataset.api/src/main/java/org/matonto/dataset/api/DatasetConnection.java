package org.matonto.dataset.api;

import org.matonto.rdf.api.Resource;
import org.matonto.repository.api.DelegatingRepositoryConnection;
import org.matonto.repository.exception.RepositoryException;

public interface DatasetConnection extends DelegatingRepositoryConnection {

    /**
     * Returns the number of (explicit) statements that are in the specified contexts that exist in this Dataset.
     * Contexts that are not graphs in this Dataset will evaluate to a size of 0.
     *
     * @param contexts - The context(s) from which to count statements. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are supplied the method operates on the entire dataset. Contexts that
     *                 are not graphs in this dataset will evaluate to a size of 0.
     * @return The number of explicit statements from the specified contexts that exist in this dataset.
     */
    @Override
    long size(Resource... contexts) throws RepositoryException;

    /**
     * Returns the Resource representing the Dataset for this DatasetConnection.
     *
     * @return the Resource representing the Dataset for this DatasetConnection.
     */
    Resource getDataset();

    /**
     * Returns the String representing the ID for the Repository for this DatasetConnection.
     *
     * @return the String representing the ID for the Repository for this DatasetConnection.
     */
    String getRepositoryId();
}

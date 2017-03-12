package org.matonto.dataset.api;

import org.matonto.rdf.api.Resource;
import org.matonto.repository.api.DelegatingRepositoryConnection;

public interface DatasetConnection extends DelegatingRepositoryConnection {

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

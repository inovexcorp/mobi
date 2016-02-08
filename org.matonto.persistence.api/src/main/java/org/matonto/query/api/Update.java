package org.matonto.query.api;

import org.matonto.query.exception.UpdateExecutionException;

public interface Update extends Operation {

    /**
     * Execute this update on the repository.
     *
     * @throws UpdateExecutionException
     *         if the update could not be successfully completed.
     */
    void execute()
            throws UpdateExecutionException;

}

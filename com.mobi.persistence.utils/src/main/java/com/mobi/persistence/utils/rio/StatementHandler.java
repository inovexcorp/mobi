package com.mobi.persistence.utils.rio;

import com.mobi.rdf.api.Statement;

public interface StatementHandler {

    /**
     * Handles a statement.
     *
     * @param st The statement.
     */
    Statement handleStatement(Statement st);
}

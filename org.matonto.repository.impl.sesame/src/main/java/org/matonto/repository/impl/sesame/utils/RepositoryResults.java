package org.matonto.repository.impl.sesame.utils;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Statement;
import org.matonto.repository.base.RepositoryResult;

public class RepositoryResults {

    /**
     * Returns the Model containing all the Statements from a RepositoryResult.
     *
     * @param results - The RepositoryResult containing Statements for the Model
     * @param factory - The ModelFactory from which to create an empty Model
     * @return the Model containing all the Statements from a RepositoryResult.
     */
    public static Model asModel(RepositoryResult<Statement> results, ModelFactory factory) {
        Model model = factory.createEmptyModel();
        results.forEach(model::add);
        return model;
    }
}

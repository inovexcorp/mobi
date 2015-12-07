package org.matonto.repository.impl.sesame.utils;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Statement;
import org.matonto.repository.base.RepositoryResult;

import java.util.ArrayList;
import java.util.List;

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

    /**
     * Returns the List containing all the Objects from a RepositoryResult.
     *
     * @param results - The RepositoryResult containing the Objects for the List
     * @param <T> - The type of Objects contained in the RepositoryResult
     * @return the List containing all the Objects from a RepositoryResult.
     */
    public static <T> List<T> asList(RepositoryResult<T> results) {
        List<T> list = new ArrayList<>();
        results.forEach(list::add);
        return list;
    }
}

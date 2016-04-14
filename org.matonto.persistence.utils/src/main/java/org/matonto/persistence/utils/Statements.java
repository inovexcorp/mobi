package org.matonto.persistence.utils;

import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;

import java.util.Optional;

public class Statements {

    /**
     * Retrieves an Object (Resource) from the statement.
     *
     * @param statement The statement to retrieve the resource
     * @return an object resource from the statement or an empty Optional.
     */
    public static Optional<Resource> objectResource(Statement statement) {
        Value object = statement.getObject();
        if (object instanceof Resource) {
            return Optional.of((Resource) object);
        } else {
            return Optional.empty();
        }
    }
}
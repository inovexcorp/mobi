package org.matonto.repository.base;

import org.matonto.rdf.api.Statement;

import java.util.Iterator;

public abstract class RepositoryResult implements Iterable<Statement>, Iterator<Statement> {

    @Override
    public Iterator<Statement> iterator() {
        return this;
    }
}

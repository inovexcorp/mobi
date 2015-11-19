package org.matonto.repository.base;

import org.matonto.rdf.api.Statement;

import java.util.Iterator;

/**
 * A RepositoryResult is a result collection of objects that can be iterated over. It keeps an open connection to
 * the backend for lazy retrieval of individual results.
 *
 * By default, a RepositoryResult is not necessarily a (mathematical) set: it may contain duplicate objects.
 *
 * A RepositoryResult needs to be closed after use to free up any resources (open connections, read locks, etc.)
 * it has on the underlying repository.
 */
public abstract class RepositoryResult implements Iterable<Statement>, Iterator<Statement> {

    @Override
    public Iterator<Statement> iterator() {
        return this;
    }
}

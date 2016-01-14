package org.matonto.query.api;

import java.util.Iterator;

public abstract class QueryResult<T> implements Iterator<T>, Iterable<T> {

    @Override
    public Iterator<T> iterator() {
        return this;
    }

    public abstract void close();

}

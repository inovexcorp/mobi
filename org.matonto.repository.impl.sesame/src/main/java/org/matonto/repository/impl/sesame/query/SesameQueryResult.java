package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.QueryResult;

public class SesameQueryResult extends QueryResult {



    @Override
    public void close() {

    }

    @Override
    public boolean hasNext() {
        return false;
    }

    @Override
    public Object next() {
        return null;
    }
}

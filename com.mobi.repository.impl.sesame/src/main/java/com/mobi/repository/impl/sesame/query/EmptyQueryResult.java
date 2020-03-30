package com.mobi.repository.impl.sesame.query;

import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.BindingSet;
import com.mobi.query.exception.QueryEvaluationException;

import java.util.Collections;
import java.util.List;

public class EmptyQueryResult extends TupleQueryResult {
    @Override
    public List<String> getBindingNames() throws QueryEvaluationException {
        return Collections.emptyList();
    }

    @Override
    public void close() {}

    @Override
    public boolean hasNext() {
        return false;
    }

    @Override
    public BindingSet next() {
        return null;
    }
}

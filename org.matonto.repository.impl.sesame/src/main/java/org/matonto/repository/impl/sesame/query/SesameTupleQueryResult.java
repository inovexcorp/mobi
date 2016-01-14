package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.QueryResult;
import org.matonto.rdf.core.impl.sesame.factory.SesameMatOntoValueFactory;
import org.matonto.repository.exception.QueryEvaluationException;

public class SesameTupleQueryResult<T> extends QueryResult<T> {

    private org.openrdf.query.TupleQueryResult queryResults;
    private SesameMatOntoValueFactory<T> factory;

    public SesameRepositoryResult(org.openrdf.repository.RepositoryResult<U> results, SesameMatOntoValueFactory<T, U> factory) {
        this.queryResults = results;
        this.factory = factory;
    }

    public boolean hasNext() {
        try {
            boolean hasNext = queryResults.hasNext();
            if(!hasNext) {
                close();
            }
            return hasNext;
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    public T next() {
        try{
            return factory.asMatOntoObject(queryResults.next());
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }


    public void close() { queryResults.close(); }

}

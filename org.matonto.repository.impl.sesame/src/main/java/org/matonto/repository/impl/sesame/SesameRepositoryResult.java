package org.matonto.repository.impl.sesame;

import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.impl.sesame.Values;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;

public class SesameRepositoryResult extends RepositoryResult {

    private static final ValueFactory VF = SimpleValueFactory.getInstance();

    private org.openrdf.repository.RepositoryResult<org.openrdf.model.Statement> sesameResults;

    public SesameRepositoryResult(org.openrdf.repository.RepositoryResult<org.openrdf.model.Statement> results) {
        this.sesameResults = results;
    }

    @Override
    public boolean hasNext() {
        try {
            return sesameResults.hasNext();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public Statement next() {
        try {
            org.openrdf.model.Statement sesameStmt = sesameResults.next();
            org.openrdf.model.Resource sesameCtx = sesameStmt.getContext();

            if (sesameCtx == null) {
                return VF.createStatement(
                        Values.matontoResource(sesameStmt.getSubject()),
                        Values.matontoIRI(sesameStmt.getPredicate()),
                        Values.matontoValue(sesameStmt.getObject()));
            } else {
                return VF.createStatement(
                        Values.matontoResource(sesameStmt.getSubject()),
                        Values.matontoIRI(sesameStmt.getPredicate()),
                        Values.matontoValue(sesameStmt.getObject()),
                        Values.matontoResource(sesameCtx));
            }
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }
}

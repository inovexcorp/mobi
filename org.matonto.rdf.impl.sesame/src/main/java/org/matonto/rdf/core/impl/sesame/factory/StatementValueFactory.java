package org.matonto.rdf.core.impl.sesame.factory;

import org.matonto.rdf.api.Statement;
import org.matonto.rdf.core.impl.sesame.SimpleStatement;
import org.matonto.rdf.core.impl.sesame.Values;

public class StatementValueFactory implements SesameMatOntoValueFactory<Statement, org.openrdf.model.Statement> {

    @Override
    public Statement asMatOntoObject(org.openrdf.model.Statement object) {
        return new SimpleStatement(Values.matontoResource(object.getSubject()), Values.matontoIRI(object.getPredicate()),
                Values.matontoValue(object.getObject()), Values.matontoResource(object.getContext()));
    }
}

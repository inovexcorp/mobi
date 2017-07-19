package org.matonto.persistence.utils;

import org.jetbrains.annotations.NotNull;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.openrdf.model.Statement;

import java.util.Iterator;

public class StatementIterable implements Iterable<Statement>, Iterator<Statement> {
    private Iterator<org.matonto.rdf.api.Statement> it;
    private SesameTransformer transformer;

    public StatementIterable(Iterable<org.matonto.rdf.api.Statement> it, SesameTransformer transformer) {
        this.it = it.iterator();
        this.transformer = transformer;
    }

    @NotNull
    @Override
    public Iterator<Statement> iterator() {
        return this;
    }

    @Override
    public boolean hasNext() {
        return it.hasNext();
    }

    @Override
    public Statement next() {
        return transformer.sesameStatement(it.next());
    }
}

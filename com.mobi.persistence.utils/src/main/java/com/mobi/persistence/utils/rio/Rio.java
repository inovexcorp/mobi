package com.mobi.persistence.utils.rio;

import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Namespace;
import com.mobi.rdf.api.Statement;
import org.eclipse.rdf4j.rio.RDFHandler;

public class Rio {

    /**
     * Writes the given statements to the given {@link RDFHandler}.
     * <p>
     * If the collection is a {@link Model}, its namespaces will also be written.
     *
     * @param iterable A collection of statements, such as a {@link Model}, to be written.
     */
    public static void write(Iterable<Statement> iterable, RDFHandler writer, SesameTransformer transformer,
                             StatementHandler... statementHandlers) {
        writer.startRDF();

        if (iterable instanceof Model) {
            for (Namespace nextNamespace : ((Model) iterable).getNamespaces()) {
                writer.handleNamespace(nextNamespace.getPrefix(), nextNamespace.getName());
            }
        }

        for (final Statement st : iterable) {
            for (StatementHandler statementHandler : statementHandlers) {
                statementHandler.handleStatement(st);
            }
            org.eclipse.rdf4j.model.Statement sesameStatement = transformer.sesameStatement(st);
            writer.handleStatement(sesameStatement);
        }
        writer.endRDF();
    }
}

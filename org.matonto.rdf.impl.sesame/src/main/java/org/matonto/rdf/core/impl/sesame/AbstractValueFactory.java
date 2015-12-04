package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.*;
import org.matonto.rdf.core.utils.LiteralUtils;
import org.openrdf.model.vocabulary.XMLSchema;

import java.time.OffsetDateTime;

public abstract class AbstractValueFactory implements ValueFactory {

    protected int nextBNodeID;
    protected String bnodePrefix;

    /**
     * "universal" ID for bnode prefixes to prevent blank node clashes (unique
     * per classloaded instance of this class)
     */
    private static long lastBNodePrefixUID = 0;

    public AbstractValueFactory() {
        initBNodeParams();
    }

    @Override
    public BNode createBNode(String id) {
        return new SimpleBNode(id);
    }

    @Override
    public synchronized BNode createBNode() {
        int id = nextBNodeID++;

        BNode result = createBNode(bnodePrefix + id);

        if (id == Integer.MAX_VALUE) {
            // Start with a new bnode prefix
            initBNodeParams();
        }

        return result;
    }

    @Override
    public IRI createIRI(String iri) {
        return new SimpleIRI(iri);
    }

    @Override
    public IRI createIRI(String namespace, String localName) {
        return new SimpleIRI(namespace + localName);
    }

    @Override
    public Statement createStatement(Resource subject, IRI predicate, Value object) {
        return new SimpleStatement(subject, predicate, object);
    }

    @Override
    public Statement createStatement(Resource subject, IRI predicate, Value object, Resource context) {
        return new SimpleStatement(subject, predicate, object, context);
    }

    @Override
    public Literal createLiteral(String literal) {
        return new SimpleLiteral(literal, createIRI(XMLSchema.STRING.stringValue()));
    }

    @Override
    public Literal createLiteral(String literal, IRI datatype) {
        return new SimpleLiteral(literal, datatype);
    }

    @Override
    public Literal createLiteral(String literal, String language) {
        return new SimpleLiteral(literal, language);
    }

    @Override
    public Literal createLiteral(boolean literal) {
        return BooleanLiteral.valueOf(literal);
    }

    @Override
    public Literal createLiteral(byte literal) {
        return createIntegerLiteral(literal, new SimpleIRI(XMLSchema.BYTE.stringValue()));
    }

    @Override
    public Literal createLiteral(OffsetDateTime literal) {
        return createLiteral(literal.format(LiteralUtils.OFFSET_TIME_FORMATTER),
                new SimpleIRI(XMLSchema.DATETIME.stringValue()));
    }

    @Override
    public Literal createLiteral(double literal) {
        return createFPLiteral(literal, new SimpleIRI(XMLSchema.DOUBLE.stringValue()));
    }

    @Override
    public Literal createLiteral(float literal) {
        return createFPLiteral(literal, new SimpleIRI(XMLSchema.FLOAT.stringValue()));
    }

    @Override
    public Literal createLiteral(int literal) {
        return createIntegerLiteral(literal, new SimpleIRI(XMLSchema.INT.stringValue()));
    }

    @Override
    public Literal createLiteral(long literal) {
        return createIntegerLiteral(literal, new SimpleIRI(XMLSchema.LONG.stringValue()));
    }

    @Override
    public Literal createLiteral(short literal) {
        return createIntegerLiteral(literal, new SimpleIRI(XMLSchema.SHORT.stringValue()));
    }

    protected Literal createIntegerLiteral(Number value, IRI datatype) {
        return new NumericLiteral(value, datatype);
    }

    protected Literal createFPLiteral(Number value, IRI datatype) {
        return new NumericLiteral(value, datatype);
    }

    /**
     * Generates a new bnode prefix and resets <tt>nextBNodeID</tt> to <tt>1</tt>.
     */
    protected void initBNodeParams() {
        // BNode prefix is based on currentTimeMillis(). Combined with a
        // sequential number per session, this gives a unique identifier.
        bnodePrefix = "_:matonto/bnode/" + Long.toString(getNextBNodePrefixUid(), 32) + "x";
        nextBNodeID = 1;
    }

    private static synchronized long getNextBNodePrefixUid() {
        return lastBNodePrefixUID = Math.max(System.currentTimeMillis(), lastBNodePrefixUID + 1);
    }
}

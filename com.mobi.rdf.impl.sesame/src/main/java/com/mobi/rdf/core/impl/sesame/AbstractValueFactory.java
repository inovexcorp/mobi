package com.mobi.rdf.core.impl.sesame;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Namespace;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.XMLSchema;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import javax.annotation.Nonnull;

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
    public BNode createBNode(@Nonnull String id) {
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
    public IRI createIRI(@Nonnull String iri) {
        return new SimpleIRI(iri);
    }

    @Override
    public IRI createIRI(@Nonnull String namespace, @Nonnull String localName) {
        return new SimpleIRI(namespace + localName);
    }

    @Override
    public Statement createStatement(@Nonnull Resource subject, @Nonnull IRI predicate, @Nonnull Value object) {
        return new SimpleStatement(subject, predicate, object);
    }

    @Override
    public Statement createStatement(@Nonnull Resource subject, @Nonnull IRI predicate, @Nonnull Value object, Resource context) {
        return new SimpleStatement(subject, predicate, object, context);
    }

    @Override
    public Literal createLiteral(@Nonnull String literal) {
        return new SimpleLiteral(literal, createIRI(XMLSchema.STRING.stringValue()));
    }

    @Override
    public Literal createLiteral(@Nonnull String literal, @Nonnull IRI datatype) {
        return new SimpleLiteral(literal, datatype);
    }

    @Override
    public Literal createLiteral(@Nonnull String literal, @Nonnull String language) {
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
    public Literal createLiteral(@Nonnull OffsetDateTime literal) {
        return createLiteral(literal.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
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

    @Override
    public Namespace createNamespace(@Nonnull String prefix, @Nonnull String name) {
        return new SimpleNamespace(prefix, name);
    }

    /**
     * Generates a new bnode prefix and resets <tt>nextBNodeID</tt> to <tt>1</tt>.
     */
    protected void initBNodeParams() {
        // BNode prefix is based on currentTimeMillis(). Combined with a
        // sequential number per session, this gives a unique identifier.
        bnodePrefix = "mobi-bnode-" + Long.toString(getNextBNodePrefixUid(), 32) + "x";
        nextBNodeID = 1;
    }

    private static synchronized long getNextBNodePrefixUid() {
        return lastBNodePrefixUID = Math.max(System.currentTimeMillis(), lastBNodePrefixUID + 1);
    }
}

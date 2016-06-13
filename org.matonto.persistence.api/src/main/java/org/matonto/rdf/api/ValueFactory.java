package org.matonto.rdf.api;

/*-
 * #%L
 * org.matonto.persistence.api
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

import javax.annotation.Nonnull;
import java.time.OffsetDateTime;

public interface ValueFactory {

    /**
     * Creates a new bNode.
     *
     * @return An object representing the bNode.
     */
    BNode createBNode();

    /**
     * Creates a new blank node with the given node identifier.
     *
     * @param id - The blank node identifier.
     * @return An object representing the blank node.
     */
    BNode createBNode(@Nonnull String id);

    /**
     * Creates a new IRI from the supplied string-representation.
     *
     * @param iri - A string-representation of a IRI.
     * @return An object representing the IRI.
     * @throws IllegalArgumentException - If the supplied string does not resolve to a legal (absolute) IRI.
     */
    IRI createIRI(@Nonnull String iri);

    /**
     * Creates a new IRI from the supplied namespace and local name. Calling this method is functionally equivalent to
     * calling createIRI(namespace+localName). Note that the values returned by IRI.getNamespace() and
     * IRI.getLocalName() are not necessarily the same as the values that are supplied to this method.
     *
     * @param namespace - The IRI's namespace.
     * @param localName - The IRI's local name.
     * @return An object representing the IRI.
     */
    IRI createIRI(@Nonnull String namespace, @Nonnull String localName);

    /**
     * Creates a new xsd:boolean-typed literal representing the specified value.
     *
     * @param literal - The value for the literal.
     * @return An xsd:boolean-typed literal for the specified value.
     */
    Literal createLiteral(boolean literal);

    /**
     * Creates a new xsd:byte-typed literal representing the specified value.
     *
     * @param literal - The value for the literal.
     * @return An xsd:byte-typed literal for the specified value.
     */
    Literal createLiteral(byte literal);

    /**
     * Creates a new xsd:dateTime-typed literal representing the specified value.
     *
     * @param literal - The value for the literal.
     * @return An xsd:dateTime-typed literal for the specified value.
     */
    Literal createLiteral(@Nonnull OffsetDateTime literal);

    /**
     * Creates a new xsd:double-typed literal representing the specified value.
     *
     * @param literal - The value for the literal.
     * @return An xsd:double-typed literal for the specified value.
     */
    Literal createLiteral(double literal);

    /**
     * Creates a new xsd:float-typed literal representing the specified value.
     *
     * @param literal - The value for the literal.
     * @return An xsd:float-typed literal for the specified value.
     */
    Literal createLiteral(float literal);

    /**
     * Creates a new xsd:int-typed literal representing the specified value.
     *
     * @param literal - The value for the literal.
     * @return An xsd:int-typed literal for the specified value.
     */
    Literal createLiteral(int literal);

    /**
     * Creates a new xsd:long-typed literal representing the specified value.
     *
     * @param literal - The value for the literal.
     * @return An xsd:long-typed literal for the specified value.
     */
    Literal createLiteral(long literal);

    /**
     * Creates a new xsd:short-typed literal representing the specified value.
     *
     * @param literal - The value for the literal.
     * @return An xsd:short-typed literal for the specified value.
     */
    Literal createLiteral(short literal);

    /**
     * Creates a new literal with the supplied label.
     *
     * @param literal - The literal's label.
     * @return An object representing the literal.
     */
    Literal createLiteral(@Nonnull String literal);

    /**
     * Creates a new literal with the supplied label and datatype.
     *
     * @param literal - The literal's label.
     * @param datatype - The literal's datatype, or null if the literal doesn't have a datatype.
     * @return An object representing the literal.
     */
    Literal createLiteral(@Nonnull String literal, @Nonnull IRI datatype);

    /**
     * Creates a new literal with the supplied label and language attribute.
     *
     * @param literal - The literal's label.
     * @param language - The literal's language attribute, or null if the literal doesn't have a language.
     * @return An object representing the literal.
     */
    Literal createLiteral(@Nonnull String literal, @Nonnull String language);

    /**
     * Creates a new statement with the supplied subject, predicate and object.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's predicate.
     * @param object - The statement's object.
     * @return The created statement.
     */
    Statement createStatement(@Nonnull Resource subject, @Nonnull IRI predicate, @Nonnull Value object);

    /**
     * Creates a new statement with the supplied subject, predicate and object and associated context.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's predicate.
     * @param object - The statement's object.
     * @param context - The statement's context.
     * @return The created statement.
     */
    Statement createStatement(@Nonnull Resource subject, @Nonnull IRI predicate, @Nonnull Value object, Resource context);

    /**
     * Creates a new Namespace with the supplied prefix and name.
     *
     * @param prefix The prefix of the namespace
     * @param name The localname of the namespace
     * @return The created Namespace.
     */
    Namespace createNamespace(@Nonnull String prefix, @Nonnull String name);
}

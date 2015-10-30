package org.matonto.rdf.core.api;

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
    BNode createBNode(String id);

    /**
     * Creates a new IRI from the supplied string-representation.
     *
     * @param iri - A string-representation of a IRI.
     * @return An object representing the IRI.
     * @throws IllegalArgumentException - If the supplied string does not resolve to a legal (absolute) IRI.
     */
    IRI createIRI(String iri);

    /**
     * Creates a new IRI from the supplied namespace and local name. Calling this method is functionally equivalent to
     * calling createIRI(namespace+localName). Note that the values returned by IRI.getNamespace() and
     * IRI.getLocalName() are not necessarily the same as the values that are supplied to this method.
     *
     * @param namespace - The IRI's namespace.
     * @param localName - The IRI's local name.
     * @return An object representing the IRI.
     */
    IRI createIRI(String namespace, String localName);

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
    Literal createLiteral(OffsetDateTime literal);

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
    Literal createLiteral(String literal);

    /**
     * Creates a new literal with the supplied label and datatype.
     *
     * @param literal - The literal's label.
     * @param datatype - The literal's datatype, or null if the literal doesn't have a datatype.
     * @return An object representing the literal.
     */
    Literal createLiteral(String literal, IRI datatype);

    /**
     * Creates a new literal with the supplied label and language attribute.
     *
     * @param literal - The literal's label.
     * @param language - The literal's language attribute, or null if the literal doesn't have a language.
     * @return An object representing the literal.
     */
    Literal createLiteral(String literal, String language);

    /**
     * Creates a new statement with the supplied subject, predicate and object.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's predicate.
     * @param object - The statement's object.
     * @return The created statement.
     */
    Statement createStatement(Resource subject, IRI predicate, Value object);

    /**
     * Creates a new statement with the supplied subject, predicate and object and associated context.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's predicate.
     * @param object - The statement's object.
     * @param context - The statement's context.
     * @return The created statement.
     */
    Statement createStatement(Resource subject, IRI predicate, Value object, Resource context);
}

package org.matonto.rdf.api;


/**
 * A Model that enforces a single context across all contained Statements.
 */
public interface NamedGraph extends StatementSet {

    Resource getGraphID();

    /**
     * Adds one statement to the model in the context with the NamedGraph ID.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's predicate.
     * @param object - The statement's object.
     * @return true if this Model did not already contain the specified element
     */
    boolean add(Resource subject, IRI predicate, Value object);

    /**
     * Determines if statements with the specified subject, predicate, object exist in this model. The subject,
     * predicate and object parameters can be null to indicate wildcards.
     *
     * @param subject - The subject of the statements to match, null to match statements with any subject.
     * @param predicate - The predicate of the statements to match, null to match statements with any predicate.
     * @param object - The object of the statements to match, null to match statements with any object.
     * @return true if statements match the specified pattern.
     */
    boolean contains(Resource subject, IRI predicate, Value object);

    /**
     * Returns a view of the statements with the specified subject, predicate, object. The subject, predicate and
     * object parameters can be null to indicate wildcards.
     *
     * The returned model is backed by this Model, so changes to this Model are reflected in the returned model, and
     * vice-versa. If this Model is modified while an iteration over the returned model is in progress (except through
     * the iterator's own remove operation), the results of the iteration are undefined. The model supports element
     * removal, which removes the corresponding statement from this Model, via the Iterator.remove, Set.remove,
     * removeAll, retainAll, and clear operations. The statements passed to the add and addAll operations must match the
     * parameter pattern.
     *
     * Example:
     * model.filter(s1, null, null) matches all statements that have subject s1,
     *
     * @param subject - The subject of the statements to match, null to match statements with any subject.
     * @param predicate - The predicate of the statements to match, null to match statements with any predicate.
     * @param object - The object of the statements to match, null to match statements with any object.
     * @return The statements that match the specified pattern.
     */
    Model filter(Resource subject, IRI predicate, Value object);

    /**
     * Removes statements with the specified subject, predicate, object from this model.
     * The subject, predicate and object parameters can be null to indicate wildcards.
     *
     * Examples:
     * model.remove(s1, null, null) removes any statements in this model have subject s1,
     *
     * @param subject - The subject of the statements to remove, null to remove statements with any subject.
     * @param predicate - The predicate of the statements to remove, null to remove statements with any predicate.
     * @param object - The object of the statements to remove, null to remove statements with any object.
     * @return true if one or more statements have been removed.
     */
    boolean remove(Resource subject, IRI predicate, Value object);

    /**
     * Returns an unmodifiable view of this model. This method provides "read-only" access to this model. Query
     * operations on the returned model "read through" to this model, and attempts to modify the returned model, whether
     * direct or via its iterator, result in an UnsupportedOperationException.
     *
     * @return an unmodifiable view of the specified set.
     */
    NamedGraph unmodifiable();

    Model asModel(ModelFactory factory);
}

package com.mobi.rdf.api;

/*-
 * #%L
 * com.mobi.persistence.api
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

public interface Model extends StatementSet {

    /**
     * Adds one or more statements to the model. This method creates a statement for each specified context and adds
     * those to the model. If no contexts are specified, a single statement with no associated context is added.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's predicate.
     * @param object - The statement's object.
     * @param context - The contexts to add statements to.
     * @return true if this Model did not already contain the specified element
     */
    boolean add(Resource subject, IRI predicate, Value object, Resource... context);

    /**
     * Removes statements with the specified context exist in this model.
     *
     * @param context - The context of the statements to remove.
     * @return true if one or more statements have been removed.
     */
    boolean clear(Resource... context);

    /**
     * Determines if statements with the specified subject, predicate, object and (optionally) context exist in this
     * model. The subject, predicate and object parameters can be null to indicate wildcards. The contexts parameter is
     * a wildcard and accepts zero or more values. If no contexts are specified, statements will match disregarding
     * their context. If one or more contexts are specified, statements with a context matching one of these will
     * match. Note: to match statements without an associated context, specify the value null and explicitly cast it to
     * type Resource.
     *
     * Examples:
     * model.contains(s1, null, null) is true if any statements in this model have subject s1,
     * model.contains(null, null, null, c1) is true if any statements in this model have context c1,
     * model.contains(null, null, null, (Resource)null) is true if any statements in this model have no associated
     * context,
     * model.contains(null, null, null, c1, c2, c3) is true if any statements in this model have context c1, c2 or c3.
     *
     * @param subject - The subject of the statements to match, null to match statements with any subject.
     * @param predicate - The predicate of the statements to match, null to match statements with any predicate.
     * @param object - The object of the statements to match, null to match statements with any object.
     * @param context - The contexts of the statements to match. If no contexts are specified, statements will match
     *                disregarding their context. If one or more contexts are specified, statements with a context
     *                matching one of these will match.
     * @return true if statements match the specified pattern.
     */
    boolean contains(Resource subject, IRI predicate, Value object, Resource... context);

    /**
     * Returns a view of the statements with the specified subject, predicate, object and (optionally) context. The
     * subject, predicate and object parameters can be null to indicate wildcards. The contexts parameter is a wildcard
     * and accepts zero or more values. If no contexts are specified, statements will match disregarding their context.
     * If one or more contexts are specified, statements with a context matching one of these will match. Note: to match
     * statements without an associated context, specify the value null and explicitly cast it to type Resource.
     *
     * The returned model is backed by this Model, so changes to this Model are reflected in the returned model, and
     * vice-versa. If this Model is modified while an iteration over the returned model is in progress (except through
     * the iterator's own remove operation), the results of the iteration are undefined. The model supports element
     * removal, which removes the corresponding statement from this Model, via the Iterator.remove, Set.remove,
     * removeAll, retainAll, and clear operations. The statements passed to the add and addAll operations must match the
     * parameter pattern.
     *
     * Examples:
     * model.filter(s1, null, null) matches all statements that have subject s1,
     * model.filter(null, null, null, c1) matches all statements that have context c1,
     * model.filter(null, null, null, (Resource)null) matches all statements that have no associated context,
     * model.filter(null, null, null, c1, c2, c3) matches all statements that have context c1, c2 or c3.
     *
     * @param subject - The subject of the statements to match, null to match statements with any subject.
     * @param predicate - The predicate of the statements to match, null to match statements with any predicate.
     * @param object - The object of the statements to match, null to match statements with any object.
     * @param context - The contexts of the statements to match. If no contexts are specified, statements will match
     *                disregarding their context. If one or more contexts are specified, statements with a context
     *                matching one of these will match.
     * @return The statements that match the specified pattern.
     */
    Model filter(Resource subject, IRI predicate, Value object, Resource... context);

    /**
     * Removes statements with the specified subject, predicate, object and (optionally) context exist in this model.
     * The subject, predicate and object parameters can be null to indicate wildcards. The contexts parameter is a
     * wildcard and accepts zero or more values. If no contexts are specified, statements will be removed disregarding
     * their context. If one or more contexts are specified, statements with a context matching one of these will be
     * removed. Note: to remove statements without an associated context, specify the value null.
     *
     * Examples:
     * model.remove(s1, null, null) removes any statements in this model have subject s1,
     * model.remove(null, null, null, c1) removes any statements in this model have context c1,
     * model.remove(null, null, null, null) removes any statements in this model have no associated context,
     * model.remove(null, null, null, c1, c2, c3) removes any statements in this model have context c1, c2 or c3.
     *
     * @param subject - The subject of the statements to remove, null to remove statements with any subject.
     * @param predicate - The predicate of the statements to remove, null to remove statements with any predicate.
     * @param object - The object of the statements to remove, null to remove statements with any object.
     * @param context - The contexts of the statements to remove. If no contexts are specified, statements will be
     *                removed disregarding their context. If one or more contexts are specified, statements with a
     *                context matching one of these will be removed.
     * @return true if one or more statements have been removed.
     */
    boolean remove(Resource subject, IRI predicate, Value object, Resource... context);

    /**
     * Returns an unmodifiable view of this model. This method provides "read-only" access to this model. Query
     * operations on the returned model "read through" to this model, and attempts to modify the returned model, whether
     * direct or via its iterator, result in an UnsupportedOperationException.
     *
     * @return an unmodifiable view of the specified set.
     */
    Model unmodifiable();
}

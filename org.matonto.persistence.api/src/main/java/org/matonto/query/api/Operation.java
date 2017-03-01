package org.matonto.query.api;

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


import org.matonto.query.api.processor.OperationProcessor;
import org.matonto.query.exception.QueryInterruptedException;
import org.matonto.query.exception.UpdateInterruptedException;
import org.matonto.rdf.api.Value;

import java.util.List;

/**
 * An operation executed against a Repository. Operation may be configured optional properties such as variable
 * bindings, to include inferred triples, a maximum execution time, or a processing chain.
 */
public interface Operation {

    /**
     * Binds the specified variable to the supplied value. Any value that was
     * previously bound to the specified value will be overwritten.
     *
     * @param name
     *        The name of the variable that should be bound.
     * @param value
     *        The (new) value for the specified variable.
     */
    void setBinding(String name, Value value);

    /**
     * Removes a previously set binding on the supplied variable. Calling this
     * method with an unbound variable name has no effect.
     *
     * @param name
     *        The name of the variable from which the binding is to be removed.
     */
    void removeBinding(String name);

    /**
     * Removes all previously set bindings.
     */
    void clearBindings();

    /**
     * Retrieves the bindings that have been set on this operation.
     *
     * @return A (possibly empty) set of operation variable bindings.
     * @see #setBinding(String, Value)
     */
    BindingSet getBindings();

    /**
     * Determine whether evaluation results of this operation should include
     * inferred statements (if any inferred statements are present in the
     * repository). The default setting is 'true'.
     *
     * @param includeInferred
     *        indicates whether inferred statements should be included in the
     *        result.
     */
    void setIncludeInferred(boolean includeInferred);

    /**
     * Returns whether or not this operation will return inferred statements (if
     * any are present in the repository).
     *
     * @return <tt>true</tt> if inferred statements will be returned,
     *         <tt>false</tt> otherwise.
     */
    boolean getIncludeInferred();

    /**
     * Specifies the maximum time that an operation is allowed to run. The
     * operation will be interrupted when it exceeds the time limit. Any
     * consecutive requests to fetch query results will result in
     * {@link QueryInterruptedException}s or {@link UpdateInterruptedException}s
     * (depending on whether the operation is a query or an update).
     *
     * @param maxExecTime
     *        The maximum query time, measured in seconds. A negative or zero
     *        value indicates an unlimited execution time (which is the default).
     */
    void setMaxExecutionTime(int maxExecTime);

    /**
     * Returns the maximum operation execution time.
     *
     * @return The maximum operation execution time, measured in seconds.
     * @see #setMaxExecutionTime(int)
     */
    int getMaxExecutionTime();

    /**
     * Returns the List of OperationProcessors set on this Operation when it was created. These
     * Processors are run as part of the operation processing chain before evaluation against the
     * Repository.
     *
     * @return The List of OperationProcessors set on this Operation.
     */
    List<OperationProcessor> getProcessors();
}

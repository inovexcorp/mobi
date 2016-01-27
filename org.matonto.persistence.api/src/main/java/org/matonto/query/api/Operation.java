package org.matonto.query.api;


import org.matonto.rdf.api.Value;

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
     * {@link QueryInterruptedException}
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

}

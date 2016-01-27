package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.BindingSet;
import org.matonto.query.api.Operation;
import org.matonto.query.exception.QueryInterruptedException;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.core.utils.Values;

public class SesameOperation implements Operation {

    private org.openrdf.query.Operation sesameOperation;

    public SesameOperation(org.openrdf.query.Operation sesameOperation) {
        this.sesameOperation = sesameOperation;
    }

    public void setBinding(String name, Value value) {
        sesameOperation.setBinding(name, Values.sesameValue(value));
    }

    @Override
    public void removeBinding(String name) {
        sesameOperation.removeBinding(name);
    }

    @Override
    public void clearBindings() {
        sesameOperation.clearBindings();
    }

    @Override
    public BindingSet getBindings() {
        return new SesameBindingSet(sesameOperation.getBindings());
    }

    @Override
    public void setIncludeInferred(boolean includeInferred) {
        sesameOperation.setIncludeInferred(includeInferred);
    }

    @Override
    public boolean getIncludeInferred() {
        return sesameOperation.getIncludeInferred();
    }

    @Override
    public void setMaxExecutionTime(int maxExecTime) {
        try {
            sesameOperation.setMaxExecutionTime(maxExecTime);
        } catch (org.openrdf.query.QueryInterruptedException e) {
            throw new QueryInterruptedException(e);
        }
    }

    @Override
    public int getMaxExecutionTime() {
        return sesameOperation.getMaxExecutionTime();
    }
}

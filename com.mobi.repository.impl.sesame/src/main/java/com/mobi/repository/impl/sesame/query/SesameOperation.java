package com.mobi.repository.impl.sesame.query;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

import com.mobi.query.api.BindingSet;
import com.mobi.query.api.processor.OperationProcessor;
import org.apache.commons.lang.NotImplementedException;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.Operation;
import com.mobi.query.api.processor.OperationProcessor;
import com.mobi.query.exception.QueryInterruptedException;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.core.utils.Values;

import java.util.List;

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
        } catch (org.openrdf.query.UpdateExecutionException | org.openrdf.query.QueryInterruptedException e) {
            throw new QueryInterruptedException(e);
        }
    }

    @Override
    public int getMaxExecutionTime() {
        return sesameOperation.getMaxExecutionTime();
    }

    @Override
    public List<OperationProcessor> getProcessors() {
        throw new NotImplementedException("Not yet implemented.");
    }
}

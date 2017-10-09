package com.mobi.repository.impl.sesame;

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

import com.mobi.rdf.core.impl.sesame.factory.SesameMobiValueFactory;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.exception.RepositoryException;

public class SesameRepositoryResult<T, U> extends RepositoryResult<T> {

    private org.openrdf.repository.RepositoryResult<U> sesameResults;
    private SesameMobiValueFactory<T, U> factory;

    public SesameRepositoryResult(org.openrdf.repository.RepositoryResult<U> results, SesameMobiValueFactory<T, U> factory) {
        this.sesameResults = results;
        this.factory = factory;
    }

    @Override
    public boolean hasNext() {
        try {
            boolean hasNext = sesameResults.hasNext();
            if (!hasNext) {
                close();
            }
            return hasNext;
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public T next() {
        try {
            return factory.asMobiObject(sesameResults.next());
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void close() {
        sesameResults.close();
    }
}

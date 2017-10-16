package com.mobi.repository.base;

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

import java.util.Iterator;

/**
 * A RepositoryResult is a result collection of objects that can be iterated over. It keeps an open connection to
 * the backend for lazy retrieval of individual results.
 *
 * By default, a RepositoryResult is not necessarily a (mathematical) set: it may contain duplicate objects.
 *
 * A RepositoryResult needs to be closed after use to free up any resources (open connections, read locks, etc.)
 * it has on the underlying repository.
 */
public abstract class RepositoryResult<T> implements Iterable<T>, Iterator<T> {

    @Override
    public Iterator<T> iterator() {
        return this;
    }

    public abstract void close();
}

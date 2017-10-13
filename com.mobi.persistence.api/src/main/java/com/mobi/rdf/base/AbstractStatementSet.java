package com.mobi.rdf.base;

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

import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.StatementSet;

import java.util.*;

public abstract class AbstractStatementSet implements StatementSet {

    @Override
    public Object[] toArray() {
        Iterator<Statement> it = iterator();
        List<Object> r = new ArrayList<>(size());
        while (it.hasNext()) {
            r.add(it.next());
        }
        return r.toArray();
    }

    @Override
    public <T> T[] toArray(T[] a) {
        Iterator<Statement> it = iterator();
        List<Object> r = new ArrayList<>(size());
        while (it.hasNext()) {
            r.add(it.next());
        }
        return r.toArray(a);
    }

    @Override
    public boolean containsAll(Collection<?> c) {
        Iterator<?> e = c.iterator();
        while (e.hasNext())
            if (!contains(e.next()))
                return false;
        return true;
    }

    @Override
    public boolean addAll(Collection<? extends Statement> c) {
        Iterator<? extends Statement> e = c.iterator();
        boolean modified = false;
        while (e.hasNext()) {
            if (add(e.next()))
                modified = true;
        }
        return modified;
    }

    @Override
    public boolean retainAll(Collection<?> c) {
        Iterator<Statement> e = iterator();
        boolean modified = false;
        while (e.hasNext()) {
            if (!c.contains(e.next())) {
                e.remove();
                modified = true;
            }
        }
        return modified;
    }

    @Override
    public boolean removeAll(Collection<?> c) {
        boolean modified = false;
        Iterator<?> i = c.iterator();
        while (i.hasNext())
            modified |= remove(i.next());
        return modified;
    }
}

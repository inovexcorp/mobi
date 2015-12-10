package org.matonto.rdf.base;

import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.StatementSet;

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

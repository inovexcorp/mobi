package org.matonto.query.api;


import org.matonto.rdf.api.Value;

import java.util.Iterator;
import java.util.Set;

public interface BindingSet extends Iterable<Binding> {

    Iterator<Binding> iterator();

    Set<String> getBindingNames();

    Binding getBinding(String bindingName);

    boolean hasBinding(String bindingName);

    Value getValue(String bindingName);

    int size();

    boolean equals(Object o);

}

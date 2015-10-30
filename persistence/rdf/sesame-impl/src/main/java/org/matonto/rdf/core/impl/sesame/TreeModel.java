package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.core.api.Model;
import org.matonto.rdf.core.api.Namespace;
import org.matonto.rdf.core.api.Statement;

import java.util.Collection;
import java.util.Set;

public class TreeModel extends SesameModelWrapper {

    public TreeModel() {
        setDelegate(new org.openrdf.model.impl.TreeModel());
    }

    public TreeModel(Model model) {
        this(model.getNamespaces());
        addAll(model);
    }

    public TreeModel(Collection<? extends Statement> c) {
        this();
        addAll(c);
    }

    public TreeModel(Set<Namespace> namespaces) {
        this();
        namespaces.forEach(this::setNamespace);
    }

    public TreeModel(Set<Namespace> namespaces, Collection<? extends Statement> c) {
        this(c);
        namespaces.forEach(this::setNamespace);
    }
}

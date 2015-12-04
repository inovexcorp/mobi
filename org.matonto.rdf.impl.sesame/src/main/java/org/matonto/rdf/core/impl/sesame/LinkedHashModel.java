package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Namespace;
import org.matonto.rdf.api.Statement;

import java.util.Collection;
import java.util.Set;

public class LinkedHashModel extends SesameModelWrapper {

    public LinkedHashModel() {
        this(128);
    }

    public LinkedHashModel(Model model) {
        this(model.getNamespaces());
        addAll(model);
    }

    public LinkedHashModel(Collection<? extends Statement> c) {
        this(c.size());
        addAll(c);
    }

    public LinkedHashModel(int size) {
        super();
        setDelegate(new org.openrdf.model.impl.LinkedHashModel(size));
    }

    public LinkedHashModel(Set<Namespace> namespaces) {
        this();
        namespaces.forEach(this::setNamespace);
    }

    public LinkedHashModel(Set<Namespace> namespaces, Collection<? extends Statement> c) {
        this(c);
        namespaces.forEach(this::setNamespace);
    }
}

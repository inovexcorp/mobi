package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.Namespace;

public class SimpleNamespace extends org.openrdf.model.impl.SimpleNamespace implements Namespace {

    public SimpleNamespace(String prefix, String name) {
        super(prefix, name);
    }
}

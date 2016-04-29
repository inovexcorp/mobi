package org.matonto.catalog.impl;

import org.matonto.catalog.api.Ontology;
import org.matonto.catalog.api.OntologyBuilder;
import org.matonto.rdf.api.Resource;

public class SimpleOntologyBuilder extends AbstractPublishedResourceBuilder<OntologyBuilder, Ontology>
        implements OntologyBuilder {

    public SimpleOntologyBuilder(Resource resource, Resource type, String title) {
        this.resource = resource;
        this.type = type;
        this.title = title;
    }

    @Override
    protected OntologyBuilder getThis() {
        return this;
    }

    @Override
    public Ontology build() {
        setModified();
        return new SimpleOntology(this);
    }
}

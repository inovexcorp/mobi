package org.matonto.catalog.impl;

import org.matonto.catalog.api.Ontology;

public class SimpleOntology extends AbstractPublishedResource implements Ontology {

    SimpleOntology(SimpleOntologyBuilder builder) {
        title = builder.title;
        description = builder.description;
        issued = builder.issued;
        modified = builder.modified;
        identifier = builder.identifier;
        keywords = builder.keywords;
        distributions = builder.distributions;
        resource = builder.resource;
        types = builder.types;
    }
}

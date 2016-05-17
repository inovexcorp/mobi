package org.matonto.catalog.impl;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.catalog.api.CatalogFactory;
import org.matonto.catalog.api.OntologyBuilder;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchParamsBuilder;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;

@Component
public class SimpleCatalogFactory implements CatalogFactory {

    private Resource ontologyType;
    private ValueFactory valueFactory;

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Activate
    protected void start() {
        ontologyType = valueFactory.createIRI("http://matonto.org/ontologies/catalog#Ontology");
    }

    @Override
    public OntologyBuilder createOntologyBuilder(Resource resource, String title) {
        return new SimpleOntologyBuilder(resource, ontologyType, title);
    }

    @Override
    public PaginatedSearchParamsBuilder createSearchParamsBuilder(int limit, int offset, Resource sortBy) {
        return new SimpleSearchParams.Builder(limit, offset, sortBy);
    }
}

package org.matonto.catalog.impl;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Ontology;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.catalog.config.CatalogConfig;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Bindings;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.*;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component(
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = CatalogConfig.class
)
public class SimpleCatalogManager implements CatalogManager {

    private Repository repo;
    private ValueFactory vf;
    private NamedGraphFactory ngf;

    @Reference(service = DelegatingRepository.class, target = "(id=system)")
    protected void setRepo(Repository repo) {
        this.repo = repo;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    protected void setNamedGraphFactory(NamedGraphFactory namedGraphFactory) {
        ngf = namedGraphFactory;
    }

    private static final String GET_RESOURCE_QUERY;
    private static final String RESOURCE_BINDING = "resource";

    static {
        try {
            GET_RESOURCE_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-resource.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    private static final String RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
    private static final String PR_TYPE = "http://matonto.org/ontologies/catalog#PublishedResource";
    private static final String CATALOG_TYPE = "http://www.w3.org/ns/dcat#Catalog";
    private static final String DC = "http://purl.org/dc/terms/";
    private static final String DCAT = "http://www.w3.org/ns/dcat#";

    @Activate
    protected void start(Map<String, Object> props) {
        CatalogConfig config = Configurable.createConfigurable(CatalogConfig.class, props);
        IRI catalogIri = vf.createIRI(config.iri());

        // Create Catalog if it doesn't exist
        if (!resourceExists(catalogIri)) {
            OffsetDateTime now = OffsetDateTime.now();

            NamedGraph namedGraph = ngf.createNamedGraph(catalogIri);
            namedGraph.add(catalogIri, vf.createIRI(RDF_TYPE), vf.createIRI(CATALOG_TYPE));
            namedGraph.add(catalogIri, vf.createIRI(DC + "title"), vf.createLiteral(config.title()));
            namedGraph.add(catalogIri, vf.createIRI(DC + "description"), vf.createLiteral(config.description()));
            namedGraph.add(catalogIri, vf.createIRI(DC + "issued"), vf.createLiteral(now));
            namedGraph.add(catalogIri, vf.createIRI(DC + "modified"), vf.createLiteral(now));

            RepositoryConnection conn = repo.getConnection();
            conn.add(namedGraph);
            conn.close();
        }
    }

    @Override
    public <T extends PublishedResource> Set<T> findResource(String searchTerm) {
        return null;
    }

    @Override
    public Optional<PublishedResource> getResource(Resource resource) {
        RepositoryConnection conn = repo.getConnection();

        TupleQuery query = conn.prepareTupleQuery(GET_RESOURCE_QUERY);
        query.setBinding(RESOURCE_BINDING, resource);

        TupleQueryResult result = query.evaluate();

        // TODO: Handle more than one result (warn?)
        if (result.hasNext()) {
            BindingSet bindingSet = result.next();

            // Get Required Params
            String title = Bindings.requiredLiteral(bindingSet, "title").stringValue();
            Resource type = Bindings.requiredResource(bindingSet, "type");

            SimplePublishedResourceBuilder builder = new SimplePublishedResourceBuilder(resource, type, title);
            builder.issued(Bindings.requiredLiteral(bindingSet, "issued").dateTimeValue());
            builder.modified(Bindings.requiredLiteral(bindingSet, "modified").dateTimeValue());

            bindingSet.getBinding("description").ifPresent(binding ->
                    builder.description(binding.getValue().stringValue()));

            bindingSet.getBinding("identifier").ifPresent(binding ->
                    builder.identifier(binding.getValue().stringValue()));

            bindingSet.getBinding("keyword").ifPresent(binding -> {
                String[] keywords = StringUtils.split(binding.getValue().stringValue(), ",");

                for (String keyword : keywords) {
                    builder.addKeyword(keyword);
                }
            });

            result.close();
            conn.close();
            return Optional.of(builder.build());
        } else {
            result.close();
            conn.close();
            return Optional.empty();
        }
    }

    @Override
    public void removeResource(PublishedResource resource) {
    }

    @Override
    public void createOntology(Ontology ontology) {
        Resource resource = ontology.getResource();

        if (resourceExists(resource)) {
            throw new IllegalArgumentException("Published Resource [" + resource.stringValue() + "] already exists.");
        }

        NamedGraph namedGraph = ngf.createNamedGraph(resource);
        namedGraph.add(resource, vf.createIRI(RDF_TYPE), ontology.getType());
        namedGraph.add(resource, vf.createIRI(DC + "title"), vf.createLiteral(ontology.getTitle()));
        namedGraph.add(resource, vf.createIRI(DC + "description"), vf.createLiteral(ontology.getDescription()));
        namedGraph.add(resource, vf.createIRI(DC + "issued"), vf.createLiteral(ontology.getIssued()));
        namedGraph.add(resource, vf.createIRI(DC + "modified"), vf.createLiteral(ontology.getModified()));

        ontology.getDistributions().forEach(distribution -> {
            namedGraph.add(resource, vf.createIRI(DCAT + "distribution"), distribution.getResource());
        });

        RepositoryConnection conn = repo.getConnection();
        conn.add(namedGraph);
        conn.close();
    }

    private boolean resourceExists(Resource resource) {
        RepositoryConnection conn = repo.getConnection();
        boolean catalogExists = conn.getStatements(null, null, null, resource).hasNext();
        conn.close();
        return catalogExists;
    }
}

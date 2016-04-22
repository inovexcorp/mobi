package org.matonto.catalog.impl;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.Ontology;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.catalog.config.CatalogConfig;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.Models;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.Binding;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.*;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.*;

@Component(
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = CatalogConfig.class,
        name = "org.matonto.catalog.api.CatalogManager"
)
public class SimpleCatalogManager implements CatalogManager {

    private Repository repo;
    private ValueFactory vf;
    private ModelFactory mf;
    private NamedGraphFactory ngf;

    private final Logger log = Logger.getLogger(SimpleCatalogManager.class);

    @Reference(service = DelegatingRepository.class, target = "(id=system)")
    protected void setRepo(Repository repo) {
        this.repo = repo;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    protected void setModelFactory(ModelFactory modelFactory) {
        mf = modelFactory;
    }

    @Reference
    protected void setNamedGraphFactory(NamedGraphFactory namedGraphFactory) {
        ngf = namedGraphFactory;
    }

    private static final String GET_RESOURCE_QUERY;
    private static final String FIND_RESOURCES_QUERY;
    private static final String RESOURCE_BINDING = "resource";
    private static final String LIMIT_BINDING = "limit";
    private static final String OFFSET_BINDING = "offset";

    static {
        try {
            GET_RESOURCE_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-resource.rq"),
                    "UTF-8"
            );
            FIND_RESOURCES_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/find-resources.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    private static final String RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
    private static final String CATALOG_TYPE = "http://www.w3.org/ns/dcat#Catalog";
    private static final String DC = "http://purl.org/dc/terms/";
    private static final String DCAT = "http://www.w3.org/ns/dcat#";

    @Activate
    protected void start(Map<String, Object> props) {
        CatalogConfig config = Configurable.createConfigurable(CatalogConfig.class, props);
        IRI catalogIri = vf.createIRI(config.iri());

        // Create Catalog if it doesn't exist
        if (!resourceExists(catalogIri)) {
            log.debug("Initializing MatOnto Catalog.");
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
    public Set<PublishedResource> findResource(String searchTerm, int limit, int offset) {
        RepositoryConnection conn = repo.getConnection();

        TupleQuery query = conn.prepareTupleQuery(GET_RESOURCE_QUERY);
        query.setBinding(LIMIT_BINDING, vf.createLiteral(limit));
        query.setBinding(OFFSET_BINDING, vf.createLiteral(offset));

        TupleQueryResult result = query.evaluate();

        Set<PublishedResource> resources = new HashSet<>();
        while (result.hasNext()) {
            BindingSet bindingSet = result.next();

            if (!bindingSet.getBindingNames().contains(RESOURCE_BINDING)) {
                // Aggregations return an empty result when no results found
                result.close();
                conn.close();
                return Collections.emptySet();
            }

            Resource resource = vf.createIRI(Bindings.requiredResource(bindingSet, RESOURCE_BINDING).stringValue());

            PublishedResource publishedResource = processResourceBindingSet(bindingSet, resource, conn);

            resources.add(publishedResource);
        }

        result.close();
        conn.close();
        return resources;
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

            if (!bindingSet.getBindingNames().contains("resource")) {
                // Aggregations return an empty result when no results found
                result.close();
                conn.close();
                return Optional.empty();
            }

            PublishedResource publishedResource = processResourceBindingSet(bindingSet, resource, conn);

            result.close();
            conn.close();
            return Optional.of(publishedResource);
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

    private Optional<Literal> getOptionalLiteral(Model model, String propertyName) {
        return Models.objectLiteral(model.filter(null, vf.createIRI(propertyName), null));
    }

    private Literal getLiteral(Model model, String propertyName) {
        return Models.objectLiteral(model.filter(null, vf.createIRI(propertyName), null))
                .orElseThrow(() -> missingRequiredProperty(propertyName));
    }

    private RuntimeException missingRequiredProperty(String propertyName) {
        return new IllegalStateException(String.format("Required property \"%s\" was not present.", propertyName));
    }

    private PublishedResource processResourceBindingSet(BindingSet bindingSet, Resource resource, RepositoryConnection conn) {
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

        bindingSet.getBinding("keywords").ifPresent(binding -> {
            String[] keywords = StringUtils.split(binding.getValue().stringValue(), ",");

            for (String keyword : keywords) {
                builder.addKeyword(keyword);
            }
        });

        bindingSet.getBinding("distributions").ifPresent(binding -> {
            String[] distributions = StringUtils.split(binding.getValue().stringValue(), ",");

            for (String distribution : distributions) {
                Resource distIRI = vf.createIRI(distribution);

                Model distModel = RepositoryResults.asModel(conn.getStatements(distIRI, null, null), mf);
                String distTitle = getLiteral(distModel, DC + "title").stringValue();

                SimpleDistribution.Builder distBuilder = new SimpleDistribution.Builder(distIRI, distTitle);

                distBuilder.issued(getLiteral(distModel, DC + "issued").dateTimeValue());
                distBuilder.modified(getLiteral(distModel, DC + "modified").dateTimeValue());

                getOptionalLiteral(distModel, DC + "description").ifPresent(literal ->
                        distBuilder.description(literal.stringValue()));

                builder.addDistribution(distBuilder.build());
            }
        });

        return builder.build();
    }
}

package org.matonto.catalog.impl;

import aQute.bnd.annotation.component.*;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Ontology;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.catalog.config.CatalogConfig;
import org.matonto.catalog.util.SearchResults;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.Models;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.*;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.*;

@Component(
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = CatalogConfig.class,
        name = "org.matonto.catalog.api.CatalogManager"
)
public class SimpleCatalogManager implements CatalogManager {

    private RepositoryManager repositoryManager;
    private String repositoryId;
    private ValueFactory vf;
    private ModelFactory mf;
    private NamedGraphFactory ngf;

    private Map<Resource, String> sortingOptions = new HashMap<>();

    private final Logger log = Logger.getLogger(SimpleCatalogManager.class);

    @Reference
    protected void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
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
    private static final String COUNT_RESOURCES_QUERY;
    private static final String RESOURCE_BINDING = "resource";
    private static final String RESOURCE_COUNT_BINDING = "resource_count";

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
            COUNT_RESOURCES_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/count-resources.rq"),
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
        repositoryId = config.repositoryId();
        createSortingOptions();

        // Create Catalog if it doesn't exist
        RepositoryConnection conn = getRepositoryConnection();
        if (!resourceExists(catalogIri)) {
            log.debug("Initializing MatOnto Catalog.");
            OffsetDateTime now = OffsetDateTime.now();

            NamedGraph namedGraph = ngf.createNamedGraph(catalogIri);
            namedGraph.add(catalogIri, vf.createIRI(RDF_TYPE), vf.createIRI(CATALOG_TYPE));
            namedGraph.add(catalogIri, vf.createIRI(DC + "title"), vf.createLiteral(config.title()));
            namedGraph.add(catalogIri, vf.createIRI(DC + "description"), vf.createLiteral(config.description()));
            namedGraph.add(catalogIri, vf.createIRI(DC + "issued"), vf.createLiteral(now));
            namedGraph.add(catalogIri, vf.createIRI(DC + "modified"), vf.createLiteral(now));

            conn.add(namedGraph);
        }
        conn.close();
    }

    @Modified
    protected void modified(Map<String, Object> props) {
        start(props);
    }

    @Override
    public PaginatedSearchResults<PublishedResource> findResource(String searchTerm, int limit, int offset) {
        return findResource(searchTerm, limit, offset, vf.createIRI(DC + "modified"), false);
    }

    @Override
    public PaginatedSearchResults<PublishedResource> findResource(String searchTerm, int limit, int offset,
                                                                  Resource sortBy, boolean ascending) {
        RepositoryConnection conn = getRepositoryConnection();

        // Get Total Count
        TupleQuery countQuery = conn.prepareTupleQuery(COUNT_RESOURCES_QUERY);
        TupleQueryResult countResults = countQuery.evaluate();

        int totalCount;
        if (countResults.hasNext()) {
            BindingSet bindingSet = countResults.next();

            if (!bindingSet.getBindingNames().contains(RESOURCE_COUNT_BINDING)) {
                // Aggregations return an empty result when no results found
                countResults.close();
                conn.close();
                return SearchResults.emptyResults();
            }

            totalCount = Bindings.requiredLiteral(bindingSet, RESOURCE_COUNT_BINDING).intValue();
        } else {
            countResults.close();
            conn.close();
            return SearchResults.emptyResults();
        }

        // Get Results
        String sortBinding = sortingOptions.get(sortBy) == null ? "modified" : sortingOptions.get(sortBy);
        String queryString;
        if (ascending) {
            queryString = FIND_RESOURCES_QUERY + String.format("\nORDER BY ?%s\nLIMIT %d\nOFFSET %d", sortBinding,
                    limit, offset);
        } else {
            queryString = FIND_RESOURCES_QUERY + String.format("\nORDER BY DESC(?%s)\nLIMIT %d\nOFFSET %d", sortBinding,
                    limit, offset);
        }

        TupleQuery query = conn.prepareTupleQuery(queryString);
        TupleQueryResult result = query.evaluate();

        Set<PublishedResource> resources = new HashSet<>();
        while (result.hasNext()) {
            BindingSet bindingSet = result.next();

            if (!bindingSet.getBindingNames().contains(RESOURCE_BINDING)) {
                // Aggregations return an empty result when no results found
                result.close();
                conn.close();
                return SearchResults.emptyResults();
            }

            Resource resource = vf.createIRI(Bindings.requiredResource(bindingSet, RESOURCE_BINDING).stringValue());

            PublishedResource publishedResource = processResourceBindingSet(bindingSet, resource, conn);

            resources.add(publishedResource);
        }

        result.close();
        conn.close();

        int pageNumber = (offset / limit) + 1;
        return new SimpleSearchResults<>(resources, totalCount, limit, pageNumber);
    }

    @Override
    public Optional<PublishedResource> getResource(Resource resource) {
        RepositoryConnection conn = getRepositoryConnection();

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

        RepositoryConnection conn = getRepositoryConnection();
        conn.add(namedGraph);
        conn.close();
    }

    private boolean resourceExists(Resource resource) {
        RepositoryConnection conn = getRepositoryConnection();
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

    private RepositoryConnection getRepositoryConnection() {
        Optional<Repository> repository = repositoryManager.getRepository(repositoryId);
        if (repository.isPresent()) {
            return repository.get().getConnection();
        } else {
            String errorMsg = String.format("Repository \"%s\" is unavailable.", repositoryId);
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }
    }

    private void createSortingOptions() {
        sortingOptions.put(vf.createIRI(DC + "modified"), "modified");
        sortingOptions.put(vf.createIRI(DC + "issued"), "issued");
        sortingOptions.put(vf.createIRI(DC + "title"), "title");
    }
}

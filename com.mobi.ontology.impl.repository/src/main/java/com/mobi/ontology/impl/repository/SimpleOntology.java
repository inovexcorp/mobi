package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.AnnotationProperty;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.Datatype;
import com.mobi.ontology.core.api.Hierarchy;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.OClass;
import com.mobi.ontology.core.api.ObjectProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.ontology.utils.cache.repository.OntologyDatasets;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.BatchGraphInserter;
import com.mobi.persistence.utils.BatchInserter;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.rio.RemoveContextHandler;
import com.mobi.persistence.utils.rio.SkolemizeHandler;
import com.mobi.repository.api.OsgiRepository;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.NotImplementedException;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.impl.MutableTupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.rio.ParserConfig;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BasicParserSettings;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.eclipse.rdf4j.rio.turtle.TurtleParserSettings;
import org.eclipse.rdf4j.rio.turtle.TurtleWriterSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import javax.annotation.Nullable;

public class SimpleOntology implements Ontology {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntology.class);

    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();
    private final OsgiRepository repository;
    private final DatasetUtilsService dsUtilsService;
    private final OntologyManager ontologyManager;
    private final CatalogConfigProvider configProvider;
    private final ImportsResolver importsResolver;
    private final BNodeService bNodeService;
    private final BranchManager branchManager;
    private final CommitManager commitManager;
    private final IRI datasetIRI;
    private Set<IRI> importsClosure;
    private Set<IRI> unresolvedImports;
    private Difference difference;

    private static final String GET_SUB_CLASSES_OF;
    private static final String GET_CLASSES_FOR;
    private static final String GET_PROPERTIES_FOR;
    private static final String GET_SUB_DATATYPE_PROPERTIES_OF;
    private static final String GET_SUB_OBJECT_PROPERTIES_OF;
    private static final String GET_CLASSES_WITH_INDIVIDUALS;
    private static final String SELECT_ENTITY_USAGES;
    private static final String CONSTRUCT_ENTITY_USAGES;
    private static final String GET_CONCEPT_RELATIONSHIPS;
    private static final String GET_CONCEPT_SCHEME_RELATIONSHIPS;
    private static final String GET_SEARCH_RESULTS;
    private static final String GET_SUB_ANNOTATION_PROPERTIES_OF;
    private static final String GET_ALL_CLASSES;
    private static final String GET_CLASS_DATA_PROPERTIES;
    private static final String GET_CLASS_OBJECT_PROPERTIES;
    private static final String GET_ALL_ANNOTATIONS;
    private static final String GET_ONTOLOGY_ANNOTATIONS;
    private static final String GET_INDIVIDUALS_OF_TYPE;
    private static final String GET_ALL_NO_DOMAIN_OBJECT_PROPERTIES;
    private static final String GET_ALL_NO_DOMAIN_DATA_PROPERTIES;
    private static final String GET_ALL_INDIVIDUALS;
    private static final String GET_ONTOLOGY_ID;
    private static final String GET_ALL_DEPRECATED_IRIS;
    private static final String GET_MASTER_HEAD;
    private static final String ENTITY_BINDING = "entity";
    private static final String RECORD_BINDING = "record";
    private static final String SEARCH_TEXT = "searchText";

    private static final String CLOSURE_KEY = "closure";
    private static final String UNRESOLVED_KEY = "unresolved";

    static {
        try {
            GET_SUB_CLASSES_OF = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-sub-classes-of.rq")),
                    StandardCharsets.UTF_8
            );
            GET_CLASSES_FOR = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-sub-classes-for.rq")),
                    StandardCharsets.UTF_8
            );
            GET_PROPERTIES_FOR = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-sub-properties-for.rq")),
                    StandardCharsets.UTF_8
            );
            GET_SUB_DATATYPE_PROPERTIES_OF = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class
                            .getResourceAsStream("/get-sub-datatype-properties-of.rq")),
                    StandardCharsets.UTF_8
            );
            GET_SUB_OBJECT_PROPERTIES_OF = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class
                            .getResourceAsStream("/get-sub-object-properties-of.rq")),
                    StandardCharsets.UTF_8
            );
            GET_CLASSES_WITH_INDIVIDUALS = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class
                            .getResourceAsStream("/get-classes-with-individuals.rq")),
                    StandardCharsets.UTF_8
            );
            SELECT_ENTITY_USAGES = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-entity-usages.rq")),
                    StandardCharsets.UTF_8
            );
            CONSTRUCT_ENTITY_USAGES = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/construct-entity-usages.rq")),
                    StandardCharsets.UTF_8
            );
            GET_CONCEPT_RELATIONSHIPS = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-concept-relationships.rq")),
                    StandardCharsets.UTF_8
            );
            GET_CONCEPT_SCHEME_RELATIONSHIPS = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class
                            .getResourceAsStream("/get-concept-scheme-relationships.rq")),
                    StandardCharsets.UTF_8
            );
            GET_SEARCH_RESULTS = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-search-results.rq")),
                    StandardCharsets.UTF_8
            );
            GET_SUB_ANNOTATION_PROPERTIES_OF = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class
                            .getResourceAsStream("/get-sub-annotation-properties-of.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_CLASSES = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-all-classes.rq")),
                    StandardCharsets.UTF_8
            );
            GET_CLASS_DATA_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-class-data-properties.rq")),
                    StandardCharsets.UTF_8
            );
            GET_CLASS_OBJECT_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-class-object-properties.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_ANNOTATIONS = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-all-annotations.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ONTOLOGY_ANNOTATIONS = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-ontology-annotations.rq")),
                    StandardCharsets.UTF_8
            );
            GET_INDIVIDUALS_OF_TYPE = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-individuals-of-type.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_NO_DOMAIN_OBJECT_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class
                            .getResourceAsStream("/get-all-no-domain-object-properties.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_NO_DOMAIN_DATA_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class
                            .getResourceAsStream("/get-all-no-domain-data-properties.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_INDIVIDUALS = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-all-individuals.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_DEPRECATED_IRIS = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-all-deprecated-iris.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ONTOLOGY_ID = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-ontology-id.rq")),
                    StandardCharsets.UTF_8
            );
            GET_MASTER_HEAD = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntology.class.getResourceAsStream("/get-master-head.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    /**
     * Creates a SimpleOntology object from the provided {@link Model} and stores the Ontology and its imports as
     * datasets inside the cacheRepo. Used when the Ontology exists in the Catalog but the Ontology and its imports
     * don't exist in the cache yet.
     *
     * @param recordCommitKey The key used to retrieve the Ontology from the cache
     * @param ontologyFile    The {@link File} of RDF to load into cache
     * @param cacheRepo       The {@link OsgiRepository} to use as a cache
     * @param ontologyManager The {@link OntologyManager} used to retrieve Ontology information
     * @param configProvider  The {@link CatalogConfigProvider} used to retrieve the local catalog IRI
     * @param dsUtilsService  The {@link DatasetUtilsService} used to manage Ontology Datasets
     * @param importsResolver The {@link ImportsResolver} used to resolve imports from local catalog and from the web
     * @param bNodeService    The {@link BNodeService} used to skolemize Models
     * @param branchManager   The {@link BranchManager} used to retrieve Branch details
     * @param commitManager   The {@link CommitManager} used to retrieve Commit details
     */
    public SimpleOntology(String recordCommitKey, File ontologyFile, OsgiRepository cacheRepo,
                          OntologyManager ontologyManager, CatalogConfigProvider configProvider,
                          DatasetUtilsService dsUtilsService, ImportsResolver importsResolver,
                          BNodeService bNodeService, BranchManager branchManager, CommitManager commitManager) {
        long startTime = getStartTime();
        this.datasetIRI = OntologyDatasets.createDatasetIRIFromKey(recordCommitKey);
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.configProvider = configProvider;
        this.dsUtilsService = dsUtilsService;
        this.importsResolver = importsResolver;
        this.bNodeService = bNodeService;
        this.branchManager = branchManager;
        this.commitManager = commitManager;

        Map<String, Set<IRI>> imports = loadOntologyIntoCache(ontologyFile, false);
        this.importsClosure = imports.get(CLOSURE_KEY);
        this.unresolvedImports = imports.get(UNRESOLVED_KEY);
        logTrace("SimpleOntology constructor specific commit in catalog but not in cache", startTime);
    }

    /**
     * Retrieves the SimpleOntology from the cache that has the matching recordCommitKey.
     *
     * @param recordCommitKey The key used to retrieve the Ontology from the cache
     * @param cacheRepo       The {@link OsgiRepository} to use as a cache
     * @param ontologyManager The {@link OntologyManager} used to retrieve Ontology information
     * @param configProvider  The {@link CatalogConfigProvider} used to retrieve the local catalog IRI
     * @param dsUtilsService  The {@link DatasetUtilsService} used to manage Ontology Datasets
     * @param importsResolver The {@link ImportsResolver} used to resolve imports from local catalog and from the web
     * @param bNodeService    The {@link BNodeService} used to skolemize Models
     * @param branchManager   The {@link BranchManager} used to retrieve Branch details
     * @param commitManager   The {@link CommitManager} used to retrieve Commit details
     */
    public SimpleOntology(String recordCommitKey, OsgiRepository cacheRepo, OntologyManager ontologyManager,
                          CatalogConfigProvider configProvider, DatasetUtilsService dsUtilsService,
                          ImportsResolver importsResolver, BNodeService bNodeService, BranchManager branchManager,
                          CommitManager commitManager) {
        long startTime = getStartTime();
        this.datasetIRI = OntologyDatasets.createDatasetIRIFromKey(recordCommitKey);
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.configProvider = configProvider;
        this.dsUtilsService = dsUtilsService;
        this.importsResolver = importsResolver;
        this.bNodeService = bNodeService;
        this.branchManager = branchManager;
        this.commitManager = commitManager;

        importsClosure = new HashSet<>();
        unresolvedImports = new HashSet<>();

        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> imports = QueryResults.asList(conn.getStatements(datasetIRI,
                    vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI));
            imports.forEach(imported -> importsClosure.add((IRI) imported.getObject()));
            List<Statement> unresolved = QueryResults.asList(conn.getStatements(datasetIRI,
                    vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, datasetIRI));
            unresolved.forEach(unresolvedImport -> unresolvedImports.add((IRI) unresolvedImport.getObject()));

            // Check if the datasetIri/SdNg of an import has changed since last open. This indicates that the import
            // was modified (ie, web import is now in the system, master was updated on an import). Auto refresh the
            // loaded ontology.
            boolean refresh = false;
            List<Resource> defaultGraphs = QueryResults.asList(conn.getDefaultNamedGraphs());
            for (IRI importIri : importsClosure) {
                IRI importSdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(getDatasetIRI(importIri));
                if (!defaultGraphs.contains(importSdNg) && !unresolvedImports.contains(importIri)) {
                    refresh = true;
                    break;
                }
            }
            if (refresh) {
                defaultGraphs.forEach(conn::removeGraph);
                Map<String, Set<IRI>> importsMap = loadOntologyIntoCache(null, false);
                this.importsClosure = importsMap.get(CLOSURE_KEY);
                this.unresolvedImports = importsMap.get(UNRESOLVED_KEY);
            }
        }
        logTrace("SimpleOntology constructor from cache with recordCommitKey", startTime);
    }

    /**
     * Creates an SimpleOntology object that represents an imported Ontology.
     *
     * @param datasetIRI      The {@link IRI} of the datasetIRI of the imported Ontology
     * @param cacheRepo       The {@link OsgiRepository} to use as a cache
     * @param ontologyManager The {@link OntologyManager} used to retrieve Ontology information
     * @param configProvider  The {@link CatalogConfigProvider} used to retrieve the local catalog IRI
     * @param dsUtilsService  The {@link DatasetUtilsService} used to manage Ontology Datasets
     * @param importsResolver The {@link ImportsResolver} used to resolve imports from local catalog and from the web
     * @param bNodeService    The {@link BNodeService} used to skolemize Models
     * @param branchManager   The {@link BranchManager} used to retrieve Branch details
     * @param commitManager   The {@link CommitManager} used to retrieve Commit details
     */
    protected SimpleOntology(IRI datasetIRI, OsgiRepository cacheRepo, OntologyManager ontologyManager,
                             CatalogConfigProvider configProvider, DatasetUtilsService dsUtilsService,
                             ImportsResolver importsResolver, BNodeService bNodeService, BranchManager branchManager,
                             CommitManager commitManager) {
        long startTime = getStartTime();
        this.datasetIRI = datasetIRI;
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.configProvider = configProvider;
        this.dsUtilsService = dsUtilsService;
        this.importsResolver = importsResolver;
        this.bNodeService = bNodeService;
        this.branchManager = branchManager;
        this.commitManager = commitManager;

        importsClosure = new HashSet<>();
        unresolvedImports = new HashSet<>();

        try (RepositoryConnection conn = cacheRepo.getConnection()) {
            boolean datasetIriExists = ConnectionUtils.containsContext(conn, datasetIRI);
            boolean datasetSdNgExists = ConnectionUtils.containsContext(conn, 
                    OntologyDatasets.createSystemDefaultNamedGraphIRI(datasetIRI));
            boolean catalogImport = datasetIRI.stringValue().startsWith(OntologyDatasets.DEFAULT_DS_NAMESPACE);

            // Fully loaded ontology dataset and SdNg
            if (datasetIriExists) {
                this.importsClosure = new HashSet<>();
                this.unresolvedImports = new HashSet<>();
                QueryResults.asList(conn.getStatements(datasetIRI,
                        vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI))
                        .stream()
                        .map(Statement::getObject)
                        .map(imported -> (IRI) imported)
                        .forEach(importsClosure::add);
                QueryResults.asList(conn.getStatements(datasetIRI,
                        vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, datasetIRI))
                        .stream()
                        .map(Statement::getObject)
                        .map(imported -> (IRI) imported)
                        .forEach(unresolvedImports::add);
            } else if (datasetSdNgExists && !catalogImport) { // Web import with no dataset graph, but SdNg exists
                Map<String, Set<IRI>> imports = loadOntologyIntoCache(null, true);
                this.importsClosure = imports.get(CLOSURE_KEY);
                this.unresolvedImports = imports.get(UNRESOLVED_KEY);
            } else { // Import was updated with Catalog version while web versioned exists in cache
                // Or catalog import whose SDNG has been added to cache but not the dataset graph
                IRI commitIri = OntologyDatasets.getCommitFromDatasetIRI(datasetIRI);
                File ontologyFile = importsResolver.retrieveOntologyLocalFileFromCommitIRI(commitIri);
                Map<String, Set<IRI>> imports = loadOntologyIntoCache(ontologyFile, false);
                this.importsClosure = imports.get(CLOSURE_KEY);
                this.unresolvedImports = imports.get(UNRESOLVED_KEY);
            }
        }
        logTrace("SimpleOntology constructor from import in cache", startTime);
    }

    /**
     * Creates an SimpleOntology object that represents an Ontology that was resolved from the web.
     *
     * @param datasetIRI      The {@link IRI} of the datasetIRI of the imported Ontology
     * @param ontologyFile    The {@link File} of RDF to load into cache
     * @param cacheRepo       The {@link OsgiRepository} to use as a cache
     * @param ontologyManager The {@link OntologyManager} used to retrieve Ontology information
     * @param configProvider  The {@link CatalogConfigProvider} used to retrieve the local catalog IRI
     * @param dsUtilsService  The {@link DatasetUtilsService} used to manage Ontology Datasets
     * @param importsResolver The {@link ImportsResolver} used to resolve imports from local catalog and from the web
     * @param bNodeService    The {@link BNodeService} used to skolemize Models
     * @param branchManager   The {@link BranchManager} used to retrieve Branch details
     * @param commitManager   The {@link CommitManager} used to retrieve Commit details
     */
    protected SimpleOntology(IRI datasetIRI, File ontologyFile, OsgiRepository cacheRepo,
                             OntologyManager ontologyManager, CatalogConfigProvider configProvider,
                             DatasetUtilsService dsUtilsService, ImportsResolver importsResolver,
                             BNodeService bNodeService, BranchManager branchManager, CommitManager commitManager) {
        long startTime = getStartTime();
        this.datasetIRI = datasetIRI;
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.configProvider = configProvider;
        this.dsUtilsService = dsUtilsService;
        this.importsResolver = importsResolver;
        this.bNodeService = bNodeService;
        this.branchManager = branchManager;
        this.commitManager = commitManager;

        Map<String, Set<IRI>> importsMap = loadOntologyIntoCache(ontologyFile, true);
        this.importsClosure = importsMap.get(CLOSURE_KEY);
        this.unresolvedImports = importsMap.get(UNRESOLVED_KEY);
        logTrace("SimpleOntology constructor from web import", startTime);
    }

    /**
     * Sets the {@link Difference} object to be applied to the ontology when queried.
     *
     * @param difference The Difference comprised of additions and deletions to apply to the Ontology
     */
    public void setDifference(Difference difference) {
        this.difference = difference;
    }

    @Override
    public Model asModel() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long startTime = getStartTime();
            Model model = mf.createEmptyModel();
            conn.getStatements(null, null, null, conn.getSystemDefaultNamedGraph()).stream()
                    .map(statement -> vf.createStatement(statement.getSubject(), statement.getPredicate(),
                            statement.getObject()))
                    .forEach(model::add);
            logTrace("asModel(factory)", startTime);
            undoApplyDifferenceIfPresent(conn);
            return model;
        }
    }

    @Override
    public OutputStream asTurtle() {
        return getOntologyOutputStream(false, true, RDFFormat.TURTLE);
    }

    @Override
    public OutputStream asTurtle(OutputStream outputStream) {
        return getOntologyOutputStream(false, true, RDFFormat.TURTLE, outputStream);
    }

    @Override
    public OutputStream asRdfXml() {
        return getOntologyOutputStream(false, true, RDFFormat.RDFXML);
    }

    @Override
    public OutputStream asRdfXml(OutputStream outputStream) {
        return getOntologyOutputStream(false, true, RDFFormat.RDFXML, outputStream);
    }

    @Override
    public OutputStream asOwlXml() {
        throw new NotImplementedException("OWL/XML format is not yet implemented.");
    }

    @Override
    public OutputStream asOwlXml(OutputStream outputStream) {
        throw new NotImplementedException("OWL/XML format is not yet implemented.");
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize) {
        return getOntologyOutputStream(skolemize, false, RDFFormat.JSONLD);
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize, OutputStream outputStream) {
        return getOntologyOutputStream(skolemize, false, RDFFormat.JSONLD, outputStream);
    }

    /**
     * Generates an {@link OutputStream} of the Ontology in the provided RDFFormat.
     *
     * @param skolemize A boolean indicating if blank nodes should be skolemized.
     * @param prettyPrint A boolean indicating if the result should be pretty printed.
     * @param format The {@link RDFFormat} to write to the OutputStream.
     * @return An {@link OutputStream} of the RDF data.
     */
    private OutputStream getOntologyOutputStream(boolean skolemize, boolean prettyPrint, RDFFormat format) {
        OutputStream outputStream = new ByteArrayOutputStream();
        return getOntologyOutputStream(skolemize, prettyPrint, format, outputStream);
    }

    /**
     * Writes to the provided {@link OutputStream} of the Ontology in the provided RDFFormat.
     *
     * @param skolemize A boolean indicating if blank nodes should be skolemized.
     * @param prettyPrint A boolean indicating if the result should be pretty printed.
     * @param format The {@link RDFFormat} to write to the OutputStream.
     * @param outputStream The {@link OutputStream} to write to.
     * @return The modified {@link OutputStream}.
     */
    private OutputStream getOntologyOutputStream(boolean skolemize, boolean prettyPrint, RDFFormat format,
                                                 OutputStream outputStream) {
        long startTime = getStartTime();
        try (DatasetConnection conn = getDatasetConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null,
                    conn.getSystemDefaultNamedGraph());

            RDFHandler rdfHandler;
            if (prettyPrint) {
                RDFWriter writer = Rio.createWriter(format, outputStream);
                setWriterOptions(writer, format);
                rdfHandler = new BufferedGroupingRDFHandler(writer);
            } else {
                RDFWriter writer = Rio.createWriter(format, outputStream);
                setWriterOptions(writer, format);
                rdfHandler = writer;
            }

            RemoveContextHandler removeContextSH = new RemoveContextHandler(vf);
            if (skolemize) {
                SkolemizeHandler skolemizeSH = new SkolemizeHandler(bNodeService);
                com.mobi.persistence.utils.rio.Rio.write(statements, rdfHandler, skolemizeSH,
                        removeContextSH);
            } else {
                com.mobi.persistence.utils.rio.Rio.write(statements, rdfHandler, removeContextSH);
            }

            undoApplyDifferenceIfPresent(conn);
        } catch (RDFHandlerException e) {
            throw new RDFHandlerException("Error while writing Ontology.", e);
        }
        logTrace("getOntologyOutputStream(" + format.getName() + ", outputStream)", startTime);
        return outputStream;
    }

    private void setWriterOptions(RDFWriter writer, RDFFormat format) {
        if (RDFFormat.TURTLE.equals(format) || RDFFormat.TRIG.equals(format)) {
            writer.getWriterConfig().set(TurtleWriterSettings.ABBREVIATE_NUMBERS, false);
        }
    }

    @Override
    public OntologyId getOntologyId() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            Model iris = runGraphQueryOnOntology(GET_ONTOLOGY_ID, null, "getOntologyId()", false);
            OntologyId id = ontologyManager.createOntologyId(iris);
            undoApplyDifferenceIfPresent(conn);
            logTrace("getOntologyId()", start);
            return id;
        }
    }

    @Override
    public Set<IRI> getUnloadableImportIRIs() {
        try (DatasetConnection conn = getDatasetConnection()) {
            Set<IRI> unloadableImports = conn.getStatements(
                    datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, datasetIRI)
                    .stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(iri -> (IRI) iri)
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            return unloadableImports;
        }
    }

    @Override
    public Set<Ontology> getImportsClosure() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            Resource sdNg = conn.getSystemDefaultNamedGraph();
            Set<Ontology> closure = new HashSet<>();
            conn.getDefaultNamedGraphs().forEach(ng -> {
                if (ng.stringValue().equals(sdNg.stringValue())) {
                    closure.add(this);
                } else {
                    IRI ontIRI = OntologyDatasets.getDatasetIriFromSystemDefaultNamedGraph(ng);
                    IRI ontDatasetIRI = getDatasetIRI(ontIRI);
                    closure.add(new SimpleOntology(ontDatasetIRI, repository, ontologyManager, configProvider,
                            dsUtilsService, importsResolver, bNodeService, branchManager, commitManager));
                }
            });
            undoApplyDifferenceIfPresent(conn);
            logTrace("getImportsClosure()", start);
            return closure;
        }
    }

    @Override
    public Set<IRI> getImportedOntologyIRIs() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            Set<IRI> imports = getImportedOntologyIRIs(conn);
            undoApplyDifferenceIfPresent(conn);
            logTrace("getImportedOntologyIRIs()", start);
            return imports;
        }
    }

    /**
     * Gets the imported ontology IRIs directory on this ontology.
     *
     * @param conn A {@link DatasetConnection} to query the repo.
     * @return A {@link Set} of {@link IRI}s of direct imports.
     */
    protected Set<IRI> getImportedOntologyIRIs(DatasetConnection conn) {
        List<Statement> importStatements = QueryResults.asList(conn.getStatements(null,
                vf.createIRI(OWL.IMPORTS.stringValue()), null, conn.getSystemDefaultNamedGraph()));
        return importStatements.stream()
                .map(Statement::getObject)
                .filter(iri -> iri instanceof IRI)
                .map(iri -> (IRI) iri)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<IRI> getDeprecatedIRIs() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getIRISet(runQueryOnOntology(GET_ALL_DEPRECATED_IRIS, null,
                    "getDeprecatedIRIs()", true, conn));
        }
    }

    @Override
    public Set<Annotation> getOntologyAnnotations() {
        OntologyId ontologyId = getOntologyId();
        IRI ontologyIRI = ontologyId.getOntologyIRI().orElse((IRI) ontologyId.getOntologyIdentifier());
        try (DatasetConnection conn = getDatasetConnection()) {
            return getAnnotationSet(runQueryOnOntology(String.format(GET_ONTOLOGY_ANNOTATIONS,
                    ontologyIRI.stringValue()), null, "getOntologyAnnotations()", false, conn));
        }
    }

    @Override
    public Set<Annotation> getAllAnnotations() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getAnnotationSet(runQueryOnOntology(GET_ALL_ANNOTATIONS, null,
                    "getAllAnnotations()", false, conn));
        }
    }

    @Override
    public Set<AnnotationProperty> getAllAnnotationProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            List<Statement> statements = QueryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ANNOTATIONPROPERTY.stringValue()),
                    conn.getSystemDefaultNamedGraph()));
            Set<AnnotationProperty> annotationProperties = statements.stream()
                    .map(Statement::getSubject)
                    .map(subject -> new SimpleAnnotationProperty((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            logTrace("getAllAnnotationProperties()", start);
            return annotationProperties;
        }
    }

    @Override
    public boolean containsClass(IRI iri) {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            boolean containsOwl = conn.contains(iri, vf.createIRI(RDF.TYPE.stringValue()),
                    vf.createIRI(OWL.CLASS.stringValue()));
            boolean containsRdfs = conn.contains(iri, vf.createIRI(RDF.TYPE.stringValue()),
                    vf.createIRI(RDFS.CLASS.stringValue()));
            undoApplyDifferenceIfPresent(conn);
            logTrace("containsClass(" + iri.stringValue() + ")", start);
            return containsOwl || containsRdfs;
        }
    }

    @Override
    public Set<OClass> getAllClasses() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            Set<OClass> classes = getIRISet(runQueryOnOntology(GET_ALL_CLASSES, null, "getAllClasses()", false, conn))
                    .stream()
                    .map(SimpleClass::new)
                    .collect(Collectors.toSet());
            logTrace("getAllClasses()", start);
            return classes;
        }
    }

    @Override
    public Set<ObjectProperty> getAllClassObjectProperties(IRI iri) {
        try (DatasetConnection conn = getDatasetConnection()) {
            Set<ObjectProperty> properties = getIRISet(runQueryOnOntology(String.format(GET_CLASS_OBJECT_PROPERTIES,
                    iri.stringValue()), null, "getAllClassObjectProperties(" + iri.stringValue() + ")", true, conn))
                    .stream()
                    .map(SimpleObjectProperty::new)
                    .collect(Collectors.toSet());
            properties.addAll(getAllNoDomainObjectProperties());
            return properties;
        }
    }

    @Override
    public Set<ObjectProperty> getAllNoDomainObjectProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getIRISet(runQueryOnOntology(GET_ALL_NO_DOMAIN_OBJECT_PROPERTIES, null,
                    "getAllNoDomainObjectProperties()", true, conn))
                    .stream()
                    .map(SimpleObjectProperty::new)
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Set<DataProperty> getAllClassDataProperties(IRI iri) {
        try (DatasetConnection conn = getDatasetConnection()) {
            Set<DataProperty> properties = getIRISet(runQueryOnOntology(String.format(GET_CLASS_DATA_PROPERTIES,
                    iri.stringValue()), null, "getAllClassDataProperties(" + iri.stringValue() + ")", true, conn))
                    .stream()
                    .map(SimpleDataProperty::new)
                    .collect(Collectors.toSet());
            properties.addAll(getAllNoDomainDataProperties());
            return properties;
        }
    }

    @Override
    public Set<DataProperty> getAllNoDomainDataProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getIRISet(runQueryOnOntology(GET_ALL_NO_DOMAIN_DATA_PROPERTIES, null,
                    "getAllNoDomainDataProperties()", true, conn))
                    .stream()
                    .map(SimpleDataProperty::new)
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Set<Datatype> getAllDatatypes() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            List<Statement> statements = QueryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(com.mobi.ontologies.rdfs.Datatype.TYPE),
                    conn.getSystemDefaultNamedGraph()));
            Set<Datatype> dataTypes = statements.stream()
                    .map(Statement::getSubject)
                    .filter(iri -> iri instanceof IRI)
                    .map(subject -> new SimpleDatatype((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            logTrace("getAllDatatypes()", start);
            return dataTypes;
        }
    }

    @Override
    public Set<ObjectProperty> getAllObjectProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            List<Statement> statements = QueryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue()),
                    conn.getSystemDefaultNamedGraph()));
            Set<ObjectProperty> objectProperties = statements.stream()
                    .map(Statement::getSubject)
                    .map(subject -> new SimpleObjectProperty((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            logTrace("getAllObjectProperties()", start);
            return objectProperties;
        }
    }

    @Override
    public Optional<ObjectProperty> getObjectProperty(IRI iri) {
        long start = getStartTime();
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = QueryResults.asList(conn.getStatements(iri,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue())));
            if (statements.size() > 0) {
                Optional<ObjectProperty> objPropOpt = Optional.of(
                        new SimpleObjectProperty((IRI) statements.get(0).getSubject()));
                undoApplyDifferenceIfPresent(conn);
                logTrace("getObjectProperty(" + iri.stringValue() + ")", start);
                return objPropOpt;
            }
            undoApplyDifferenceIfPresent(conn);
        }
        logTrace("getObjectProperty(" + iri.stringValue() + ")", start);
        return Optional.empty();
    }

    @Override
    public Set<Resource> getObjectPropertyRange(ObjectProperty objectProperty) {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            List<Statement> statements = QueryResults.asList(conn.getStatements(objectProperty.getIRI(),
                    vf.createIRI(RDFS.RANGE.stringValue()), null));
            Set<Resource> resources = statements.stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(value -> (Resource) value)
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            logTrace("getObjectPropertyRange(" + objectProperty.getIRI().stringValue() + ")", start);
            return resources;
        }
    }

    @Override
    public Set<DataProperty> getAllDataProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            List<Statement> statements = QueryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue()),
                    conn.getSystemDefaultNamedGraph()));
            Set<DataProperty> dataProperties = statements.stream()
                    .map(Statement::getSubject)
                    .map(subject -> new SimpleDataProperty((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            logTrace("getAllDataProperties()", start);
            return dataProperties;
        }
    }

    @Override
    public Optional<DataProperty> getDataProperty(IRI iri) {
        long start = getStartTime();
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = QueryResults.asList(conn.getStatements(iri,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue())));
            if (statements.size() > 0) {
                Optional<DataProperty> dataPropOpt = Optional.of(
                        new SimpleDataProperty((IRI) statements.get(0).getSubject()));
                undoApplyDifferenceIfPresent(conn);
                logTrace("getDataProperty(" + iri.stringValue() + ")", start);
                return dataPropOpt;
            }
            undoApplyDifferenceIfPresent(conn);
        }
        logTrace("getDataProperty(" + iri.stringValue() + ")", start);
        return Optional.empty();
    }

    @Override
    public Set<Resource> getDataPropertyRange(DataProperty dataProperty) {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            List<Statement> statements = QueryResults.asList(conn.getStatements(dataProperty.getIRI(),
                    vf.createIRI(RDFS.RANGE.stringValue()), null));
            Set<Resource> resources = statements.stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(value -> (Resource) value)
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            logTrace("getDataPropertyRange(" + dataProperty.getIRI().stringValue() + ")", start);
            return resources;
        }
    }

    @Override
    public Set<Individual> getAllIndividuals() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getIRISet(runQueryOnOntology(GET_ALL_INDIVIDUALS, null,
                    "getAllIndividuals()", true, conn))
                    .stream()
                    .map(SimpleIndividual::new)
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Set<Individual> getIndividualsOfType(IRI classIRI) {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getIRISet(runQueryOnOntology(String.format(GET_INDIVIDUALS_OF_TYPE, classIRI.stringValue()), null,
                    "getIndividualsOfType(" + classIRI.stringValue() + ")", true, conn))
                    .stream()
                    .map(SimpleIndividual::new)
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Set<Individual> getIndividualsOfType(OClass clazz) {
        return getIndividualsOfType(clazz.getIRI());
    }

    @Override
    public Hierarchy getSubClassesOf() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getHierarchy(runQueryOnOntology(GET_SUB_CLASSES_OF, null, "getSubClassesOf(ontology)", true, conn));
        }
    }

    @Override
    public Set<IRI> getSubClassesFor(IRI iri) {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getIRISet(runQueryOnOntology(String.format(GET_CLASSES_FOR, iri.stringValue()), null,
                    "getSubClassesFor(ontology, " + iri.stringValue() + ")", true, conn));
        }
    }

    @Override
    public Set<IRI> getSubPropertiesFor(IRI iri) {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getIRISet(runQueryOnOntology(String.format(GET_PROPERTIES_FOR, iri.stringValue()), null,
                    "getSubPropertiesFor(ontology, " + iri.stringValue() + ")", true, conn));
        }
    }

    @Override
    public Hierarchy getSubDatatypePropertiesOf() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getHierarchy(runQueryOnOntology(GET_SUB_DATATYPE_PROPERTIES_OF, null,
                    "getSubDatatypePropertiesOf(ontology)", true, conn));
        }
    }

    @Override
    public Hierarchy getSubAnnotationPropertiesOf() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getHierarchy(runQueryOnOntology(GET_SUB_ANNOTATION_PROPERTIES_OF, null,
                    "getSubAnnotationPropertiesOf(ontology)", true, conn));
        }
    }

    @Override
    public Hierarchy getSubObjectPropertiesOf() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getHierarchy(runQueryOnOntology(GET_SUB_OBJECT_PROPERTIES_OF, null,
                    "getSubObjectPropertiesOf(ontology)", true, conn));
        }
    }

    @Override
    public Hierarchy getClassesWithIndividuals() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getHierarchy(runQueryOnOntology(GET_CLASSES_WITH_INDIVIDUALS, null,
                    "getClassesWithIndividuals(ontology)", true, conn));
        }
    }

    @Override
    public TupleQueryResult getEntityUsages(Resource entity) {
        try (DatasetConnection conn = getDatasetConnection()) {
            return new MutableTupleQueryResult(runQueryOnOntology(SELECT_ENTITY_USAGES, tupleQuery -> {
                tupleQuery.setBinding(ENTITY_BINDING, entity);
                return tupleQuery;
            }, "getEntityUsages(ontology, entity)", true, conn));
        }
    }

    @Override
    public Model constructEntityUsages(Resource entity) {
        long start = getStartTime();
        try (DatasetConnection conn = getDatasetConnection()) {
            GraphQuery query = conn.prepareGraphQuery(CONSTRUCT_ENTITY_USAGES);
            query.setBinding(ENTITY_BINDING, entity);
            Model model = QueryResults.asModel(query.evaluate(), mf);
            undoApplyDifferenceIfPresent(conn);
            return model;
        } finally {
            logTrace("constructEntityUsages(entity, conn)", start);
        }

    }

    @Override
    public Hierarchy getConceptRelationships() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getHierarchy(runQueryOnOntology(GET_CONCEPT_RELATIONSHIPS, null,
                    "getConceptRelationships(ontology)", true, conn));
        }
    }

    @Override
    public Hierarchy getConceptSchemeRelationships() {
        try (DatasetConnection conn = getDatasetConnection()) {
            return getHierarchy(runQueryOnOntology(GET_CONCEPT_SCHEME_RELATIONSHIPS, null,
                    "getConceptSchemeRelationships(ontology)", true, conn));
        }
    }

    @Override
    public TupleQueryResult getSearchResults(String searchText) {
        try (DatasetConnection conn = getDatasetConnection()) {
            return new MutableTupleQueryResult(runQueryOnOntology(GET_SEARCH_RESULTS, tupleQuery -> {
                tupleQuery.setBinding(SEARCH_TEXT, vf.createLiteral(searchText.toLowerCase()));
                return tupleQuery;
            }, "getSearchResults(ontology, searchText)", true, conn));
        }

    }

    @Override
    public TupleQueryResult getTupleQueryResults(String queryString, boolean includeImports) {
        try (DatasetConnection conn = getDatasetConnection()) {
            return new MutableTupleQueryResult(runQueryOnOntology(queryString, null,
                    "getTupleQueryResults(ontology, queryString)", includeImports, conn));
        }
    }

    @Override
    public Model getGraphQueryResults(String queryString, boolean includeImports) {
        return runGraphQueryOnOntology(queryString, null, "getGraphQueryResults(ontology, queryString)",
                includeImports);
    }

    @Override
    public OutputStream getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                                   boolean skolemize) {
        OutputStream outputStream = new ByteArrayOutputStream();
        return getGraphQueryResultsStream(queryString, includeImports, format, skolemize, outputStream);
    }

    @Override
    public OutputStream getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                                   boolean skolemize, OutputStream outputStream) {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            try {
                GraphQuery query;
                if (includeImports) {
                    query = conn.prepareGraphQuery(queryString);
                } else {
                    query = conn.prepareGraphQuery(queryString, conn.getSystemDefaultNamedGraph());
                }
                GraphQueryResult statements = query.evaluate();

                RDFWriter rdfWriter = Rio.createWriter(format, outputStream);
                setWriterOptions(rdfWriter, format);

                RemoveContextHandler removeContextSH = new RemoveContextHandler(vf);
                if (skolemize) {
                    SkolemizeHandler skolemizeSH = new SkolemizeHandler(bNodeService);
                    assert statements != null;
                    com.mobi.persistence.utils.rio.Rio.write(statements, rdfWriter, skolemizeSH,
                            removeContextSH);
                } else {
                    com.mobi.persistence.utils.rio.Rio.write(statements, rdfWriter, removeContextSH);
                }
                statements.close();
                undoApplyDifferenceIfPresent(conn);
            } finally {
                logTrace("getGraphQueryResults", start);
            }

            return outputStream;
        }
    }

    public boolean getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                                   boolean skolemize, Integer limit, OutputStream outputStream) {
        boolean limitExceeded = false;
        try (DatasetConnection conn = getDatasetConnection()) {

            long start = getStartTime();
            try {
                GraphQuery query;
                if (includeImports) {
                    query = conn.prepareGraphQuery(queryString);
                } else {
                    query = conn.prepareGraphQuery(queryString, conn.getSystemDefaultNamedGraph());
                }
                GraphQueryResult statements = query.evaluate();

                RDFWriter rdfWriter = Rio.createWriter(format, outputStream);
                setWriterOptions(rdfWriter, format);

                RemoveContextHandler removeContextSH = new RemoveContextHandler(vf);
                if (skolemize) {
                    SkolemizeHandler skolemizeSH = new SkolemizeHandler(bNodeService);
                    assert statements != null;

                    if (limit != null) {
                        limitExceeded = com.mobi.persistence.utils.rio.Rio.write(statements, rdfWriter, limit,
                                skolemizeSH, removeContextSH);
                    } else {
                        com.mobi.persistence.utils.rio.Rio.write(statements, rdfWriter, skolemizeSH,
                                removeContextSH);
                    }
                } else {
                    if (limit != null) {
                        limitExceeded = com.mobi.persistence.utils.rio.Rio.write(statements, rdfWriter, limit,
                                removeContextSH);
                    } else {
                        com.mobi.persistence.utils.rio.Rio.write(statements, rdfWriter, removeContextSH);
                    }
                }
                statements.close();
                undoApplyDifferenceIfPresent(conn);
            } finally {
                logTrace("getGraphQueryResults", start);
            }
        }
        return limitExceeded;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (obj instanceof SimpleOntology) {
            SimpleOntology simpleOntology = (SimpleOntology) obj;
            return this.datasetIRI.equals(simpleOntology.datasetIRI);
        }
        return false;
    }

    @Override
    public int hashCode() {
        return datasetIRI.hashCode();
    }

    /**
     * Executes the provided Graph query on the current Ontology.
     *
     * @param queryString    the query string that you wish to run
     * @param addBinding     the binding to add to the query, if needed
     * @param methodName     the name of the method to provide more accurate logging messages
     * @param includeImports whether to include imported ontologies in the query
     * @return the results of the query as a model
     */
    private Model runGraphQueryOnOntology(String queryString,
                                          @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, boolean includeImports) {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            try {
                GraphQuery query;
                if (includeImports) {
                    query = conn.prepareGraphQuery(queryString);
                } else {
                    query = conn.prepareGraphQuery(queryString, conn.getSystemDefaultNamedGraph());
                }
                if (addBinding != null) {
                    query = addBinding.apply(query);
                }
                Model model = QueryResults.asModel(query.evaluate(), mf);
                undoApplyDifferenceIfPresent(conn);
                return model;
            } finally {
                logTrace(methodName, start);
            }
        }
    }

    /**
     * Executes the provided Graph query on the current Ontology.
     *
     * @param queryString    the query string that you wish to run
     * @param addBinding     the binding to add to the query, if needed
     * @param methodName     the name of the method to provide more accurate logging messages
     * @param includeImports whether to include imported ontologies in the query
     * @param conn           the open DatasetConnection to query from
     * @return the results of the query as a TupleQueryResult
     */
    private TupleQueryResult runQueryOnOntology(String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding,
                                                String methodName, boolean includeImports,
                                                DatasetConnection conn) {
        long start = getStartTime();

        TupleQuery query;
        if (includeImports) {
            query = conn.prepareTupleQuery(queryString);
        } else {
            query = conn.prepareTupleQuery(queryString, conn.getSystemDefaultNamedGraph());
        }
        if (addBinding != null) {
            query = addBinding.apply(query);
        }
        TupleQueryResult result = query.evaluate(); // TODO: NOT SURE. try will close it....
        undoApplyDifferenceIfPresent(conn);

        logTrace(methodName, start);
        return result;
    }

    /**
     * Uses the provided TupleQueryResult to construct a hierarchy of the entities provided.
     *
     * @param tupleQueryResult the TupleQueryResult that contains the parent-child relationships for creating the
     *                         hierarchy.
     * @return a Hierarchy containing the hierarchy of the entities provided.
     */
    private Hierarchy getHierarchy(TupleQueryResult tupleQueryResult) {
        Hierarchy hierarchy = new Hierarchy(vf, mf);
        tupleQueryResult.forEach(queryResult -> {
            Value key = Optional.ofNullable(queryResult.getBinding("parent")).orElseThrow(
                    () -> new RuntimeException("Parent binding must be present for hierarchy")).getValue();
            Binding value = Optional.ofNullable(queryResult.getBinding("child"))
                    .orElse(queryResult.getBinding("individual"));
            if (!(key instanceof BNode) && key instanceof IRI) {
                hierarchy.addIRI((IRI) key);
                if (value != null && !(value.getValue() instanceof BNode) && value.getValue() instanceof IRI
                        && !key.stringValue().equals(value.getValue().stringValue())) {
                    String parent = key.stringValue();
                    String child = value.getValue().stringValue();
                    Map<String, Set<String>> parentMap = hierarchy.getParentMap();

                    Map<String, Object> result = checkChildren(parentMap, parent, child, null, new HashSet<>());
                    if (!((boolean) result.get("circular"))) {
                        hierarchy.addParentChild((IRI) key, (IRI) value.getValue());
                    } else {
                        hierarchy.addCircularRelationship((IRI) key, (IRI) value.getValue(),
                                (HashSet) result.get("entities"));
                    }
                }
            }
        });
        return hierarchy;
    }

    /**
     * Uses the provided TupleQueryResult to construct a set of the entities provided.
     *
     * @param tupleQueryResult the TupleQueryResult that contains IRIs
     * @return a Set of IRIs from the TupleQueryResult
     */
    private Set<IRI> getIRISet(TupleQueryResult tupleQueryResult) {
        return StreamSupport.stream(tupleQueryResult.spliterator(), false)
                .map(result -> Optional.ofNullable(result.getBinding("s")))
                .filter(resource -> resource.isPresent() && !(resource.get().getValue() instanceof BNode))
                .map(resource -> (IRI) resource.get().getValue())
                .collect(Collectors.toSet());
    }

    /**
     * Uses the provided TupleQueryResult to construct a set of {@link Annotation}s.
     *
     * @param tupleQueryResult the TupleQueryResult that contains properties and values
     * @return a Set of Annotations from the TupleQueryResult
     */
    private Set<Annotation> getAnnotationSet(TupleQueryResult tupleQueryResult) {
        Set<Annotation> annotations = new HashSet<>();
        tupleQueryResult.forEach(queryResult -> {
            Value prop = Bindings.requiredResource(queryResult, "prop");
            Value value = Bindings.requiredResource(queryResult, "value");
            if (!(prop instanceof BNode) && !(value instanceof BNode)) {
                annotations.add(new SimpleAnnotation(new SimpleAnnotationProperty((IRI) prop), value));
            }
        });
        return annotations;
    }

    /**
     * Loads the provided ontologyFile into the cacheRepo. Loads any imports into their own SdNg if they don't
     * exist in the cache repo yet. Attempts to resolve any imports that are not in the catalog from the web. Generates
     * the dataset representing an Ontology. If an ontologyFile is not present, indicates the SdNg has already been
     * loaded into the cache (i.e, a web import) and generates the managing dataset graph for the datasetIRI.
     *
     * @param ontologyFile An optional {@link File} that contains ontology RDF if present
     * @param webImport A boolean indicating if the ontology was resolved from the web
     * @return A {@link Map} of two {@link Set}s of {@link IRI}s of the unresolvedImports and the importsClosure
     */
    private Map<String, Set<IRI>> loadOntologyIntoCache(@Nullable File ontologyFile, boolean webImport) {
        long start = getStartTime();
        Set<IRI> unresolvedImports = new HashSet<>();
        Set<IRI> processedImports = new HashSet<>();
        List<IRI> importsToProcess = new ArrayList<>();
        String repoId = repository.getRepositoryID();

        try (RepositoryConnection conn = repository.getConnection()) {
            if (!ConnectionUtils.containsContext(conn, datasetIRI)) {
                dsUtilsService.createDataset(datasetIRI, repoId);
            }
            addOntologyToRepo(ontologyFile, datasetIRI, datasetIRI, conn, true);

            IRI ontologyIRI = webImport ? datasetIRI : getOntologyIRI(conn);
            IRI datasetSdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(datasetIRI);

            // Get all direct imports and begin to process them sequentially, adding each one's direct imports to the
            // list importsToBeProcessed. Through this we essentially recurse through all imports and generate the
            // imports closure for the loaded ontology.
            updateImportTrackers(ontologyIRI, getDirectImports(ontologyIRI, datasetSdNg, conn), processedImports,
                    importsToProcess);

            for (int i = 0; i < importsToProcess.size(); i++) {
                IRI importIRI = importsToProcess.get(i);
                IRI iri = getDatasetIRI(importIRI);
                IRI sdngIRI = OntologyDatasets.createSystemDefaultNamedGraphIRI(iri);

                // Import exists in the ontologyCache already
                if (ConnectionUtils.containsContext(conn, iri) || ConnectionUtils.containsContext(conn, sdngIRI)) {
                    updateImportTrackers(importIRI, getDirectImports(importIRI, sdngIRI, conn), processedImports,
                            importsToProcess);
                    conn.add(datasetIRI, vf.createIRI(Dataset.defaultNamedGraph_IRI), sdngIRI, datasetIRI);
                    continue;
                }

                IRI importSdNg;
                // Import does not exist in the catalog. Must resolve from web
                if (iri.equals(importIRI)) {
                    // For generating SimpleOntology of a web import already in the cache (with its importsClosure in
                    // the cache as well) we can skip trying to retrieve again and set the importSdNg
                    importSdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(importIRI);
                    if (!ConnectionUtils.containsContext(conn, importSdNg)) {
                        Optional<File> webFileOpt = importsResolver.retrieveOntologyFromWebFile(importIRI);
                        if (webFileOpt.isPresent()) {
                            addOntologyToRepo(webFileOpt.get(), datasetIRI, iri, conn, false);
                        } else {
                            unresolvedImports.add(importIRI);
                            processedImports.add(importIRI);
                            continue;
                        }
                    }
                } else { // Import exists in catalog
                    Resource recordIRI = importsResolver.getRecordIRIFromOntologyIRI(importIRI).orElseThrow(
                            () -> new IllegalStateException("Imported IRI " + importIRI + " must be associated with"
                                    + "a catalog record"));
                    Resource headCommit = getMasterBranchHead(recordIRI);
                    String headKey = OntologyDatasets.createRecordKey(recordIRI, headCommit);
                    IRI importDatasetIRI = OntologyDatasets.createDatasetIRIFromKey(headKey);
                    importSdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(importDatasetIRI);

                    // For generating SimpleOntology of an import already in the cache (with its importsClosure in
                    // the cache as well) we can skip trying to retrieve again and set the importSdNg
                    if (!ConnectionUtils.containsContext(conn, importSdNg)) {
                        File catalogOntFile = importsResolver.retrieveOntologyLocalFileFromCommitIRI(headCommit);
                        addOntologyToRepo(catalogOntFile, datasetIRI, importDatasetIRI, conn, false);
                    }
                }

                updateImportTrackers(importIRI, getDirectImports(importIRI, importSdNg, conn), processedImports,
                        importsToProcess);
            }
            // Update dataset graph triples that track the imports closure and the unresolved imports
            processedImports.forEach(imported
                    -> conn.add(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), imported, datasetIRI));
            unresolvedImports.forEach(imported
                    -> conn.add(datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), imported,
                    datasetIRI));
        }

        Map<String, Set<IRI>> imports = new HashMap<>();
        imports.put(UNRESOLVED_KEY, unresolvedImports);
        imports.put(CLOSURE_KEY, processedImports);
        logTrace("loadOntologyIntoCache()", start);
        return imports;
    }

    /**
     * Adds the provided ontologyFile into the specified datasetIRI graph if the file is not null and the system default
     * named graph doesn't already exist in the cache. Sets the system default named graph of the dataset to the SdNg
     * generated from the ontologyIRI. If the Adds a timestamp to the datasetIRI graph if specified.
     *
     * @param ontologyFile An optional {@link File} of RDF data if present.
     * @param datasetIRI The {@link IRI} of the dataset graph.
     * @param ontologyIRI The {@link IRI} to generate the system default named graph from.
     * @param conn The {@link RepositoryConnection} to add data to.
     * @param addTimestamp A boolean indicating if a timestamp should be added to the datasetIRI graph.
     */
    private void addOntologyToRepo(@Nullable File ontologyFile, IRI datasetIRI, IRI ontologyIRI,
                                   RepositoryConnection conn, boolean addTimestamp) {
        long start = getStartTime();
        IRI ontologySdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(ontologyIRI);
        // If SdNg exists already, the file is already loaded. When a null ontologyFile is passed, it indicates a web
        // import that has already been loaded into the cache.
        if (!ConnectionUtils.containsContext(conn, ontologySdNg) && ontologyFile != null) {
            loadOntologyFile(ontologyFile, ontologySdNg);
        }
        try (DatasetConnection dsConn = dsUtilsService.getConnection(datasetIRI, repository.getRepositoryID())) {
            dsConn.addDefaultNamedGraph(ontologySdNg);
            if (addTimestamp) {
                dsConn.remove(datasetIRI, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), null, datasetIRI);
                dsConn.addDefault(datasetIRI, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING),
                        vf.createLiteral(OffsetDateTime.now()), datasetIRI);
            }
        } finally {
            logTrace("addOntologyToRepo()", start);
        }
    }

    /**
     * Loads the provided ontologyFile into the provided named graph in the repository for the SimpleOntology.
     *
     * @param ontologyFile The RDF {@link File} of an Ontology to bulk load.
     * @param graph The {@link Resource} specifying what graph to load the ontologyFile into.
     */
    private void loadOntologyFile(File ontologyFile, Resource graph) {
        long importTimeStart = System.currentTimeMillis();
        try (RepositoryConnection conn = repository.getConnection();
                InputStream is = new FileInputStream(ontologyFile)) {
            RDFParser parser = Rio.createParser(RDFFormat.TURTLE);
            ParserConfig parserConfig = new ParserConfig();
            parserConfig.set(TurtleParserSettings.ACCEPT_TURTLESTAR, false);
            parserConfig.set(BasicParserSettings.FAIL_ON_UNKNOWN_LANGUAGES, true);
            parserConfig.set(BasicParserSettings.VERIFY_LANGUAGE_TAGS, false);
            parserConfig.set(BasicParserSettings.VERIFY_RELATIVE_URIS, false);
            parserConfig.set(BasicParserSettings.VERIFY_DATATYPE_VALUES, false);
            parserConfig.set(BasicParserSettings.VERIFY_URI_SYNTAX, false);
            parserConfig.set(BasicParserSettings.PRESERVE_BNODE_IDS, true);
            BatchInserter inserter = new BatchGraphInserter(conn, 50000, graph);
            inserter.setLogger(LOG);
            parser.setParserConfig(parserConfig);
            parser.setRDFHandler(inserter);
            parser.parse(is, "");
            ontologyFile.delete();
        } catch (IOException e) {
            throw new MobiException("Error writing file to repo or deleting file.", e);
        } finally {
            if (LOG.isTraceEnabled()) {
                LOG.trace("Import statements to repo in {} ms", System.currentTimeMillis() - importTimeStart);
            }
        }
    }

    /**
     * Updates the tracking collections for imports. Marks the provided ontologyId as processed and determines if the
     * ontologyId's direct imports have been processed. If not, they are added to the list of importsToProcess.
     *
     * @param ontologyIRI The {@link IRI} identifying the {@link Ontology} that is being processed.
     * @param ontologyImports The {@link List} of {@link IRI}s that represent the direct imports of the ontologyId
     *                        that was processed.
     * @param processedImports A {@link Set} of {@link IRI}s that represent the imports that have already been
     *                         processed.
     * @param importsToProcess The {@link List} of {@link IRI}s that represent the imports that have not been
     *                         processed yet.
     */
    private void updateImportTrackers(IRI ontologyIRI, List<IRI> ontologyImports, Set<IRI> processedImports,
                                      List<IRI> importsToProcess) {
        processedImports.add(ontologyIRI);
        ontologyImports.forEach(imported -> {
            if (!processedImports.contains(imported) && !importsToProcess.contains(imported)) {
                importsToProcess.add(imported);
            }
        });
    }

    /**
     * Gets the direct imports on the provided ontologyIRI that has been loaded into cache. Queries the provided
     * system default named graph (ontologySdNg) for the import statements.
     *
     * @param ontologyIRI The {@link IRI} of the ontology to query for import statements.
     * @param ontologySdNg The {@link IRI} of the system default named graph the provided ontologyIRI has been loaded
     *                     into.
     * @param conn The {@link RepositoryConnection} to the ontologyCache.
     * @return A {@link List} of {@link IRI}s of the imports directly on the provided ontologyIRI.
     */
    private List<IRI> getDirectImports(IRI ontologyIRI, IRI ontologySdNg, RepositoryConnection conn) {
        return conn.getStatements(ontologyIRI, vf.createIRI(OWL.IMPORTS.stringValue()), null, ontologySdNg)
                .stream()
                .map(Statement::getObject)
                .filter(o -> o instanceof IRI)
                .map(r -> (IRI) r)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves the OntologyIRI from the system default named graph associated with the datasetIRI.
     *
     * @param conn A {@link RepositoryConnection} to query from.
     * @return A {@link IRI} of the Ontology.
     */
    private IRI getOntologyIRI(RepositoryConnection conn) {
        Model ontologyDefModel = QueryResults.asModel(
                conn.getStatements(null, vf.createIRI(RDF.TYPE.stringValue()),
                        vf.createIRI(OWL.ONTOLOGY.stringValue()),
                        OntologyDatasets.createSystemDefaultNamedGraphIRI(datasetIRI)), mf);
        return OntologyModels.findFirstOntologyIRI(ontologyDefModel).orElse(datasetIRI);
    }

    /**
     * Retrieves the datasetKey. If the ontologyIRI exists in the catalog, generates the recordKey from recordIRI and
     * headCommitIRI, then converts that into an {@link IRI} which will be used as the datasetIRI. If the ontologyIRI
     * does not exist the catalog, returns the ontologyIRI to be resolved from the web.
     *
     * @param ontologyIRI The ontologyIRI of an {@link Ontology}.
     * @return The datasetIRI if the ontologyIRI exists in the catalog. Otherwise, the ontologyIRI
     */
    private IRI getDatasetIRI(IRI ontologyIRI) {
        Optional<Resource> recordIRI = importsResolver.getRecordIRIFromOntologyIRI(ontologyIRI);
        if (recordIRI.isPresent()) {
            Resource headCommitIRI = getMasterBranchHead(recordIRI.get());
            String headKey = OntologyDatasets.createRecordKey(recordIRI.get(), headCommitIRI);
            return OntologyDatasets.createDatasetIRIFromKey(headKey);
        }
        return ontologyIRI;
    }

    /**
     * Retrieves the {@link DatasetConnection} for the Ontology in cache identified by the datasetIRI.
     *
     * @return A {@link DatasetConnection} for the datasetIRI.
     */
    private DatasetConnection getDatasetConnection() {
        DatasetConnection conn = dsUtilsService.getConnection(datasetIRI, repository.getRepositoryID());
        applyDifferenceIfPresent(conn);
        return conn;
    }

    /**
     * Applies the {@link Difference} to the connection. Starts a transaction for the Difference that represents an
     * {@link com.mobi.catalog.api.ontologies.mcat.InProgressCommit} that is rolled back after, so that the cache is
     * preserved. If imports are added within the Difference, they are resolved using the {@link ImportsResolver} if not
     * present in the cache already.
     *
     * @param conn The {@link DatasetConnection} to perform the transaction on.
     */
    private void applyDifferenceIfPresent(DatasetConnection conn) {
        if (difference != null) {
            long start = getStartTime();
            // Start transaction that will be rolled back in #undoApplyDifferenceIfPresent()
            conn.begin();
            conn.add(difference.getAdditions(), conn.getSystemDefaultNamedGraph());
            conn.remove(difference.getDeletions(), conn.getSystemDefaultNamedGraph());
            addTemporaryImports(conn);
            removeImports(conn);
            logTrace("applyDifferenceIfPresent()", start);
        }
    }

    /**
     * Handles adding temporary imports into the cache. Will check if the import is the cache and if not, will retrieve
     * from catalog or the web if possible. Updates the datasetIRI graph with the new imports statements and
     * default graphs statements.
     *
     * @param conn A {@link DatasetConnection} to add the imports.
     */
    private void addTemporaryImports(DatasetConnection conn) {
        // Gather all the added imports
        List<IRI> addedImports = difference.getAdditions()
                .filter(null, vf.createIRI(OWL.IMPORTS.stringValue()), null)
                .stream()
                .map(Statement::getObject)
                .filter(iri -> iri instanceof IRI)
                .map(iri -> (IRI) iri)
                .toList();
        try (RepositoryConnection repoConn = repository.getConnection()) {
            // Check the cache for each import. If not there, check catalog, next resolve from web, if unresolvable,
            // add unresolved triple to datasetIRI graph
            addedImports.forEach(imported -> {
                IRI importedDatasetIRI = getDatasetIRI(imported);
                IRI importedDatasetSdNgIRI =
                        OntologyDatasets.createSystemDefaultNamedGraphIRI(importedDatasetIRI);
                if (ConnectionUtils.containsContext(repoConn, importedDatasetSdNgIRI)) {
                    createTempImportExistsInCache(importedDatasetIRI, importedDatasetSdNgIRI, conn);
                } else {
                    Optional<File> localFile = importsResolver.retrieveOntologyLocalFile(imported);
                    if (localFile.isPresent()) {
                        createTempImportNotInCacheLocal(importedDatasetIRI, importedDatasetSdNgIRI, localFile.get(),
                                imported, conn);
                    } else {
                        Optional<File> webFile = importsResolver.retrieveOntologyFromWebFile(imported);
                        if (webFile.isPresent()) {
                            createTempImportNotInCacheWeb(importedDatasetIRI, importedDatasetSdNgIRI, webFile.get(),
                                    conn);
                        } else {
                            conn.add(datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), imported,
                                    datasetIRI);
                        }
                    }
                }
            });
        }
    }

    /**
     * Handles temporarily removing imports. Will calculate the new imports closure and update the datasetIRI graph
     * accordingly. Will also update the datasetIRI graph to reflect the appropriate default graphs.
     *
     * @param conn A {@link DatasetConnection} to add the imports.
     */
    private void removeImports(DatasetConnection conn) {
        // Get the removed imports list
        List<IRI> removedImports = difference.getDeletions().filter(null, vf.createIRI(OWL.IMPORTS.stringValue()),
                null)
                .stream()
                .map(Statement::getObject)
                .filter(iri -> iri instanceof IRI)
                .map(iri -> (IRI) iri)
                .toList();
        if (removedImports.size() > 0) {
            // Get all the imports directly on the ontology
            // Includes newly added direct imports in the Difference
            Set<IRI> directImports = this.getImportedOntologyIRIs(conn);

            // Get all unresolved imports including Difference
            Set<IRI> updatedUnresolvedImports = conn.getStatements(datasetIRI,
                    vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, datasetIRI)
                    .stream()
                    .map(Statement::getObject)
                    .filter(obj -> obj instanceof IRI)
                    .map(obj -> vf.createIRI(obj.stringValue()))
                    .collect(Collectors.toSet());
            directImports.removeAll(updatedUnresolvedImports);

            // Calculate any newly added unresolved imports and add to temporary unresolved set
            updatedUnresolvedImports.removeAll(this.unresolvedImports);
            Set<IRI> unresolved = new HashSet<>(updatedUnresolvedImports);

            // Add the ontologyIRI of this to the imports closure
            Set<IRI> importClosureIris = new HashSet<>();
            conn.getStatements(null, vf.createIRI(RDF.TYPE.stringValue()),
                    vf.createIRI(OWL.ONTOLOGY.stringValue()), conn.getSystemDefaultNamedGraph())
                    .stream().map(Statement::getSubject)
                    .filter(iri -> iri instanceof IRI)
                    .map(iri -> (IRI) iri)
                    .forEach(importClosureIris::add);

            // Get each imports closure for direct imports on this
            directImports.forEach(importIri -> {
                IRI importDatasetIRI = getDatasetIRI(importIri);
                SimpleOntology importedOnt = new SimpleOntology(importDatasetIRI, repository, ontologyManager,
                        configProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);
                Set<Ontology> ontClosure = importedOnt.getImportsClosure();

                // Add all internal importsClosure IRIs and unresolved IRIs to appropriate sets
                ontClosure.forEach(closureOnt -> {
                    SimpleOntology ont = (SimpleOntology) closureOnt;
                    importClosureIris.addAll(ont.getImportsClosureIRIs());
                    unresolved.addAll(ont.getUnresolvedImportsIRIs());
                });
            });

            // Clear existing imports closure and default graphs on the datasetIRI graph
            conn.remove(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI);
            conn.remove(datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, datasetIRI);
            conn.remove(datasetIRI, vf.createIRI(Dataset.defaultNamedGraph_IRI), null, datasetIRI);

            // Don't process unresolved imports
            importClosureIris.removeAll(unresolved);

            // Add the default graphs and imports statements for the updated closure
            IRI ontologyIRI = getOntologyIRI(conn);
            importClosureIris.forEach(iri -> {
                IRI importDatasetIRI = getDatasetIRI(iri);
                if (importDatasetIRI.equals(ontologyIRI)) {
                    // DatasetIRI doesn't exist for newly updated ontologyIRI
                    conn.addDefaultNamedGraph(conn.getSystemDefaultNamedGraph());
                } else {
                    IRI importDatasetSdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(importDatasetIRI);
                    conn.addDefaultNamedGraph(importDatasetSdNg);
                }
                conn.add(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), iri, datasetIRI);
            });
            // Add the unresolved statements for the updated closure
            unresolved.forEach(iri ->
                    conn.add(datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), iri, datasetIRI));
        }
    }

    /**
     * Loads the import of an Ontology retrieved from the web into the cache. Updates import statements on datasetIRI
     * graph.
     *
     * @param importedDatasetIRI The datasetIRI of the import.
     * @param importedDatasetSdNg The datasetSdNg of the import.
     * @param ontologyFile The {@link File} of web resolved ontology to load.
     * @param conn The {@link DatasetConnection} used to update the dataset graph with the new import.
     */
    private void createTempImportNotInCacheWeb(IRI importedDatasetIRI, IRI importedDatasetSdNg, File ontologyFile,
                                               DatasetConnection conn) {
        if (LOG.isTraceEnabled()) {
            LOG.trace("Adding import for inProgressCommit for dataset not in cache "
                    + importedDatasetIRI.stringValue());
        }
        Ontology importedOntology = new SimpleOntology(importedDatasetIRI, ontologyFile, repository,
                ontologyManager, configProvider, dsUtilsService, importsResolver, bNodeService, branchManager,
                commitManager);
        updateImportStatements(importedDatasetIRI, importedDatasetSdNg, conn);
    }

    /**
     * Loads the import of an Ontology retrieved from the catalog into the cache. Updates import statements on
     * datasetIRI graph.
     *
     * @param importedDatasetIRI The datasetIRI of the import.
     * @param importedDatasetSdNg The datasetSdNg of the import.
     * @param ontologyFile The {@link File} of catalog resolved ontology to load.
     * @param imported The IRI of the imported ontology.
     * @param conn The {@link DatasetConnection} used to update the dataset graph with the new import.
     */
    private void createTempImportNotInCacheLocal(IRI importedDatasetIRI, IRI importedDatasetSdNg, File ontologyFile,
                                                 IRI imported,
                                                 DatasetConnection conn) {
        if (LOG.isTraceEnabled()) {
            LOG.trace("Adding import for inProgressCommit for dataset not in cache from catalog"
                    + importedDatasetIRI.stringValue());
        }
        Resource recordIRI = importsResolver.getRecordIRIFromOntologyIRI(imported).orElseThrow(
                () -> new IllegalStateException("Record must exist in catalog"));
        Resource masterHead = getMasterBranchHead(recordIRI);
        String recordCommitKey = OntologyDatasets.createRecordKey(recordIRI, masterHead);
        Ontology importedOntology = new SimpleOntology(recordCommitKey, ontologyFile, repository,
                ontologyManager, configProvider, dsUtilsService, importsResolver, bNodeService, branchManager,
                commitManager);
        updateImportStatements(importedDatasetIRI, importedDatasetSdNg, conn);
    }

    /**
     * Adds the import of an Ontology that exists the cache to the dataset graph. Updates import statements on
     * datasetIRI graph.
     *
     * @param importedDatasetIRI The datasetIRI of the import.
     * @param importedDatasetSdNg The datasetSdNg of the import.
     * @param conn The {@link DatasetConnection} used to update the dataset graph with the new import.
     */
    private void createTempImportExistsInCache(IRI importedDatasetIRI, IRI importedDatasetSdNg,
                                               DatasetConnection conn) {
        if (LOG.isTraceEnabled()) {
            LOG.trace("Adding import for inProgressCommit for dataset exists in cache "
                    + importedDatasetIRI.stringValue());
        }
        Ontology importedOntology = new SimpleOntology(importedDatasetIRI, repository,
                ontologyManager, configProvider, dsUtilsService, importsResolver, bNodeService, branchManager,
                commitManager);
        updateImportStatements(importedDatasetIRI, importedDatasetSdNg, conn);
    }

    /**
     * Updates the dataset graph identified by the datasetIRI with a new import statement for the importedDatasetIRI.
     *
     * @param importedDatasetIRI The {@link IRI} to add to the dataset graphs imports.
     * @param importedDatasetSdNg The {@link IRI} to add as a default graph to the datasetIRI graph.
     * @param conn The {@link DatasetConnection} to add the import statement to.
     */
    private void updateImportStatements(IRI importedDatasetIRI, IRI importedDatasetSdNg, DatasetConnection conn) {
        conn.addDefaultNamedGraph(importedDatasetSdNg);
        Set<IRI> failedImportStatements = QueryResults.asList(conn.getStatements(
                importedDatasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, importedDatasetIRI))
                .stream()
                .map(Statement::getObject)
                .filter(iri -> iri instanceof IRI)
                .map(iri -> (IRI) iri)
                .collect(Collectors.toSet());
        List<Statement> importStatements = QueryResults.asList(conn.getStatements(
                importedDatasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), null, importedDatasetIRI));
        importStatements.stream()
                .map(Statement::getObject)
                .filter(iri -> iri instanceof IRI)
                .map(iri -> (IRI) iri)
                .forEach(importIRI -> {
                    conn.add(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), importIRI, datasetIRI);
                    if (!failedImportStatements.contains(importIRI)) {
                        conn.addDefaultNamedGraph(OntologyDatasets.createSystemDefaultNamedGraphIRI(
                                getDatasetIRI(importIRI)));
                    }
                });
        failedImportStatements.forEach(importIRI
                -> conn.add(datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), importIRI, datasetIRI));
    }

    /**
     * Rolls back a transaction if a {@link Difference} is present.
     *
     * @param conn The {@link RepositoryConnection} to use if rolling back the transaction.
     */
    private void undoApplyDifferenceIfPresent(RepositoryConnection conn) {
        if (difference != null) {
            conn.rollback();
        }
    }

    /**
     * Returns the internal Set of imports closure IRIs.
     *
     * @return the internal Set of imports closure IRIs.
     */
    protected Set<IRI> getImportsClosureIRIs() {
        return importsClosure;
    }

    /**
     * Returns the internal Set of unresolved import IRIs.
     *
     * @return the internal Set of unresolved import IRIs.
     */
    protected Set<IRI> getUnresolvedImportsIRIs() {
        return unresolvedImports;
    }

    /**
     * Gets the System currentTimeMillis if log TRACE is enabled.
     *
     * @return A long representing the system time in milliseconds if log trace is enabled. Otherwise, 0L.
     */
    private long getStartTime() {
        return LOG.isTraceEnabled() ? System.currentTimeMillis() : 0L;
    }

    /**
     * Logs the methodName and time it took to run if log TRACE is enabled.
     *
     * @param methodName The name of the method to log.
     * @param start A long of the system time in milliseconds from when the method was first started.
     */
    private void logTrace(String methodName, Long start) {
        if (LOG.isTraceEnabled()) {
            LOG.trace(String.format(methodName + " complete in %d ms", System.currentTimeMillis() - start));
        }
    }

    /**
     *  Checks to see if entities are subclassing each other in a circular manner.
     *
     * @param parentMap A map that contains the most up-to-date parent-to-child relationships
     * @param parentIRI The parent entity in a parent/child set
     * @param childIRI The child entity in a parent/child set
     * @param root The top level child element for a circular relationship
     * @param path A set of entities that are along the path to the circular entity if there is one
     *
     */
    private Map<String, Object> checkChildren(Map<String, Set<String>> parentMap, String parentIRI, String childIRI,
                                              String root, Set<String> path) {
        if (root == null) {
            root = childIRI;
        }
        Map<String, Object> result = new ConcurrentHashMap<>();
        result.put("circular", false);
        result.put("entities", new HashSet<String>());

        Set<String> childList = parentMap.get(childIRI);
        if (childList != null && !childList.isEmpty()) {
            for (String child : childList) {
                if (!((Boolean) result.get("circular"))) {
                    if (parentMap.get(root).contains(child)) {
                        path.clear();
                    }
                    if (((HashSet) result.get("entities")).isEmpty()) {
                        path.add(childIRI);
                    }
                    path.add(child);
                    if (child.equals(parentIRI)) {
                        result.put("circular", true);
                    } else {
                        result = checkChildren(parentMap, parentIRI, child, root, path);
                    }
                }
                result.put("entities", path);
            }
        }

        return result;
    }

    private Resource getMasterBranchHead(Resource recordIRI) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch masterBranch = branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordIRI, conn);
            return commitManager.getHeadCommitIRI(masterBranch);
        }
    }
}

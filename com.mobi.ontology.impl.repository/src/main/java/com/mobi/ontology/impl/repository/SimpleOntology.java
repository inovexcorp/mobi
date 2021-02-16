package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import com.google.common.collect.Iterables;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
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
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.ontology.utils.cache.repository.OntologyDatasets;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.persistence.utils.rio.RemoveContextHandler;
import com.mobi.persistence.utils.rio.SkolemizeHandler;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.api.Update;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.NotImplementedException;
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public class SimpleOntology implements Ontology {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntology.class);

    private ModelFactory mf;
    private ValueFactory vf;
    private Repository repository;
    private DatasetManager datasetManager;
    private OntologyManager ontologyManager;
    private CatalogManager catalogManager;
    private CatalogConfigProvider configProvider;
    private ImportsResolver importsResolver;
    private SesameTransformer transformer;
    private BNodeService bNodeService;
    private RDFImportService importService;
    private IRI datasetIRI;
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
    private static final String GET_CLASS_DATA_PROPERTIES;
    private static final String GET_CLASS_OBJECT_PROPERTIES;
    private static final String GET_ALL_ANNOTATIONS;
    private static final String GET_ONTOLOGY_ANNOTATIONS;
    private static final String GET_INDIVIDUALS_OF_TYPE;
    private static final String GET_ALL_NO_DOMAIN_OBJECT_PROPERTIES;
    private static final String GET_ALL_NO_DOMAIN_DATA_PROPERTIES;
    private static final String GET_ALL_INDIVIDUALS;
    private static final String ENTITY_BINDING = "entity";
    private static final String SEARCH_TEXT = "searchText";

    private static final String CLOSURE_KEY = "closure";
    private static final String UNRESOLVED_KEY = "unresolved";

    static {
        try {
            GET_SUB_CLASSES_OF = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-classes-of.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CLASSES_FOR = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-classes-for.rq"),
                    StandardCharsets.UTF_8
            );
            GET_PROPERTIES_FOR = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-properties-for.rq"),
                    StandardCharsets.UTF_8
            );
            GET_SUB_DATATYPE_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-datatype-properties-of.rq"),
                    StandardCharsets.UTF_8
            );
            GET_SUB_OBJECT_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-object-properties-of.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CLASSES_WITH_INDIVIDUALS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-classes-with-individuals.rq"),
                    StandardCharsets.UTF_8
            );
            SELECT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-entity-usages.rq"),
                    StandardCharsets.UTF_8
            );
            CONSTRUCT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/construct-entity-usages.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CONCEPT_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-concept-relationships.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CONCEPT_SCHEME_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-concept-scheme-relationships.rq"),
                    StandardCharsets.UTF_8
            );
            GET_SEARCH_RESULTS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-search-results.rq"),
                    StandardCharsets.UTF_8
            );
            GET_SUB_ANNOTATION_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-annotation-properties-of.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CLASS_DATA_PROPERTIES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-class-data-properties.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CLASS_OBJECT_PROPERTIES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-class-object-properties.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ALL_ANNOTATIONS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-annotations.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ONTOLOGY_ANNOTATIONS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-ontology-annotations.rq"),
                    StandardCharsets.UTF_8
            );
            GET_INDIVIDUALS_OF_TYPE = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-individuals-of-type.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ALL_NO_DOMAIN_OBJECT_PROPERTIES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-no-domain-object-properties.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ALL_NO_DOMAIN_DATA_PROPERTIES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-no-domain-data-properties.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ALL_INDIVIDUALS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-individuals.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    /**
     * Creates a SimpleOntology object from the provided {@link Model} and stores the Ontology and its imports as
     * datasets inside of the cacheRepo. Used when the Ontology exists in the Catalog but the Ontology and its imports
     * don't exist in the cache yet.
     *
     * @param recordCommitKey The key used to retrieve the Ontology from the cache
     * TODO
     * @param cacheRepo       The {@link Repository} to use as a cache
     * @param ontologyManager The {@link OntologyManager} used to retrieve Ontology information
     * @param catalogManager  The {@link CatalogManager} used to retrieve Record information
     * @param configProvider  The {@link CatalogConfigProvider} used to retrieve the local catalog IRI
     * @param datasetManager  The {@link DatasetManager} used to manage Ontology Datasets
     * @param importsResolver The {@link ImportsResolver} used to resolve imports from local catalog and from the web
     * @param transformer     The {@link SesameTransformer} used to convert RDF4J models to Mobi Models
     * @param bNodeService    The {@link BNodeService} used to skolemize Models
     * @param vf              The {@link ValueFactory} used to create Statements
     * @param mf              The {@link ModelFactory} used to create Models
     */
    public SimpleOntology(String recordCommitKey, File ontologyFile, Repository cacheRepo,
                          OntologyManager ontologyManager, CatalogManager catalogManager,
                          CatalogConfigProvider configProvider, DatasetManager datasetManager,
                          ImportsResolver importsResolver, SesameTransformer transformer, BNodeService bNodeService,
                          ValueFactory vf, ModelFactory mf, RDFImportService importService) {
        long startTime = getStartTime();
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = OntologyDatasets.createDatasetIRIFromKey(recordCommitKey, vf);
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.catalogManager = catalogManager;
        this.configProvider = configProvider;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;
        this.importService = importService;

        Map<String, Set<IRI>> imports = loadOntologyIntoCache(ontologyFile, repository, ontologyManager);
        this.importsClosure = imports.get(CLOSURE_KEY);
        this.unresolvedImports = imports.get(UNRESOLVED_KEY);
        logTrace("SimpleOntology constructor specific commit in catalog but not in cache", startTime);
    }

    /**
     * Retrieves the SimpleOntology from the cache that has the matching recordCommitKey.
     *
     * @param recordCommitKey The key used to retrieve the Ontology from the cache
     * @param cacheRepo       The {@link Repository} to use as a cache
     * @param ontologyManager The {@link OntologyManager} used to retrieve Ontology information
     * @param catalogManager  The {@link CatalogManager} used to retrieve Record information
     * @param configProvider  The {@link CatalogConfigProvider} used to retrieve the local catalog IRI
     * @param datasetManager  The {@link DatasetManager} used to manage Ontology Datasets
     * @param importsResolver The {@link ImportsResolver} used to resolve imports from local catalog and from the web
     * @param transformer     The {@link SesameTransformer} used to convert RDF4J models to Mobi Models
     * @param bNodeService    The {@link BNodeService} used to skolemize Models
     * @param vf              The {@link ValueFactory} used to create Statements
     * @param mf              The {@link ModelFactory} used to create Models
     */
    public SimpleOntology(String recordCommitKey, Repository cacheRepo, OntologyManager ontologyManager,
                          CatalogManager catalogManager, CatalogConfigProvider configProvider,
                          DatasetManager datasetManager, ImportsResolver importsResolver, SesameTransformer transformer,
                          BNodeService bNodeService, ValueFactory vf, ModelFactory mf, RDFImportService importService) {
        long startTime = getStartTime();
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = OntologyDatasets.createDatasetIRIFromKey(recordCommitKey, vf);
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.catalogManager = catalogManager;
        this.configProvider = configProvider;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;
        this.importService = importService;

        importsClosure = new HashSet<>();
        unresolvedImports = new HashSet<>();

        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> imports = RepositoryResults.asList(conn.getStatements(datasetIRI,
                    vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI));
            imports.forEach(imported -> importsClosure.add((IRI) imported.getObject()));
            imports = RepositoryResults.asList(conn.getStatements(datasetIRI,
                    vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, datasetIRI));
            imports.forEach(imported -> unresolvedImports.add((IRI) imported.getObject()));
        }
        logTrace("SimpleOntology constructor from cache with recordCommitKey", startTime);
    }

    /**
     * Creates an SimpleOntology object that represents an imported Ontology.
     *
     * @param datasetIRI      The {@link IRI} of the datasetIRI of the imported Ontology
     * @param cacheRepo       The {@link Repository} to use as a cache
     * @param ontologyManager The {@link OntologyManager} used to retrieve Ontology information
     * @param catalogManager  The {@link CatalogManager} used to retrieve Record information
     * @param configProvider  The {@link CatalogConfigProvider} used to retrieve the local catalog IRI
     * @param datasetManager  The {@link DatasetManager} used to manage Ontology Datasets
     * @param importsResolver The {@link ImportsResolver} used to resolve imports from local catalog and from the web
     * @param transformer     The {@link SesameTransformer} used to convert RDF4J models to Mobi Models
     * @param bNodeService    The {@link BNodeService} used to skolemize Models
     * @param vf              The {@link ValueFactory} used to create Statements
     * @param mf              The {@link ModelFactory} used to create Models
     */
    private SimpleOntology(IRI datasetIRI, Repository cacheRepo, OntologyManager ontologyManager,
                           CatalogManager catalogManager, CatalogConfigProvider configProvider,
                           DatasetManager datasetManager, ImportsResolver importsResolver,
                           SesameTransformer transformer, BNodeService bNodeService, ValueFactory vf, ModelFactory mf,
                           RDFImportService importService) {
        long startTime = getStartTime();
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = datasetIRI;
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.catalogManager = catalogManager;
        this.configProvider = configProvider;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;
        this.importService = importService;

        importsClosure = new HashSet<>();
        unresolvedImports = new HashSet<>();

        try (RepositoryConnection conn = cacheRepo.getConnection()) {
            if (!conn.containsContext(datasetIRI)) {
//                // Create dataset for web import. Will automatically link to loaded web system default named graph
//                datasetManager.createDataset(datasetIRI.stringValue(), cacheRepo.getConfig().id());
//                // Recurse down to get imports closure
//                List<IRI> imports = getDirectImports(datasetIRI, OntologyDatasets.createSystemDefaultNamedGraphIRI(datasetIRI, vf), conn);

                Map<String, Set<IRI>> imports = loadOntologyIntoCache(null, repository, ontologyManager);
                this.importsClosure = imports.get(CLOSURE_KEY);
                this.unresolvedImports = imports.get(UNRESOLVED_KEY);
            } else {
                this.importsClosure = new HashSet<>();
                this.unresolvedImports = new HashSet<>();
                RepositoryResults.asList(conn.getStatements(datasetIRI,
                        vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI))
                        .stream()
                        .map(Statement::getObject)
                        .map(imported -> (IRI) imported)
                        .forEach(importsClosure::add);
                RepositoryResults.asList(conn.getStatements(datasetIRI,
                        vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, datasetIRI))
                        .stream()
                        .map(Statement::getObject)
                        .map(imported -> (IRI) imported)
                        .forEach(unresolvedImports::add);
            }
        }

        logTrace("SimpleOntology constructor from import in cache", startTime);
    }

    /**
     * TODO:
     *
     * @param datasetIRI
     * @param ontologyFile
     * @param cacheRepo
     * @param ontologyManager
     * @param catalogManager
     * @param configProvider
     * @param datasetManager
     * @param importsResolver
     * @param transformer
     * @param bNodeService
     * @param vf
     * @param mf
     * @param importService
     */
    private SimpleOntology(IRI datasetIRI, File ontologyFile, Repository cacheRepo, OntologyManager ontologyManager,
                           CatalogManager catalogManager, CatalogConfigProvider configProvider,
                           DatasetManager datasetManager, ImportsResolver importsResolver,
                           SesameTransformer transformer, BNodeService bNodeService, ValueFactory vf, ModelFactory mf,
                           RDFImportService importService) {
        long startTime = getStartTime();
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = datasetIRI;
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.catalogManager = catalogManager;
        this.configProvider = configProvider;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;
        this.importService = importService;

        Map<String, Set<IRI>> imports = loadOntologyIntoCache(ontologyFile, repository, ontologyManager);
        this.importsClosure = imports.get(CLOSURE_KEY);
        this.unresolvedImports = imports.get(UNRESOLVED_KEY);
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
    public Model asModel(ModelFactory factory) throws MobiOntologyException {
        try (DatasetConnection conn = getDatasetConnection()) {
            long startTime = getStartTime();
            Model model = RepositoryResults.asModelNoContext(conn.getStatements(null, null, null,
                    conn.getSystemDefaultNamedGraph()), factory);
            logTrace("asModel(factory)", startTime);
            undoApplyDifferenceIfPresent(conn);
            return model;
        }
    }

    @Override
    public OutputStream asTurtle() throws MobiOntologyException {
        return getOntologyOutputStream(false, true, RDFFormat.TURTLE);
    }

    @Override
    public OutputStream asTurtle(OutputStream outputStream) throws MobiOntologyException {
        return getOntologyOutputStream(false, true, RDFFormat.TURTLE, outputStream);
    }

    @Override
    public OutputStream asRdfXml() throws MobiOntologyException {
        return getOntologyOutputStream(false, true, RDFFormat.RDFXML);
    }

    @Override
    public OutputStream asRdfXml(OutputStream outputStream) throws MobiOntologyException {
        return getOntologyOutputStream(false, true, RDFFormat.RDFXML, outputStream);
    }

    @Override
    public OutputStream asOwlXml() throws MobiOntologyException {
        throw new NotImplementedException("OWL/XML format is not yet implemented.");
    }

    @Override
    public OutputStream asOwlXml(OutputStream outputStream) throws MobiOntologyException {
        throw new NotImplementedException("OWL/XML format is not yet implemented.");
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize) throws MobiOntologyException {
        return getOntologyOutputStream(skolemize, false, RDFFormat.JSONLD);
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize, OutputStream outputStream) throws MobiOntologyException {
        return getOntologyOutputStream(skolemize, false, RDFFormat.JSONLD, outputStream);
    }

    private OutputStream getOntologyOutputStream(boolean skolemize, boolean prettyPrint, RDFFormat format) {
        OutputStream outputStream = new ByteArrayOutputStream();
        return getOntologyOutputStream(skolemize, prettyPrint, format, outputStream);
    }

    private OutputStream getOntologyOutputStream(boolean skolemize, boolean prettyPrint, RDFFormat format, OutputStream outputStream) {
        long startTime = getStartTime();
        try (DatasetConnection conn = getDatasetConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null,
                    conn.getSystemDefaultNamedGraph());

            RDFHandler rdfWriter;
            if (prettyPrint) {
                rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, outputStream));
            } else {
                rdfWriter = Rio.createWriter(format, outputStream);
            }

            RemoveContextHandler removeContextSH = new RemoveContextHandler(vf);
            if (skolemize) {
                SkolemizeHandler skolemizeSH = new SkolemizeHandler(bNodeService);
                com.mobi.persistence.utils.rio.Rio.write(statements, rdfWriter, transformer, skolemizeSH, removeContextSH);
            } else {
                com.mobi.persistence.utils.rio.Rio.write(statements, rdfWriter, transformer, removeContextSH);
            }

            undoApplyDifferenceIfPresent(conn);
        } catch (RDFHandlerException e) {
            throw new MobiOntologyException("Error while writing Ontology.");
        }
        logTrace("getOntologyOutputStream(" + format.getName() + ", outputStream)", startTime);
        return outputStream;
    }

    @Override
    public OntologyId getOntologyId() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            Model iris = RepositoryResults.asModelNoContext(
                    conn.getStatements(null, vf.createIRI(RDF.TYPE.stringValue()),
                            vf.createIRI(OWL.ONTOLOGY.stringValue()), conn.getSystemDefaultNamedGraph()), mf);
            iris.addAll(RepositoryResults.asModelNoContext(
                    conn.getStatements(null, vf.createIRI(OWL.VERSIONIRI.stringValue()),
                            null, conn.getSystemDefaultNamedGraph()), mf));
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
                    IRI ontIRI = OntologyDatasets.getDatasetIriFromSystemDefaultNamedGraph(ng, vf);
                    IRI ontDatasetIRI = getDatasetIRI(ontIRI);
                    closure.add(new SimpleOntology(ontDatasetIRI, repository, ontologyManager,
                            catalogManager, configProvider, datasetManager, importsResolver, transformer, bNodeService,
                            vf, mf, importService));
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
            List<Statement> importStatements = RepositoryResults.asList(conn.getStatements(null,
                    vf.createIRI(OWL.IMPORTS.stringValue()), null, conn.getSystemDefaultNamedGraph()));
            Set<IRI> imports = importStatements.stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(iri -> (IRI) iri)
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            logTrace("getImportedOntologyIRIs()", start);
            return imports;
        }
    }

    @Override
    public Set<Annotation> getOntologyAnnotations() {
        OntologyId ontologyId = getOntologyId();
        IRI ontologyIRI = ontologyId.getOntologyIRI().orElse((IRI) ontologyId.getOntologyIdentifier());
        return getAnnotationSet(runQueryOnOntology(String.format(GET_ONTOLOGY_ANNOTATIONS,
                ontologyIRI.stringValue()), null, "getOntologyAnnotations()", false));
    }

    @Override
    public Set<Annotation> getAllAnnotations() {
        return getAnnotationSet(runQueryOnOntology(GET_ALL_ANNOTATIONS, null,
                "getAllAnnotations()", false));
    }

    @Override
    public Set<AnnotationProperty> getAllAnnotationProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
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
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()),
                    conn.getSystemDefaultNamedGraph()));
            Set<OClass> owlClasses = statements.stream()
                    .map(Statement::getSubject)
                    .filter(subject -> subject instanceof IRI)
                    .map(subject -> new SimpleClass((IRI) subject))
                    .collect(Collectors.toSet());
            statements = RepositoryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(RDFS.CLASS.stringValue()),
                    conn.getSystemDefaultNamedGraph()));
            Set<OClass> rdfsClasses = statements.stream()
                    .map(Statement::getSubject)
                    .filter(subject -> subject instanceof IRI)
                    .map(subject -> new SimpleClass((IRI) subject))
                    .collect(Collectors.toSet());
            owlClasses.addAll(rdfsClasses);
            undoApplyDifferenceIfPresent(conn);
            logTrace("getAllClasses()", start);
            return owlClasses;
        }
    }

    @Override
    public Set<ObjectProperty> getAllClassObjectProperties(IRI iri) {
        Set<ObjectProperty> properties = getIRISet(runQueryOnOntology(String.format(GET_CLASS_OBJECT_PROPERTIES,
                iri.stringValue()), null, "getAllClassObjectProperties(" + iri.stringValue() + ")", true))
                .stream()
                .map(SimpleObjectProperty::new)
                .collect(Collectors.toSet());
        properties.addAll(getAllNoDomainObjectProperties());
        return properties;
    }

    @Override
    public Set<ObjectProperty> getAllNoDomainObjectProperties() {
        return getIRISet(runQueryOnOntology(GET_ALL_NO_DOMAIN_OBJECT_PROPERTIES, null,
                "getAllNoDomainObjectProperties()", true))
                .stream()
                .map(SimpleObjectProperty::new)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<DataProperty> getAllClassDataProperties(IRI iri) {
        Set<DataProperty> properties = getIRISet(runQueryOnOntology(String.format(GET_CLASS_DATA_PROPERTIES,
                iri.stringValue()), null, "getAllClassDataProperties(" + iri.stringValue() + ")", true))
                .stream()
                .map(SimpleDataProperty::new)
                .collect(Collectors.toSet());
        properties.addAll(getAllNoDomainDataProperties());
        return properties;
    }

    @Override
    public Set<DataProperty> getAllNoDomainDataProperties() {
        return getIRISet(runQueryOnOntology(GET_ALL_NO_DOMAIN_DATA_PROPERTIES, null,
                "getAllNoDomainDataProperties()", true))
                .stream()
                .map(SimpleDataProperty::new)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Datatype> getAllDatatypes() {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
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
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
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
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(iri,
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
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(objectProperty.getIRI(),
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
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
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
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(iri,
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
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(dataProperty.getIRI(),
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
        return getIRISet(runQueryOnOntology(GET_ALL_INDIVIDUALS, null,
                "getAllIndividuals()", true))
                .stream()
                .map(SimpleIndividual::new)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Individual> getIndividualsOfType(IRI classIRI) {
        return getIRISet(runQueryOnOntology(String.format(GET_INDIVIDUALS_OF_TYPE, classIRI.stringValue()), null,
                "getIndividualsOfType(" + classIRI.stringValue() + ")", true))
                .stream()
                .map(SimpleIndividual::new)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Individual> getIndividualsOfType(OClass clazz) {
        return getIndividualsOfType(clazz.getIRI());
    }

    @Override
    public Hierarchy getSubClassesOf(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_SUB_CLASSES_OF, null, "getSubClassesOf(ontology)", true));
    }

    @Override
    public Set<IRI> getSubClassesFor(IRI iri) {
        return getIRISet(runQueryOnOntology(String.format(GET_CLASSES_FOR, iri.stringValue()), null,
                "getSubClassesFor(ontology, " + iri.stringValue() + ")", true));
    }

    @Override
    public Set<IRI> getSubPropertiesFor(IRI iri) {
        return getIRISet(runQueryOnOntology(String.format(GET_PROPERTIES_FOR, iri.stringValue()), null,
                "getSubPropertiesFor(ontology, " + iri.stringValue() + ")", true));
    }

    @Override
    public Hierarchy getSubDatatypePropertiesOf(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_SUB_DATATYPE_PROPERTIES_OF, null,
                "getSubDatatypePropertiesOf(ontology)", true));
    }

    @Override
    public Hierarchy getSubAnnotationPropertiesOf(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_SUB_ANNOTATION_PROPERTIES_OF, null,
                "getSubAnnotationPropertiesOf(ontology)", true));
    }

    @Override
    public Hierarchy getSubObjectPropertiesOf(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_SUB_OBJECT_PROPERTIES_OF, null,
                "getSubObjectPropertiesOf(ontology)", true));
    }

    @Override
    public Hierarchy getClassesWithIndividuals(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_CLASSES_WITH_INDIVIDUALS, null,
                "getClassesWithIndividuals(ontology)", true));
    }

    @Override
    public TupleQueryResult getEntityUsages(Resource entity) {
        return runQueryOnOntology(SELECT_ENTITY_USAGES, tupleQuery -> {
            tupleQuery.setBinding(ENTITY_BINDING, entity);
            return tupleQuery;
        }, "getEntityUsages(ontology, entity)", true);

    }

    @Override
    public Model constructEntityUsages(Resource entity, ModelFactory modelFactory) {
        long start = getStartTime();
        try (DatasetConnection conn = getDatasetConnection()) {
            GraphQuery query = conn.prepareGraphQuery(CONSTRUCT_ENTITY_USAGES);
            query.setBinding(ENTITY_BINDING, entity);
            Model model = QueryResults.asModel(query.evaluate(), modelFactory);
            undoApplyDifferenceIfPresent(conn);
            return model;
        } finally {
            logTrace("constructEntityUsages(entity, conn)", start);
        }

    }

    @Override
    public Hierarchy getConceptRelationships(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_CONCEPT_RELATIONSHIPS, null,
                "getConceptRelationships(ontology)", true));
    }

    @Override
    public Hierarchy getConceptSchemeRelationships(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_CONCEPT_SCHEME_RELATIONSHIPS, null,
                "getConceptSchemeRelationships(ontology)", true));
    }

    @Override
    public TupleQueryResult getSearchResults(String searchText, ValueFactory valueFactory) {
        return runQueryOnOntology(GET_SEARCH_RESULTS, tupleQuery -> {
            tupleQuery.setBinding(SEARCH_TEXT, valueFactory.createLiteral(searchText.toLowerCase()));
            return tupleQuery;
        }, "getSearchResults(ontology, searchText)", true);

    }

    @Override
    public TupleQueryResult getTupleQueryResults(String queryString, boolean includeImports) {
        return runQueryOnOntology(queryString, null, "getTupleQueryResults(ontology, queryString)", includeImports);
    }

    @Override
    public Model getGraphQueryResults(String queryString, boolean includeImports, ModelFactory modelFactory) {
        return runGraphQueryOnOntology(queryString, null, "getGraphQueryResults(ontology, queryString)", includeImports,
                modelFactory);
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
     * @param modelFactory   {@link ModelFactory} used for generating the returned model
     * @return the results of the query as a model
     */
    private Model runGraphQueryOnOntology(String queryString,
                                          @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, boolean includeImports, ModelFactory modelFactory) {
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
                Model model = QueryResults.asModel(query.evaluate(), modelFactory);
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
     * @return the results of the query as a TupleQueryResult
     */
    private TupleQueryResult runQueryOnOntology(String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding,
                                                String methodName, boolean includeImports) {
        try (DatasetConnection conn = getDatasetConnection()) {
            long start = getStartTime();
            try {
                TupleQuery query;
                if (includeImports) {
                    query = conn.prepareTupleQuery(queryString);
                } else {
                    query = conn.prepareTupleQuery(queryString, conn.getSystemDefaultNamedGraph());
                }
                if (addBinding != null) {
                    query = addBinding.apply(query);
                }
                TupleQueryResult result = query.evaluateAndReturn();
                undoApplyDifferenceIfPresent(conn);
                return result;
            } finally {
                logTrace(methodName, start);
            }
        }
    }

    /**
     * Uses the provided TupleQueryResult to construct a hierarchy of the entities provided. Each BindingSet in the Set
     * must have the parent set as the first binding and the child set as the second binding.
     *
     * @param tupleQueryResult the TupleQueryResult that contains the parent-child relationships for creating the
     *                         hierarchy.
     * @return a Hierarchy containing the hierarchy of the entities provided.
     */
    private Hierarchy getHierarchy(TupleQueryResult tupleQueryResult) {
        Hierarchy hierarchy = new Hierarchy(vf, mf);
        tupleQueryResult.forEach(queryResult -> {
            Value key = Iterables.get(queryResult, 0).getValue();
            Binding value = Iterables.get(queryResult, 1, null);
            if (!(key instanceof BNode) && key instanceof IRI) {
                hierarchy.addIRI((IRI) key);
                if (value != null && !(value.getValue() instanceof BNode) && value.getValue() instanceof IRI
                        && !key.stringValue().equals(value.getValue().stringValue())) {
                    String parent = key.stringValue();
                    String child = value.getValue().stringValue();
                    Map<String, Set<String>> parentMap = hierarchy.getParentMap();
                    Map<String, Set<String>> childMap = hierarchy.getChildMap();

                    // Remove if Parent and Child are directly subclasses of each other
                    boolean existsInParent = parentMap.containsKey(child) && parentMap.get(child).contains(parent);
                    boolean existsInChild = childMap.containsKey(parent) && childMap.get(parent).contains(child);
                    if (existsInParent) {
                        parentMap.get(child).remove(parent);
                        if (parentMap.get(child).size() == 0) {
                            parentMap.remove(child);
                        }
                    }
                    if (existsInChild) {
                        childMap.get(parent).remove(child);
                        if (childMap.get(parent).size() == 0) {
                            childMap.remove(parent);
                        }
                    }

                    if (!existsInChild && !existsInParent) {
                        hierarchy.addParentChild((IRI) key, (IRI) value.getValue());
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
        Set<IRI> iris = new HashSet<>();
        tupleQueryResult.forEach(r -> r.getBinding("s")
                .ifPresent(b -> {
                    if (!(b.getValue() instanceof BNode)) {
                        iris.add(vf.createIRI(b.getValue().stringValue()));
                    }
                }));
        return iris;
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
     * TODO:
     * @param ontologyFile
     * @param cacheRepo
     * @param ontologyManager
     * @return
     */
    private Map<String, Set<IRI>> loadOntologyIntoCache(@Nullable File ontologyFile, Repository cacheRepo,
                                                             OntologyManager ontologyManager) {
        Set<IRI> unresolvedImports = new HashSet<>();
        Set<IRI> processedImports = new HashSet<>();
        List<IRI> importsToProcess = new ArrayList<>();
        String repoId = cacheRepo.getConfig().id();

        try (RepositoryConnection conn = cacheRepo.getConnection()) {
            if (!conn.containsContext(datasetIRI)) {
                datasetManager.createDataset(datasetIRI.stringValue(), repoId);
            }
            addOntologyToRepo(ontologyFile, datasetIRI, datasetIRI, conn, repoId, true);

            IRI ontologyIRI = getOntologyIRI(conn);
            IRI datasetSdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(datasetIRI, vf);

            // Get all direct imports and begin to process them sequentially, adding each ones direct imports to the
            // list importsToBeProcessed. Through this we essentially recurse through all imports and generate the
            // imports closure for the loaded ontology.
            updateImportTrackers(ontologyIRI, getDirectImports(ontologyIRI, datasetSdNg, conn), processedImports,
                    importsToProcess);

            for (int i = 0; i < importsToProcess.size(); i++) {
                IRI importIRI = importsToProcess.get(i);
                IRI iri = getDatasetIRI(importIRI);
                IRI sdngIRI = OntologyDatasets.createSystemDefaultNamedGraphIRI(iri, vf);

                // Import exists in the ontologyCache already
                if (conn.containsContext(iri) || conn.containsContext(sdngIRI)) {
                    updateImportTrackers(importIRI, getDirectImports(iri, sdngIRI, conn), processedImports,
                            importsToProcess);
                    conn.add(datasetIRI, vf.createIRI(Dataset.defaultNamedGraph_IRI), sdngIRI, datasetIRI);
                    continue;
                }

                IRI importSdNg;
                // Import does not exist in the catalog. Must resolve from web
                if (iri.equals(importIRI)) {
                    // For generating SimpleOntology of a web import already in the cache (with its importsClosure in
                    // the cache as well) we can skip trying to retrieve again and set the importSdNg
                    importSdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(importIRI, vf);
                    if (!conn.containsContext(importSdNg)) {
                        Optional<File> webFileOpt = importsResolver.retrieveOntologyFromWebFile(importIRI);
                        if (webFileOpt.isPresent()) {
                            addOntologyToRepo(webFileOpt.get(), datasetIRI, iri, conn, repoId, false);

                        } else {
                            unresolvedImports.add(importIRI);
                            processedImports.add(importIRI);
                            continue;
                        }
                    }
                }
                // Import exists in catalog
                else {
                    Resource recordIRI = ontologyManager.getOntologyRecordResource(importIRI).orElseThrow(
                            () -> new IllegalStateException("Imported IRI " + importIRI + " must be associated with"
                                    + "a catalog record"));
                    Resource headCommit = catalogManager.getMasterBranch(
                            configProvider.getLocalCatalogIRI(), recordIRI).getHead_resource().orElseThrow(
                                () -> new IllegalStateException("Record " + recordIRI + " must have a head "
                                        + "commit associated with the master branch"));
                    String headKey = OntologyDatasets.createRecordKey(recordIRI, headCommit);
                    IRI importDatasetIRI = OntologyDatasets.createDatasetIRIFromKey(headKey, vf);
                    importSdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(importDatasetIRI, vf);

                    // For generating SimpleOntology of an import already in the cache (with its importsClosure in
                    // the cache as well) we can skip trying to retrieve again and set the importSdNg
                    if (!conn.containsContext(importSdNg)) {
                        File catalogOntFile = catalogManager.getCompiledResourceFile(headCommit);
                        addOntologyToRepo(catalogOntFile, datasetIRI, importDatasetIRI, conn, repoId, false);
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
        return imports;
    }

    private void addOntologyToRepo(File ontologyFile, IRI datasetIRI, IRI ontologyIRI, RepositoryConnection conn,
                                  String repoId, boolean addTimestamp) {
        IRI ontologySdNg = OntologyDatasets.createSystemDefaultNamedGraphIRI(ontologyIRI, vf);
        // If SdNg exists already, the file is already loaded. When a null ontologyFile is passed, it indicates a web
        // import that has already been loaded into the cache.
        if (!conn.containsContext(ontologySdNg) && ontologyFile != null) {
            loadOntologyFile(ontologyFile, ontologySdNg, repoId);
        }
        try (DatasetConnection dsConn = datasetManager.getConnection(datasetIRI, repository.getConfig().id(), false)) {
            dsConn.addDefaultNamedGraph(ontologySdNg);
            if (addTimestamp) {
                dsConn.remove(datasetIRI, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), null, datasetIRI);
                dsConn.addDefault(datasetIRI, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now()), datasetIRI);
            }
        }
    }

    private void loadOntologyFile(File ontologyFile, Resource tempGraph, String repoId) {
        long importTimeStart = System.currentTimeMillis();
        try {
            ImportServiceConfig.Builder builder = new ImportServiceConfig.Builder()
                    .continueOnError(false)
                    .logOutput(true)
                    .printOutput(false)
                    .batchSize(50000)
                    .format(RDFFormat.TRIG)
                    .repository(repoId);
            importService.importFile(builder.build(), ontologyFile, tempGraph);
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
     * @param conn The {@link RepositoryConnection} to the ontologyCache
     * @return
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
     * TODO:
     * @param conn
     * @return
     */
    private IRI getOntologyIRI(RepositoryConnection conn) {
        Model ontologyDefModel = RepositoryResults.asModel(
                conn.getStatements(null, vf.createIRI(RDF.TYPE.stringValue()),
                        vf.createIRI(OWL.ONTOLOGY.stringValue()),
                        OntologyDatasets.createSystemDefaultNamedGraphIRI(datasetIRI, vf)), mf);
        return OntologyModels.findFirstOntologyIRI(ontologyDefModel, vf).orElseThrow(
                () -> new IllegalStateException("OntologyIRI must exist for dataset" + datasetIRI.stringValue()));
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
        Optional<Resource> recordIRI = ontologyManager.getOntologyRecordResource(ontologyIRI);
        if (recordIRI.isPresent()) {
            Optional<Resource> headCommitIRI = catalogManager.getMasterBranch(
                    configProvider.getLocalCatalogIRI(), recordIRI.get()).getHead_resource();
            if (headCommitIRI.isPresent()) {
                String headKey = OntologyDatasets.createRecordKey(recordIRI.get(), headCommitIRI.get());
                return OntologyDatasets.createDatasetIRIFromKey(headKey, vf);
            }
        }
        return ontologyIRI;
    }

    private DatasetConnection getDatasetConnection() {
        DatasetConnection conn = datasetManager.getConnection(datasetIRI, repository.getConfig().id(), false);
        applyDifferenceIfPresent(conn);
        return conn;
    }

    private void applyDifferenceIfPresent(DatasetConnection conn) {
        if (difference != null) {
            long start = getStartTime();
            conn.begin();
            conn.add(difference.getAdditions(), conn.getSystemDefaultNamedGraph());
            conn.remove(difference.getDeletions(), conn.getSystemDefaultNamedGraph());

            List<IRI> addedImports = difference.getAdditions()
                    .filter(null, vf.createIRI(OWL.IMPORTS.stringValue()), null)
                    .stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(iri -> (IRI) iri)
                    .collect(Collectors.toList());
            try (RepositoryConnection repoConn = repository.getConnection()) {
                addedImports.forEach(imported -> {
                    IRI importedDatasetIRI = getDatasetIRI(imported);
                    IRI importedDatasetSdNgIRI =
                            OntologyDatasets.createSystemDefaultNamedGraphIRI(importedDatasetIRI, vf);
                    if (repoConn.containsContext(importedDatasetSdNgIRI)) {
                        createTempImportExistsInCache(importedDatasetIRI, conn);
                    } else {
                        Optional<File> localFile = importsResolver.retrieveOntologyLocalFile(imported, ontologyManager);
                        if (localFile.isPresent()) {
                            createTempImportExistsInCatalog(importedDatasetIRI, localFile.get(), conn);
                        } else {
                            Optional<File> webFile = importsResolver.retrieveOntologyFromWebFile(imported);
                            if (webFile.isPresent()) {
                                createTempImportWebNotInCache(importedDatasetIRI, webFile.get(), conn);
                            } else {
                                conn.add(datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), imported,
                                        datasetIRI);
                            }
                        }
                    }
                });
            }

            List<IRI> removedImports = difference.getDeletions().filter(null, vf.createIRI(OWL.IMPORTS.stringValue()),
                    null)
                    .stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(iri -> (IRI) iri)
                    .collect(Collectors.toList());
            removedImports.forEach(imported -> {
                IRI importDatasetIRI = OntologyDatasets.createSystemDefaultNamedGraphIRI(
                        getDatasetIRI(imported), vf);
                conn.removeGraph(importDatasetIRI);
                conn.remove(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), imported);
            });
            logTrace("applyDifferenceIfPresent()", start);
        }
    }

    private void createTempImportExistsInCatalog(IRI importedDatasetIRI, File ontologyFile, DatasetConnection conn) {
        LOG.trace("Adding import for inProgressCommit for dataset in catalog but not loaded in cache " +
                importedDatasetIRI.stringValue());

        Ontology importedOntology = new SimpleOntology(importedDatasetIRI.stringValue(), ontologyFile, repository,
                ontologyManager, catalogManager, configProvider, datasetManager, importsResolver, transformer,
                bNodeService, vf, mf, importService);
        updateImportStatements(importedDatasetIRI, conn);
    }

    private void createTempImportWebNotInCache(IRI importedDatasetIRI, File ontologyFile, DatasetConnection conn) {
        LOG.trace("Adding import for inProgressCommit for dataset not in cache " + importedDatasetIRI.stringValue());
        Ontology importedOntology = new SimpleOntology(importedDatasetIRI, ontologyFile, repository,
                ontologyManager, catalogManager, configProvider, datasetManager, importsResolver, transformer,
                bNodeService, vf, mf, importService);
        updateImportStatements(importedDatasetIRI, conn);
    }

    private void createTempImportExistsInCache(IRI importedDatasetIRI, DatasetConnection conn) {
        LOG.trace("Adding import for inProgressCommit for dataset exists in cache " + importedDatasetIRI.stringValue());
        updateImportStatements(importedDatasetIRI, conn);
    }

    private void updateImportStatements(IRI importedDatasetIRI, DatasetConnection conn) {
        Set<IRI> failedImportStatements = RepositoryResults.asList(conn.getStatements(
                importedDatasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, importedDatasetIRI))
                .stream()
                .map(Statement::getObject)
                .filter(iri -> iri instanceof IRI)
                .map(iri -> (IRI) iri)
                .collect(Collectors.toSet());
        List<Statement> importStatements = RepositoryResults.asList(conn.getStatements(
                importedDatasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), null, importedDatasetIRI));
        importStatements.stream()
                .map(Statement::getObject)
                .filter(iri -> iri instanceof IRI)
                .map(iri -> (IRI) iri)
                .forEach(importIRI -> {
                    conn.add(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), importIRI, datasetIRI);
                    if (!failedImportStatements.contains(importIRI)) {
                        conn.addDefaultNamedGraph(OntologyDatasets.createSystemDefaultNamedGraphIRI(
                                getDatasetIRI(importIRI), vf));
                    }
                });
        failedImportStatements.forEach(importIRI
                -> conn.add(datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), importIRI, datasetIRI));
    }

    private void undoApplyDifferenceIfPresent(RepositoryConnection conn) {
        if (difference != null) {
            conn.rollback();
        }
    }

    private long getStartTime() {
        return LOG.isTraceEnabled() ? System.currentTimeMillis() : 0L;
    }

    private void logTrace(String methodName, Long start) {
        if (LOG.isTraceEnabled()) {
            LOG.trace(String.format(methodName + " complete in %d ms", System.currentTimeMillis() - start));
        }
    }
}

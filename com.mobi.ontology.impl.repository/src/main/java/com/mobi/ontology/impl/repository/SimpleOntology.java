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
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
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
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.NotImplementedException;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.WriterConfig;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
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
import javax.annotation.Nullable;

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
    private IRI datasetIRI;
    private Set<Resource> importsClosure;
    private Set<Resource> unresolvedImports;
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
                    "UTF-8"
            );
            GET_CLASSES_FOR = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-classes-for.rq"),
                    "UTF-8"
            );
            GET_PROPERTIES_FOR = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-properties-for.rq"),
                    "UTF-8"
            );
            GET_SUB_DATATYPE_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-datatype-properties-of.rq"),
                    "UTF-8"
            );
            GET_SUB_OBJECT_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-object-properties-of.rq"),
                    "UTF-8"
            );
            GET_CLASSES_WITH_INDIVIDUALS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-classes-with-individuals.rq"),
                    "UTF-8"
            );
            SELECT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-entity-usages.rq"),
                    "UTF-8"
            );
            CONSTRUCT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/construct-entity-usages.rq"),
                    "UTF-8"
            );
            GET_CONCEPT_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-concept-relationships.rq"),
                    "UTF-8"
            );
            GET_CONCEPT_SCHEME_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-concept-scheme-relationships.rq"),
                    "UTF-8"
            );
            GET_SEARCH_RESULTS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-search-results.rq"),
                    "UTF-8"
            );
            GET_SUB_ANNOTATION_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-sub-annotation-properties-of.rq"),
                    "UTF-8"
            );
            GET_CLASS_DATA_PROPERTIES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-class-data-properties.rq"),
                    "UTF-8"
            );
            GET_CLASS_OBJECT_PROPERTIES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-class-object-properties.rq"),
                    "UTF-8"
            );
            GET_ALL_ANNOTATIONS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-annotations.rq"),
                    "UTF-8"
            );
            GET_ONTOLOGY_ANNOTATIONS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-ontology-annotations.rq"),
                    "UTF-8"
            );
            GET_INDIVIDUALS_OF_TYPE = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-individuals-of-type.rq"),
                    "UTF-8"
            );
            GET_ALL_NO_DOMAIN_OBJECT_PROPERTIES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-no-domain-object-properties.rq"),
                    "UTF-8"
            );
            GET_ALL_NO_DOMAIN_DATA_PROPERTIES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-no-domain-data-properties.rq"),
                    "UTF-8"
            );
            GET_ALL_INDIVIDUALS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-individuals.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    /**
     * Creates a SimpleOntology object from the provided {@link Model} and stores the Ontology and its imports as
     * datasets inside of the cacheRepo.
     *
     * @param model           The {@link Model} representing an Ontology
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
    public SimpleOntology(Model model, Repository cacheRepo, OntologyManager ontologyManager,
                          CatalogManager catalogManager, CatalogConfigProvider configProvider,
                          DatasetManager datasetManager, ImportsResolver importsResolver, SesameTransformer transformer,
                          BNodeService bNodeService, ValueFactory vf, ModelFactory mf) {
        long startTime = getStartTime();
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = OntologyModels.findFirstOntologyIRI(model, vf)
                .orElseThrow(() -> new IllegalStateException("Ontology must have an identifier."));
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.catalogManager = catalogManager;
        this.configProvider = configProvider;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;

        Map<String, Set<Resource>> imports = loadOntologyIntoCache(this.datasetIRI, null, model,
                repository, ontologyManager);
        this.importsClosure = imports.get(CLOSURE_KEY);
        this.unresolvedImports = imports.get(UNRESOLVED_KEY);
        logTrace("SimpleOntology constructor from Model", startTime);
    }

    /**
     * Creates a SimpleOntology object from the provided {@link Model} and stores the Ontology and its imports as
     * datasets inside of the cacheRepo. Used when the Ontology exists in the Catalog but the Ontology and its imports
     * don't exist in the cache yet.
     *
     * @param recordCommitKey The key used to retrieve the Ontology from the cache
     * @param model           The {@link Model} representing an Ontology
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
    public SimpleOntology(String recordCommitKey, Model model, Repository cacheRepo, OntologyManager ontologyManager,
                          CatalogManager catalogManager, CatalogConfigProvider configProvider,
                          DatasetManager datasetManager, ImportsResolver importsResolver, SesameTransformer transformer,
                          BNodeService bNodeService, ValueFactory vf, ModelFactory mf) {
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

        Resource ontologyIRI = OntologyModels.findFirstOntologyIRI(model, vf)
                .orElseThrow(() -> new IllegalStateException("Ontology must have an identifier."));
        Map<String, Set<Resource>> imports = loadOntologyIntoCache(ontologyIRI, recordCommitKey, model,
                repository, ontologyManager);
        this.importsClosure = imports.get(CLOSURE_KEY);
        this.unresolvedImports = imports.get(UNRESOLVED_KEY);
        logTrace("SimpleOntology constructor in catalog but not in cache", startTime);
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
                          BNodeService bNodeService, ValueFactory vf, ModelFactory mf) {
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

        importsClosure = new HashSet<>();
        unresolvedImports = new HashSet<>();

        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> imports = RepositoryResults.asList(conn.getStatements(datasetIRI,
                    vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI));
            imports.forEach(imported -> importsClosure.add((Resource) imported.getObject()));
            imports = RepositoryResults.asList(conn.getStatements(datasetIRI,
                    vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING), null, datasetIRI));
            imports.forEach(imported -> unresolvedImports.add((Resource) imported.getObject()));
        }
        logTrace("SimpleOntology constructor from cache", startTime);
    }

    /**
     * Creates an SimpleOntology object that represents an imported Ontology.
     *
     * @param datasetIRI      The {@link IRI} of the datasetIRI of the imported Ontology
     * @param model           The {@link Model} representing an Ontology
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
    private SimpleOntology(IRI datasetIRI, Model model, Repository cacheRepo, OntologyManager ontologyManager,
                           CatalogManager catalogManager, CatalogConfigProvider configProvider,
                           DatasetManager datasetManager, ImportsResolver importsResolver,
                           SesameTransformer transformer, BNodeService bNodeService, ValueFactory vf, ModelFactory mf) {
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

        try (RepositoryConnection cacheConn = cacheRepo.getConnection()) {
            if (!cacheConn.containsContext(datasetIRI)) {
                Map<String, Set<Resource>> imports = loadOntologyIntoCache(datasetIRI, null, model,
                        repository, ontologyManager);
                this.importsClosure = imports.get(CLOSURE_KEY);
                this.unresolvedImports = imports.get(UNRESOLVED_KEY);
            } else {
                this.importsClosure = new HashSet<>();
                this.unresolvedImports = new HashSet<>();
                RepositoryResults.asList(cacheConn.getStatements(datasetIRI,
                        vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI))
                        .stream()
                        .map(Statement::getObject)
                        .map(imported -> (IRI) imported)
                        .forEach(importsClosure::add);
                RepositoryResults.asList(cacheConn.getStatements(datasetIRI,
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
        return getOntologyOutputStream(RDFFormat.TURTLE);
    }

    @Override
    public OutputStream asTurtle(OutputStream outputStream) throws MobiOntologyException {
        return getOntologyOutputStream(RDFFormat.TURTLE);
    }

    @Override
    public OutputStream asRdfXml() throws MobiOntologyException {
        return getOntologyOutputStream(RDFFormat.RDFXML);
    }

    @Override
    public OutputStream asRdfXml(OutputStream outputStream) throws MobiOntologyException {
        return getOntologyOutputStream(RDFFormat.RDFXML);
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
        OutputStream outputStream = new ByteArrayOutputStream();
        return asJsonLD(skolemize, outputStream);
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize, OutputStream outputStream) throws MobiOntologyException {
        WriterConfig config = new WriterConfig();
        try {
            long startTime = getStartTime();
            Model model = asModel(mf);
            if (skolemize) {
                model = bNodeService.skolemize(model);
            }
            Rio.write(transformer.sesameModel(model), outputStream, RDFFormat.JSONLD, config);
            logTrace("asJsonLD(skolemize, outputStream)", startTime);
        } catch (RDFHandlerException e) {
            throw new MobiOntologyException("Error while writing Ontology.");
        }
        return outputStream;
    }

    private OutputStream getOntologyOutputStream(RDFFormat format) {
        OutputStream outputStream = new ByteArrayOutputStream();
        return getOntologyOutputStream(format, outputStream);
    }

    private OutputStream getOntologyOutputStream(RDFFormat format, OutputStream outputStream) {
        long startTime = getStartTime();
        try {
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, outputStream));
            Rio.write(transformer.sesameModel(asModel(mf)), rdfWriter);
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
                    IRI ontDatasetIRI = getDatasetIRI(ontIRI, ontologyManager);
                    Model importModel = RepositoryResults.asModel(conn.getStatements(null, null, null, ng), mf);
                    closure.add(new SimpleOntology(ontDatasetIRI, importModel, repository, ontologyManager,
                            catalogManager, configProvider, datasetManager, importsResolver, transformer, bNodeService,
                            vf, mf));
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
                .ifPresent(b -> iris.add(vf.createIRI(b.getValue().stringValue()))));
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

    private Map<String, Set<Resource>> loadOntologyIntoCache(Resource ontologyId, @Nullable String key, Model ontModel,
                                                             Repository cacheRepo, OntologyManager ontologyManager) {
        Set<Resource> unresolvedImports = new HashSet<>();
        Set<Resource> processedImports = new HashSet<>();
        List<Resource> importsToProcess = new ArrayList<>();
        importsToProcess.add(ontologyId);
        Resource datasetKey = key == null
                ? getDatasetIRI(ontologyId, ontologyManager) : OntologyDatasets.createDatasetIRIFromKey(key, vf);


        try (RepositoryConnection cacheConn = cacheRepo.getConnection()) {
            if (!cacheConn.containsContext(datasetKey)) {
                datasetManager.createDataset(datasetKey.stringValue(), cacheRepo.getConfig().id());
            }
            addOntologyToRepo(cacheRepo, ontModel, datasetKey, datasetKey, true);
            addImportsToSets(getImportsFromModel(ontModel), processedImports, importsToProcess, ontologyId);

            for (int i = 1; i < importsToProcess.size(); i++) {
                Resource importIRI = importsToProcess.get(i);
                Model model;
                IRI iri = getDatasetIRI(importIRI, ontologyManager);
                IRI sdngIRI = OntologyDatasets.createSystemDefaultNamedGraphIRI(iri, vf);
                if (cacheConn.containsContext(iri) || cacheConn.containsContext(sdngIRI)) {
                    List<Resource> imports = cacheConn.getStatements(null,
                            vf.createIRI(OWL.IMPORTS.stringValue()), null, sdngIRI)
                            .stream()
                            .map(Statement::getObject)
                            .filter(o -> o instanceof IRI)
                            .map(r -> (IRI) r)
                            .collect(Collectors.toList());

                    addImportsToSets(imports, processedImports, importsToProcess, importIRI);
                    cacheConn.add(datasetKey, vf.createIRI(Dataset.defaultNamedGraph_IRI), sdngIRI, datasetKey);
                    continue;
                }
                if (iri.equals(importIRI)) {
                    Optional<Model> modelOpt = importsResolver.retrieveOntologyFromWeb(importIRI);
                    if (modelOpt.isPresent()) {
                        model = modelOpt.get();
                        addOntologyToRepo(cacheRepo, model, datasetKey, iri, false);
                    } else {
                        unresolvedImports.add(importIRI);
                        processedImports.add(importIRI);
                        continue;
                    }
                } else {
                    Resource recordIRI = ontologyManager.getOntologyRecordResource(importIRI).orElseThrow(
                            () -> new IllegalStateException("Imported IRI " + importIRI + " must be associated with"
                                    + "a catalog record"));
                    Resource headCommit = catalogManager.getMasterBranch(
                            configProvider.getLocalCatalogIRI(), recordIRI).getHead_resource().orElseThrow(
                                () -> new IllegalStateException("Record " + recordIRI + " must have a head "
                                        + "commit associated with the master branch"));
                    model = catalogManager.getCompiledResource(headCommit);
                    String headKey = OntologyDatasets.createRecordKey(recordIRI, headCommit);
                    addOntologyToRepo(cacheRepo, model, datasetKey,
                            OntologyDatasets.createDatasetIRIFromKey(headKey, vf), false);
                }
                addImportsToSets(getImportsFromModel(model), processedImports, importsToProcess, importIRI);
            }
            processedImports.forEach(imported
                    -> cacheConn.add(datasetKey, vf.createIRI(OWL.IMPORTS.stringValue()), imported, datasetKey));
            unresolvedImports.forEach(imported
                    -> cacheConn.add(datasetKey, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING),
                    imported, datasetKey));
        }

        Map<String, Set<Resource>> imports = new HashMap<>();
        imports.put(UNRESOLVED_KEY, unresolvedImports);
        imports.put(CLOSURE_KEY, processedImports);
        return imports;
    }

    private void addOntologyToRepo(Repository repository, Model ontologyModel, Resource datasetIRI,
                                   Resource ontologyIRI, boolean addTimestamp) {
        try (DatasetConnection dsConn = datasetManager.getConnection(datasetIRI, repository.getConfig().id(),
                false)) {
            IRI ontNamedGraphIRI = OntologyDatasets.createSystemDefaultNamedGraphIRI(ontologyIRI, vf);
            dsConn.addDefaultNamedGraph(ontNamedGraphIRI);
            if (!dsConn.contains(null, null, null, ontNamedGraphIRI)) {
                long startTime = getStartTime();
                dsConn.addDefault(ontologyModel, ontNamedGraphIRI);
                if (LOG.isTraceEnabled()) {
                    LOG.trace("Adding " + ontNamedGraphIRI + " to " + datasetIRI + " dataset complete in "
                            + (System.currentTimeMillis() - startTime));
                }
            }
            if (addTimestamp) {
                dsConn.remove(datasetIRI, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), null, datasetIRI);
                dsConn.addDefault(datasetIRI, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING),
                        vf.createLiteral(OffsetDateTime.now()), datasetIRI);
            }
        }
    }

    private void addImportsToSets(List<Resource> imports, Set<Resource> processedImports,
                                  List<Resource> importsToProcess, Resource importIRI) {
        processedImports.add(importIRI);
        imports.forEach(imported -> {
            if (!processedImports.contains(imported) && !importsToProcess.contains(imported)) {
                importsToProcess.add(imported);
            }
        });
    }

    private List<Resource> getImportsFromModel(Model model) {
        return model.filter(null, vf.createIRI(OWL.IMPORTS.stringValue()), null)
                .stream()
                .map(Statement::getObject)
                .filter(o -> o instanceof IRI)
                .map(r -> (IRI) r)
                .collect(Collectors.toList());
    }

    private IRI getDatasetIRI(Resource ontologyIRI, OntologyManager ontologyManager) {
        Optional<Resource> recordIRI = ontologyManager.getOntologyRecordResource(ontologyIRI);
        if (recordIRI.isPresent()) {
            Optional<Resource> headCommit = catalogManager.getMasterBranch(
                    configProvider.getLocalCatalogIRI(), recordIRI.get()).getHead_resource();
            if (headCommit.isPresent()) {
                String headKey = OntologyDatasets.createRecordKey(recordIRI.get(), headCommit.get());
                return OntologyDatasets.createDatasetIRIFromKey(headKey, vf);
            }
        }
        return (IRI) ontologyIRI;
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

            List<IRI> addedImports = difference.getAdditions().filter(null, vf.createIRI(OWL.IMPORTS.stringValue()),
                    null)
                    .stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(iri -> (IRI) iri)
                    .collect(Collectors.toList());
            try (RepositoryConnection repoConn = repository.getConnection()) {
                addedImports.forEach(imported -> {
                    IRI importedDatasetIRI = getDatasetIRI(imported, ontologyManager);
                    IRI importedDatasetSdNgIRI =
                            OntologyDatasets.createSystemDefaultNamedGraphIRI(importedDatasetIRI, vf);
                    if (repoConn.containsContext(importedDatasetSdNgIRI)) {
                        Model importModel = RepositoryResults.asModel(repoConn.getStatements(null, null,
                                null, importedDatasetSdNgIRI), mf);
                        createTempImport(importedDatasetIRI, importModel, conn);
                    } else {
                        Optional<Model> localModel = importsResolver.retrieveOntologyLocal(imported, ontologyManager);
                        if (localModel.isPresent()) {
                            createTempImport(importedDatasetIRI, localModel.get(), conn);
                        } else {
                            Optional<Model> webModel = importsResolver.retrieveOntologyFromWeb(imported);
                            if (webModel.isPresent()) {
                                repoConn.add(webModel.get(), importedDatasetSdNgIRI);
                                createTempImport(importedDatasetIRI, webModel.get(), conn);
                            } else {
                                conn.add(datasetIRI, vf.createIRI(OntologyDatasets.UNRESOLVED_IRI_STRING),
                                        imported, datasetIRI);
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
                        getDatasetIRI(imported, ontologyManager), vf);
                conn.removeGraph(importDatasetIRI);
                conn.remove(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), imported);
            });
            logTrace("applyDifferenceIfPresent()", start);
        }
    }

    private void createTempImport(IRI importedDatasetIRI, Model model, DatasetConnection conn) {
        LOG.trace("Adding import for inProgressCommit to cache for " + importedDatasetIRI.stringValue());
        Ontology importedOntology = new SimpleOntology(importedDatasetIRI, model, repository,
                ontologyManager, catalogManager, configProvider, datasetManager, importsResolver, transformer,
                bNodeService, vf, mf);
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
                                getDatasetIRI(importIRI, ontologyManager), vf));
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

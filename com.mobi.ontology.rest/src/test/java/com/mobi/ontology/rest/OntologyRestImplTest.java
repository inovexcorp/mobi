package com.mobi.ontology.rest;

/*-
 * #%L
 * com.mobi.ontology.rest
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

import static com.mobi.persistence.utils.ResourceUtils.encode;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rest.util.RestUtils.arrayContains;
import static com.mobi.rest.util.RestUtils.modelToJsonld;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;
import static com.mobi.rest.util.RestUtils.modelToString;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
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
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.impl.repository.SimpleAnnotation;
import com.mobi.ontology.impl.repository.SimpleAnnotationProperty;
import com.mobi.ontology.impl.repository.SimpleClass;
import com.mobi.ontology.impl.repository.SimpleDataProperty;
import com.mobi.ontology.impl.repository.SimpleDatatype;
import com.mobi.ontology.impl.repository.SimpleIndividual;
import com.mobi.ontology.impl.repository.SimpleObjectProperty;
import com.mobi.ontology.rest.json.EntityNames;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.impl.SimpleBNodeService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.base.OsgiRepositoryWrapper;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.EmptyQueryResult;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.TestQueryResult;
import com.mobi.rest.test.util.UsernameTestFilter;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import org.apache.commons.collections.IteratorUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.impl.MutableTupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.WriterConfig;
import org.eclipse.rdf4j.rio.helpers.JSONLDMode;
import org.eclipse.rdf4j.rio.helpers.JSONLDSettings;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.stubbing.Answer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class OntologyRestImplTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private OrmFactory<OntologyRecord> ontologyRecordFactory;
    private IRI catalogId;
    private IRI recordId;
    private OntologyRecord record;
    private IRI inProgressCommitId;
    private InProgressCommit inProgressCommit;
    private IRI commitId;
    private Commit commit;
    private IRI branchId;
    private Branch branch;
    private MasterBranch masterBranch;
    private User user;
    private IRI classId;
    private Difference difference;
    private Model ontologyModel;
    private Model importedOntologyModel;
    private Model constructs;
    private String entityUsagesConstruct;
    private Set<Annotation> annotations;
    private Set<AnnotationProperty> annotationProperties;
    private Set<OClass> classes;
    private Set<OClass> importedClasses;
    private Set<Datatype> datatypes;
    private Set<ObjectProperty> objectProperties;
    private Set<DataProperty> dataProperties;
    private Set<Individual> namedIndividuals;
    private Set<Individual> concepts;
    private Set<Individual> conceptSchemes;
    private Set<IRI> deprecatedIris;
    private Set<IRI> derivedConcepts;
    private Set<IRI> derivedConceptSchemes;
    private Set<IRI> derivedSemanticRelations;
    private Set<IRI> failedImports;
    private IRI datatypeIRI;
    private IRI objectPropertyIRI;
    private IRI dataPropertyIRI;
    private IRI individualIRI;
    private IRI conceptIRI;
    private IRI conceptSchemeIRI;
    private Set<Ontology> importedOntologies;
    private IRI ontologyIRI;
    private IRI importedOntologyIRI;
    private ObjectNode entityUsagesResult;
    private ObjectNode searchResults;
    private ObjectNode individualsOfResult;
    private ObjectNode basicHierarchyResults;
    private ObjectNode propertyToRanges;
    private ArrayNode importedOntologyResults;
    private ArrayNode importsClosureResults;
    private ByteArrayOutputStream ontologyJsonLd;
    private ByteArrayOutputStream ontologyTurtle;
    private ByteArrayOutputStream importedOntologyJsonLd;
    private static OsgiRepositoryWrapper repo;
    private static final String INVALID_JSON = "{id: 'invalid";
    private static final String constructJsonLd = "[ {\n  \"@id\" : \"urn:test\",\n  \"urn:prop\" : [ {\n    \"@value\" : \"test\"\n  } ]\n} ]";
    private IRI missingIRI;
    private OsgiRepositoryWrapper testQueryRepo;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Mock services used in server
    private static OntologyRest rest;
    private static ModelFactory mf;
    private static ValueFactory vf;
    private static OntologyManager ontologyManager;
    private static CatalogConfigProvider configProvider;
    private static DifferenceManager differenceManager;
    private static CommitManager commitManager;
    private static BranchManager branchManager;
    private static RecordManager recordManager;
    private static CompiledResourceManager compiledResourceManager;
    private static EngineManager engineManager;
    private static OntologyCache ontologyCache;
    private static SimpleBNodeService bNodeService;
    private static ImportsResolver importsResolver;
    private static PDP pdp;

    @Mock
    private OntologyId ontologyId;

    @Mock
    private OntologyId importedOntologyId;

    @Mock
    private Ontology ontology;

    @Mock
    private Ontology importedOntology;

    @Mock
    private PaginatedSearchResults<Record> results;

    @Mock
    private Request request;

    @Mock
    private com.mobi.security.policy.api.Response response;

    @BeforeClass
    public static void startServer() {
        objectMapper.enable(JsonParser.Feature.ALLOW_COMMENTS);
        vf = getValueFactory();
        mf = getModelFactory();

        differenceManager = Mockito.mock(DifferenceManager.class);
        commitManager = Mockito.mock(CommitManager.class);
        branchManager = Mockito.mock(BranchManager.class);
        recordManager = Mockito.mock(RecordManager.class);
        compiledResourceManager = Mockito.mock(CompiledResourceManager.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);
        ontologyManager = Mockito.mock(OntologyManager.class);
        engineManager = Mockito.mock(EngineManager.class);
        importsResolver = Mockito.mock(ImportsResolver.class);
        pdp = Mockito.mock(PDP.class);

        ontologyCache = Mockito.mock(OntologyCache.class);

        rest = new OntologyRest();
        rest.ontologyManager = ontologyManager;
        rest.configProvider = configProvider;
        rest.differenceManager = differenceManager;
        rest.commitManager = commitManager;
        rest.branchManager = branchManager;
        rest.recordManager = recordManager;
        rest.compiledResourceManager = compiledResourceManager;
        rest.engineManager = engineManager;
        rest.ontologyCache = ontologyCache;
        rest.importsResolver = importsResolver;
        rest.pdp = pdp;

        bNodeService = new SimpleBNodeService();
        rest.bNodeService = bNodeService;

        configureServer(rest, new UsernameTestFilter());
    }

    protected void configureApp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        InputStream testData = getClass().getResourceAsStream("/testOntologyData.trig");
        try (RepositoryConnection connection = repo.getConnection()) {
            connection.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);
        OrmFactory<MasterBranch> masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
        OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
        OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

        catalogId = vf.createIRI("http://mobi.com/catalog");
        recordId = vf.createIRI("http://mobi.com/record");
        record = ontologyRecordFactory.createNew(recordId);
        inProgressCommitId = vf.createIRI("http://mobi.com/in-progress-commit");
        inProgressCommit = inProgressCommitFactory.createNew(inProgressCommitId);
        commitId = vf.createIRI("http://mobi.com/commit");
        commit = commitFactory.createNew(commitId);
        branchId = vf.createIRI("http://mobi.com/branch");
        branch = branchFactory.createNew(branchId);
        masterBranch = masterBranchFactory.createNew(branchId);
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));
        record.setMasterBranch(masterBranch);
        classId = vf.createIRI("http://mobi.com/ontology#Class1a");
        IRI titleIRI = vf.createIRI(DCTERMS.TITLE.stringValue());
        Model additions = mf.createEmptyModel();
        additions.add(catalogId, titleIRI, vf.createLiteral("Addition"));
        Model deletions = mf.createEmptyModel();
        deletions.add(catalogId, titleIRI, vf.createLiteral("Deletion"));
        difference = new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build();
        WriterConfig config = new WriterConfig();
        config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        ontologyModel = mf.createEmptyModel();
        ontologyModel.addAll(Rio.parse(testOntology, "", RDFFormat.TURTLE));
        ontologyTurtle = new ByteArrayOutputStream();
        Rio.write(ontologyModel, ontologyTurtle, RDFFormat.TURTLE);
        ontologyJsonLd = new ByteArrayOutputStream();
        Rio.write(ontologyModel, ontologyJsonLd, RDFFormat.JSONLD, config);
        InputStream testVocabulary = getClass().getResourceAsStream("/test-vocabulary.ttl");
        importedOntologyModel = mf.createEmptyModel();
        importedOntologyModel.addAll(Rio.parse(testVocabulary, "", RDFFormat.TURTLE));
        importedOntologyJsonLd = new ByteArrayOutputStream();
        Rio.write(importedOntologyModel, importedOntologyJsonLd, RDFFormat.JSONLD, config);
        IRI annotationPropertyIRI = vf.createIRI("http://mobi.com/annotation-property");
        annotationProperties = Collections.singleton(new SimpleAnnotationProperty(annotationPropertyIRI));
        IRI annotationIRI = vf.createIRI("http://mobi.com/annotation");
        AnnotationProperty annotationProperty = new SimpleAnnotationProperty(annotationIRI);
        annotations = Collections.singleton(new SimpleAnnotation(annotationProperty, vf.createLiteral("word")));
        classes = Collections.singleton(new SimpleClass(vf.createIRI("http://mobi.com/ontology#Class1a")));
        importedClasses = Collections.singleton(new SimpleClass(vf.createIRI("https://mobi.com/vocabulary#ConceptSubClass")));
        datatypeIRI = vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#langString");
        datatypes = Collections.singleton(new SimpleDatatype(datatypeIRI));
        objectPropertyIRI = vf.createIRI("http://mobi.com/ontology#objectProperty1a");
        objectProperties = Collections.singleton(new SimpleObjectProperty(objectPropertyIRI));
        dataPropertyIRI = vf.createIRI("http://mobi.com/ontology#dataProperty1a");
        dataProperties = Collections.singleton(new SimpleDataProperty(dataPropertyIRI));
        individualIRI = vf.createIRI("http://mobi.com/ontology#Individual1a");
        conceptIRI = vf.createIRI("http://mobi.com/ontology#Concept");
        conceptSchemeIRI = vf.createIRI("http://mobi.com/ontology#ConceptScheme");
        namedIndividuals = Collections.singleton(new SimpleIndividual(individualIRI));
        concepts = Collections.singleton(new SimpleIndividual(conceptIRI));
        conceptSchemes = Collections.singleton(new SimpleIndividual(conceptSchemeIRI));
        deprecatedIris = Collections.singleton(vf.createIRI("https://mobi.com/vocabulary#DeprecatedIRI1"));
        derivedConcepts = Collections.singleton(vf.createIRI("https://mobi.com/vocabulary#ConceptSubClass"));
        derivedConceptSchemes = Collections.singleton(vf.createIRI("https://mobi.com/vocabulary#ConceptSchemeSubClass"));
        derivedSemanticRelations = Collections.singleton(vf.createIRI("https://mobi.com/vocabulary#SemanticRelationSubProperty"));
        importedOntologies = Stream.of(ontology, importedOntology).collect(Collectors.toSet());
        ontologyIRI = vf.createIRI("http://mobi.com/ontology-id");
        importedOntologyIRI = vf.createIRI("http://mobi.com/imported-ontology-id");
        searchResults = getResource("/search-results.json");
        entityUsagesResult = getResource("/entity-usages-results.json");
        importedOntologyResults = getResourceArray("/imported-ontology-results.json");
        importsClosureResults = getResourceArray("/imports-closure-results.json");
        individualsOfResult = getResource("/individuals-of-results.json");
        basicHierarchyResults = getResource("/basic-hierarchy.json");
        propertyToRanges = getResource("/propertyToRanges.json");

        record.setTrackedIdentifier(ontologyIRI);
        missingIRI = vf.createIRI("http://mobi.com/missing");
        Resource class1b = vf.createIRI("http://mobi.com/ontology#Class1b");
        IRI subClassOf = vf.createIRI("http://www.w3.org/2000/01/rdf-schema#subClassOf");
        Value class1a = vf.createIRI("http://mobi.com/ontology#Class1a");
        Resource individual1a = vf.createIRI("http://mobi.com/ontology#Individual1a");
        IRI type = vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
        constructs = mf.createEmptyModel();
        constructs.addAll(Stream.of(vf.createStatement(class1b, subClassOf, class1a), vf.createStatement(individual1a, type, class1a)).collect(Collectors.toSet()));
        failedImports = Collections.singleton(importedOntologyIRI);

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLimitedSize()).thenReturn(500);
    }

    @Before
    public void setupMocks() throws Exception {
        configureApp();
        final IRI skosSemanticRelation = vf.createIRI(SKOS.SEMANTIC_RELATION.stringValue());

        when(results.page()).thenReturn(Collections.emptyList());
        when(results.pageNumber()).thenReturn(0);
        when(results.pageSize()).thenReturn(0);
        when(results.totalSize()).thenReturn(0);

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));

        when(ontologyId.getOntologyIdentifier()).thenReturn(ontologyIRI);
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));

        when(ontology.getOntologyId()).thenReturn(ontologyId);
        when(ontology.asModel()).thenReturn(ontologyModel);
        when(ontology.getAllAnnotations()).thenReturn(annotations);
        when(ontology.getAllAnnotationProperties()).thenReturn(annotationProperties);
        when(ontology.getAllClasses()).thenReturn(classes);
        when(ontology.getAllDatatypes()).thenReturn(datatypes);
        when(ontology.getAllObjectProperties()).thenReturn(objectProperties);
        when(ontology.getAllDataProperties()).thenReturn(dataProperties);
        when(ontology.getAllIndividuals()).thenReturn(namedIndividuals);
        when(ontology.getDeprecatedIRIs()).thenReturn(deprecatedIris);
        when(ontology.getIndividualsOfType(SKOS.CONCEPT)).thenReturn(concepts);
        when(ontology.getIndividualsOfType(SKOS.CONCEPT_SCHEME)).thenReturn(conceptSchemes);
        when(ontology.getImportsClosure()).thenReturn(importedOntologies);
        when(ontology.asJsonLD(anyBoolean())).thenReturn(ontologyJsonLd);
        when(ontology.asJsonLD(anyBoolean(), any())).thenAnswer((Answer<OutputStream>) invocation -> {
            Object[] args = invocation.getArguments();
            OutputStream os = (OutputStream) args[1];
            WriterConfig config = new WriterConfig();
            config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
            Rio.write(ontologyModel, os, RDFFormat.JSONLD, config);
            return os;
        });
        when(ontology.asTurtle(any())).thenAnswer((Answer<OutputStream>) invocation -> {
            Object[] args = invocation.getArguments();
            OutputStream os = (OutputStream) args[0];
            Rio.write(ontologyModel, os, RDFFormat.TURTLE);
            return os;
        });
        when(ontology.getUnloadableImportIRIs()).thenReturn(failedImports);
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i -> new EmptyQueryResult());
        Model queryResultModel = mf.createEmptyModel();
        queryResultModel.add(vf.createStatement(vf.createIRI("urn:test"), vf.createIRI("urn:prop"), vf.createLiteral("test")));
        when(ontology.getGraphQueryResults(anyString(), anyBoolean())).thenReturn(queryResultModel);

        when(importedOntologyId.getOntologyIdentifier()).thenReturn(importedOntologyIRI);
        when(importedOntologyId.getOntologyIRI()).thenReturn(Optional.of(importedOntologyIRI));

        when(importedOntology.getOntologyId()).thenReturn(importedOntologyId);
        when(importedOntology.asModel()).thenReturn(importedOntologyModel);
        when(importedOntology.getAllAnnotations()).thenReturn(annotations);
        when(importedOntology.getAllAnnotationProperties()).thenReturn(annotationProperties);
        when(importedOntology.getAllClasses()).thenReturn(importedClasses);
        when(importedOntology.getAllDatatypes()).thenReturn(datatypes);
        when(importedOntology.getAllObjectProperties()).thenReturn(objectProperties);

        when(importedOntology.getAllDataProperties()).thenReturn(dataProperties);
        when(importedOntology.getAllIndividuals()).thenReturn(namedIndividuals);
        when(importedOntology.getIndividualsOfType(SKOS.CONCEPT)).thenReturn(concepts);
        when(importedOntology.getIndividualsOfType(SKOS.CONCEPT_SCHEME)).thenReturn(conceptSchemes);
        when(importedOntology.asJsonLD(anyBoolean())).thenReturn(importedOntologyJsonLd);
        when(importedOntology.asJsonLD(anyBoolean(), any())).thenAnswer((Answer<OutputStream>) invocation -> {
            Object[] args = invocation.getArguments();
            OutputStream os = (OutputStream) args[1];
            WriterConfig config = new WriterConfig();
            config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN); // TODO FIX
            Rio.write(ontologyModel, os, RDFFormat.JSONLD, config);
            return os;
        });
        when(importedOntology.getImportsClosure()).thenReturn(Collections.singleton(importedOntology));

        when(recordManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class), any(RepositoryConnection.class))).thenReturn(results);
        when(recordManager.getRecordOpt(eq(catalogId), eq(recordId), any(OntologyRecordFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.of(record));
        when(recordManager.removeRecord(eq(catalogId), eq(recordId), eq(user), eq(OntologyRecord.class), any(RepositoryConnection.class))).thenReturn(record);
        when(commitManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId), eq(user), any(RepositoryConnection.class))).thenReturn(Optional.of(inProgressCommit));
        when(commitManager.createCommit(eq(inProgressCommit), anyString(), any(Commit.class), any(Commit.class), anyBoolean())).thenReturn(commit);
        when(differenceManager.applyInProgressCommit(eq(inProgressCommitId), any(Model.class), any(RepositoryConnection.class))).thenReturn(mf.createEmptyModel());
        when(differenceManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class), eq(OntologyRecord.class), any(RepositoryConnection.class))).thenReturn(record);

        when(ontologyManager.retrieveOntology(eq(recordId), any(Resource.class), any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntology(eq(recordId), any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntologyByCommit(eq(recordId), any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntology(recordId)).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntology(eq(importedOntologyIRI), any(Resource.class), any(Resource.class))).thenReturn(Optional.of(importedOntology));
        when(ontologyManager.retrieveOntology(eq(importedOntologyIRI), any(Resource.class))).thenReturn(Optional.of(importedOntology));
        when(ontologyManager.retrieveOntology(importedOntologyIRI)).thenReturn(Optional.of(importedOntology));
        when(ontologyManager.applyChanges(eq(ontology), eq(inProgressCommit))).thenReturn(ontology);

        when(ontology.getSubClassesFor(any(IRI.class))).thenReturn(Collections.singleton(vf.createIRI("https://mobi.com/values#Value1")));
        when(importedOntology.getSubClassesFor(any(IRI.class))).thenReturn(Collections.singleton(vf.createIRI("https://mobi.com/values#Value1")));
        when(ontology.getSubPropertiesFor(eq(skosSemanticRelation))).thenReturn(Collections.singleton(vf.createIRI("https://mobi.com/values#Value1")));
        when(importedOntology.getSubPropertiesFor(eq(skosSemanticRelation))).thenReturn(Collections.singleton(vf.createIRI("https://mobi.com/values#Value1")));

        Hierarchy individualsHierarchy = new Hierarchy(vf, mf);
        individualsHierarchy.addParentChild(vf.createIRI("https://mobi.com#parent"), vf.createIRI("https://mobi.com#individual"));
        when(ontology.getClassesWithIndividuals()).thenReturn(individualsHierarchy);
        when(importedOntology.getClassesWithIndividuals()).thenReturn(individualsHierarchy);

        Hierarchy hierarchy = new Hierarchy(vf, mf);
        hierarchy.addParentChild(vf.createIRI("https://mobi.com#parent"), vf.createIRI("https://mobi.com#child"));
        hierarchy.addCircularRelationship(vf.createIRI("https://mobi.com#parent"), vf.createIRI("https://mobi.com#child"),
                new HashSet<>(Arrays.asList("https://mobi.com#child", "https://mobi.com#parent")));
        when(ontology.getSubClassesOf()).thenReturn(hierarchy);
        when(importedOntology.getSubClassesOf()).thenReturn(hierarchy);
        when(ontology.getSubObjectPropertiesOf()).thenReturn(hierarchy);
        when(ontology.getSubDatatypePropertiesOf()).thenReturn(hierarchy);
        when(ontology.getSubAnnotationPropertiesOf()).thenReturn(hierarchy);
        when(ontology.getConceptRelationships()).thenReturn(hierarchy);
        when(ontology.getConceptSchemeRelationships()).thenReturn(hierarchy);

        List<String> entityBindings = Stream.of("s", "p", "o").collect(Collectors.toList());
        List<String> entityValues = Stream.of("https://mobi.com#subject", "https://mobi.com#predicate", "https://mobi.com#object").collect(Collectors.toList());
        when(ontology.getEntityUsages(any(Resource.class))).thenAnswer(i -> new TestQueryResult(entityBindings, entityValues, 1, vf));

        List<String> searchBindings = Stream.of("entity", "type").collect(Collectors.toList());
        List<String> searchValues = Stream.of("https://mobi.com#entity", "https://mobi.com#type").collect(Collectors.toList());
        when(ontology.getSearchResults(anyString())).thenAnswer(i -> new TestQueryResult(searchBindings, searchValues, 1, vf));

        when(ontology.constructEntityUsages(any(Resource.class))).thenReturn(constructs);

        entityUsagesConstruct = modelToJsonld(constructs);

        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.evaluate(any(), any(IRI.class))).thenReturn(response);

        testQueryRepo = new MemoryRepositoryWrapper();
        testQueryRepo.setDelegate(new SailRepository(new MemoryStore()));
    }

    private void mockGraphQueryResultStream(String outputStreamResult) {
        when(ontology.getGraphQueryResultsStream(anyString(), anyBoolean(), any(RDFFormat.class), anyBoolean(), any(OutputStream.class))).thenAnswer(
            (Answer) invocation -> {
                OutputStream graphQueryOutputStream = (OutputStream) invocation.getArguments()[4];
                try {
                    graphQueryOutputStream.write(outputStreamResult.getBytes(StandardCharsets.UTF_8));
                } catch (IOException e) {
                    fail("Failed to create outputStream");
                }
                return graphQueryOutputStream;
            });
    }

    @After
    public void resetMocks() throws Exception {
        reset(engineManager, ontologyId, ontology, importedOntologyId, importedOntology,
                differenceManager, commitManager, branchManager, recordManager, compiledResourceManager,
                ontologyManager, results, ontologyCache, ontologyCache);
        if (testQueryRepo != null) {
            testQueryRepo.shutDown();
        }
        closeable.close();
    }

    @AfterClass
    public static void tearDown() {
        repo.shutDown();
    }
    
    private ObjectNode getObjectValue(ObjectNode object, String key) {
        JsonNode node = object.get(key);
        assertNotNull(node);
        assertTrue(node.isObject());
        return (ObjectNode) node;
    }

    private ArrayNode getArrayValue(ObjectNode object, String key) {
        JsonNode node = object.get(key);
        assertNotNull(node);
        assertTrue(node.isArray());
        return (ArrayNode) node;
    }
    
    private ObjectNode getResource(String path) throws Exception {
        return objectMapper.readValue(IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream(path)),
                StandardCharsets.UTF_8), ObjectNode.class);
    }

    private String getResourceString(String path) throws IOException {
        return IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream(path)), StandardCharsets.UTF_8);
    }

    private ArrayNode getResourceArray(String path) throws Exception {
        return objectMapper.readValue(IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream(path)),
                StandardCharsets.UTF_8), ArrayNode.class);
    }

    private void assertGetInProgressCommitIRI(boolean hasInProgressCommit) {
        assertGetUserFromContext();
        verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(Resource.class), any(Resource.class), any(User.class), any(RepositoryConnection.class));
        if (!hasInProgressCommit) {
            verify(commitManager).createInProgressCommit(any(User.class));
            verify(commitManager).addInProgressCommit(any(Resource.class), any(Resource.class), any(InProgressCommit.class), any(RepositoryConnection.class));
        }
    }

    private void assertGetUserFromContext() {
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }

    private void assertGetOntology(boolean hasInProgressCommit) {
        assertGetUserFromContext();
        verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(Resource.class), any(Resource.class), any(User.class), any(RepositoryConnection.class));
        if (hasInProgressCommit) {
            verify(ontologyManager).applyChanges(any(Ontology.class), any(InProgressCommit.class));
        }
    }

    private String createJsonIRI(IRI iri) {
        return iri.stringValue();
    }

    private Set<String> createSetClassIRIs(Set<OClass> classes) {
        return classes.stream()
                .map(oclass -> oclass.getIRI().stringValue())
                .collect(Collectors.toSet());
    }

    private Set<String> createSetDatatypeIRIs(Set<Datatype> datatypes) {
        return datatypes.stream()
                .map(datatype -> datatype.getIRI().stringValue())
                .collect(Collectors.toSet());
    }

    private Set<String> createSetObjectPropertyIRIs(Set<ObjectProperty> objectProperties) {
        return objectProperties.stream()
                .map(objectProperty -> objectProperty.getIRI().stringValue())
                .collect(Collectors.toSet());
    }

    private Set<String> createSetDataPropertyIRIs(Set<DataProperty> dataProperties) {
        return dataProperties.stream()
                .map(dataProperty -> dataProperty.getIRI().stringValue())
                .collect(Collectors.toSet());
    }

    private Set<String> createSetAnnotationPropertyIRIs(Set<AnnotationProperty> annotationProperties) {
        return annotationProperties.stream()
                .map(annotationProperty -> annotationProperty.getIRI().stringValue())
                .collect(Collectors.toSet());
    }

    private Set<String> createSetIndividualIRIs(Set<Individual> individuals) {
        return individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .collect(Collectors.toSet());
    }

    private void assertAnnotations(ObjectNode responseObject, Set<AnnotationProperty> propSet, Set<Annotation> annSet) {
        JsonNode jsonAnnotations = responseObject.get("annotationProperties");
        assertNotNull(jsonAnnotations);
        assertTrue(jsonAnnotations.isArray());
        assertEquals(jsonAnnotations.size(), propSet.size());
        propSet.forEach(annotationProperty ->
                assertTrue(arrayContains((ArrayNode) jsonAnnotations, createJsonIRI(annotationProperty.getIRI()))));
    }

    private void assertHierarchyResults(Response response, Set<String> iris) {
        ObjectNode responseObj = getResponse(response);
        assertTrue(IteratorUtils.toList(responseObj.fieldNames()).containsAll(IteratorUtils.toList(basicHierarchyResults.fieldNames())));
        assertIRIObject(responseObj, "iris", iris);
    }

    private void assertIRIObject(ObjectNode responseObject, String key, Set<String> set) {
        ArrayNode jsonArr = getArrayValue(responseObject, key);
        System.out.println(jsonArr);
        assertEquals(jsonArr.size(), set.size());
        set.forEach(iri -> assertTrue(arrayContains(jsonArr, iri)));
    }

    private void assertClassIRIs(ObjectNode responseObject, Set<OClass> set) {
        Set<String> iris = createSetClassIRIs(set);
        assertIRIObject(responseObject, "classes", iris);
    }

    private void assertClasses(ArrayNode responseArray, Set<OClass> set) {
        assertNotNull(responseArray);
        assertEquals(responseArray.size(), set.size());
    }

    private void assertDatatypes(ObjectNode responseObject, Set<Datatype> set) {
        Set<String> iris = createSetDatatypeIRIs(set);
        assertIRIObject(responseObject, "datatypes", iris);
    }

    private void assertObjectPropertyIRIs(ObjectNode responseObject, Set<ObjectProperty> set) {
        Set<String> iris = createSetObjectPropertyIRIs(set);
        assertIRIObject(responseObject, "objectProperties", iris);
    }

    private void assertObjectProperties(ArrayNode responseArray, Set<ObjectProperty> set) {
        assertNotNull(responseArray);
        assertEquals(responseArray.size(), set.size());
    }

    private void assertDataPropertyIRIs(ObjectNode responseObject, Set<DataProperty> set) {
        Set<String> iris = createSetDataPropertyIRIs(set);
        assertIRIObject(responseObject, "dataProperties", iris);
    }

    private void assertDataProperties(ArrayNode responseArray, Set<DataProperty> set) {
        assertNotNull(responseArray);
        assertEquals(responseArray.size(), set.size());
    }

    private void assertIndividuals(ObjectNode responseObject, Set<Individual> set) {
        Set<String> iris = createSetIndividualIRIs(set);
        assertIRIObject(responseObject, "namedIndividuals", iris);
    }

    private void assertConcepts(ObjectNode responseObject, Set<Individual> set) {
        Set<String> iris = createSetIndividualIRIs(set);
        assertIRIObject(responseObject, "concepts", iris);
    }

    private void assertConceptSchemes(ObjectNode responseObject, Set<Individual> set) {
        Set<String> iris = createSetIndividualIRIs(set);
        assertIRIObject(responseObject, "conceptSchemes", iris);
    }

    private void assertDerivedConcepts(ObjectNode responseObject, Set<IRI> set) {
        JsonNode jsonConcepts = responseObject.get("derivedConcepts");
        assertNotNull(jsonConcepts);
        assertTrue(jsonConcepts.isArray());
        assertEquals(jsonConcepts.size(), set.size());
    }

    private void assertDeprecatedIris(ObjectNode responseObject, Set<IRI> set) {
        JsonNode jsonConcepts = responseObject.get("deprecatedIris");
        assertNotNull(jsonConcepts);
        assertTrue(jsonConcepts.isArray());
        assertEquals(jsonConcepts.size(), set.size());
    }

    private void assertDerivedConceptSchemes(ObjectNode responseObject, Set<IRI> set) {
        JsonNode jsonConceptSchemes = responseObject.get("derivedConceptSchemes");
        assertNotNull(jsonConceptSchemes);
        assertTrue(jsonConceptSchemes.isArray());
        assertEquals(jsonConceptSchemes.size(), set.size());
    }

    private void assertDerivedSemanticRelations(ObjectNode responseObject, Set<IRI> set) {
        JsonNode jsonSemanticRelations = responseObject.get("derivedSemanticRelations");
        assertNotNull(jsonSemanticRelations);
        assertTrue(jsonSemanticRelations.isArray());
        assertEquals(jsonSemanticRelations.size(), set.size());
    }

    private void assertAdditionsToInProgressCommit(boolean hasInProgressCommit) {
        assertGetInProgressCommitIRI(hasInProgressCommit);
        verify(commitManager).updateInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(Model.class), eq(null), any(RepositoryConnection.class));
    }

    private void assertDeletionsToInProgressCommit(boolean hasInProgressCommit) {
        assertGetInProgressCommitIRI(hasInProgressCommit);
        verify(commitManager).updateInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), eq(null), any(Model.class), any(RepositoryConnection.class));
    }

    private void assertImportedOntologies(ArrayNode responseArray, Consumer<ObjectNode> assertConsumer) {
        for (JsonNode node : responseArray) {
            assertTrue(node.isObject());
            String ontologyId = node.get("id").asText();
            assertNotEquals(importedOntologies.stream()
                    .filter(ont -> ont.getOntologyId().getOntologyIdentifier().stringValue().equals(ontologyId))
                    .toList().size(), 0);
            assertConsumer.accept((ObjectNode) node);
        }
    }

    private void setNoInProgressCommit() {
        when(commitManager.getInProgressCommitOpt(any(Resource.class), any(Resource.class), any(User.class), any(RepositoryConnection.class)))
                .thenReturn(Optional.empty());
    }

    private void assertCreatedOntologyIRI(ObjectNode responseObject) {
        JsonNode ontologyId = responseObject.get("ontologyId");
        assertNotNull(ontologyId);
        assertTrue(ontologyId.isTextual());
        assertEquals(ontologyIRI.stringValue(), ontologyId.asText());
    }

    private ObjectNode getResponse(Response response) {
        try {
            return objectMapper.readValue(response.readEntity(String.class), ObjectNode.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Expected no exception", e);
        }
    }

    private ArrayNode getResponseArray(Response response) {
        try {
            return objectMapper.readValue(response.readEntity(String.class), ArrayNode.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Expected no exception", e);
        }
    }

    private JsonNode getResponseNode(Response response, String node) throws IOException {
        return objectMapper.readTree(response.readEntity(String.class)).get(node);
    }

    private ObjectNode createJsonOfType(String type) {
        return objectMapper.createObjectNode().set("@type", objectMapper.createArrayNode().add(type));
    }

    private void assertGetOntologyStuff(Response response) {
        ObjectNode responseObject = getResponse(response);
        ObjectNode iriList = getObjectValue(responseObject, "iriList");

        assertAnnotations(iriList, annotationProperties, annotations);
        assertClassIRIs(iriList, classes);
        assertDatatypes(iriList, datatypes);
        assertObjectPropertyIRIs(iriList, objectProperties);
        assertDataPropertyIRIs(iriList, dataProperties);
        assertIndividuals(iriList, namedIndividuals);
        assertConcepts(iriList, concepts);
        assertConceptSchemes(iriList, conceptSchemes);
        assertDeprecatedIris(iriList, deprecatedIris);
        assertDerivedConcepts(iriList, derivedConcepts);
        assertDerivedConceptSchemes(iriList, derivedConceptSchemes);
        assertDerivedSemanticRelations(iriList, derivedSemanticRelations);

        assertImportedOntologies(getArrayValue(responseObject, "importedIRIs"), (importedObject) -> {
            assertAnnotations(importedObject, annotationProperties, annotations);
            assertClassIRIs(importedObject, importedClasses);
            assertDatatypes(importedObject, datatypes);
            assertObjectPropertyIRIs(importedObject, objectProperties);
            assertDataPropertyIRIs(importedObject, dataProperties);
            assertIndividuals(importedObject, namedIndividuals);
            assertConcepts(importedObject, concepts);
            assertConceptSchemes(importedObject, conceptSchemes);
            assertDerivedConcepts(importedObject, derivedConcepts);
            assertDerivedConceptSchemes(importedObject, derivedConceptSchemes);
            assertDerivedSemanticRelations(importedObject, derivedSemanticRelations);
        });

        assertEquals(importedOntologyResults, getArrayValue(responseObject, "importedOntologies"));
        assertFailedImports(getArrayValue(responseObject, "failedImports"));
        assertEquals(basicHierarchyResults, getObjectValue(responseObject, "classHierarchy"));
        assertEquals(getObjectValue(individualsOfResult, "individuals"), getObjectValue(responseObject, "individuals"));
        assertEquals(basicHierarchyResults, getObjectValue(responseObject, "dataPropertyHierarchy"));
        assertEquals(basicHierarchyResults, getObjectValue(responseObject, "objectPropertyHierarchy"));
        assertEquals(basicHierarchyResults, getObjectValue(responseObject, "annotationHierarchy"));
        assertEquals(basicHierarchyResults, getObjectValue(responseObject, "conceptHierarchy"));
        assertEquals(basicHierarchyResults, getObjectValue(responseObject, "conceptSchemeHierarchy"));
    }

    private void assertFailedImports(ArrayNode failedImports) {
        assertEquals(failedImports.size(), 1);
        assertEquals(importedOntologyIRI.stringValue(), failedImports.get(0).asText());
    }

    private void assertSelectQuery(ObjectNode queryResults) {
        ObjectNode head = getObjectValue(queryResults, "head");
        ArrayNode vars = getArrayValue(head, "vars");
        assertEquals(vars.size(), 1);
        ObjectNode results = getObjectValue(queryResults, "results");
        ArrayNode bindings = getArrayValue(results, "bindings");
        assertEquals(bindings.size(), 1);
    }

    private void assertConstructQuery(String queryResults) {
        assertNotNull(queryResults);
        assertEquals(constructJsonLd, queryResults.replaceAll("\\r\\n?", "\n"));
    }

    private void assertGroupedSelectQuery(ObjectNode queryResults) {
        ObjectNode ontologyResult = getObjectValue(queryResults, "http://mobi.com/ontology-id");
        ObjectNode head = getObjectValue(ontologyResult, "head");
        ArrayNode vars = getArrayValue(head, "vars");
        assertEquals(vars.size(), 1);
        ObjectNode results = getObjectValue(ontologyResult, "results");
        ArrayNode bindings = getArrayValue(results, "bindings");
        assertEquals(bindings.size(), 1);
    }

    private void assertGroupedConstructQuery(ObjectNode queryResults) {
        String expectedResult = "[\"(urn:test, urn:prop, \\\"test\\\")\"]";
        ObjectNode ontologyResult = getObjectValue(queryResults, "http://mobi.com/ontology-id");
        ArrayNode bindings = getArrayValue(ontologyResult, "bindings");
        assertEquals(bindings.size(), 1);
        assertEquals(bindings.toString(), expectedResult);
    }

    private void assertEntityNames(Response response, boolean fromNode, Set<String> keys) throws Exception {
        Map<String, EntityNames> expectedValues = objectMapper.readValue(
                getResourceString("/getOntologyStuffData/entityNames-results.json"),
                new TypeReference<>() {}
        );
        if (keys.size() > 0) {
            expectedValues = keys.stream()
                    .filter(expectedValues::containsKey)
                    .collect(Collectors.toMap(Function.identity(), expectedValues::get));
        }

        Map<String, EntityNames> actualValues = objectMapper.convertValue(
                fromNode ? getResponseNode(response, "entityNames") : getResponse(response),
                new TypeReference<Map<String, EntityNames>>(){});
        assertEquals(actualValues.keySet(), expectedValues.keySet());
        Map<String, EntityNames> finalExpectedValues = expectedValues;
        actualValues.forEach((s, entityNames1) ->
                assertEquals(entityNames1.getNames(), finalExpectedValues.get(s).getNames()));
    }

    @Test
    public void testDoWithOntologies() {
        Ontology mockOntology1 = mock(Ontology.class);
        OntologyId mockOntology1Id = mock(OntologyId.class);
        when(mockOntology1.getOntologyId()).thenReturn(mockOntology1Id);
        when(mockOntology1Id.getOntologyIRI()).thenReturn(Optional.empty());
        when(mockOntology1Id.getOntologyIdentifier()).thenReturn(vf.createIRI("http://mobi.com/getOntologyIdentifier"));

        Ontology mockOntology2 = mock(Ontology.class);
        OntologyId mockOntology2Id = mock(OntologyId.class);
        when(mockOntology2.getOntologyId()).thenReturn(mockOntology2Id);
        when(mockOntology2Id.getOntologyIRI()).thenReturn(Optional.of(vf.createIRI("http://mobi.com/getOntologyIRI")));

        Set<Ontology> set = new LinkedHashSet<>();
        set.add(mockOntology1);
        set.add(mockOntology2);

        ArrayNode array = OntologyRest.doWithOntologies(set, (ontology1 ->  objectMapper.createObjectNode() ));
        assertEquals(array.toString(), "[{\"id\":\"http://mobi.com/getOntologyIdentifier\"},{\"id\":\"http://mobi.com/getOntologyIRI\"}]");
    }

    // Test upload file
    @Test
    public void testUploadFile() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertCreatedOntologyIRI(getResponse(response));
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(recordManager).createRecord(any(User.class), config.capture(), eq(OntologyRecord.class), any(RepositoryConnection.class));
        assertEquals(catalogId.stringValue(), config.getValue().get(RecordCreateSettings.CATALOG_ID));
        assertEquals("title", config.getValue().get(RecordCreateSettings.RECORD_TITLE));
        assertEquals("description", config.getValue().get(RecordCreateSettings.RECORD_DESCRIPTION));
        assertEquals("#markdown", config.getValue().get(RecordCreateSettings.RECORD_MARKDOWN));
        assertEquals(Stream.of("keyword1", "keyword2").collect(Collectors.toSet()), config.getValue().get(RecordCreateSettings.RECORD_KEYWORDS));
        assertEquals(Collections.singleton(user), config.getValue().get(RecordCreateSettings.RECORD_PUBLISHERS));
        assertNotNull(config.getValue().get(VersionedRDFRecordCreateSettings.INPUT_STREAM));
        assertGetUserFromContext();
    }

    @Test
    public void testUploadErrorMobiException() {
        Mockito.doThrow(new MobiException("I'm an exception!")).when(recordManager).createRecord(any(), any(), any(), any(RepositoryConnection.class));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-local-imports-1e.ttl", getClass().getResourceAsStream("/test-local-imports-1e.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(500, response.getStatus());

        ObjectNode responseObject = getResponse(response);
        assertEquals("MobiException", responseObject.get("error").asText());
        assertEquals("I'm an exception!", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void testUploadErrorRDFParseException() {
        Mockito.doThrow(new RDFParseException("I'm an exception!")).when(recordManager).createRecord(any(), any(), any(), any(RepositoryConnection.class));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-local-imports-1e.ttl", getClass().getResourceAsStream("/test-local-imports-1e.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(400, response.getStatus());

        ObjectNode responseObject = getResponse(response);
        assertEquals("RDFParseException", responseObject.get("error").asText());
        assertEquals("I'm an exception!", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void testUploadErrorIllegalArgumentException() {
        Mockito.doThrow(new IllegalArgumentException("I'm an exception!")).when(recordManager).createRecord(any(), any(), any(), any(RepositoryConnection.class));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-local-imports-1e.ttl", getClass().getResourceAsStream("/test-local-imports-1e.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(400, response.getStatus());

        ObjectNode responseObject = getResponse(response);
        assertEquals("IllegalArgumentException", responseObject.get("error").asText());
        assertEquals("I'm an exception!", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void testUploadFileWithoutTitle() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    // Test upload ontology json

    @Test
    public void testUploadOntologyJson() {
        ObjectNode ontologyJson = objectMapper.createObjectNode().put("@id", "http://mobi.com/ontology");
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("json", ontologyJson.toString());
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 201);
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(recordManager).createRecord(any(User.class), config.capture(), eq(OntologyRecord.class), any(RepositoryConnection.class));
        assertEquals(catalogId.stringValue(), config.getValue().get(RecordCreateSettings.CATALOG_ID));
        assertEquals("title", config.getValue().get(RecordCreateSettings.RECORD_TITLE));
        assertEquals("description", config.getValue().get(RecordCreateSettings.RECORD_DESCRIPTION));
        assertEquals("#markdown", config.getValue().get(RecordCreateSettings.RECORD_MARKDOWN));
        assertEquals(Stream.of("keyword1", "keyword2").collect(Collectors.toSet()), config.getValue().get(RecordCreateSettings.RECORD_KEYWORDS));
        assertEquals(Collections.singleton(user), config.getValue().get(RecordCreateSettings.RECORD_PUBLISHERS));
        assertNotNull(config.getValue().get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA));
        assertCreatedOntologyIRI(getResponse(response));
        assertGetUserFromContext();
    }

    @Test
    public void testUploadOntologyJsonWithoutTitle() {
        ObjectNode entity = objectMapper.createObjectNode().put("@id", "http://mobi.com/entity");

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("json", entity.toString());
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void testUploadOntologyWithoutJsonOrFile() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void testUploadOntologyJsonAndFile() {
        ObjectNode ontologyJson = objectMapper.createObjectNode().put("@id", "http://mobi.com/ontology");
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("json", ontologyJson.toString());
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    // Test get ontology

    @Test
    public void testDownloadOntologyFile() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(200, response.getStatus());
        assertGetOntology(true);
    }

    @Test
    public void testDownloadOntologyFileWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(200, response.getStatus());
        assertGetOntology(false);
    }

    @Test
    public void testDownloadOntologyFileWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(200, response.getStatus());
        assertGetOntology(true);
    }

    @Test
    public void testDownloadOntologyFileMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(200, response.getStatus());
        assertGetOntology(true);
    }

    @Test
    public void testDownloadOntologyFileWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(400, response.getStatus());
    }

    // Test download ontology file

    @Test
    public void testGetOntologyClearCache() {
        when(ontologyCache.containsKey(anyString())).thenReturn(false);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("clearCache", true).request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(200, response.getStatus());
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(ontologyCache).removeFromCache(recordId.stringValue(), commitId.stringValue());
        // OntologyManger will handle caching the ontology
        verify(ontologyCache, times(0)).put(anyString(), any(Ontology.class));
    }

    @Test
    public void testGetOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(200, response.getStatus());
        assertGetOntology(false);
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(ontologyCache, times(0)).removeFromCache(anyString(), anyString());
    }

    @Test
    public void testGetOntologyWithDoNotApplyInProgressCommit() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("applyInProgressCommit", false)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(200, response.getStatus());
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(engineManager, times(0)).retrieveUser(anyString());
        verify(commitManager, times(0)).getInProgressCommitOpt(any(Resource.class), any(Resource.class), any(User.class), any(RepositoryConnection.class));
        verify(differenceManager, times(0)).applyInProgressCommit(any(Resource.class), any(Model.class), any(RepositoryConnection.class));
        verify(ontologyCache, times(0)).removeFromCache(anyString(), anyString());
    }

    @Test
    public void testGetOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(200, response.getStatus());
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(ontologyCache, times(0)).removeFromCache(anyString(),  anyString());
    }

    @Test
    public void testGetOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(200, response.getStatus());
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(ontologyCache, times(0)).removeFromCache(anyString(),  anyString());
    }

    @Test
    public void testGetOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(400, response.getStatus());
    }

    // Test save changes to ontology

    @Test
    public void testSaveChangesToOntology() {
        ObjectNode entity = objectMapper.createObjectNode().put("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void testSaveChangesToOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        ObjectNode entity = objectMapper.createObjectNode().put("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertGetInProgressCommitIRI(false);
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void testSaveChangesToOntologyWithNoDifference() {
        when(differenceManager.getDiff(any(Model.class), any(Model.class))).thenReturn(new Difference.Builder()
                .build());

        ObjectNode entity = objectMapper.createObjectNode().put("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), eq(null), eq(null), any(RepositoryConnection.class));
    }

    @Test
    public void testSaveChangesToOntologyWithCommitIdAndMissingBranchId() {
        ObjectNode entity = objectMapper.createObjectNode().put("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().post(Entity.json(entity.toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void testSaveChangesToOntologyMissingCommitId() {
        ObjectNode entity = objectMapper.createObjectNode().put("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().post(Entity.json(entity.toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void testSaveChangesToOntologyMissingBranchIdAndMissingCommitId() {
        ObjectNode entity = objectMapper.createObjectNode().put("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void testSaveChangesToOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        ObjectNode entity = objectMapper.createObjectNode().put("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(400, response.getStatus());
    }

    // Test get vocabulary stuff

    @Test
    public void testGetVocabularyStuff() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        ObjectNode responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(getObjectValue(responseObject, "conceptHierarchy"), basicHierarchyResults);
        assertEquals(getObjectValue(responseObject, "conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffWithNoInProgressCommit() {
        // Setup:
        setNoInProgressCommit();
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        ObjectNode responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(getObjectValue(responseObject, "conceptHierarchy"), basicHierarchyResults);
        assertEquals(getObjectValue(responseObject, "conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        ObjectNode responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(getObjectValue(responseObject, "conceptHierarchy"), basicHierarchyResults);
        assertEquals(getObjectValue(responseObject, "conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("branchId", branchId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        ObjectNode responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(getObjectValue(responseObject, "conceptHierarchy"), basicHierarchyResults);
        assertEquals(getObjectValue(responseObject, "conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        ObjectNode responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(getObjectValue(responseObject, "conceptHierarchy"), basicHierarchyResults);
        assertEquals(getObjectValue(responseObject, "conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffWhenRetrieveOntologyIsEmpty() {
        // Setup:
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    // Test get ontology stuff

    @Test
    public void testGetOntologyStuff() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertGetOntologyStuff(response);
    }

    @Test
    public void testGetOntologyStuffWithNoInProgressCommit() {
        // Setup:
        setNoInProgressCommit();
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertGetOntologyStuff(response);
    }

    @Test
    public void testGetOntologyStuffWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertGetOntologyStuff(response);
    }

    @Test
    public void testGetOntologyStuffMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertGetOntologyStuff(response);
    }

    @Test
    public void testGetOntologyStuffMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertGetOntologyStuff(response);
    }

    @Test
    public void testGetOntologyStuffWhenRetrieveOntologyIsEmpty() {
        // Setup:
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetOntologyStuffPropertyToRanges() throws Exception {
        setupTupleQueryMock();

        Model data = getModel("/getOntologyStuffData/ontologyData.ttl");
        ObjectNode expectedResults = getResource("/getOntologyStuffData/propertyToRanges-results.json");

        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            conn.add(data);
        }

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(getObjectValue(responseObject, "propertyToRanges"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffPropertyToRangesNoResults() {
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.has("propertyToRanges"));
        assertEquals(getObjectValue(responseObject, "propertyToRanges"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffClassToAssociatedProperties() throws Exception {
        setupTupleQueryMock();

        Model data = getModel("/getOntologyStuffData/ontologyData.ttl");
        ObjectNode expectedResults = getResource("/getOntologyStuffData/classToAssociatedProperties-results.json");

        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            conn.add(data);
        }

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(getObjectValue(responseObject, "classToAssociatedProperties"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffClassToAssociatedPropertiesNoResults() {
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.has("classToAssociatedProperties"));
        assertEquals(getObjectValue(responseObject, "classToAssociatedProperties"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffNoDomainProperties() throws Exception {
        setupTupleQueryMock();

        Model data = getModel("/getOntologyStuffData/ontologyData.ttl");
        ArrayNode expectedResults = getResourceArray("/getOntologyStuffData/noDomainProperties-results.json");

        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            conn.add(data);
        }

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);

        Set<String> actual = new HashSet<>();
        getArrayValue(responseObject, "noDomainProperties").forEach(o -> actual.add(o.asText()));

        Set<String> expected = new HashSet<>();
        expectedResults.forEach(o -> expected.add(o.asText()));

        assertEquals(actual, expected);
    }

    @Test
    public void testGetOntologyStuffNoDomainPropertiesNoResults() {
        ArrayNode expectedResults = objectMapper.createArrayNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.has("noDomainProperties"));
        assertEquals(getArrayValue(responseObject, "noDomainProperties"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffEntityNames() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEntityNames(response, true, Collections.emptySet());
    }

    @Test
    public void testGetOntologyStuffEntityNamesNoResults() {
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.has("entityNames"));
        assertEquals(getObjectValue(responseObject, "entityNames"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffEntityNamesBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.has("entityNames"));
        assertEquals(getObjectValue(responseObject, "entityNames"), expectedResults);
    }

    // Test PropertyToRanges in ontology

    // Test PropertyToRanges in ontology

    @Test
    public void testGetPropertyToRanges() {
        List<String> bindings = Arrays.asList("prop", "range");
        List<String> values = Arrays.asList("urn:hasTopping", "urn:PizzaTopping");
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(bindings, values, 2, vf));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/property-ranges")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(getResponse(response), propertyToRanges);
    }

    @Test
    public void testGetPropertyToRangesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        List<String> bindings = Arrays.asList("prop", "range");
        List<String> values = Arrays.asList("urn:hasTopping", "urn:PizzaTopping");
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(bindings, values, 2, vf));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/property-ranges")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(getResponse(response), propertyToRanges);
    }
    // Test get IRIs in ontology

    @Test
    public void testGetIRIsInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        ObjectNode responseObject = getResponse(response);
        assertAnnotations(responseObject, annotationProperties, annotations);
        assertClassIRIs(responseObject, classes);
        assertDatatypes(responseObject, datatypes);
        assertObjectPropertyIRIs(responseObject, objectProperties);
        assertDataPropertyIRIs(responseObject, dataProperties);
        assertIndividuals(responseObject, namedIndividuals);
        assertDeprecatedIris(responseObject, deprecatedIris);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
    }

    @Test
    public void testGetIRIsInOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        ObjectNode responseObject = getResponse(response);
        assertAnnotations(responseObject, annotationProperties, annotations);
        assertClassIRIs(responseObject, classes);
        assertDatatypes(responseObject, datatypes);
        assertObjectPropertyIRIs(responseObject, objectProperties);
        assertDataPropertyIRIs(responseObject, dataProperties);
        assertIndividuals(responseObject, namedIndividuals);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
    }

    @Test
    public void testGetIRIsInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/iris")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        ObjectNode responseObject = getResponse(response);
        assertAnnotations(responseObject, annotationProperties, annotations);
        assertClassIRIs(responseObject, classes);
        assertDatatypes(responseObject, datatypes);
        assertObjectPropertyIRIs(responseObject, objectProperties);
        assertDataPropertyIRIs(responseObject, dataProperties);
        assertIndividuals(responseObject, namedIndividuals);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
    }

    @Test
    public void testGetIRIsInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/iris")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        ObjectNode responseObject = getResponse(response);
        assertAnnotations(responseObject, annotationProperties, annotations);
        assertClassIRIs(responseObject, classes);
        assertDatatypes(responseObject, datatypes);
        assertObjectPropertyIRIs(responseObject, objectProperties);
        assertDataPropertyIRIs(responseObject, dataProperties);
        assertIndividuals(responseObject, namedIndividuals);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
    }

    @Test
    public void testGetIRIsInOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/iris").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        ObjectNode responseObject = getResponse(response);
        assertAnnotations(responseObject, annotationProperties, annotations);
        assertClassIRIs(responseObject, classes);
        assertDatatypes(responseObject, datatypes);
        assertObjectPropertyIRIs(responseObject, objectProperties);
        assertDataPropertyIRIs(responseObject, dataProperties);
        assertIndividuals(responseObject, namedIndividuals);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
    }

    @Test
    public void testGetIRIsInOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    // Test get annotations in ontology

    @Test
    public void testGetAnnotationsInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertAnnotations(getResponse(response), annotationProperties, annotations);
    }

    @Test
    public void testGetAnnotationsInOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertAnnotations(getResponse(response), annotationProperties, annotations);
    }

    @Test
    public void testGetAnnotationsInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(false);
        assertAnnotations(getResponse(response), annotationProperties, annotations);
    }

    @Test
    public void testGetAnnotationsInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(false);
        assertAnnotations(getResponse(response), annotationProperties, annotations);
    }

    @Test
    public void testGetAnnotationsInOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(false);
        assertAnnotations(getResponse(response), annotationProperties, annotations);
    }

    @Test
    public void testGetAnnotationsInOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetAnnotationsInOntologyWhenNoAnnotations() {
        when(ontology.getAllAnnotationProperties()).thenReturn(Collections.emptySet());
        when(ontology.getAllAnnotations()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertAnnotations(getResponse(response), Collections.emptySet(), Collections.emptySet());
    }

    // Test add annotation to ontology

    @Test
    public void testAddAnnotationToOntology() {
        ObjectNode entity = createJsonOfType(OWL.ANNOTATIONPROPERTY.stringValue())
                .put("@id", "http://mobi.com/new-annotation");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedAnnotationToOntology() {
        ObjectNode entity = objectMapper.createObjectNode()
                .put("@id", "http://mobi.com/new-annotation");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations").request()
                .post(Entity.json(entity.toString()));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddInvalidAnnotationToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations").request()
                .post(Entity.json(INVALID_JSON));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddAnnotationToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        ObjectNode entity = createJsonOfType(OWL.ANNOTATIONPROPERTY.stringValue())
                .put("@id", "http://mobi.com/new-annotation");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete annotation from ontology

    @Test
    public void testDeleteAnnotationFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteAnnotationFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteAnnotationFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteAnnotationFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteAnnotationFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteAnnotationFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testDeleteMissingAnnotationFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    // Test get classes in ontology

    @Test
    public void testGetClassesInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertClasses(getResponseArray(response), classes);
    }

    @Test
    public void testGetClassesInOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertClasses(getResponseArray(response), classes);
    }

    @Test
    public void testGetClassesInOntologyWithDoNotApplyInProgressCommit() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("applyInProgressCommit", false)
                .request().get();

        assertEquals(200, response.getStatus());
        assertClasses(getResponseArray(response), classes);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(engineManager, times(0)).retrieveUser(anyString());
        verify(commitManager, times(0)).getInProgressCommitOpt(any(Resource.class), any(Resource.class), any(User.class), any(RepositoryConnection.class));
        verify(differenceManager, times(0)).applyInProgressCommit(any(Resource.class), any(Model.class), any(RepositoryConnection.class));
        verify(ontologyCache, times(0)).removeFromCache(anyString(), anyString());
    }

    @Test
    public void testGetClassesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertClasses(getResponseArray(response), classes);
    }

    @Test
    public void testGetClassesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertClasses(getResponseArray(response), classes);
    }

    @Test
    public void testGetClassesInOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertClasses(getResponseArray(response), classes);
    }

    @Test
    public void testGetClassesInOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetClassesInOntologyWhenNoClasses() {
        when(ontology.getAllClasses()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertClasses(getResponseArray(response), Collections.emptySet());
    }

    // Test add class to ontology

    @Test
    public void testAddClassToOntology() {
        ObjectNode entity = createJsonOfType(OWL.CLASS.stringValue())
                .put("@id", "http://mobi.com/new-class");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedClassToOntology() {
        ObjectNode entity = objectMapper.createObjectNode()
                .put("@id", "http://mobi.com/new-class");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddInvalidClassToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .post(Entity.json(INVALID_JSON));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddClassToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        ObjectNode entity = createJsonOfType(OWL.CLASS.stringValue())
                .put("@id", "http://mobi.com/new-class");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete class from ontology

    @Test
    public void testDeleteClassFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteClassFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testDeleteMissingClassFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    // Test get datatypes in ontology

    @Test
    public void testGetDatatypesInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDatatypes(getResponse(response), datatypes);
    }

    @Test
    public void testGetDatatypesInOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDatatypes(getResponse(response), datatypes);
    }

    @Test
    public void testGetDatatypesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDatatypes(getResponse(response), datatypes);
    }

    @Test
    public void testGetDatatypesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDatatypes(getResponse(response), datatypes);
    }

    @Test
    public void testGetDatatypesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertDatatypes(getResponse(response), datatypes);
    }

    @Test
    public void testGetDatatypesInOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetDatatypesInOntologyWhenNoDatatypes() {
        when(ontology.getAllDatatypes()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDatatypes(getResponse(response), Collections.emptySet());
    }

    // Test add datatype to ontology

    @Test
    public void testAddDatatypeToOntology() {
        ObjectNode entity = createJsonOfType(OWL.DATATYPEPROPERTY.stringValue())
                .put("@id", "http://mobi.com/new-datatype");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedDatatypeToOntology() {
        ObjectNode entity = objectMapper.createObjectNode()
                .put("@id", "http://mobi.com/new-datatype");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddInvalidDatatypeToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .post(Entity.json(INVALID_JSON));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddDatatypeToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        ObjectNode entity = createJsonOfType(OWL.DATATYPEPROPERTY.stringValue())
                .put("@id", "http://mobi.com/new-datatype");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete datatype from ontology

    @Test
    public void testDeleteDatatypeFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteDatatypeFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testDeleteMissingDatatypeFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    // Test get object properties in ontology

    @Test
    public void testGetObjectPropertiesInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertObjectProperties(getResponseArray(response), objectProperties);
    }

    @Test
    public void testGetObjectPropertiesInOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertObjectProperties(getResponseArray(response), objectProperties);
    }

    @Test
    public void testGetObjectPropertiesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertObjectProperties(getResponseArray(response), objectProperties);
    }

    @Test
    public void testGetObjectPropertiesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertObjectProperties(getResponseArray(response), objectProperties);
    }

    @Test
    public void testGetObjectPropertiesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertObjectProperties(getResponseArray(response), objectProperties);
    }

    @Test
    public void testGetObjectPropertiesInOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetObjectPropertiesInOntologyWhenNoObjectProperties() {
        when(ontology.getAllObjectProperties()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertObjectProperties(getResponseArray(response), Collections.emptySet());
    }

    // Test add object property to ontology

    @Test
    public void testAddObjectPropertyToOntology() {
        ObjectNode entity = createJsonOfType(OWL.OBJECTPROPERTY.stringValue())
                .put("@id", "http://mobi.com/new-object-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedObjectPropertyToOntology() {
        ObjectNode entity = objectMapper.createObjectNode()
                .put("@id", "http://mobi.com/new-object-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddInvalidObjectPropertyToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().post(Entity.json(INVALID_JSON));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddObjectPropertyToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        ObjectNode entity = createJsonOfType(OWL.OBJECTPROPERTY.stringValue())
                .put("@id", "http://mobi.com/new-object-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete object property from ontology

    @Test
    public void testDeleteObjectPropertyFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testDeleteMissingObjectPropertyFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    // Test get data properties in ontology

    @Test
    public void testGetDataPropertiesInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyWhenNoInProgressCommit() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetDataPropertiesInOntologyWhenNoDataProperties() {
        when(ontology.getAllDataProperties()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), Collections.emptySet());
    }

    // Test add data property to ontology

    @Test
    public void testAddDataPropertyToOntology() {
        ObjectNode entity = createJsonOfType(OWL.DATATYPEPROPERTY.stringValue())
                .put("@id", "http://mobi.com/new-data-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedDataPropertyToOntology() {
        ObjectNode entity = objectMapper.createObjectNode()
                .put("@id", "http://mobi.com/new-data-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddInvalidDataPropertyToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(INVALID_JSON));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddDataPropertyToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        ObjectNode entity = createJsonOfType(OWL.DATATYPEPROPERTY.stringValue())
                .put("@id", "http://mobi.com/new-data-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete data property from ontology

    @Test
    public void testDeleteDataPropertyFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testDeleteMissingDataPropertyFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    // Test get named individuals in ontology

    @Test
    public void testGetNamedIndividualsInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyWhenNoInProgressCommit() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetNamedIndividualsInOntologyWhenNoNamedIndividuals() {
        when(ontology.getAllIndividuals()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), Collections.emptySet());
    }

    // Test add named individual to ontology

    @Test
    public void testAddNamedIndividualToOntology() {
        ObjectNode entity = createJsonOfType(OWL.NAMEDINDIVIDUAL.stringValue())
                .put("@id", "http://mobi.com/new-named-individual");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedNamedIndividualToOntology() {
        ObjectNode entity = objectMapper.createObjectNode()
                .put("@id", "http://mobi.com/new-named-individual");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().post(Entity.json(entity.toString()));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddInvalidNamedIndividualToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().post(Entity.json(INVALID_JSON));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testAddNamedIndividualToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        ObjectNode entity = createJsonOfType(OWL.NAMEDINDIVIDUAL.stringValue())
                .put("@id", "http://mobi.com/new-named-individual");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(false);
    }

    @Test
    public void testAddNamedIndividualToOntologyWhenGetRecordIsEmpty() {
        when(recordManager.getRecordOpt(eq(catalogId), eq(recordId), eq(ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        ObjectNode entity = createJsonOfType(OWL.NAMEDINDIVIDUAL.stringValue())
                .put("@id", "http://mobi.com/new-named-individual");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(400, response.getStatus());
    }

    // Test delete named individual from ontology

    @Test
    public void testDeleteNamedIndividualFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).request().delete();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testDeleteMissingNamedIndividualFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(400, response.getStatus());
    }

    // Test get IRIs in imported ontologies

    @Test
    public void testGetIRIsInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) -> {
            assertAnnotations(responseObject, annotationProperties, annotations);
            assertClassIRIs(responseObject, importedClasses);
            assertDatatypes(responseObject, datatypes);
            assertObjectPropertyIRIs(responseObject, objectProperties);
            assertDataPropertyIRIs(responseObject, dataProperties);
            assertIndividuals(responseObject, namedIndividuals);
            assertDerivedConcepts(responseObject, derivedConcepts);
            assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
            assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(getResponseArray(response), (responseObject) -> {
            assertAnnotations(responseObject, annotationProperties, annotations);
            assertClassIRIs(responseObject, importedClasses);
            assertDatatypes(responseObject, datatypes);
            assertObjectPropertyIRIs(responseObject, objectProperties);
            assertDataPropertyIRIs(responseObject, dataProperties);
            assertIndividuals(responseObject, namedIndividuals);
            assertDerivedConcepts(responseObject, derivedConcepts);
            assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
            assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-iris")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) -> {
            assertAnnotations(responseObject, annotationProperties, annotations);
            assertClassIRIs(responseObject, importedClasses);
            assertDatatypes(responseObject, datatypes);
            assertObjectPropertyIRIs(responseObject, objectProperties);
            assertDataPropertyIRIs(responseObject, dataProperties);
            assertIndividuals(responseObject, namedIndividuals);
            assertDerivedConcepts(responseObject, derivedConcepts);
            assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
            assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) -> {
            assertAnnotations(responseObject, annotationProperties, annotations);
            assertClassIRIs(responseObject, importedClasses);
            assertDatatypes(responseObject, datatypes);
            assertObjectPropertyIRIs(responseObject, objectProperties);
            assertDataPropertyIRIs(responseObject, dataProperties);
            assertIndividuals(responseObject, namedIndividuals);
            assertDerivedConcepts(responseObject, derivedConcepts);
            assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
            assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-iris")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) -> {
            assertAnnotations(responseObject, annotationProperties, annotations);
            assertClassIRIs(responseObject, importedClasses);
            assertDatatypes(responseObject, datatypes);
            assertObjectPropertyIRIs(responseObject, objectProperties);
            assertDataPropertyIRIs(responseObject, dataProperties);
            assertIndividuals(responseObject, namedIndividuals);
            assertDerivedConcepts(responseObject, derivedConcepts);
            assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
            assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetIRIsInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 204);
    }

    // Test get Ontology IRIs

    @Test
    public void testGetImportedOntologyIRIs() {
        when(ontology.getUnloadableImportIRIs()).thenReturn(Collections.singleton(vf.createIRI("http://mobi.com/failed-import-1")));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontology-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());

        ArrayNode responseArray = getResponseArray(response);

        assertEquals(responseArray.size(), 2);
        assertTrue(arrayContains(responseArray, "http://mobi.com/imported-ontology-id"));
        assertTrue(arrayContains(responseArray, "http://mobi.com/failed-import-1"));
    }

    @Test
    public void testGetImportedOntologyIRIsWithDupes() {
        when(ontology.getUnloadableImportIRIs()).thenReturn(Collections.singleton(vf.createIRI("http://mobi.com/imported-ontology-id")));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontology-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());

        ArrayNode responseArray = getResponseArray(response);

        assertEquals(responseArray.size(), 1);
        assertEquals(responseArray.get(0).asText(), "http://mobi.com/imported-ontology-id");
    }

    @Test
    public void testGetImportedOntologyIRIsWithNoImports() {
        when(ontology.getUnloadableImportIRIs()).thenReturn(Collections.emptySet());
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontology-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());

        ArrayNode responseArray = getResponseArray(response);

        assertEquals(responseArray.size(), 0);
    }

    @Test
    public void testGetIRIsInImportedOntologiesWhenNoOntologyIRI() {
        OntologyId mockOntologyId = mock(OntologyId.class);
        when(mockOntologyId.getOntologyIRI()).thenReturn(Optional.empty());

        Ontology mock = mock(Ontology.class);
        when(mock.getOntologyId()).thenReturn(mockOntologyId);

        Set<Ontology> set = new HashSet<>();
        set.add(mock);
        when(ontology.getImportsClosure()).thenReturn(set);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontology-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
    }

    // Test get imports closure

    @Test
    public void testGetImportsClosure() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(getResponseArray(response), importsClosureResults);
    }

    @Test
    public void testgetImportsClosureWhenApplyInProgressCommitFalse() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("applyInProgressCommit", false).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(engineManager, times(0)).retrieveUser(anyString());
        verify(commitManager, times(0)).getInProgressCommitOpt(any(Resource.class), any(Resource.class), any(User.class), any(RepositoryConnection.class));
        verify(differenceManager, times(0)).applyInProgressCommit(any(Resource.class), any(Model.class), any(RepositoryConnection.class));
        verify(ontologyCache, times(0)).removeFromCache(anyString(), anyString());
        assertEquals(getResponseArray(response), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(getResponseArray(response), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(getResponseArray(response), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(getResponseArray(response), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEquals(getResponseArray(response), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetImportsClosureWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 204);
    }

    // Test get annotations in imported ontologies

    @Test
    public void testGetAnnotationsInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 204);
    }

    // Test get classes in imported ontologies

    @Test
    public void testGetClassesInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetClassesInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 204);
    }

    // Test get datatypes in imported ontologies

    @Test
    public void testGetDatatypesInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 204);
    }

    // Test get object properties in imported ontologies

    @Test
    public void testGetObjectPropertiesInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 204);
    }

    // Test get data properties in imported ontologies

    @Test
    public void testGetDataPropertiesInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesMissingBranchIdAndCommmitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 204);
    }

    // Test get named individuals in imported ontologies

    @Test
    public void testGetNamedIndividualsInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWithCommitIdMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(getResponseArray(response), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.emptySet());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 204);
    }

    // Test get ontology class hierarchy

    @Test
    public void testGetOntologyClassHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubClassesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetClassIRIs(classes));
    }

    @Test
    public void testGetOntologyClassHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubClassesOf();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetClassIRIs(classes));
    }

    @Test
    public void testGetOntologyClassHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getSubClassesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetClassIRIs(classes));
    }

    @Test
    public void testGetOntologyClassHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getSubClassesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetClassIRIs(classes));
    }

    @Test
    public void testGetOntologyClassHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        verify(ontology).getSubClassesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetClassIRIs(classes));
    }

    @Test
    public void testGetOntologyClassHierarchyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    // Test get ontology object property hierarchy

    @Test
    public void testGetOntologyObjectPropertyHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubObjectPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetObjectPropertyIRIs(objectProperties));
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubObjectPropertiesOf();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetObjectPropertyIRIs(objectProperties));
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getSubObjectPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetObjectPropertyIRIs(objectProperties));
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getSubObjectPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetObjectPropertyIRIs(objectProperties));
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        verify(ontology).getSubObjectPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetObjectPropertyIRIs(objectProperties));
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    // Test get ontology data property hierarchy

    @Test
    public void testGetOntologyDataPropertyHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubDatatypePropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetDataPropertyIRIs(dataProperties));
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubDatatypePropertiesOf();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetDataPropertyIRIs(dataProperties));
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getSubDatatypePropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetDataPropertyIRIs(dataProperties));
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getSubDatatypePropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetDataPropertyIRIs(dataProperties));
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        verify(ontology).getSubDatatypePropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetDataPropertyIRIs(dataProperties));
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    // Test get ontology annotation property hierarchy

    @Test
    public void testGetOntologyAnnotationPropertyHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubAnnotationPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetAnnotationPropertyIRIs(annotationProperties));
    }

    @Test
    public void testGetOntologyAnnotationPropertyHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubAnnotationPropertiesOf();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetAnnotationPropertyIRIs(annotationProperties));
    }

    @Test
    public void testGetOntologyAnnotationPropertyHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getSubAnnotationPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetAnnotationPropertyIRIs(annotationProperties));
    }

    @Test
    public void testGetOntologyAnnotationPropertyHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getSubAnnotationPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetAnnotationPropertyIRIs(annotationProperties));
    }

    @Test
    public void testGetOntologyAnnotationPropertyHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        verify(ontology).getSubAnnotationPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetAnnotationPropertyIRIs(annotationProperties));
    }

    @Test
    public void testGetOntologyAnnotationPropertyHierarchyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    // Test get concept hierarchy

    @Test
    public void testGetConceptHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getConceptRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(concepts));
    }

    @Test
    public void testGetConceptHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getConceptRelationships();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetIndividualIRIs(concepts));
    }

    @Test
    public void testGetConceptHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getConceptRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(concepts));
    }

    @Test
    public void testGetConceptHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getConceptRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(concepts));
    }

    @Test
    public void testGetConceptHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        verify(ontology).getConceptRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(concepts));
    }

    @Test
    public void testGetConceptHierarchyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    // Test get concept scheme hierarchy

    @Test
    public void testGetConceptSchemeHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getConceptSchemeRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(conceptSchemes));
    }

    @Test
    public void testGetConceptSchemeHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getConceptSchemeRelationships();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetIndividualIRIs(conceptSchemes));
    }

    @Test
    public void testGetConceptSchemeHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getConceptSchemeRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(conceptSchemes));
    }

    @Test
    public void testGetConceptSchemeHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getConceptSchemeRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(conceptSchemes));
    }

    @Test
    public void testGetConceptSchemeHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        verify(ontology).getConceptSchemeRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(conceptSchemes));
    }

    @Test
    public void testGetConceptSchemeHierarchyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    // Test get classes with individuals

    @Test
    public void testGetClassesWithIndividuals() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(getResponse(response), individualsOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(getResponse(response), individualsOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(getResponse(response), individualsOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).request().get();
        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(getResponse(response), individualsOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEquals(getResponse(response), individualsOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(400, response.getStatus());
    }

    // Test get entity usages when queryType is "select"

    @Test
    public void testGetEntityUsages() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "select").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(getResponse(response), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "select").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getEntityUsages(classId);
        assertGetOntology(false);
        assertEquals(getResponse(response), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("commitId", commitId.stringValue())
                .queryParam("queryType", "select").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(getResponse(response), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("queryType", "select").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(getResponse(response), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("queryType", "select").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        verify(ontology).getEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(getResponse(response), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "select").request().get();

        assertEquals(400, response.getStatus());
    }

    // Test get entity usages when queryType is "construct"

    @Test
    public void testGetEntityUsagesWhenConstruct() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "construct").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).constructEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), entityUsagesConstruct);
    }

    @Test
    public void testGetEntityUsagesWhenNoInProgressCommitWhenConstruct() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "construct").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).constructEntityUsages(classId);
        assertGetOntology(false);
        assertEquals(response.readEntity(String.class), entityUsagesConstruct);
    }

    @Test
    public void testGetEntityUsagesWithCommitIdAndMissingBranchIdWhenConstruct() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("commitId", commitId.stringValue())
                .queryParam("queryType", "construct").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).constructEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), entityUsagesConstruct);
    }

    @Test
    public void testGetEntityUsagesMissingCommitIdWhenConstruct() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("queryType", "construct").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).constructEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), entityUsagesConstruct);
    }

    @Test
    public void testGetEntityUsagesMissingBranchIdAndCommitIdWhenConstruct() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("queryType", "construct").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        verify(ontology).constructEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), entityUsagesConstruct);
    }

    @Test
    public void testGetEntityUsagesWhenRetrieveOntologyIsEmptyWhenConstruct() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "construct").request().get();

        assertEquals(400, response.getStatus());
    }

    // Test get entity usages when queryType is "wrong"

    @Test
    public void testGetEntityUsagesWhenQueryTypeIsWrong() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "wrong").request().get();

        assertEquals(400, response.getStatus());
    }

    // Test get search results

    @Test
    public void testGetSearchResults() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "class").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(getResponse(response), searchResults);
    }

    @Test
    public void testGetSearchResultsWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "class").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(getResponse(response), searchResults);
    }

    @Test
    public void testGetSearchResultsWithNoMatches() {
        // Setup:
        when(ontology.getSearchResults(anyString())).thenAnswer(i -> new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "nothing").request().get();

        assertEquals(response.getStatus(), 204);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
    }

    @Test
    public void testGetSearchResultsMissingSearchText() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetSearchResultsWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("commitId", commitId.stringValue()).queryParam("searchText", "class").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(getResponse(response), searchResults);
    }

    @Test
    public void testGetSearchResultsMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("searchText", "class").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(getResponse(response), searchResults);
    }

    @Test
    public void testGetSearchResultsMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("searchText", "class").request().get();

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEquals(getResponse(response), searchResults);
    }

    @Test
    public void testGetSearchResultsWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "class").request().get();

        assertEquals(400, response.getStatus());
    }

    // Test upload changes

    @Test
    public void testUploadChangesToOntology() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(ontologyModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(compiledResourceManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager).getDiff(any(Model.class), any(Model.class));
        verify(commitManager, times(2)).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesToOntologyWithoutBranchId() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(ontologyModel);

        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(branchManager.getMasterBranch(eq(catalogId), eq(recordId), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        verify(branchManager, times(0)).getMasterBranch(eq(catalogId), eq(recordId), any(RepositoryConnection.class));
        verify(compiledResourceManager, times(0)).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager, times(0)).getDiff(any(Model.class), any(Model.class));
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager, times(0)).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesToOntologyWithoutBranchIdNoPermission() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(ontologyModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(branchManager.getMasterBranch(eq(catalogId), eq(recordId), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(response.getDecision()).thenReturn(Decision.DENY);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.UNAUTHORIZED.getStatusCode());
        verify(branchManager).getMasterBranch(eq(catalogId), eq(recordId), any(RepositoryConnection.class));
        verify(compiledResourceManager, times(0)).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager, times(0)).getDiff(any(Model.class), any(Model.class));
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager, times(0)).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesToOntologyWithoutCommitId() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(ontologyModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(commitManager.getHeadCommit(eq(catalogId), eq(recordId), eq(branchId), any(RepositoryConnection.class))).thenReturn(commit);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(commitManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId), any(RepositoryConnection.class));
        verify(compiledResourceManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager).getDiff(any(Model.class), any(Model.class));
        verify(commitManager, times(2)).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesToOntologyWithExistingInProgressCommit() {
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.of(inProgressCommit));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "search-results.json", getClass().getResourceAsStream("/search-results.json"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
    }

    @Test
    public void testUploadChangesToOntologyNoDiff() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(ontologyModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        Difference difference = new Difference.Builder().additions(mf.createEmptyModel()).deletions(mf.createEmptyModel()).build();
        when(differenceManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.NO_CONTENT.getStatusCode());
        assertGetUserFromContext();
        verify(compiledResourceManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager).getDiff(any(Model.class), any(Model.class));
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager, never()).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesTrigToOntologyNoDiff() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(ontologyModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        Difference difference = new Difference.Builder().additions(mf.createEmptyModel()).deletions(mf.createEmptyModel()).build();
        when(differenceManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "testOntologyData.trig", getClass().getResourceAsStream("/testOntologyData.trig"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        ObjectNode responseObject = getResponse(response);
        assertEquals("IllegalArgumentException", responseObject.get("error").asText());
        assertEquals("TriG data is not supported for upload changes.", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }
    
    // Test failed-imports

    @Test
    public void testGetFailedImports() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().get();

        assertEquals(200, response.getStatus());
        assertFailedImports(getResponseArray(response));
        assertGetOntology(true);
    }

    @Test
    public void testGetFailedImportsWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().get();

        assertEquals(200, response.getStatus());
        assertFailedImports(getResponseArray(response));
        assertGetOntology(false);
    }

    @Test
    public void testGetFailedImportsMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        assertFailedImports(getResponseArray(response));
        assertGetOntology(true);
    }

    @Test
    public void testGetFailedImportsMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        assertFailedImports(getResponseArray(response));
        assertGetOntology(true);
    }

    @Test
    public void testGetFailedImportsMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .request().get();

        assertEquals(200, response.getStatus());
        assertFailedImports(getResponseArray(response));
        assertGetOntology(true);
    }

    @Test
    public void testGetFailedImportsWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().get();

        assertEquals(400, response.getStatus());
    }

    // Test getEntity

    @Test
    public void query01_NoBlankNodes() throws IOException {
        setupGraphQueryMock();

        Model data = getModel("/queryData/01_NoBlankNodes-data.ttl");
        Model expectedResults = getModel("/queryData/01_NoBlankNodes-results.ttl");

        Model results;
        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            results = getResults(conn, data, "http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#Fin");
        }

        try {
            Assert.assertEquals(expectedResults, results);
        } catch (AssertionError e) {
            printModel("Expected Results", expectedResults);
            printModel("Actual Results", results);
            fail(e.getMessage());
        }
    }

    @Test
    public void query02_RestrictionOnRealClass() throws IOException {
        setupGraphQueryMock();

        Model data = getModel("/queryData/02_RestrictionOnRealClass-data.ttl");
        Model expectedResults = getModel("/queryData/02_RestrictionOnRealClass-results.ttl");

        Model results;
        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            results = getResults(conn, data, "http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#Fin");
        }

        try {
            // RDF4j 3.6.0 updated Models.isomorphic() for speed. New implementation does not consider a model with
            // blank nodes and the corresponding skolemized method to be equivalent.
            // https://github.com/eclipse/rdf4j/pull/2787#issuecomment-775510233
            assertTrue(Models.isomorphic(expectedResults, bNodeService.deskolemize(results)));
        } catch (AssertionError e) {
            printModel("Expected Results", expectedResults);
            printModel("Actual Results", results);
            fail(e.getMessage());
        }
    }

    @Test
    public void query03_RestrictionOnList() throws IOException {
        setupGraphQueryMock();

        Model data = getModel("/queryData/03_RestrictionOnList-data.ttl");
        Model expectedResults = bNodeService.skolemize(getModel("/queryData/03_RestrictionOnList-results.ttl"));

        Model results;
        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            results = getResults(conn, data, "http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#Fin");
        }

        try {
            Assert.assertEquals(results.size(), expectedResults.size());
//            Assert.assertEquals(results, expectedResults);
        } catch (AssertionError e) {
            printModel("Expected Results", expectedResults);
            printModel("Actual Results", results);
            fail(e.getMessage());
        }
    }

    @Test
    public void query04_RestrictionsInList() throws IOException {
        setupGraphQueryMock();

        Model data = getModel("/queryData/04_RestrictionsInList-data.ttl");
        Model expectedResults = bNodeService.skolemize(getModel("/queryData/04_RestrictionsInList-results.ttl"));

        Model results;
        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            results = getResults(conn, data, "http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#DualMountedMainLandingGear");
        }

        try {
            Assert.assertEquals(results.size(), expectedResults.size());
        } catch (AssertionError e) {
            printModel("Expected Results", expectedResults);
            printModel("Actual Results", results);
            fail(e.getMessage());
        }
    }

    // Test getEntityNames

    @Test
    public void testGetEntityNames() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEntityNames(response, false, Collections.emptySet());
    }

    @Test
    public void testGetEntityNamesFiltered() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json("{\"filterResources\": [\"http://test.com/Ontology1\", \"http://test.com/Ontology1#prop1\"]}"));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesNoResults() throws Exception {
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesWithNoInProgressCommit() throws Exception {
        setupTupleQueryMock();
        setupEntityNamesRepo();
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEntityNames(response, false, Collections.emptySet());
    }

    @Test
    public void testGetEntityNamesWithNoInProgressCommitFiltered() throws Exception {
        setupTupleQueryMock();
        setupEntityNamesRepo();
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json("{\"filterResources\": [\"http://test.com/Ontology1\", \"http://test.com/Ontology1#prop1\"]}"));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesWithNoInProgressCommitNoResults() throws Exception {
        setNoInProgressCommit();
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesWithNoInProgressCommitBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        setNoInProgressCommit();
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesWithCommitIdAndMissingBranchId() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("commitId", commitId.stringValue()).request().post(Entity.json(objectMapper.createObjectNode().toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEntityNames(response, false, Collections.emptySet());
    }

    @Test
    public void testGetEntityNamesWithCommitIdAndMissingBranchIdFiltered() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json("{\"filterResources\": [\"http://test.com/Ontology1\", \"http://test.com/Ontology1#prop1\"]}"));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesWithCommitIdAndMissingBranchIdNoResults() throws Exception {
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("commitId", commitId.stringValue()).request().post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesWithCommitIdAndMissingBranchIdBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("commitId", commitId.stringValue()).request().post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesMissingCommitId() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEntityNames(response, false, Collections.emptySet());
    }

    @Test
    public void testGetEntityNamesMissingCommitIdFiltered() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).request()
                .post(Entity.json("{\"filterResources\": [\"http://test.com/Ontology1\", \"http://test.com/Ontology1#prop1\"]}"));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesMissingCommitIdNoResults() throws Exception {
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesMissingCommitIdBlankResult() throws Exception {
        setupTupleQueryMock();
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesMissingBranchIdAndCommitId() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .request().post(Entity.json(objectMapper.createObjectNode().toString()));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEntityNames(response, false, Collections.emptySet());
    }

    @Test
    public void testGetEntityNamesMissingBranchIdAndCommitIdFiltered() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .request().post(Entity.json("{\"filterResources\": [\"http://test.com/Ontology1\", \"http://test.com/Ontology1#prop1\"]}"));

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesMissingBranchIdAndCommitIdNoResults() throws Exception {
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .request().post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesMissingBranchIdAndCommitIdBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        ObjectNode expectedResults = objectMapper.createObjectNode();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .request().post(Entity.json(objectMapper.createObjectNode().toString()));
        ObjectNode responseObject = getResponse(response);

        assertEquals(200, response.getStatus());
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(objectMapper.createObjectNode().toString()));

        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetOntologyFromIRI() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(importsResolver.getRecordIRIFromOntologyIRI(any(Resource.class))).thenReturn(Optional.of(recordId));
        when(ontologyManager.retrieveOntology(any(Resource.class))).thenReturn(Optional.of(ontology));

        Response response = target().path("ontologies/ontology/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals(response.readEntity(String.class), ontologyTurtle.toString());
        assertEquals(200, response.getStatus());
    }

    @Test
    public void testGetOntologyFromIRIWithFormat() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(importsResolver.getRecordIRIFromOntologyIRI(any(Resource.class))).thenReturn(Optional.of(recordId));
        when(ontologyManager.retrieveOntology(any(Resource.class))).thenReturn(Optional.of(ontology));

        Response response = target().path("ontologies/ontology/" + encode(recordId.stringValue()))
                .queryParam("format", "jsonld").request().get();
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        assertEquals(200, response.getStatus());
    }

    @Test
    public void testGetOntologyFromIRIwithFileExtension() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(importsResolver.getRecordIRIFromOntologyIRI(any(Resource.class))).thenReturn(Optional.of(recordId));
        when(ontologyManager.retrieveOntology(any(Resource.class))).thenReturn(Optional.of(ontology));

        Response response = target().path("ontologies/ontology/" + encode(recordId.stringValue()) + ".jsonld")
                .request().get();
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        assertEquals(200, response.getStatus());
    }

    @Test
    public void testGetOntologyFromIRINoPermissions() {
        when(importsResolver.getRecordIRIFromOntologyIRI(any(Resource.class))).thenReturn(Optional.of(recordId));
        when(response.getDecision()).thenReturn(Decision.DENY);

        Response response = target().path("ontologies/ontology/" + encode(recordId.stringValue()))
                .request().get();

        assertEquals(response.getStatus(), 403);
    }

    @Test
    public void testGetOntologyFromIRINoRecord() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(importsResolver.getRecordIRIFromOntologyIRI(any(Resource.class))).thenReturn(Optional.empty());

        Response response = target().path("ontologies/ontology/" + encode("https://www.non-exists.com")).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals("", response.readEntity(String.class));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void testGetOntologyFromIRIInvalidIRI() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(importsResolver.getRecordIRIFromOntologyIRI(any(Resource.class))).thenReturn(Optional.empty());

        Response response = target().path("ontologies/ontology/" + encode("www.non-exists.com")).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals("", response.readEntity(String.class));
        assertEquals(500, response.getStatus());
    }

    private void setupEntityNamesRepo() throws Exception {
        setupTupleQueryMock();
        Model data = getModel("/getOntologyStuffData/ontologyData.ttl");
        try (RepositoryConnection conn = testQueryRepo.getConnection()) {
            conn.add(data);
        }
    }

    private void setupEntityNamesRepoEmptyEntity() throws Exception {
        setupTupleQueryMock();
        Model data = getModel("/getOntologyStuffData/ontologyEmptyEntity.ttl");
        try (RepositoryConnection conn = testQueryRepo.getConnection()) {
            conn.add(data);
        }
    }

    private void setupGraphQueryMock() {
        when(ontology.getGraphQueryResults(any(String.class), eq(true))).thenAnswer(invocationOnMock -> {
            String query = invocationOnMock.getArgument(0, String.class);
            try(RepositoryConnection conn = testQueryRepo.getConnection()) {
                GraphQuery graphQuery = conn.prepareGraphQuery(query);
                return QueryResults.asModel(graphQuery.evaluate(), mf);
            }
        });

        when(ontology.getGraphQueryResultsStream(any(String.class), eq(true), any(RDFFormat.class), eq(true), any(OutputStream.class))).thenAnswer(invocationOnMock -> {
            String query = invocationOnMock.getArgument(0, String.class);
            boolean skolemize = true;
            RDFFormat format = RDFFormat.JSONLD;

            try(RepositoryConnection conn = testQueryRepo.getConnection()) {
                GraphQuery graphQuery = conn.prepareGraphQuery(query);
                Model entityData = QueryResults.asModel(graphQuery.evaluate(), mf);

                String modelStr;
                if (skolemize) {
                    modelStr = modelToSkolemizedString(entityData, format, bNodeService);
                } else {
                    modelStr = modelToString(entityData, format);
                }

                OutputStream outputStream = invocationOnMock.getArgument(4, OutputStream.class);

                outputStream.write(modelStr.getBytes(StandardCharsets.UTF_8));
                return outputStream;
            }
        });

    }

    private void setupTupleQueryMock() {
        when(ontology.getTupleQueryResults(any(String.class), eq(true))).thenAnswer(invocationOnMock -> {
            String query = invocationOnMock.getArgument(0, String.class);
            try(RepositoryConnection conn = testQueryRepo.getConnection()) {
                TupleQuery graphQuery = conn.prepareTupleQuery(query);
                return new MutableTupleQueryResult(graphQuery.evaluate());
            }
        });
    }

    private Model getModel(String path) throws IOException {
        return Rio.parse(this.getClass().getResourceAsStream(path), "", RDFFormat.TURTLE);
    }

    private Model getResults(RepositoryConnection conn, Model data, String resource) throws IOException {
        conn.add(data);
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entities/" + encode(resource))
                .request().get();
        String resultData = response.readEntity(String.class);

        return Rio.parse(new StringReader(resultData), "", RDFFormat.JSONLD);
    }

    private void printModel(String prefix, Model model) {
        List<Statement> list = new ArrayList<>(model);
        list.sort(Comparator.comparing(o -> o.getSubject().stringValue()));

        System.out.println();
        System.out.println(prefix);
        list.forEach(System.out::println);
        System.out.println();
    }
}

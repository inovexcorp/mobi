package com.mobi.ontology.rest;

/*-
 * #%L
 * com.mobi.ontology.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
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
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
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
import org.eclipse.rdf4j.query.MalformedQueryException;
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
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.cache.Cache;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Form;
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
    private JSONObject entityUsagesResult;
    private JSONObject searchResults;
    private JSONObject individualsOfResult;
    private JSONObject basicHierarchyResults;
    private JSONObject propertyToRanges;
    private JSONArray importedOntologyResults;
    private JSONArray importsClosureResults;
    private OutputStream ontologyJsonLd;
    private OutputStream ontologyTurtle;
    private OutputStream importedOntologyJsonLd;
    private static OsgiRepositoryWrapper repo;
    private static String INVALID_JSON = "{id: 'invalid";
    private static String constructJsonLd = "[ {\n  \"@id\" : \"urn:test\",\n  \"urn:prop\" : [ {\n    \"@value\" : \"test\"\n  } ]\n} ]";
    private IRI missingIRI;
    private OsgiRepositoryWrapper testQueryRepo;
    private ObjectMapper objectMapper = new ObjectMapper();

    // Mock services used in server
    private static OntologyRest rest;
    private static ModelFactory mf;
    private static ValueFactory vf;
    private static OntologyManager ontologyManager;
    private static CatalogConfigProvider configProvider;
    private static CatalogManager catalogManager;
    private static EngineManager engineManager;
    private static OntologyCache ontologyCache;
    private static SimpleBNodeService bNodeService;
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
    private Cache<String, Ontology> mockCache;

    @Mock
    private Request request;

    @Mock
    private com.mobi.security.policy.api.Response response;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();

        catalogManager = Mockito.mock(CatalogManager.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);
        ontologyManager = Mockito.mock(OntologyManager.class);
        engineManager = Mockito.mock(EngineManager.class);
        pdp = Mockito.mock(PDP.class);

        ontologyCache = Mockito.mock(OntologyCache.class);

        rest = new OntologyRest();
        rest.ontologyManager = ontologyManager;
        rest.configProvider = configProvider;
        rest.catalogManager = catalogManager;
        rest.engineManager = engineManager;
        rest.ontologyCache = ontologyCache;
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
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));
        record.setMasterBranch(branch);
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

        record.setOntologyIRI(ontologyIRI);
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
    }

    @Before
    public void setupMocks() throws Exception {
        configureApp();
        final IRI skosSemanticRelation = vf.createIRI(SKOS.SEMANTIC_RELATION.stringValue());

        when(results.getPage()).thenReturn(Collections.emptyList());
        when(results.getPageNumber()).thenReturn(0);
        when(results.getPageSize()).thenReturn(0);
        when(results.getTotalSize()).thenReturn(0);

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
        queryResultModel.addAll(Collections.singleton(vf.createStatement(vf.createIRI("urn:test"), vf.createIRI("urn:prop"), vf.createLiteral("test"))));
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
            config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
            Rio.write(ontologyModel, os, RDFFormat.JSONLD, config);
            return os;
        });
        when(importedOntology.getImportsClosure()).thenReturn(Collections.singleton(importedOntology));

        when(catalogManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class))).thenReturn(results);
        when(catalogManager.getRecord(eq(catalogId), eq(recordId), any(OntologyRecordFactory.class))).thenReturn(Optional.of(record));
        when(catalogManager.removeRecord(catalogId, recordId, user, OntologyRecord.class)).thenReturn(record);
        when(catalogManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);
        when(catalogManager.getInProgressCommit(catalogId, recordId, user)).thenReturn(Optional.of(inProgressCommit));
        when(catalogManager.getInProgressCommit(catalogId, recordId, inProgressCommitId)).thenReturn(Optional.of(inProgressCommit));
        when(catalogManager.createCommit(eq(inProgressCommit), anyString(), any(Commit.class), any(Commit.class))).thenReturn(commit);
        when(catalogManager.applyInProgressCommit(eq(inProgressCommitId), any(Model.class))).thenReturn(mf.createEmptyModel());
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);
        when(catalogManager.createRecord(any(User.class), any(RecordOperationConfig.class), eq(OntologyRecord.class))).thenReturn(record);

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
                new HashSet<>(Arrays.asList(new String[]{"https://mobi.com#child", "https://mobi.com#parent"})));
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

        when(ontologyCache.getOntologyCache()).thenReturn(Optional.of(mockCache));

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
                catalogManager, ontologyManager, results, mockCache, ontologyCache);
        if (testQueryRepo != null) {
            testQueryRepo.shutDown();
        }
        closeable.close();
    }

    @AfterClass
    public static void tearDown() {
        repo.shutDown();
    }

    private JSONObject getResource(String path) throws Exception {
        return JSONObject.fromObject(IOUtils.toString(getClass().getResourceAsStream(path), StandardCharsets.UTF_8));
    }

    private String getResourceString(String path) throws IOException {
        return IOUtils.toString(getClass().getResourceAsStream(path), StandardCharsets.UTF_8);
    }

    private JSONArray getResourceArray(String path) throws Exception {
        return JSONArray.fromObject(IOUtils.toString(getClass().getResourceAsStream(path), StandardCharsets.UTF_8));
    }

    private void assertGetInProgressCommitIRI(boolean hasInProgressCommit) {
        assertGetUserFromContext();
        verify(catalogManager, atLeastOnce()).getInProgressCommit(any(Resource.class), any(Resource.class), any(User.class));
        if (!hasInProgressCommit) {
            verify(catalogManager).createInProgressCommit(any(User.class));
            verify(catalogManager).addInProgressCommit(any(Resource.class), any(Resource.class), any(InProgressCommit.class));
        }
    }

    private void assertGetUserFromContext() {
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }

    private void assertGetOntology(boolean hasInProgressCommit) {
        assertGetUserFromContext();
        verify(catalogManager, atLeastOnce()).getInProgressCommit(any(Resource.class), any(Resource.class), any(User.class));
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

    private void assertAnnotations(JSONObject responseObject, Set<AnnotationProperty> propSet, Set<Annotation> annSet) {
        JSONArray jsonAnnotations = responseObject.optJSONArray("annotationProperties");
        assertNotNull(jsonAnnotations);
        assertEquals(jsonAnnotations.size(), propSet.size());
        propSet.forEach(annotationProperty ->
                assertTrue(jsonAnnotations.contains(createJsonIRI(annotationProperty.getIRI()))));
    }

    private void assertHierarchyResults(Response response, Set<String> iris) {
        JSONObject responseObj = getResponse(response);
        assertTrue(responseObj.keySet().containsAll(basicHierarchyResults.keySet()));
        assertIRIObject(responseObj, "iris", iris);
    }

    private void assertIRIObject(JSONObject responseObject, String key, Set<String> set) {
        JSONArray jsonArr = responseObject.optJSONArray(key);
        assertNotNull(jsonArr);
        assertEquals(jsonArr.size(), set.size());
        set.forEach(iri -> assertTrue(jsonArr.contains(iri)));
    }

    private void assertClassIRIs(JSONObject responseObject, Set<OClass> set) {
        Set<String> iris = createSetClassIRIs(set);
        assertIRIObject(responseObject, "classes", iris);
    }

    private void assertClasses(JSONArray responseArray, Set<OClass> set) {
        assertNotNull(responseArray);
        assertEquals(responseArray.size(), set.size());
    }

    private void assertDatatypes(JSONObject responseObject, Set<Datatype> set) {
        Set<String> iris = createSetDatatypeIRIs(set);
        assertIRIObject(responseObject, "datatypes", iris);
    }

    private void assertObjectPropertyIRIs(JSONObject responseObject, Set<ObjectProperty> set) {
        Set<String> iris = createSetObjectPropertyIRIs(set);
        assertIRIObject(responseObject, "objectProperties", iris);
    }

    private void assertObjectProperties(JSONArray responseArray, Set<ObjectProperty> set) {
        assertNotNull(responseArray);
        assertEquals(responseArray.size(), set.size());
    }

    private void assertDataPropertyIRIs(JSONObject responseObject, Set<DataProperty> set) {
        Set<String> iris = createSetDataPropertyIRIs(set);
        assertIRIObject(responseObject, "dataProperties", iris);
    }

    private void assertDataProperties(JSONArray responseArray, Set<DataProperty> set) {
        assertNotNull(responseArray);
        assertEquals(responseArray.size(), set.size());
    }

    private void assertIndividuals(JSONObject responseObject, Set<Individual> set) {
        Set<String> iris = createSetIndividualIRIs(set);
        assertIRIObject(responseObject, "namedIndividuals", iris);
    }

    private void assertConcepts(JSONObject responseObject, Set<Individual> set) {
        Set<String> iris = createSetIndividualIRIs(set);
        assertIRIObject(responseObject, "concepts", iris);
    }

    private void assertConceptSchemes(JSONObject responseObject, Set<Individual> set) {
        Set<String> iris = createSetIndividualIRIs(set);
        assertIRIObject(responseObject, "conceptSchemes", iris);
    }

    private void assertDerivedConcepts(JSONObject responseObject, Set<IRI> set) {
        JSONArray jsonConcepts = responseObject.optJSONArray("derivedConcepts");
        assertNotNull(jsonConcepts);
        assertEquals(jsonConcepts.size(), set.size());
    }

    private void assertDeprecatedIris(JSONObject responseObject, Set<IRI> set) {
        JSONArray jsonConcepts = responseObject.optJSONArray("deprecatedIris");
        assertNotNull(jsonConcepts);
        assertEquals(jsonConcepts.size(), set.size());
    }

    private void assertDerivedConceptSchemes(JSONObject responseObject, Set<IRI> set) {
        JSONArray jsonConceptSchemes = responseObject.optJSONArray("derivedConceptSchemes");
        assertNotNull(jsonConceptSchemes);
        assertEquals(jsonConceptSchemes.size(), set.size());
    }

    private void assertDerivedSemanticRelations(JSONObject responseObject, Set<IRI> set) {
        JSONArray jsonSemanticRelations = responseObject.optJSONArray("derivedSemanticRelations");
        assertNotNull(jsonSemanticRelations);
        assertEquals(jsonSemanticRelations.size(), set.size());
    }

    private void assertAdditionsToInProgressCommit(boolean hasInProgressCommit) {
        assertGetInProgressCommitIRI(hasInProgressCommit);
        verify(catalogManager).updateInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(Model.class), eq(null));
    }

    private void assertDeletionsToInProgressCommit(boolean hasInProgressCommit) {
        assertGetInProgressCommitIRI(hasInProgressCommit);
        verify(catalogManager).updateInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), eq(null), any(Model.class));
    }

    private void assertImportedOntologies(JSONArray responseArray, Consumer<JSONObject> assertConsumer) {
        for (Object o : responseArray) {
            JSONObject jsonO = (JSONObject) o;
            String ontologyId = jsonO.get("id").toString();
            assertNotEquals(importedOntologies.stream()
                    .filter(ont -> ont.getOntologyId().getOntologyIdentifier().stringValue().equals(ontologyId))
                    .collect(Collectors.toList()).size(), 0);
            assertConsumer.accept(jsonO);
        }
    }

    private void setNoInProgressCommit() {
        when(catalogManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(User.class)))
                .thenReturn(Optional.empty());
    }

    private void assertCreatedOntologyIRI(JSONObject responseObject) {
        String ontologyId = responseObject.optString("ontologyId");
        assertNotNull(ontologyId);
        assertEquals(ontologyId, ontologyIRI.stringValue());
    }

    private JSONObject getResponse(Response response) {
        return JSONObject.fromObject(response.readEntity(String.class));
    }

    private JSONArray getResponseArray(Response response) {
        return JSONArray.fromObject(response.readEntity(String.class));
    }

    private JsonNode getResponseNode(Response response, String node) throws IOException {
        return objectMapper.readTree(response.readEntity(String.class)).get(node);
    }

    private JSONObject createJsonOfType(String type) {
        return new JSONObject().element("@type", JSONArray.fromObject(Collections.singleton(type)));
    }

    private void assertGetOntologyStuff(Response response) {
        JSONObject responseObject = getResponse(response);
        JSONObject iriList = responseObject.getJSONObject("iriList");

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

        assertImportedOntologies(responseObject.getJSONArray("importedIRIs"), (importedObject) -> {
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

        assertEquals(responseObject.get("importedOntologies"), importedOntologyResults);
        assertFailedImports(responseObject.getJSONArray("failedImports"));
        assertEquals(responseObject.getJSONObject("classHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("individuals"), individualsOfResult.getJSONObject("individuals"));
        assertEquals(responseObject.getJSONObject("dataPropertyHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("objectPropertyHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("annotationHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("conceptHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("conceptSchemeHierarchy"), basicHierarchyResults);
    }

    private void assertFailedImports(JSONArray failedImports) {
        assertEquals(failedImports.size(), 1);
        assertEquals(failedImports.get(0), importedOntologyIRI.stringValue());
    }

    private void assertSelectQuery(JSONObject queryResults) {
        JSONObject head = queryResults.optJSONObject("head");
        assertNotNull(head);
        JSONArray vars = head.optJSONArray("vars");
        assertNotNull(vars);
        assertEquals(vars.size(), 1);
        JSONObject results = queryResults.optJSONObject("results");
        assertNotNull(results);
        JSONArray bindings = results.optJSONArray("bindings");
        assertNotNull(bindings);
        assertEquals(bindings.size(), 1);
    }

    private void assertConstructQuery(String queryResults) {
        assertNotNull(queryResults);
        assertEquals(queryResults.replaceAll("\\r\\n?", "\n"), constructJsonLd);
    }

    private void assertGroupedSelectQuery(JSONObject queryResults) {
        JSONObject ontologyResult = queryResults.optJSONObject("http://mobi.com/ontology-id");
        assertNotNull(ontologyResult);
        JSONObject head = ontologyResult.optJSONObject("head");
        assertNotNull(head);
        JSONArray vars = head.optJSONArray("vars");
        assertNotNull(vars);
        assertEquals(vars.size(), 1);
        JSONObject results = ontologyResult.optJSONObject("results");
        assertNotNull(results);
        JSONArray bindings = results.optJSONArray("bindings");
        assertNotNull(bindings);
        assertEquals(bindings.size(), 1);
    }

    private void assertGroupedConstructQuery(JSONObject queryResults) {
        String expectedResult = "[\"(urn:test, urn:prop, \\\"test\\\")\"]";
        JSONObject ontologyResult = queryResults.optJSONObject("http://mobi.com/ontology-id");
        assertNotNull(ontologyResult);
        JSONArray bindings = ontologyResult.optJSONArray("bindings");
        assertNotNull(bindings);
        assertEquals(bindings.size(), 1);
        assertEquals(bindings.toString(), expectedResult);
    }

    private void assertEntityNames(Response response, boolean fromNode, Set<String> keys) throws Exception {
        Map<String, EntityNames> expectedValues = objectMapper.readValue(
                getResourceString("/getOntologyStuffData/entityNames-results.json"),
                new TypeReference<Map<String, EntityNames>>() {});
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
        verify(catalogManager).createRecord(any(User.class), config.capture(), eq(OntologyRecord.class));
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
        Mockito.doThrow(new MobiException("I'm an exception!")).when(catalogManager).createRecord(any(), any(), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-local-imports-1e.ttl", getClass().getResourceAsStream("/test-local-imports-1e.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 500);

        JSONObject responseObject = getResponse(response);
        assertEquals(responseObject.get("error"), "MobiException");
        assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void testUploadErrorRDFParseException() {
        Mockito.doThrow(new RDFParseException("I'm an exception!")).when(catalogManager).createRecord(any(), any(), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-local-imports-1e.ttl", getClass().getResourceAsStream("/test-local-imports-1e.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);

        JSONObject responseObject = getResponse(response);
        assertEquals(responseObject.get("error"), "RDFParseException");
        assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void testUploadErrorIllegalArgumentException() {
        Mockito.doThrow(new IllegalArgumentException("I'm an exception!")).when(catalogManager).createRecord(any(), any(), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-local-imports-1e.ttl", getClass().getResourceAsStream("/test-local-imports-1e.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);

        JSONObject responseObject = getResponse(response);
        assertEquals(responseObject.get("error"), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
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
        assertEquals(response.getStatus(), 400);
    }

    // Test upload ontology json

    @Test
    public void testUploadOntologyJson() {
        JSONObject ontologyJson = new JSONObject().element("@id", "http://mobi.com/ontology");
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
        verify(catalogManager).createRecord(any(User.class), config.capture(), eq(OntologyRecord.class));
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
        JSONObject entity = new JSONObject().element("@id", "http://mobi.com/entity");

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("json", entity.toString());
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
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
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testUploadOntologyJsonAndFile() {
        JSONObject ontologyJson = new JSONObject().element("@id", "http://mobi.com/ontology");
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("json", ontologyJson.toString());
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    // Test get ontology

    @Test
    public void testDownloadOntologyFile() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        assertGetOntology(true);
    }

    @Test
    public void testDownloadOntologyFileWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        assertGetOntology(false);
    }

    @Test
    public void testDownloadOntologyFileWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        assertGetOntology(true);
    }

    @Test
    public void testDownloadOntologyFileMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        assertGetOntology(true);
    }

    @Test
    public void testDownloadOntologyFileWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 400);
    }

    // Test download ontology file

    @Test
    public void testGetOntologyClearCache() {
        when(mockCache.containsKey(anyString())).thenReturn(false);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("clearCache", true).request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(response.getStatus(), 200);
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(ontologyCache).removeFromCache(recordId.stringValue(), commitId.stringValue());
        // OntologyManger will handle caching the ontology
        verify(mockCache, times(0)).put(anyString(), any(Ontology.class));
    }

    @Test
    public void testGetOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(response.getStatus(), 200);
        assertGetOntology(false);
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(ontologyCache, times(0)).removeFromCache(anyString(), anyString());
    }

    @Test
    public void testGetOntologyWithDoNotApplyInProgressCommit() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("applyInProgressCommit", false)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(engineManager, times(0)).retrieveUser(anyString());
        verify(catalogManager, times(0)).getInProgressCommit(any(Resource.class), any(Resource.class), any(User.class));
        verify(catalogManager, times(0)).applyInProgressCommit(any(Resource.class), any(Model.class));
        verify(ontologyCache, times(0)).removeFromCache(anyString(), anyString());
    }

    @Test
    public void testGetOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(response.getStatus(), 200);
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        verify(ontologyCache, times(0)).removeFromCache(anyString(),  anyString());
    }

    @Test
    public void testGetOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request().accept(MediaType.APPLICATION_JSON_TYPE).get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test save changes to ontology

    @Test
    public void testSaveChangesToOntology() {
        JSONObject entity = new JSONObject().element("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class));
    }

    @Test
    public void testSaveChangesToOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = new JSONObject().element("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertGetInProgressCommitIRI(false);
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class));
    }

    @Test
    public void testSaveChangesToOntologyWithNoDifference() {
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(new Difference.Builder()
                .build());

        JSONObject entity = new JSONObject().element("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(catalogManager).updateInProgressCommit(catalogId, recordId, inProgressCommitId, null, null);
    }

    @Test
    public void testSaveChangesToOntologyWithCommitIdAndMissingBranchId() {
        JSONObject entity = new JSONObject().element("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class));
    }

    @Test
    public void testSaveChangesToOntologyMissingCommitId() {
        JSONObject entity = new JSONObject().element("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class));
    }

    @Test
    public void testSaveChangesToOntologyMissingBranchIdAndMissingCommitId() {
        JSONObject entity = new JSONObject().element("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertGetInProgressCommitIRI(true);
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), eq(inProgressCommitId), any(Model.class), any(Model.class));
    }

    @Test
    public void testSaveChangesToOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        JSONObject entity = new JSONObject().element("@id", "http://mobi.com/entity");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 400);
    }

    // Test get vocabulary stuff

    @Test
    public void testGetVocabularyStuff() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        JSONObject responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(responseObject.getJSONObject("conceptHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffWithNoInProgressCommit() {
        // Setup:
        setNoInProgressCommit();
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        JSONObject responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(responseObject.getJSONObject("conceptHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        JSONObject responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(responseObject.getJSONObject("conceptHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("branchId", branchId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        JSONObject responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(responseObject.getJSONObject("conceptHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        JSONObject responseObject = getResponse(response);
        assertConcepts(responseObject, concepts);
        assertConceptSchemes(responseObject, conceptSchemes);
        assertDerivedConcepts(responseObject, derivedConcepts);
        assertDerivedConceptSchemes(responseObject, derivedConceptSchemes);
        assertDerivedSemanticRelations(responseObject, derivedSemanticRelations);
        assertEquals(responseObject.getJSONObject("conceptHierarchy"), basicHierarchyResults);
        assertEquals(responseObject.getJSONObject("conceptSchemeHierarchy"), basicHierarchyResults);
    }

    @Test
    public void testGetVocabularyStuffWhenRetrieveOntologyIsEmpty() {
        // Setup:
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/vocabulary-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get ontology stuff

    @Test
    public void testGetOntologyStuff() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertGetOntologyStuff(response);
    }

    @Test
    public void testGetOntologyStuffWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertGetOntologyStuff(response);
    }

    @Test
    public void testGetOntologyStuffMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertGetOntologyStuff(response);
    }

    @Test
    public void testGetOntologyStuffMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetOntologyStuffPropertyToRanges() throws Exception {
        setupTupleQueryMock();

        Model data = getModel("/getOntologyStuffData/ontologyData.ttl");
        JSONObject expectedResults = getResource("/getOntologyStuffData/propertyToRanges-results.json");

        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            conn.add(data);
        }

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject.getJSONObject("propertyToRanges"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffPropertyToRangesNoResults() {
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.containsKey("propertyToRanges"));
        assertEquals(responseObject.getJSONObject("propertyToRanges"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffClassToAssociatedProperties() throws Exception {
        setupTupleQueryMock();

        Model data = getModel("/getOntologyStuffData/ontologyData.ttl");
        JSONObject expectedResults = getResource("/getOntologyStuffData/classToAssociatedProperties-results.json");

        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            conn.add(data);
        }

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject.getJSONObject("classToAssociatedProperties"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffClassToAssociatedPropertiesNoResults() {
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.containsKey("classToAssociatedProperties"));
        assertEquals(responseObject.getJSONObject("classToAssociatedProperties"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffNoDomainProperties() throws Exception {
        setupTupleQueryMock();

        Model data = getModel("/getOntologyStuffData/ontologyData.ttl");
        JSONArray expectedResults = getResourceArray("/getOntologyStuffData/noDomainProperties-results.json");

        try(RepositoryConnection conn = testQueryRepo.getConnection()) {
            conn.add(data);
        }

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);

        Set<String> actual = new HashSet<>();
        responseObject.getJSONArray("noDomainProperties").forEach(o -> actual.add((String) o));

        Set<String> expected = new HashSet<>();
        expectedResults.forEach(o -> expected.add((String) o));

        assertEquals(actual, expected);
    }

    @Test
    public void testGetOntologyStuffNoDomainPropertiesNoResults() {
        JSONArray expectedResults = new JSONArray();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.containsKey("noDomainProperties"));
        assertEquals(responseObject.getJSONArray("noDomainProperties"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffEntityNames() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEntityNames(response, true, Collections.emptySet());
    }

    @Test
    public void testGetOntologyStuffEntityNamesNoResults() {
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.containsKey("entityNames"));
        assertEquals(responseObject.getJSONObject("entityNames"), expectedResults);
    }

    @Test
    public void testGetOntologyStuffEntityNamesBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/ontology-stuff")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertTrue(responseObject.containsKey("entityNames"));
        assertEquals(responseObject.getJSONObject("entityNames"), expectedResults);
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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        JSONObject responseObject = getResponse(response);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        JSONObject responseObject = getResponse(response);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        JSONObject responseObject = getResponse(response);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        JSONObject responseObject = getResponse(response);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        JSONObject responseObject = getResponse(response);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get annotations in ontology

    @Test
    public void testGetAnnotationsInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertAnnotations(getResponse(response), annotationProperties, annotations);
    }

    @Test
    public void testGetAnnotationsInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(false);
        assertAnnotations(getResponse(response), annotationProperties, annotations);
    }

    @Test
    public void testGetAnnotationsInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(false);
        assertAnnotations(getResponse(response), annotationProperties, annotations);
    }

    @Test
    public void testGetAnnotationsInOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetAnnotationsInOntologyWhenNoAnnotations() {
        when(ontology.getAllAnnotationProperties()).thenReturn(Collections.EMPTY_SET);
        when(ontology.getAllAnnotations()).thenReturn(Collections.EMPTY_SET);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertAnnotations(getResponse(response), Collections.EMPTY_SET, Collections.EMPTY_SET);
    }

    // Test add annotation to ontology

    @Test
    public void testAddAnnotationToOntology() {
        JSONObject entity = createJsonOfType(OWL.ANNOTATIONPROPERTY.stringValue())
                .element("@id", "http://mobi.com/new-annotation");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedAnnotationToOntology() {
        JSONObject entity = new JSONObject()
                .element("@id", "http://mobi.com/new-annotation");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddInvalidAnnotationToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations").request()
                .post(Entity.json(INVALID_JSON));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddAnnotationToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = createJsonOfType(OWL.ANNOTATIONPROPERTY.stringValue())
                .element("@id", "http://mobi.com/new-annotation");

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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteAnnotationFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteAnnotationFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteAnnotationFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(classId.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteMissingAnnotationFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/annotations/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get classes in ontology

    @Test
    public void testGetClassesInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        assertClasses(getResponseArray(response), classes);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(engineManager, times(0)).retrieveUser(anyString());
        verify(catalogManager, times(0)).getInProgressCommit(any(Resource.class), any(Resource.class), any(User.class));
        verify(catalogManager, times(0)).applyInProgressCommit(any(Resource.class), any(Model.class));
        verify(ontologyCache, times(0)).removeFromCache(anyString(), anyString());
    }

    @Test
    public void testGetClassesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertClasses(getResponseArray(response), classes);
    }

    @Test
    public void testGetClassesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertClasses(getResponseArray(response), classes);
    }

    @Test
    public void testGetClassesInOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetClassesInOntologyWhenNoClasses() {
        when(ontology.getAllClasses()).thenReturn(Collections.EMPTY_SET);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertClasses(getResponseArray(response), Collections.EMPTY_SET);
    }

    // Test add class to ontology

    @Test
    public void testAddClassToOntology() {
        JSONObject entity = createJsonOfType(OWL.CLASS.stringValue())
                .element("@id", "http://mobi.com/new-class");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedClassToOntology() {
        JSONObject entity = new JSONObject()
                .element("@id", "http://mobi.com/new-class");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddInvalidClassToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes").request()
                .post(Entity.json(INVALID_JSON));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddClassToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = createJsonOfType(OWL.CLASS.stringValue())
                .element("@id", "http://mobi.com/new-class");

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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteClassFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(classId.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteMissingClassFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/classes/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get datatypes in ontology

    @Test
    public void testGetDatatypesInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDatatypes(getResponse(response), datatypes);
    }

    @Test
    public void testGetDatatypesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDatatypes(getResponse(response), datatypes);
    }

    @Test
    public void testGetDatatypesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDatatypes(getResponse(response), datatypes);
    }

    @Test
    public void testGetDatatypesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetDatatypesInOntologyWhenNoDatatypes() {
        when(ontology.getAllDatatypes()).thenReturn(Collections.EMPTY_SET);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDatatypes(getResponse(response), Collections.EMPTY_SET);
    }

    // Test add datatype to ontology

    @Test
    public void testAddDatatypeToOntology() {
        JSONObject entity = createJsonOfType(OWL.DATATYPEPROPERTY.stringValue())
                .element("@id", "http://mobi.com/new-datatype");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedDatatypeToOntology() {
        JSONObject entity = new JSONObject()
                .element("@id", "http://mobi.com/new-datatype");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddInvalidDatatypeToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes").request()
                .post(Entity.json(INVALID_JSON));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddDatatypeToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = createJsonOfType(OWL.DATATYPEPROPERTY.stringValue())
                .element("@id", "http://mobi.com/new-datatype");

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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteDatatypeFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteMissingDatatypeFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/datatypes/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get object properties in ontology

    @Test
    public void testGetObjectPropertiesInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertObjectProperties(getResponseArray(response), objectProperties);
    }

    @Test
    public void testGetObjectPropertiesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertObjectProperties(getResponseArray(response), objectProperties);
    }

    @Test
    public void testGetObjectPropertiesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertObjectProperties(getResponseArray(response), objectProperties);
    }

    @Test
    public void testGetObjectPropertiesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetObjectPropertiesInOntologyWhenNoObjectProperties() {
        when(ontology.getAllObjectProperties()).thenReturn(Collections.EMPTY_SET);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertObjectProperties(getResponseArray(response), Collections.EMPTY_SET);
    }

    // Test add object property to ontology

    @Test
    public void testAddObjectPropertyToOntology() {
        JSONObject entity = createJsonOfType(OWL.OBJECTPROPERTY.stringValue())
                .element("@id", "http://mobi.com/new-object-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedObjectPropertyToOntology() {
        JSONObject entity = new JSONObject()
                .element("@id", "http://mobi.com/new-object-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddInvalidObjectPropertyToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties")
                .request().post(Entity.json(INVALID_JSON));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddObjectPropertyToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = createJsonOfType(OWL.OBJECTPROPERTY.stringValue())
                .element("@id", "http://mobi.com/new-object-property");

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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteMissingObjectPropertyFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/object-properties/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get data properties in ontology

    @Test
    public void testGetDataPropertiesInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyWhenNoInProgressCommit() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), dataProperties);
    }

    @Test
    public void testGetDataPropertiesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetDataPropertiesInOntologyWhenNoDataProperties() {
        when(ontology.getAllDataProperties()).thenReturn(Collections.EMPTY_SET);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertDataProperties(getResponseArray(response), Collections.EMPTY_SET);
    }

    // Test add data property to ontology

    @Test
    public void testAddDataPropertyToOntology() {
        JSONObject entity = createJsonOfType(OWL.DATATYPEPROPERTY.stringValue())
                .element("@id", "http://mobi.com/new-data-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedDataPropertyToOntology() {
        JSONObject entity = new JSONObject()
                .element("@id", "http://mobi.com/new-data-property");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddInvalidDataPropertyToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(INVALID_JSON));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddDataPropertyToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = createJsonOfType(OWL.DATATYPEPROPERTY.stringValue())
                .element("@id", "http://mobi.com/new-data-property");

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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteMissingDataPropertyFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get named individuals in ontology

    @Test
    public void testGetNamedIndividualsInOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyWhenNoInProgressCommit() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), namedIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetNamedIndividualsInOntologyWhenNoNamedIndividuals() {
        when(ontology.getAllIndividuals()).thenReturn(Collections.EMPTY_SET);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertIndividuals(getResponse(response), Collections.EMPTY_SET);
    }

    // Test add named individual to ontology

    @Test
    public void testAddNamedIndividualToOntology() {
        JSONObject entity = createJsonOfType(OWL.INDIVIDUAL.stringValue())
                .element("@id", "http://mobi.com/new-named-individual");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddWrongTypedNamedIndividualToOntology() {
        JSONObject entity = new JSONObject()
                .element("@id", "http://mobi.com/new-named-individual");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddInvalidNamedIndividualToOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().post(Entity.json(INVALID_JSON));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testAddNamedIndividualToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = createJsonOfType(OWL.INDIVIDUAL.stringValue())
                .element("@id", "http://mobi.com/new-named-individual");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 201);
        assertAdditionsToInProgressCommit(false);
    }

    @Test
    public void testAddNamedIndividualToOntologyWhenGetRecordIsEmpty() {
        when(catalogManager.getRecord(catalogId, recordId, ontologyRecordFactory)).thenReturn(Optional.empty());

        JSONObject entity = createJsonOfType(OWL.INDIVIDUAL.stringValue())
                .element("@id", "http://mobi.com/new-named-individual");

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity.toString()));

        assertEquals(response.getStatus(), 400);
    }

    // Test delete named individual from ontology

    @Test
    public void testDeleteNamedIndividualFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteMissingNamedIndividualFromOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/named-individuals/"
                + encode(missingIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get IRIs in imported ontologies

    @Test
    public void testGetIRIsInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) -> {
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) -> {
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) -> {
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) -> {
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) -> {
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetIRIsInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

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

        assertEquals(response.getStatus(), 200);

        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));

        assertEquals(responseArray.size(), 2);
        assert(responseArray.contains("http://mobi.com/imported-ontology-id"));
        assert(responseArray.contains("http://mobi.com/failed-import-1"));
    }

    @Test
    public void testGetImportedOntologyIRIsWithDupes() {
        when(ontology.getUnloadableImportIRIs()).thenReturn(Collections.singleton(vf.createIRI("http://mobi.com/imported-ontology-id")));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontology-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);

        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));

        assertEquals(responseArray.size(), 1);
        assertEquals(responseArray.get(0), "http://mobi.com/imported-ontology-id");
    }

    @Test
    public void testGetImportedOntologyIRIsWithNoImports() {
        when(ontology.getUnloadableImportIRIs()).thenReturn(Collections.EMPTY_SET);
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontology-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);

        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));

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

        assertEquals(response.getStatus(), 200);
    }

    // Test get imports closure

    @Test
    public void testGetImportsClosure() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importsClosureResults);
    }

    @Test
    public void testgetImportsClosureWhenApplyInProgressCommitFalse() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("applyInProgressCommit", false).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(engineManager, times(0)).retrieveUser(anyString());
        verify(catalogManager, times(0)).getInProgressCommit(any(Resource.class), any(Resource.class), any(User.class));
        verify(catalogManager, times(0)).applyInProgressCommit(any(Resource.class), any(Model.class));
        verify(ontologyCache, times(0)).removeFromCache(anyString(), anyString());
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importsClosureResults);
    }

    @Test
    public void testGetImportsClosureWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetImportsClosureWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertAnnotations(responseObject, annotationProperties, annotations));
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertClassIRIs(responseObject, importedClasses));
    }

    @Test
    public void testGetClassesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetClassesInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDatatypes(responseObject, datatypes));
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                        commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertObjectPropertyIRIs(responseObject, objectProperties));
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesMissingBranchIdAndCommmitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertDataPropertyIRIs(responseObject, dataProperties));
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWithCommitIdMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->
                assertIndividuals(responseObject, namedIndividuals));
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWhenNoImports() {
        when(ontology.getImportsClosure()).thenReturn(Collections.EMPTY_SET);

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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubClassesOf();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetClassIRIs(classes));
    }

    @Test
    public void testGetOntologyClassHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getSubClassesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetClassIRIs(classes));
    }

    @Test
    public void testGetOntologyClassHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getSubClassesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetClassIRIs(classes));
    }

    @Test
    public void testGetOntologyClassHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/class-hierarchies")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get ontology object property hierarchy

    @Test
    public void testGetOntologyObjectPropertyHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubObjectPropertiesOf();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetObjectPropertyIRIs(objectProperties));
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getSubObjectPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetObjectPropertyIRIs(objectProperties));
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getSubObjectPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetObjectPropertyIRIs(objectProperties));
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/object-property-hierarchies").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get ontology data property hierarchy

    @Test
    public void testGetOntologyDataPropertyHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubDatatypePropertiesOf();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetDataPropertyIRIs(dataProperties));
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getSubDatatypePropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetDataPropertyIRIs(dataProperties));
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getSubDatatypePropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetDataPropertyIRIs(dataProperties));
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/data-property-hierarchies").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get ontology annotation property hierarchy

    @Test
    public void testGetOntologyAnnotationPropertyHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getSubAnnotationPropertiesOf();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetAnnotationPropertyIRIs(annotationProperties));
    }

    @Test
    public void testGetOntologyAnnotationPropertyHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getSubAnnotationPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetAnnotationPropertyIRIs(annotationProperties));
    }

    @Test
    public void testGetOntologyAnnotationPropertyHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getSubAnnotationPropertiesOf();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetAnnotationPropertyIRIs(annotationProperties));
    }

    @Test
    public void testGetOntologyAnnotationPropertyHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/annotation-property-hierarchies").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get concept hierarchy

    @Test
    public void testGetConceptHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getConceptRelationships();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetIndividualIRIs(concepts));
    }

    @Test
    public void testGetConceptHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getConceptRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(concepts));
    }

    @Test
    public void testGetConceptHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getConceptRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(concepts));
    }

    @Test
    public void testGetConceptHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-hierarchies")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get concept scheme hierarchy

    @Test
    public void testGetConceptSchemeHierarchy() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        verify(ontology).getConceptSchemeRelationships();
        assertGetOntology(false);
        assertHierarchyResults(response, createSetIndividualIRIs(conceptSchemes));
    }

    @Test
    public void testGetConceptSchemeHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        verify(ontology).getConceptSchemeRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(conceptSchemes));
    }

    @Test
    public void testGetConceptSchemeHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getConceptSchemeRelationships();
        assertGetOntology(true);
        assertHierarchyResults(response, createSetIndividualIRIs(conceptSchemes));
    }

    @Test
    public void testGetConceptSchemeHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/concept-scheme-hierarchies")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get classes with individuals

    @Test
    public void testGetClassesWithIndividuals() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(getResponse(response), individualsOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(getResponse(response), individualsOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).request().get();
        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(getResponse(response), individualsOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())
                + "/classes-with-individuals").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get entity usages when queryType is "select"

    @Test
    public void testGetEntityUsages() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "select").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).getEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(getResponse(response), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("queryType", "select").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get entity usages when queryType is "construct"

    @Test
    public void testGetEntityUsagesWhenConstruct() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "construct").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        verify(ontology).constructEntityUsages(classId);
        assertGetOntology(true);
        assertEquals(response.readEntity(String.class), entityUsagesConstruct);
    }

    @Test
    public void testGetEntityUsagesMissingBranchIdAndCommitIdWhenConstruct() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("queryType", "construct").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test get entity usages when queryType is "wrong"

    @Test
    public void testGetEntityUsagesWhenQueryTypeIsWrong() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).queryParam("queryType", "wrong").request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get search results

    @Test
    public void testGetSearchResults() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetSearchResultsWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("commitId", commitId.stringValue()).queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(getResponse(response), searchResults);
    }

    @Test
    public void testGetSearchResultsMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(getResponse(response), searchResults);
    }

    @Test
    public void testGetSearchResultsMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/search-results")
                .queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteOntology() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeRecord(eq(catalogId), eq(recordId), eq(user), eq(OntologyRecord.class));
    }

    @Test
    public void testDeleteOntologyError() {
        Mockito.doThrow(new MobiException("I'm an exception!")).when(catalogManager)
                .removeRecord(eq(catalogId), eq(recordId), eq(user), eq(OntologyRecord.class));
        Response response = target().path("ontologies/" + encode(recordId.stringValue())).request().delete();

        assertEquals(response.getStatus(), 500);
        verify(ontologyManager, times(0)).deleteOntologyBranch(any(), any());
    }

    @Test
    public void testDeleteOntologyBranch() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/branches/"
                + encode(branchId.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).deleteOntologyBranch(recordId, branchId);
    }

    @Test
    public void testDeleteOntologyBranchError() {
        Mockito.doThrow(new MobiException("I'm an exception!")).when(ontologyManager).deleteOntologyBranch(eq(recordId), eq(branchId));
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/branches/"
                + encode(branchId.stringValue())).request().delete();

        assertEquals(response.getStatus(), 500);
        verify(ontologyManager).deleteOntologyBranch(recordId, branchId);
    }

    // Test upload changes

    @Test
    public void testUploadChangesToOntology() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(ontologyModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getDiff(any(Model.class), any(Model.class));
        verify(catalogManager, times(2)).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any());
    }

    @Test
    public void testUploadChangesToOntologyWithoutBranchId() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(ontologyModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());
        when(catalogManager.getMasterBranch(eq(catalogId), eq(recordId))).thenReturn(branch);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        verify(catalogManager, times(0)).getMasterBranch(eq(catalogId), eq(recordId));
        verify(catalogManager, times(0)).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager, times(0)).getDiff(any(Model.class), any(Model.class));
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(catalogManager, times(0)).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any());
    }

    @Test
    public void testUploadChangesToOntologyWithoutCommitId() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(ontologyModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());
        when(catalogManager.getHeadCommit(eq(catalogId), eq(recordId), eq(branchId))).thenReturn(commit);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId));
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getDiff(any(Model.class), any(Model.class));
        verify(catalogManager, times(2)).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any());
    }

    @Test
    public void testUploadChangesToOntologyWithExistingInProgressCommit() {
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId), any(User.class))).thenReturn(Optional.of(inProgressCommit));

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
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(ontologyModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());
        Difference difference = new Difference.Builder().additions(mf.createEmptyModel()).deletions(mf.createEmptyModel()).build();
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-ontology.ttl", getClass().getResourceAsStream("/test-ontology.ttl"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.NO_CONTENT.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getDiff(any(Model.class), any(Model.class));
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(catalogManager, never()).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any());
    }

    @Test
    public void testUploadChangesTrigToOntologyNoDiff() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(ontologyModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());
        Difference difference = new Difference.Builder().additions(mf.createEmptyModel()).deletions(mf.createEmptyModel()).build();
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "testOntologyData.trig", getClass().getResourceAsStream("/testOntologyData.trig"));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        JSONObject responseObject = getResponse(response);
        assertEquals(responseObject.get("error"), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage"), "TriG data is not supported for ontology upload changes.");
        assertNotEquals(responseObject.get("errorDetails"), null);
    }
    
    // Test failed-imports

    @Test
    public void testGetFailedImports() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().get();

        assertEquals(response.getStatus(), 200);
        assertFailedImports(getResponseArray(response));
        assertGetOntology(true);
    }

    @Test
    public void testGetFailedImportsWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().get();

        assertEquals(response.getStatus(), 200);
        assertFailedImports(getResponseArray(response));
        assertGetOntology(false);
    }

    @Test
    public void testGetFailedImportsMissingBranchId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        assertFailedImports(getResponseArray(response));
        assertGetOntology(true);
    }

    @Test
    public void testGetFailedImportsMissingCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        assertFailedImports(getResponseArray(response));
        assertGetOntology(true);
    }

    @Test
    public void testGetFailedImportsMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/failed-imports")
                .request().get();

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);
    }

    // Test query

    @Test
    public void testQueryOntologyWithSelect() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
//        verify(ontologyManager).getTupleQueryResults(ontology, query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testQueryOntologyWithEmptySelect() {
        // Setup:
        String query = "select * { ?s ?p ?o }";
        when(ontology.getTupleQueryResults(query, true)).thenAnswer(i -> new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 204);
        verify(ontology).getTupleQueryResults(query, true);
    }

    @Test
    public void testQueryOntologyWithConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/ld+json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));
        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testQueryOntologyWithEmptyConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s <urn:test> ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/ld+json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));

        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testQueryOntologyMissingQuery() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testQueryOntologyWithUnsupportedType() {
        String query = "ask where { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testQueryOntologyWithMalformedQuery() {
        // Setup:
        String query = "select 0-2q3u { ?s ?p ?o }";
        doThrow(new MalformedQueryException()).when(ontology).getTupleQueryResults(query, true);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testQueryOntologyMissingBranchId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testQueryOntologyMissingCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testQueryOntologyMissingBranchIdAndCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testQueryOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        String query = "select * { ?s ?p ?o }";

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testPostQueryOntologyWithSelect() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
//        verify(ontologyManager).getTupleQueryResults(ontology, query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testPostQueryOntologyWithEmptySelect() {
        // Setup:
        String query = "select * { ?s ?p ?o }";
        when(ontology.getTupleQueryResults(query, true)).thenAnswer(i -> new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 204);
        verify(ontology).getTupleQueryResults(query, true);
    }

    @Test
    public void testPostQueryOntologyWithConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/ld+json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));
        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testPostQueryOntologyWithEmptyConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s <urn:test> ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/ld+json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));

        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testPostQueryOntologyMissingQuery() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").post(Entity.entity("", "application/sparql-query"));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testPostQueryOntologyWithUnsupportedType() {
        String query = "ask where { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testPostQueryOntologyWithMalformedQuery() {
        // Setup:
        String query = "select 0-2q3u { ?s ?p ?o }";
        doThrow(new MalformedQueryException()).when(ontology).getTupleQueryResults(query, true);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testPostQueryOntologyMissingBranchId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testPostQueryOntologyMissingCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue())
                .request().accept("application/json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testPostQueryOntologyMissingBranchIdAndCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testPostQueryOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        String query = "select * { ?s ?p ?o }";

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testPostUrlEncodedQueryOntologyWithSelect() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";

        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
//        verify(ontologyManager).getTupleQueryResults(ontology, query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testPostUrlEncodedQueryOntologyWithEmptySelect() {
        // Setup:
        String query = "select * { ?s ?p ?o }";
        when(ontology.getTupleQueryResults(query, true)).thenAnswer(i -> new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));

        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 204);
        verify(ontology).getTupleQueryResults(query, true);
    }

    @Test
    public void testPostUrlEncodedQueryOntologyWithConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/ld+json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false),
                any(OutputStream.class));
        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testPostUrlEncodedQueryOntologyWithEmptyConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s <urn:test> ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/ld+json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));

        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testPostUrlEncodedQueryOntologyMissingQuery() {
        Form form = new Form();
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testPostUrlEncodedQueryOntologyWithUnsupportedType() {
        String query = "ask where { ?s ?p ?o }";

        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testPostUrlEncodedQueryOntologyWithMalformedQuery() {
        // Setup:
        String query = "select 0-2q3u { ?s ?p ?o }";
        doThrow(new MalformedQueryException()).when(ontology).getTupleQueryResults(query, true);

        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testPostUrlEncodedQueryOntologyMissingBranchId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testPostUrlEncodedQueryOntologyMissingCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testPostUrlEncodedQueryOntologyMissingBranchIdAndCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testPostUrlEncodedQueryOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .request().accept("application/json").post(Entity.entity(query, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDownloadQueryOntologyWithSelect() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
//        verify(ontologyManager).getTupleQueryResults(ontology, query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testDownloadQueryOntologyWithEmptySelect() {
        // Setup:
        String query = "select * { ?s ?p ?o }";
        when(ontology.getTupleQueryResults(query, true)).thenAnswer(i -> new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 204);
        verify(ontology).getTupleQueryResults(query, true);
    }

    @Test
    public void testDownloadQueryOntologyWithConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/ld+json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));
        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testDownloadQueryOntologyWithEmptyConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s <urn:test> ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/ld+json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));

        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testDownloadQueryOntologyMissingQuery() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity("", "application/sparql-query"));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDownloadQueryOntologyWithUnsupportedType() {
        String query = "ask where { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDownloadQueryOntologyWithMalformedQuery() {
        // Setup:
        String query = "select 0-2q3u { ?s ?p ?o }";
        doThrow(new MalformedQueryException()).when(ontology).getTupleQueryResults(query, true);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDownloadQueryOntologyMissingBranchId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testDownloadQueryOntologyMissingCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue())
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testDownloadQueryOntologyMissingBranchIdAndCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testDownloadQueryOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        String query = "select * { ?s ?p ?o }";

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(query, "application/sparql-query"));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyWithSelect() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
//        verify(ontologyManager).getTupleQueryResults(ontology, query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyWithEmptySelect() {
        // Setup:
        String query = "select * { ?s ?p ?o }";
        when(ontology.getTupleQueryResults(query, true)).thenAnswer(i -> new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 204);
        verify(ontology).getTupleQueryResults(query, true);
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyWithConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/ld+json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));
        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyWithEmptyConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s <urn:test> ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/ld+json")
                .request().accept("application/octet-stream").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResultsStream(eq(query), eq(true), eq(RDFFormat.JSONLD), eq(false), any(OutputStream.class));

        assertConstructQuery(response.readEntity(String.class));
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyMissingQuery() {
        Form form = new Form();
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyWithUnsupportedType() {
        String query = "ask where { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyWithMalformedQuery() {
        // Setup:
        String query = "select 0-2q3u { ?s ?p ?o }";
        doThrow(new MalformedQueryException()).when(ontology).getTupleQueryResults(query, true);

        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyMissingBranchId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyMissingCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyMissingBranchIdAndCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query, true);
        assertSelectQuery(getResponse(response));
    }

    @Test
    public void testDownloadUrlEncodedQueryOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        String query = "select * { ?s ?p ?o }";
        Form form = new Form();
        form.param("query", query);
        form.param("branchId", branchId.stringValue());
        form.param("commitId", commitId.stringValue());
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/query")
                .queryParam("fileType", "application/json")
                .request().accept("application/octet-stream").post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

        assertEquals(response.getStatus(), 400);
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

    // Test grouped query

    @Test
    public void testGroupedQueryOntologyWithSelect() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query + " limit 500", false);
        assertGroupedSelectQuery(getResponse(response));
    }

    @Test
    public void testGroupedQueryOntologyWithEmptySelect() {
        // Setup:
        String query = "select * { ?s ?p ?o }";
        when(ontology.getTupleQueryResults(query, true)).thenAnswer(i -> new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 204);
        verify(ontology).getTupleQueryResults(query + " limit 500", false);
    }

    @Test
    public void testGroupedQueryOntologyWithConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResults(query + " limit 500", false);
        assertGroupedConstructQuery(getResponse(response));
    }

    @Test
    public void testGroupedQueryOntologyWithEmptyConstruct() {
        mockGraphQueryResultStream(constructJsonLd);
        // Setup:
        String query = "construct where { ?s <urn:test> ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getGraphQueryResults(query + " limit 500", false);
        assertGroupedConstructQuery(getResponse(response));
    }

    @Test
    public void testGroupedQueryOntologyMissingQuery() {
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGroupedQueryOntologyWithUnsupportedType() {
        String query = "ask where { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGroupedQueryOntologyWithMalformedQuery() {
        // Setup:
        String query = "select 0-2q3u { ?s ?p ?o }";
        doThrow(new MalformedQueryException()).when(ontology).getTupleQueryResults(query, true);

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGroupedQueryOntologyMissingBranchId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query + " limit 500", false);
        assertGroupedSelectQuery(getResponse(response));
    }

    @Test
    public void testGroupedQueryOntologyMissingCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query + " limit 500", false);
        assertGroupedSelectQuery(getResponse(response));
    }

    @Test
    public void testGroupedQueryOntologyMissingBranchIdAndCommitId() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i ->
                new TestQueryResult(Collections.singletonList("s"), Collections.singletonList("urn:test"), 1, vf));

        String query = "select * { ?s ?p ?o }";
        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 200);
        verify(ontology).getTupleQueryResults(query + " limit 500", false);
        assertGroupedSelectQuery(getResponse(response));
    }

    @Test
    public void testGroupedQueryOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());
        String query = "select * { ?s ?p ?o }";

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/group-query")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("query", encode(query))
                .request().accept("application/json").get();

        assertEquals(response.getStatus(), 400);
    }

    // Test getEntityNames

    @Test
    public void testGetEntityNames() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(new JSONObject().toString()));

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesNoResults() throws Exception {
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
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
                .post(Entity.json(new JSONObject().toString()));

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesWithNoInProgressCommitNoResults() throws Exception {
        setNoInProgressCommit();
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesWithNoInProgressCommitBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        setNoInProgressCommit();
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId, commitId);
        assertGetOntology(false);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesWithCommitIdAndMissingBranchId() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("commitId", commitId.stringValue()).request().post(Entity.json(new JSONObject().toString()));

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesWithCommitIdAndMissingBranchIdNoResults() throws Exception {
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("commitId", commitId.stringValue()).request().post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesWithCommitIdAndMissingBranchIdBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("commitId", commitId.stringValue()).request().post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntologyByCommit(recordId, commitId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesMissingCommitId() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).request()
                .post(Entity.json(new JSONObject().toString()));

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesMissingCommitIdNoResults() throws Exception {
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).request()
                .post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesMissingCommitIdBlankResult() throws Exception {
        setupTupleQueryMock();
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .queryParam("branchId", branchId.stringValue()).request()
                .post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId, branchId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesMissingBranchIdAndCommitId() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .request().post(Entity.json(new JSONObject().toString()));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEntityNames(response, false, Collections.emptySet());
    }

    @Test
    public void testGetEntityNamesMissingBranchIdAndCommitIdFiltered() throws Exception {
        setupEntityNamesRepo();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .request().post(Entity.json("{\"filterResources\": [\"http://test.com/Ontology1\", \"http://test.com/Ontology1#prop1\"]}"));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEntityNames(response, false, new HashSet<>(Arrays.asList("http://test.com/Ontology1", "http://test.com/Ontology1#prop1")));
    }

    @Test
    public void testGetEntityNamesMissingBranchIdAndCommitIdNoResults() throws Exception {
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .request().post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager).retrieveOntology(recordId);
        assertGetOntology(true);
        assertEquals(responseObject, expectedResults);
    }

    @Test
    public void testGetEntityNamesMissingBranchIdAndCommitIdBlankResult() throws Exception {
        setupEntityNamesRepoEmptyEntity();
        JSONObject expectedResults = new JSONObject();

        Response response = target().path("ontologies/" + encode(recordId.stringValue()) + "/entity-names")
                .request().post(Entity.json(new JSONObject().toString()));
        JSONObject responseObject = getResponse(response);

        assertEquals(response.getStatus(), 200);
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
                .post(Entity.json(new JSONObject().toString()));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetOntologyFromIRI() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.of(recordId));
        when(ontologyManager.retrieveOntologyByIRI(any(Resource.class))).thenReturn(Optional.of(ontology));

        Response response = target().path("ontologies/ontology/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals(response.readEntity(String.class), ontologyTurtle.toString());
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testGetOntologyFromIRIWithFormat() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.of(recordId));
        when(ontologyManager.retrieveOntologyByIRI(any(Resource.class))).thenReturn(Optional.of(ontology));

        Response response = target().path("ontologies/ontology/" + encode(recordId.stringValue()))
                .queryParam("format", "jsonld").request().get();
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testGetOntologyFromIRIwithFileExtension() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.of(recordId));
        when(ontologyManager.retrieveOntologyByIRI(any(Resource.class))).thenReturn(Optional.of(ontology));

        Response response = target().path("ontologies/ontology/" + encode(recordId.stringValue()) + ".jsonld")
                .request().get();
        assertEquals(response.readEntity(String.class), ontologyJsonLd.toString());
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testGetOntologyFromIRINoPermissions() {
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.of(recordId));
        when(response.getDecision()).thenReturn(Decision.DENY);

        Response response = target().path("ontologies/ontology/" + encode(recordId.stringValue()))
                .request().get();

        assertEquals(response.getStatus(), 403);
    }

    @Test
    public void testGetOntologyFromIRINoRecord() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());

        Response response = target().path("ontologies/ontology/" + encode("https://www.non-exists.com")).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals("", response.readEntity(String.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetOntologyFromIRIInvalidIRI() {
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());

        Response response = target().path("ontologies/ontology/" + encode("www.non-exists.com")).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals("", response.readEntity(String.class));
        assertEquals(response.getStatus(), 500);
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

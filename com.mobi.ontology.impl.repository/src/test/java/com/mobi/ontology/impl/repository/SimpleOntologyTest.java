package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.dataset.impl.SimpleDatasetRepositoryConnection;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.namespace.api.NamespaceService;
import com.mobi.ontology.core.api.AnnotationProperty;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.Hierarchy;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.OClass;
import com.mobi.ontology.core.api.ObjectProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.cache.repository.OntologyDatasets;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.impl.SimpleBNodeService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.setting.ApplicationSetting;
import com.mobi.vocabularies.xsd.XSD;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DC;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleOntologyTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private ValueFactory vf;
    private ModelFactory mf;
    private final RepositoryManager repoManager = new SimpleRepositoryManager();
    private IRI classIRI;
    private IRI classIRIC;
    private IRI classIRID;
    private IRI classIRIE;
    private IRI dataProp1IRI;
    private IRI dataProp2IRI;
    private IRI objectProp1IRI;
    private IRI objectProp2IRI;
    private IRI errorIRI;
    private IRI importedIRI0;
    private IRI importedIRI;
    private IRI catalogIRI;
    private IRI skosIRI;
    private Ontology ontology;
    private Ontology ont1;
    private Ontology queryOntology;
    private Ontology queryVocabulary;
    private Ontology onlyDeclared;
    private OsgiRepository repo;
    private final OrmFactory<Dataset> datasetFactory = getRequiredOrmFactory(Dataset.class);
    private Model queryOntModel;

    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";
    public static IRI TEST_LOCAL_IMPORT_1 = VALUE_FACTORY.createIRI("http://mobi.com/ontology/test-local-imports-1");
    public static IRI TEST_LOCAL_IMPORT_2 = VALUE_FACTORY.createIRI("http://mobi.com/ontology/test-local-imports-2");
    public static IRI TEST_LOCAL_IMPORT_3 = VALUE_FACTORY.createIRI("http://mobi.com/ontology/test-local-imports-3");

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private BranchManager branchManager;

    @Mock
    private CommitManager commitManager;

    @Mock
    private CatalogConfigProvider catalogConfigProvider;

    @Mock
    private OntologyId ontologyId;

    @Mock
    private BNodeService bNodeService;

    @Mock
    private DatasetUtilsService dsUtilsService;

    @Mock
    private ImportsResolver importsResolver;

    @Mock
    private SettingService<ApplicationSetting> settingService;

    @Mock
    private NamespaceService namespaceService;

    @Before
    public void setUp() throws Exception {
        vf = VALUE_FACTORY;
        mf = MODEL_FACTORY;
        IRI ontologyIRI = vf.createIRI("http://test.com/ontology1");
        IRI versionIRI = vf.createIRI("http://test.com/ontology1/1.0.0");
        classIRI = vf.createIRI("http://test.com/ontology1#TestClassA");
        classIRIC = vf.createIRI("http://test.com/ontology1#TestClassC");
        classIRID = vf.createIRI("http://test.com/ontology1#TestClassD");
        classIRIE = vf.createIRI("http://test.com/ontology1#TestClassE");
        dataProp1IRI = vf.createIRI("http://test.com/ontology1#testDataProperty1");
        dataProp2IRI = vf.createIRI("http://test.com/ontology1#testDataProperty2");
        objectProp1IRI = vf.createIRI("http://test.com/ontology1#testObjectProperty1");
        objectProp2IRI = vf.createIRI("http://test.com/ontology1#testObjectProperty2");
        errorIRI = vf.createIRI("http://test.com/ontology1#error");
        importedIRI0 = vf.createIRI("http://mobi.com/ontology/test-local-imports-1#Class0");
        importedIRI = vf.createIRI("http://mobi.com/ontology/test-local-imports-1#Class1");
        catalogIRI = vf.createIRI("http://mobi.com/test/catalog");
        skosIRI = vf.createIRI("http://www.w3.org/2004/02/skos/core");

        closeable = MockitoAnnotations.openMocks(this);

        repo = spy(repoManager.createMemoryRepository());
        when(repo.getRepositoryID()).thenReturn("ontologyCache");

        when(settingService.getSettingByType(any())).thenReturn(Optional.empty());
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyId.getVersionIRI()).thenReturn(Optional.of(versionIRI));
        when(ontologyManager.createOntologyId(any(IRI.class), any(IRI.class))).thenReturn(ontologyId);
        when(ontologyManager.createOntologyId(any(IRI.class))).thenReturn(ontologyId);
        ArgumentCaptor<Model> iriModel = ArgumentCaptor.forClass(Model.class);
        when(ontologyManager.createOntologyId(iriModel.capture())).thenAnswer(invocation -> new SimpleOntologyId.Builder(settingService, namespaceService).model(iriModel.getValue()).build());
        when(importsResolver.getRecordIRIFromOntologyIRI(any(Resource.class))).thenReturn(Optional.empty());
        when(ontologyId.getOntologyIdentifier()).thenReturn(vf.createIRI("https://mobi.com/ontology-id"));

        when(catalogConfigProvider.getLocalCatalogIRI()).thenReturn(catalogIRI);

        Model skosModel = createModelFromFile("/skos.rdf");
        File skosFile = setupOntologyMocks(skosModel);
        when(importsResolver.retrieveOntologyFromWebFile(skosIRI)).thenReturn(Optional.of(skosFile));

        doNothing().when(dsUtilsService).safeDeleteDataset(any(Resource.class), anyString());
        ArgumentCaptor<Resource> datasetIRICapture = ArgumentCaptor.forClass(Resource.class);
        when(dsUtilsService.createDataset(datasetIRICapture.capture(), anyString())).thenAnswer(invocation -> {
            try (RepositoryConnection conn = repo.getConnection()) {
                Resource datasetIRI = datasetIRICapture.getValue();
                Dataset dataset = datasetFactory.createNew(datasetIRI);
                dataset.setSystemDefaultNamedGraph(VALUE_FACTORY.createIRI(datasetIRICapture.getValue().stringValue() + SYSTEM_DEFAULT_NG_SUFFIX));
                conn.add(dataset.getModel(), datasetIRI);
            }
            return true;
        });
        ArgumentCaptor<Resource> resource = ArgumentCaptor.forClass(Resource.class);
        when(dsUtilsService.getConnection(resource.capture(), anyString())).thenAnswer(invocation -> {
            dsUtilsService.createDataset(resource.getValue(), "ontologyCache");
            return new SimpleDatasetRepositoryConnection(repo.getConnection(), resource.getValue(), "ontologyCache", VALUE_FACTORY);
        });

        Model ontologyModel = createModelFromFile("/test.owl");
        Resource ontologyRecordIRI = vf.createIRI("https://mobi.com/record/testowl");
        Resource ontologyHeadCommitIRI = vf.createIRI("https://mobi.com/commit/testowl/head");
        String ontologyKey = OntologyDatasets.createRecordKey(ontologyRecordIRI, ontologyHeadCommitIRI);
        File ontologyFile = setupOntologyMocks(ontologyModel);
        ontology = new SimpleOntology(ontologyKey, ontologyFile, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        OsgiRepository catalogRepo = repoManager.createMemoryRepository();
        when(catalogConfigProvider.getRepository()).thenReturn(catalogRepo);

        Model ont3Model = createModelFromFile("/test-local-imports-3.ttl");
        File ont3File = setupOntologyMocks(ont3Model);
        Resource ont3RecordIRI = vf.createIRI("https://mobi.com/record/test-local-imports-3");
        Resource ont3HeadCommitIRI = vf.createIRI("https://mobi.com/commit/test-local-imports-3/head");
        String ont3Key = OntologyDatasets.createRecordKey(ont3RecordIRI, ont3HeadCommitIRI);
        Ontology ont3 = new SimpleOntology(ont3Key, ont3File, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);
        MasterBranch ont3Branch = mock(MasterBranch.class);
        when(branchManager.getMasterBranch(any(Resource.class), eq(ont3RecordIRI), any(RepositoryConnection.class))).thenReturn(ont3Branch);
        when(commitManager.getHeadCommitIRI(ont3Branch)).thenReturn(ont3HeadCommitIRI);
        when(importsResolver.getRecordIRIFromOntologyIRI(TEST_LOCAL_IMPORT_3)).thenReturn(Optional.of(ont3RecordIRI));
        when(ontologyManager.retrieveOntology(ont3RecordIRI)).thenReturn(Optional.of(ont3));
        when(importsResolver.retrieveOntologyLocalFileFromCommitIRI(ont3HeadCommitIRI)).thenReturn(ont3File);

        when(bNodeService.skolemize(any(org.eclipse.rdf4j.model.Statement.class))).thenAnswer(i -> i.getArgument(0, org.eclipse.rdf4j.model.Statement.class));
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgument(0, Model.class));

        Model ont2Model = createModelFromFile("/test-local-imports-2.ttl");
        File ont2File = setupOntologyMocks(ont2Model);
        Resource ont2RecordIRI = vf.createIRI("https://mobi.com/record/test-local-imports-2");
        Resource ont2HeadCommitIRI = vf.createIRI("https://mobi.com/commit/test-local-imports-2/head");
        MasterBranch ont2Branch = mock(MasterBranch.class);
        String ont2Key = OntologyDatasets.createRecordKey(ont2RecordIRI, ont2HeadCommitIRI);
        Ontology ont2 = new SimpleOntology(ont2Key, ont2File, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);
        when(branchManager.getMasterBranch(any(Resource.class), eq(ont2RecordIRI), any(RepositoryConnection.class))).thenReturn(ont2Branch);
        when(commitManager.getHeadCommitIRI(ont2Branch)).thenReturn(ont2HeadCommitIRI);
        when(importsResolver.getRecordIRIFromOntologyIRI(TEST_LOCAL_IMPORT_2)).thenReturn(Optional.of(ont2RecordIRI));
        when(ontologyManager.retrieveOntology(ont2RecordIRI)).thenReturn(Optional.of(ont2));
        when(importsResolver.retrieveOntologyLocalFileFromCommitIRI(ont2HeadCommitIRI)).thenReturn(ont2File);

        Model dctModel = createModelFromFile("/dcterms.rdf");
        dctModel.add(vf.createIRI("urn:generatedIRI"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ONTOLOGY.stringValue()));
        File dctFile = setupOntologyMocks(dctModel);
        IRI dctermsIRI = vf.createIRI("http://purl.org/dc/terms/");
        Ontology dcterms = new SimpleOntology(dctermsIRI, dctFile, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        Model ont1Model = createModelFromFile("/test-local-imports-1.ttl");
        File ont1File = setupOntologyMocks(ont1Model);
        ont1 = new SimpleOntology(TEST_LOCAL_IMPORT_1, ont1File, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        queryOntModel = createModelFromFile("/test-ontology.ttl");
        File queryOntFile = setupOntologyMocks(queryOntModel);
        queryOntology = new SimpleOntology(vf.createIRI("http://mobi.com/ontology"), queryOntFile, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        Model queryVocModel = createModelFromFile("/test-vocabulary.ttl");
        File queryVocFile = setupOntologyMocks(queryVocModel);
        queryVocabulary = new SimpleOntology(vf.createIRI("https://mobi.com/vocabulary"), queryVocFile, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        Model onlyDeclaredModel = createModelFromFile("/only-declared.ttl");
        File onlyDeclaredFile = setupOntologyMocks(onlyDeclaredModel);
        onlyDeclared = new SimpleOntology(vf.createIRI("http://mobi.com/ontology/only-declared"), onlyDeclaredFile, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void getOntologyId() throws Exception {
        doReturn(ontologyId).when(ontologyManager).createOntologyId(any(Model.class));

        OntologyId id = ont1.getOntologyId();
        assertEquals(vf.createIRI("https://mobi.com/ontology-id"), id.getOntologyIdentifier());
    }

    @Test
    public void getImportedOntologyIRIsTest() throws Exception {
        Set<IRI> iris = ont1.getImportedOntologyIRIs();
        assertEquals(1, iris.size());
    }

    @Test
    public void getImportsClosureWithLocalImportsTest() throws Exception {
        Set<Ontology> ontologies = ont1.getImportsClosure();
        assertEquals(3, ontologies.size());
    }

    @Test
    public void withDctermsImport() throws Exception {
        // Setup:
        IRI masterHead = vf.createIRI("urn:masterHead");
        URL fileURL = getClass().getResource("/dcterms.rdf");
        assert fileURL != null;
        File dcTermsFile = new File(fileURL.toURI());
        when(importsResolver.retrieveOntologyLocalFileFromCommitIRI(masterHead)).thenReturn(dcTermsFile);

        Model model = createModelFromFile("/skos-kgaa.ttl");
        File file = setupOntologyMocks(model);

        Ontology ont = new SimpleOntology(vf.createIRI("http://www.w3.org/2004/02/skos/core2"), file, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);
        Set<String> expectedClasses = Stream.of("http://www.w3.org/2004/02/skos/core#ConceptScheme",
                "http://www.w3.org/2004/02/skos/core#Concept", "http://www.w3.org/2004/02/skos/core#Collection",
                "http://www.w3.org/2004/02/skos/core#OrderedCollection").collect(Collectors.toSet());

        Set<Ontology> ontologies = ont.getImportsClosure();
        assertEquals(2, ontologies.size());
        Set<IRI> iris = ont.getImportedOntologyIRIs();
        assertEquals(1, iris.size());
        assertTrue(iris.contains(vf.createIRI("http://purl.org/dc/terms/")));
        Set<OClass> classes = ont.getAllClasses();
        assertEquals(expectedClasses.size(), classes.size());
        classes.stream()
                .map(oClass -> oClass.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedClasses.contains(iri)));
    }

    @Test
    public void getAllClassesTest() throws Exception {
        // Setup:
        Set<String> expectedClasses = Stream.of("http://test.com/ontology1#TestClassA",
                "http://test.com/ontology1#TestClassB", "http://test.com/ontology1#TestClassC",
                "http://test.com/ontology1#TestClassD", "http://test.com/ontology1#TestClassE").collect(Collectors.toSet());

        Set<OClass> classes = ontology.getAllClasses();
        assertEquals(expectedClasses.size(), classes.size());
        classes.stream()
                .map(oClass -> oClass.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedClasses.contains(iri)));
    }

    @Test
    public void getAllClassesWithDifferenceTest() throws Exception {
        // Setup:
        Set<String> expectedClasses = Stream.of("http://test.com/ontology1#TestClassA",
                "http://test.com/ontology1#TestClassB", "http://test.com/ontology1#TestClassC",
                "http://test.com/ontology1#TestClassD").collect(Collectors.toSet());

        Model deletions = mf.createEmptyModel();
        IRI owlClass = vf.createIRI("http://test.com/ontology1#TestClassE");
        deletions.add(owlClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));

        SimpleOntology simpleOntology = (SimpleOntology) ontology;
        simpleOntology.setDifference(createDifference(null, deletions));
        Set<OClass> classes = simpleOntology.getAllClasses();
        assertEquals(expectedClasses.size(), classes.size());
        classes.stream()
                .map(oClass -> oClass.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedClasses.contains(iri)));
    }

    @Test
    public void getAllClassesDeclaredTest() throws Exception {
        // Setup:
        Set<String> expectedClasses = Stream.of("http://mobi.com/ontology/only-declared#ClassA",
                "http://mobi.com/ontology/only-declared#ClassB", "http://mobi.com/ontology/only-declared#ClassC").collect(Collectors.toSet());

        Set<OClass> classes = onlyDeclared.getAllClasses();
        assertEquals(expectedClasses.size(), classes.size());
        classes.stream()
                .map(oClass -> oClass.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedClasses.contains(iri)));
    }

    @Test
    public void getAllClassesDeclaredWithDifferenceTest() throws Exception {
        // Setup:
        Set<String> expectedClasses = Stream.of("http://mobi.com/ontology/only-declared#ClassA",
                "http://mobi.com/ontology/only-declared#ClassB").collect(Collectors.toSet());

        Model deletions = mf.createEmptyModel();
        IRI owlClass = vf.createIRI("http://mobi.com/ontology/only-declared#ClassC");
        deletions.add(owlClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));

        SimpleOntology simpleOnlyDeclared = (SimpleOntology) onlyDeclared;
        simpleOnlyDeclared.setDifference(createDifference(null, deletions));
        Set<OClass> classes = simpleOnlyDeclared.getAllClasses();
        assertEquals(expectedClasses.size(), classes.size());
        classes.stream()
                .map(oClass -> oClass.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedClasses.contains(iri)));
    }

    @Test
    public void getAllClassesNoImportsTest() throws Exception {
        // Setup:
        Set<String> expectedClasses = Stream.of("http://mobi.com/ontology/test-local-imports-1#Class0", "http://mobi.com/ontology/test-local-imports-1#Class1").collect(Collectors.toSet());

        Set<OClass> classes = ont1.getAllClasses();
        assertEquals(expectedClasses.size(), classes.size());
        classes.stream()
                .map(oClass -> oClass.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedClasses.contains(iri)));
    }

    @Test
    public void getAllClassesNoImportsWithDifferenceTest() throws Exception {
        // Setup:
        Set<String> expectedClasses = Stream.of("http://mobi.com/ontology/test-local-imports-1#Class0").collect(Collectors.toSet());

        Model deletions = mf.createEmptyModel();
        IRI owlClass = vf.createIRI("http://mobi.com/ontology/test-local-imports-1#Class1");
        deletions.add(owlClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));

        SimpleOntology simpleOnt1 = (SimpleOntology) ont1;
        simpleOnt1.setDifference(createDifference(null, deletions));

        Set<OClass> classes = simpleOnt1.getAllClasses();
        assertEquals(expectedClasses.size(), classes.size());
        classes.stream()
                .map(oClass -> oClass.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedClasses.contains(iri)));
    }

    @Test
    public void getAllObjectPropertiesTest() throws Exception {
        // Setup:
        Set<String> expectedProps = Stream.of("http://test.com/ontology1#testObjectProperty1", "http://test.com/ontology1#testObjectProperty2").collect(Collectors.toSet());

        Set<ObjectProperty> properties = ontology.getAllObjectProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllObjectPropertiesWithDifferenceTest() throws Exception {
        // Setup:
        Set<String> expectedProps = Stream.of("http://test.com/ontology1#testObjectProperty1").collect(Collectors.toSet());

        Model deletions = mf.createEmptyModel();
        IRI prop = vf.createIRI("http://test.com/ontology1#testObjectProperty2");
        deletions.add(prop, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(null, deletions));

        Set<ObjectProperty> properties = ont.getAllObjectProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllObjectPropertiesDeclaredTest() throws Exception {
        Set<ObjectProperty> properties = onlyDeclared.getAllObjectProperties();
        assertEquals(0, properties.size());
    }

    @Test
    public void getAllObjectPropertiesDeclaredWithDifferenceTest() throws Exception {
        // Setup:
        IRI prop = vf.createIRI("http://test.com/ontology1#testObjectProperty2");
        Set<String> expectedProps = Collections.singleton(prop.stringValue());

        Model additions = mf.createEmptyModel();
        additions.add(prop, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) onlyDeclared;
        ont.setDifference(createDifference(additions, null));

        Set<ObjectProperty> properties = ont.getAllObjectProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllObjectPropertiesNoImportsTest() throws Exception {
        Set<ObjectProperty> properties = ont1.getAllObjectProperties();
        assertEquals(0, properties.size());
    }

    @Test
    public void getAllObjectPropertiesNoImportsWithDifferenceTest() throws Exception {
        // Setup:
        IRI prop = vf.createIRI("http://test.com/ontology1#testObjectProperty2");
        Set<String> expectedProps = Collections.singleton(prop.stringValue());

        Model additions = mf.createEmptyModel();
        additions.add(prop, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ont1;
        ont.setDifference(createDifference(additions, null));

        Set<ObjectProperty> properties = ont.getAllObjectProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllDataPropertiesTest() throws Exception {
        // Setup:
        Set<String> expectedProps = Stream.of("http://test.com/ontology1#testDataProperty1", "http://test.com/ontology1#testDataProperty2").collect(Collectors.toSet());

        Set<DataProperty> properties = ontology.getAllDataProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllDataPropertiesWithDifferenceTest() throws Exception {
        // Setup:
        Set<String> expectedProps = Stream.of("http://test.com/ontology1#testDataProperty1").collect(Collectors.toSet());

        Model deletions = mf.createEmptyModel();
        IRI prop = vf.createIRI("http://test.com/ontology1#testDataProperty2");
        deletions.add(prop, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(null, deletions));

        Set<DataProperty> properties = ont.getAllDataProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllDataPropertiesDeclaredTest() throws Exception {
        Set<DataProperty> properties = onlyDeclared.getAllDataProperties();
        assertEquals(0, properties.size());
    }

    @Test
    public void getAllDataPropertiesDeclaredWithDifferenceTest() throws Exception {
        // Setup:
        IRI prop = vf.createIRI("http://test.com/ontology1#testDataProperty2");
        Set<String> expectedProps = Collections.singleton(prop.stringValue());

        Model additions = mf.createEmptyModel();
        additions.add(prop, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) onlyDeclared;
        ont.setDifference(createDifference(additions, null));

        Set<DataProperty> properties = ont.getAllDataProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllDataPropertiesNoImportsTest() throws Exception {
        Set<DataProperty> properties = ont1.getAllDataProperties();
        assertEquals(0, properties.size());
    }

    @Test
    public void getAllDataPropertiesNoImportsWithDifferenceTest() throws Exception {
        // Setup:
        IRI prop = vf.createIRI("http://test.com/ontology1#testDataProperty2");
        Set<String> expectedProps = Collections.singleton(prop.stringValue());

        Model additions = mf.createEmptyModel();
        additions.add(prop, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ont1;
        ont.setDifference(createDifference(additions, null));

        Set<DataProperty> properties = ont.getAllDataProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllAnnotationPropertiesTest() throws Exception {
        // Setup:
        Set<String> expectedProps = Stream.of("http://test.com/ontology1#testAnnotation").collect(Collectors.toSet());

        Set<AnnotationProperty> properties = ontology.getAllAnnotationProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllAnnotationPropertiesWithDifferenceTest() throws Exception {
        // Setup:
        Set<String> expectedProps = Stream.of("http://test.com/ontology1#testAnnotation", "http://test.com/ontology1#testAnnotation2").collect(Collectors.toSet());

        Model additions = mf.createEmptyModel();
        IRI prop = vf.createIRI("http://test.com/ontology1#testAnnotation2");
        additions.add(prop, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ANNOTATIONPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, null));

        Set<AnnotationProperty> properties = ont.getAllAnnotationProperties();
        assertEquals(expectedProps.size(), properties.size());
        properties.stream()
                .map(property -> property.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedProps.contains(iri)));
    }

    @Test
    public void getAllAnnotationPropertiesNoImportsTest() throws Exception {
        Set<AnnotationProperty> properties = ont1.getAllAnnotationProperties();
        assertEquals(0, properties.size());
    }

    @Test
    public void getAllAnnotationPropertiesNoImportsWithDifferenceTest() throws Exception {
        // Setup:
        IRI prop = vf.createIRI("http://test.com/ontology1#testAnnotation2");
        Set<String> expectedProps = Collections.singleton(prop.stringValue());

        Model additions = mf.createEmptyModel();
        additions.add(prop, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ANNOTATIONPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ont1;
        ont.setDifference(createDifference(additions, null));

        Set<AnnotationProperty> properties = ont.getAllAnnotationProperties();
        assertEquals(expectedProps.size(), properties.size());
    }

    @Test
    public void getDataPropertyTest() throws Exception {
        Optional<DataProperty> optional = ontology.getDataProperty(dataProp1IRI);
        assertTrue(optional.isPresent());
        Assert.assertEquals(dataProp1IRI, optional.get().getIRI());
    }

    @Test
    public void getDataPropertyWithDifferenceTest() throws Exception {
        Model deletions = mf.createEmptyModel();
        deletions.add(dataProp1IRI, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(null, deletions));

        Optional<DataProperty> optional = ont.getDataProperty(dataProp1IRI);
        assertFalse(optional.isPresent());
    }

    @Test
    public void getMissingDataPropertyTest() throws Exception {
        Optional<DataProperty> optional = ontology.getDataProperty(errorIRI);
        assertFalse(optional.isPresent());
    }

    @Test
    public void getDataPropertyRangeTest() throws Exception {
        // Setup:
        DataProperty dataProperty = new SimpleDataProperty(dataProp1IRI);

        Set<Resource> ranges = ontology.getDataPropertyRange(dataProperty);
        assertEquals(1, ranges.size());
        assertTrue(ranges.contains(vf.createIRI(XSD.INTEGER)));
    }

    @Test
    public void getDataPropertyRangeWithDifferenceTest() throws Exception {
        // Setup:
        DataProperty dataProperty = new SimpleDataProperty(dataProp1IRI);

        Model deletions = mf.createEmptyModel();
        deletions.add(dataProp1IRI, vf.createIRI(RDFS.RANGE.stringValue()), vf.createIRI(XSD.INTEGER));
        Model additions = mf.createEmptyModel();
        additions.add(dataProp1IRI, vf.createIRI(RDFS.RANGE.stringValue()), vf.createIRI(XSD.DATE));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, deletions));

        Set<Resource> ranges = ont.getDataPropertyRange(dataProperty);
        assertEquals(1, ranges.size());
        assertTrue(ranges.contains(vf.createIRI(XSD.DATE)));
    }

    @Test
    public void getMissingDataPropertyRangeTest() throws Exception {
        // Setup:
        DataProperty dataProperty = new SimpleDataProperty(errorIRI);
        assertEquals(0, ontology.getDataPropertyRange(dataProperty).size());
    }

    @Test
    public void getDataPropertyRangeWithNonDatatypeTest() throws Exception {
        // Setup:
        DataProperty dataProperty = new SimpleDataProperty(dataProp2IRI);

        Set<Resource> ranges = ontology.getDataPropertyRange(dataProperty);
        assertEquals(1, ranges.size());
    }

    @Test
    public void getObjectPropertyTest() throws Exception {
        Optional<ObjectProperty> optional = ontology.getObjectProperty(objectProp1IRI);
        assertTrue(optional.isPresent());
        Assert.assertEquals(objectProp1IRI, optional.get().getIRI());
    }

    @Test
    public void getObjectPropertyWithDifferenceTest() throws Exception {
        Model deletions = mf.createEmptyModel();
        deletions.add(objectProp1IRI, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(null, deletions));

        Optional<ObjectProperty> optional = ont.getObjectProperty(objectProp1IRI);
        assertFalse(optional.isPresent());
    }

    @Test
    public void getMissingObjectPropertyTest() throws Exception {
        Optional<ObjectProperty> optional = ontology.getObjectProperty(errorIRI);
        assertFalse(optional.isPresent());
    }

    @Test
    public void getObjectPropertyRangeTest() throws Exception {
        // Setup:
        ObjectProperty objectProperty = new SimpleObjectProperty(objectProp1IRI);

        Set<Resource> ranges = ontology.getObjectPropertyRange(objectProperty);
        assertEquals(1, ranges.size());
        assertTrue(ranges.contains(classIRI));
    }

    @Test
    public void getObjectPropertyRangeWithDifferenceTest() throws Exception {
        // Setup:
        ObjectProperty objectProperty = new SimpleObjectProperty(objectProp1IRI);

        Model deletions = mf.createEmptyModel();
        deletions.add(objectProp1IRI, vf.createIRI(RDFS.RANGE.stringValue()), classIRI);
        Model additions = mf.createEmptyModel();
        additions.add(objectProp1IRI, vf.createIRI(RDFS.RANGE.stringValue()), classIRIC);

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, deletions));

        Set<Resource> ranges = ont.getObjectPropertyRange(objectProperty);
        assertEquals(1, ranges.size());
        assertTrue(ranges.contains(classIRIC));
    }

    @Test
    public void getMissingObjectPropertyRangeTest() throws Exception {
        // Setup:
        ObjectProperty objectProperty = new SimpleObjectProperty(errorIRI);

        Set<Resource> ranges = ontology.getObjectPropertyRange(objectProperty);
        assertEquals(0, ranges.size());
    }

    @Test
    public void getObjectPropertyRangeWithNonClassTest() throws Exception {
        // Setup:
        ObjectProperty objectProperty = new SimpleObjectProperty(objectProp2IRI);

        Set<Resource> ranges = ontology.getObjectPropertyRange(objectProperty);
        assertEquals(1, ranges.size());
    }

    @Test
    public void getAllIndividualsTest() throws Exception {
        // Setup:
        // Ensures a blank node declared as a defined class is not included
        Set<String> expectedIndividuals = Stream.of("http://test.com/ontology1#IndividualD", "http://test.com/ontology1#IndividualA").collect(Collectors.toSet());

        Set<Individual> individuals = ontology.getAllIndividuals();
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getAllIndividualsWithDifferenceTest() throws Exception {
        // Setup:
        // Ensures a blank node declared as a defined class is not included
        IRI individualA = vf.createIRI("http://test.com/ontology1#IndividualA");
        Set<String> expectedIndividuals = Stream.of("http://test.com/ontology1#IndividualD").collect(Collectors.toSet());

        Model deletions = mf.createEmptyModel();
        deletions.add(individualA, vf.createIRI(RDF.TYPE.stringValue()), classIRI);

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(null, deletions));

        Set<Individual> individuals = ont.getAllIndividuals();
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getAllIndividualsDeclaredTest() throws Exception {
        // Setup:
        Set<String> expectedIndividuals = Stream.of("http://mobi.com/ontology/only-declared#ConceptA").collect(Collectors.toSet());

        Set<Individual> individuals = onlyDeclared.getAllIndividuals();
        assertEquals(expectedIndividuals.size(), individuals.size());
    }

    @Test
    public void getAllIndividualsDeclaredWithDifferenceTest() throws Exception {
        // Setup:
        IRI conceptC = vf.createIRI("http://mobi.com/ontology/only-declared#ConceptC");
        Set<String> expectedIndividuals = Stream.of("http://mobi.com/ontology/only-declared#ConceptA", "http://mobi.com/ontology/only-declared#ConceptC").collect(Collectors.toSet());

        Model additions = mf.createEmptyModel();
        additions.add(conceptC, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(SKOS.CONCEPT.stringValue()));

        SimpleOntology ont = (SimpleOntology) onlyDeclared;
        ont.setDifference(createDifference(additions, null));

        Set<Individual> individuals = ont.getAllIndividuals();
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getIndividualsOfTypeIRITest() throws Exception {
        // Setup:
        Set<String> expectedIndividuals = Stream.of("http://test.com/ontology1#IndividualA").collect(Collectors.toSet());

        Set<Individual> individuals = ontology.getIndividualsOfType(classIRI);
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getIndividualsOfTypeIRIWithDifferenceTest() throws Exception {
        // Setup:
        Set<String> expectedIndividuals = Stream.of("http://test.com/ontology1#IndividualA", "http://test.com/ontology1#IndividualNew").collect(Collectors.toSet());

        Model additions = mf.createEmptyModel();
        additions.add(vf.createIRI("http://test.com/ontology1#IndividualNew"), vf.createIRI(RDF.TYPE.stringValue()), classIRI);

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, null));

        Set<Individual> individuals = ontology.getIndividualsOfType(classIRI);
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getIndividualsOfSubClassTypeIRITest() throws Exception {
        // Setup:
        Set<String> expectedIndividuals = Stream.of("http://test.com/ontology1#IndividualD").collect(Collectors.toSet());

        Set<Individual> individuals = ontology.getIndividualsOfType(classIRIC);
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getIndividualsOfTypeIRIDeclaredTest() {
        // Setup:
        Set<String> expectedIndividuals = Stream.of("http://mobi.com/ontology/only-declared#ConceptA").collect(Collectors.toSet());

        Set<Individual> individuals = onlyDeclared.getIndividualsOfType(vf.createIRI(SKOS.CONCEPT.stringValue()));
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getIndividualsOfTypeTest() throws Exception {
        // Setup:
        OClass clazz = new SimpleClass(classIRI);
        Set<String> expectedIndividuals = Stream.of("http://test.com/ontology1#IndividualA").collect(Collectors.toSet());

        Set<Individual> individuals = ontology.getIndividualsOfType(clazz);
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getIndividualsOfTypeWithDifferenceTest() throws Exception {
        // Setup:
        OClass clazz = new SimpleClass(classIRI);
        Set<String> expectedIndividuals = Stream.of("http://test.com/ontology1#IndividualA", "http://test.com/ontology1#IndividualNew").collect(Collectors.toSet());

        Model additions = mf.createEmptyModel();
        additions.add(vf.createIRI("http://test.com/ontology1#IndividualNew"), vf.createIRI(RDF.TYPE.stringValue()), classIRI);

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, null));

        Set<Individual> individuals = ontology.getIndividualsOfType(clazz);
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getIndividualsOfSubClassTypeTest() throws Exception {
        // Setup:
        OClass clazz = new SimpleClass(classIRIC);
        Set<String> expectedIndividuals = Stream.of("http://test.com/ontology1#IndividualD").collect(Collectors.toSet());

        Set<Individual> individuals = ontology.getIndividualsOfType(clazz);
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void getIndividualsOfTypeDeclaredTest() throws Exception {
        // Setup:
        OClass clazz = new SimpleClass(vf.createIRI(SKOS.CONCEPT.stringValue()));
        Set<String> expectedIndividuals = Stream.of("http://mobi.com/ontology/only-declared#ConceptA").collect(Collectors.toSet());

        Set<Individual> individuals = onlyDeclared.getIndividualsOfType(clazz);
        assertEquals(expectedIndividuals.size(), individuals.size());
        individuals.stream()
                .map(individual -> individual.getIRI().stringValue())
                .forEach(iri -> assertTrue(expectedIndividuals.contains(iri)));
    }

    @Test
    public void containsClassTest() {
        assertTrue(ontology.containsClass(classIRI));
    }

    @Test
    public void containsClassWithDifferenceTest() {
        Model additions = mf.createEmptyModel();
        additions.add(vf.createIRI("http://test.com/ontology1#NewClass"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, null));
        assertTrue(ont.containsClass(classIRI));
        assertTrue(ont.containsClass(vf.createIRI("http://test.com/ontology1#NewClass")));
    }

    @Test
    public void containsClassWhenMissingTest() {
        assertFalse(ontology.containsClass(errorIRI));
    }

    @Test
    public void getAllClassObjectPropertiesTest() throws Exception {
        assertEquals(2, ontology.getAllClassObjectProperties(classIRI).size());
        assertEquals(1, ontology.getAllClassObjectProperties(classIRIC).size());
        assertEquals(1, ontology.getAllClassObjectProperties(classIRID).size());
        assertEquals(1, ontology.getAllClassObjectProperties(classIRIE).size());
    }

    @Test
    public void getAllClassObjectPropertiesWithDifferenceTest() throws Exception {
        Model additions = mf.createEmptyModel();
        IRI objectProp = vf.createIRI("http://test.com/ontology1#objectPropNew");
        additions.add(objectProp, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue()));
        additions.add(objectProp, vf.createIRI(RDFS.DOMAIN.stringValue()), classIRI);

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, null));
        assertEquals(3, ont.getAllClassObjectProperties(classIRI).size());
        assertEquals(1, ont.getAllClassObjectProperties(classIRIC).size());
        assertEquals(1, ont.getAllClassObjectProperties(classIRID).size());
        assertEquals(1, ont.getAllClassObjectProperties(classIRIE).size());
    }

    @Test
    public void getAllClassObjectPropertiesWithImportsTest() throws Exception {
        assertEquals(2, ont1.getAllClassObjectProperties(importedIRI0).size());
        assertEquals(2, ont1.getAllClassObjectProperties(importedIRI).size());
    }

    @Test
    public void getAllClassObjectPropertiesWhenMissingTest() throws Exception {
        assertEquals(1, ontology.getAllClassObjectProperties(errorIRI).size());
    }

    @Test
    public void getAllNoDomainObjectPropertiesTest() {
        assertEquals(1, ontology.getAllNoDomainObjectProperties().size());
    }

    @Test
    public void getAllNoDomainObjectPropertiesWithDifferenceTest() {
        Model additions = mf.createEmptyModel();
        IRI objectProp = vf.createIRI("http://test.com/ontology1#objectPropNew");
        additions.add(objectProp, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, null));

        assertEquals(2, ont.getAllNoDomainObjectProperties().size());
    }

    @Test
    public void getAllNoDomainObjectPropertiesWithImportsTest() {
        assertEquals(1, ont1.getAllNoDomainObjectProperties().size());
    }

    @Test
    public void getAllClassDataPropertiesTest() throws Exception {
        assertEquals(2, ontology.getAllClassDataProperties(classIRI).size());
        assertEquals(1, ontology.getAllClassDataProperties(classIRIC).size());
        assertEquals(1, ontology.getAllClassDataProperties(classIRID).size());
        assertEquals(1, ontology.getAllClassDataProperties(classIRIE).size());
    }

    @Test
    public void getAllClassDataPropertiesWithDifferenceTest() throws Exception {
        Model additions = mf.createEmptyModel();
        IRI dataProp = vf.createIRI("http://test.com/ontology1#dataPropNew");
        additions.add(dataProp, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue()));
        additions.add(dataProp, vf.createIRI(RDFS.DOMAIN.stringValue()), classIRI);

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, null));

        assertEquals(3, ont.getAllClassDataProperties(classIRI).size());
        assertEquals(1, ont.getAllClassDataProperties(classIRIC).size());
        assertEquals(1, ont.getAllClassDataProperties(classIRID).size());
        assertEquals(1, ont.getAllClassDataProperties(classIRIE).size());
    }

    @Test
    public void getAllClassDataPropertiesWithImportsTest() throws Exception {
        assertEquals(2, ont1.getAllClassDataProperties(importedIRI0).size());
        assertEquals(2, ont1.getAllClassDataProperties(importedIRI).size());
    }

    @Test
    public void getAllClassDataPropertiesWhenMissingTest() throws Exception {
        assertEquals(1, ontology.getAllClassDataProperties(errorIRI).size());
    }

    @Test
    public void getAllNoDomainDataPropertiesTest() {
        assertEquals(1, ontology.getAllNoDomainDataProperties().size());
    }

    @Test
    public void getAllNoDomainDataPropertiesWithDifferenceTest() {
        Model additions = mf.createEmptyModel();
        IRI dataProp = vf.createIRI("http://test.com/ontology1#dataPropNew");
        additions.add(dataProp, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue()));

        SimpleOntology ont = (SimpleOntology) ontology;
        ont.setDifference(createDifference(additions, null));
        assertEquals(2, ontology.getAllNoDomainDataProperties().size());
    }

    @Test
    public void getAllNoDomainDataPropertiesWithImportsTest() {
        assertEquals(1, ont1.getAllNoDomainDataProperties().size());
    }

    @Test
    public void asJsonldWithSkolemizeTest() throws Exception {
        // Setup
        SimpleBNodeService blankNodeService = spy(new SimpleBNodeService());
        InputStream expected = Objects.requireNonNull(this.getClass().getResourceAsStream("/list-ontology-skolemize.jsonld"));

        Model model = createModelFromFile("/list-ontology.ttl");
        File file = setupOntologyMocks(model);
        Ontology listOntology = new SimpleOntology(vf.createIRI("http://mobi.com/ontology/list"), file, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, blankNodeService, branchManager, commitManager);

        try (OutputStream stream = listOntology.asJsonLD(true)) {
            String jsonld = stream.toString();
            assertEquals(removeWhitespace(replaceBlankNodeSuffix(IOUtils.toString(expected, Charset.defaultCharset()))), removeWhitespace(replaceBlankNodeSuffix(jsonld)));
        }
        verify(blankNodeService, atLeast(1)).skolemize(any(org.eclipse.rdf4j.model.Statement.class));
    }

    @Test
    public void asJsonldWithoutSkolemizeTest() throws Exception {
        // Setup
        SimpleBNodeService blankNodeService = spy(new SimpleBNodeService());
        InputStream expected = Objects.requireNonNull(this.getClass().getResourceAsStream("/list-ontology.jsonld"));

        Model model = createModelFromFile("/list-ontology.ttl");
        File file = setupOntologyMocks(model);

        Ontology listOntology = new SimpleOntology(vf.createIRI("http://mobi.com/ontology/list"), file, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, blankNodeService, branchManager, commitManager);
        try (OutputStream stream = listOntology.asJsonLD(false)) {
            String jsonld = stream.toString();
            assertEquals(removeWhitespace(IOUtils.toString(expected, Charset.defaultCharset()).replaceAll("_:genid-[a-zA-Z0-9]+-[a-z]", "\"")),
                    removeWhitespace(jsonld.replaceAll("_:[a-zA-Z0-9]+\"", "\"").replaceAll("_:genid-[a-zA-Z0-9]+-[a-z]", "")));
        }
        verify(blankNodeService, times(0)).skolemize(any(org.eclipse.rdf4j.model.Model.class));
    }

    @Test
    public void testGetSubClassesOf() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#Class1a"), vf.createIRI("http://mobi.com/ontology#Class1b"),
                vf.createIRI("http://mobi.com/ontology#Class1c"), vf.createIRI("http://mobi.com/ontology#Class2a"), vf.createIRI("http://mobi.com/ontology#Class2b"),
                vf.createIRI("http://mobi.com/ontology#Class3a"), vf.createIRI("http://mobi.com/ontology#Class4a"),vf.createIRI("http://mobi.com/ontology#Class4b"))
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#Class1a", Collections.singleton("http://mobi.com/ontology#Class1b"));
        expectedParentMap.put("http://mobi.com/ontology#Class1b", Collections.singleton("http://mobi.com/ontology#Class1c"));
        expectedParentMap.put("http://mobi.com/ontology#Class2a", Collections.singleton("http://mobi.com/ontology#Class2b"));
        expectedParentMap.put("http://mobi.com/ontology#Class4a", Collections.singleton("http://mobi.com/ontology#Class4b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#Class1b", Collections.singleton("http://mobi.com/ontology#Class1a"));
        expectedChildMap.put("http://mobi.com/ontology#Class1c", Collections.singleton("http://mobi.com/ontology#Class1b"));
        expectedChildMap.put("http://mobi.com/ontology#Class2b", Collections.singleton("http://mobi.com/ontology#Class2a"));
        expectedChildMap.put("http://mobi.com/ontology#Class4b", Collections.singleton("http://mobi.com/ontology#Class4a"));

        Map<String, Map<String, Set<String>>> expectedCircularMap = new HashMap<>();
        Map<String, Set<String>> childObject = new HashMap<>();
        HashSet<String> path = new HashSet<>();
        path.add("http://mobi.com/ontology#Class4a");
        path.add("http://mobi.com/ontology#Class4b");
        childObject.put("http://mobi.com/ontology#Class4a", path);
        expectedCircularMap.put("http://mobi.com/ontology#Class4b", childObject);

        Hierarchy result = queryOntology.getSubClassesOf();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        Map<String, Map<String, Set<String>>> circularMap = result.getCircularMap();
        Set<String> topLevelKeys = circularMap.keySet();
        assertEquals(expectedCircularMap.keySet(), topLevelKeys);
        topLevelKeys.forEach(iri -> assertEquals(expectedCircularMap.get(iri), circularMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetSubClassesOfWithDifference() throws Exception {
        // Setup:
        IRI newClass = vf.createIRI("http://test.com/ontology1#ClassNew");
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#Class1a"), vf.createIRI("http://mobi.com/ontology#Class1b"),
                vf.createIRI("http://mobi.com/ontology#Class1c"), vf.createIRI("http://mobi.com/ontology#Class2a"), vf.createIRI("http://mobi.com/ontology#Class2b"),
                vf.createIRI("http://mobi.com/ontology#Class3a"), vf.createIRI("http://mobi.com/ontology#Class4a"),vf.createIRI("http://mobi.com/ontology#Class4b"),
                newClass).collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#Class1a", Stream.of("http://mobi.com/ontology#Class1b", newClass.stringValue()).collect(Collectors.toSet()));
        expectedParentMap.put("http://mobi.com/ontology#Class1b", Collections.singleton("http://mobi.com/ontology#Class1c"));
        expectedParentMap.put("http://mobi.com/ontology#Class2a", Collections.singleton("http://mobi.com/ontology#Class2b"));
        expectedParentMap.put("http://mobi.com/ontology#Class4a", Collections.singleton("http://mobi.com/ontology#Class4b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#Class1b", Collections.singleton("http://mobi.com/ontology#Class1a"));
        expectedChildMap.put("http://mobi.com/ontology#Class1c", Collections.singleton("http://mobi.com/ontology#Class1b"));
        expectedChildMap.put("http://mobi.com/ontology#Class2b", Collections.singleton("http://mobi.com/ontology#Class2a"));
        expectedChildMap.put("http://mobi.com/ontology#Class4b", Collections.singleton("http://mobi.com/ontology#Class4a"));
        expectedChildMap.put(newClass.stringValue(), Collections.singleton("http://mobi.com/ontology#Class1a"));

        Model additions = mf.createEmptyModel();
        additions.add(newClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));
        additions.add(newClass, vf.createIRI(RDFS.SUBCLASSOF.stringValue()), vf.createIRI("http://mobi.com/ontology#Class1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        Hierarchy result = ont.getSubClassesOf();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetSubClassesFor() {
        // Setup:
        Set<IRI> expected = Stream.of(vf.createIRI("http://mobi.com/ontology#Class1b"), vf.createIRI("http://mobi.com/ontology#Class1c")).collect(Collectors.toSet());

        IRI start = vf.createIRI("http://mobi.com/ontology#Class1a");
        Set<IRI> results = queryOntology.getSubClassesFor(start);
        assertEquals(results, expected);
    }

    @Test
    public void testGetSubClassesForWithDifference() {
        // Setup:
        IRI newClass = vf.createIRI("http://test.com/ontology1#ClassNew");
        Set<IRI> expected = Stream.of(vf.createIRI("http://mobi.com/ontology#Class1b"), vf.createIRI("http://mobi.com/ontology#Class1c"), newClass).collect(Collectors.toSet());

        Model additions = mf.createEmptyModel();
        additions.add(newClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));
        additions.add(newClass, vf.createIRI(RDFS.SUBCLASSOF.stringValue()), vf.createIRI("http://mobi.com/ontology#Class1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        IRI start = vf.createIRI("http://mobi.com/ontology#Class1a");
        Set<IRI> results = ont.getSubClassesFor(start);
        assertEquals(results, expected);
    }

    @Test
    public void testGetDeprecatedIris() {
        // Setup:
        Set<IRI> expected = Stream.of(vf.createIRI("http://mobi.com/ontology#Class3a")).collect(Collectors.toSet());

        Set<IRI> results = queryOntology.getDeprecatedIRIs();
        assertEquals(results, expected);
    }

    @Test
    public void testGetDeprecatedIrisWithDifference() {
        // Setup:
        IRI newClass = vf.createIRI("http://test.com/ontology1#ClassNew");
        Set<IRI> expected = Stream.of(vf.createIRI("http://mobi.com/ontology#Class3a"), newClass).collect(Collectors.toSet());

        Model additions = mf.createEmptyModel();
        additions.add(newClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));
        additions.add(newClass, vf.createIRI(OWL.DEPRECATED.stringValue()), vf.createLiteral(true));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        Set<IRI> results = ont.getDeprecatedIRIs();
        assertEquals(results, expected);
    }

    @Test
    public void testGetSubDatatypePropertiesOf() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#dataProperty1a"), vf.createIRI("http://mobi.com/ontology#dataProperty1b"))
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#dataProperty1a", Collections.singleton("http://mobi.com/ontology#dataProperty1b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#dataProperty1b", Collections.singleton("http://mobi.com/ontology#dataProperty1a"));

        Hierarchy result = queryOntology.getSubDatatypePropertiesOf();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetSubDatatypePropertiesOfWithDifference() throws Exception {
        // Setup:
        IRI newProp = vf.createIRI("http://test.com/ontology1#PropNew");
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#dataProperty1a"), vf.createIRI("http://mobi.com/ontology#dataProperty1b"), newProp)
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#dataProperty1a", Stream.of("http://mobi.com/ontology#dataProperty1b", newProp.stringValue()).collect(Collectors.toSet()));

        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#dataProperty1b", Collections.singleton("http://mobi.com/ontology#dataProperty1a"));
        expectedChildMap.put(newProp.stringValue(), Collections.singleton("http://mobi.com/ontology#dataProperty1a"));

        Model additions = mf.createEmptyModel();
        additions.add(newProp, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue()));
        additions.add(newProp, vf.createIRI(RDFS.SUBPROPERTYOF.stringValue()), vf.createIRI("http://mobi.com/ontology#dataProperty1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        Hierarchy result = ont.getSubDatatypePropertiesOf();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetSubAnnotationPropertiesOf() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#annotationProperty1a"), vf.createIRI("http://mobi.com/ontology#annotationProperty1b"),
                vf.createIRI("http://purl.org/dc/terms/title")).collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#annotationProperty1a", Collections.singleton("http://mobi.com/ontology#annotationProperty1b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#annotationProperty1b", Collections.singleton("http://mobi.com/ontology#annotationProperty1a"));

        Hierarchy result = queryOntology.getSubAnnotationPropertiesOf();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetSubAnnotationPropertiesOfWithDifference() throws Exception {
        // Setup:
        IRI newProp = vf.createIRI("http://test.com/ontology1#PropNew");
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#annotationProperty1a"), vf.createIRI("http://mobi.com/ontology#annotationProperty1b"),
                vf.createIRI("http://purl.org/dc/terms/title"), newProp).collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#annotationProperty1a", Stream.of("http://mobi.com/ontology#annotationProperty1b", newProp.stringValue()).collect(Collectors.toSet()));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#annotationProperty1b", Collections.singleton("http://mobi.com/ontology#annotationProperty1a"));
        expectedChildMap.put(newProp.stringValue(), Collections.singleton("http://mobi.com/ontology#annotationProperty1a"));

        Model additions = mf.createEmptyModel();
        additions.add(newProp, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ANNOTATIONPROPERTY.stringValue()));
        additions.add(newProp, vf.createIRI(RDFS.SUBPROPERTYOF.stringValue()), vf.createIRI("http://mobi.com/ontology#annotationProperty1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        Hierarchy result = ont.getSubAnnotationPropertiesOf();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetSubObjectPropertiesOf() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#objectProperty1a"), vf.createIRI("http://mobi.com/ontology#objectProperty1b"))
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#objectProperty1a", Collections.singleton("http://mobi.com/ontology#objectProperty1b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#objectProperty1b", Collections.singleton("http://mobi.com/ontology#objectProperty1a"));

        Hierarchy result = queryOntology.getSubObjectPropertiesOf();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetSubObjectPropertiesOfWithDifference() throws Exception {
        // Setup:
        IRI newProp = vf.createIRI("http://test.com/ontology1#PropNew");
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#objectProperty1a"), vf.createIRI("http://mobi.com/ontology#objectProperty1b"), newProp)
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#objectProperty1a", Stream.of("http://mobi.com/ontology#objectProperty1b", newProp.stringValue()).collect(Collectors.toSet()));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#objectProperty1b", Collections.singleton("http://mobi.com/ontology#objectProperty1a"));
        expectedChildMap.put(newProp.stringValue(), Collections.singleton("http://mobi.com/ontology#objectProperty1a"));

        Model additions = mf.createEmptyModel();
        additions.add(newProp, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue()));
        additions.add(newProp, vf.createIRI(RDFS.SUBPROPERTYOF.stringValue()), vf.createIRI("http://mobi.com/ontology#objectProperty1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        Hierarchy result = ont.getSubObjectPropertiesOf();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testSubPropertiesFor() {
        // Setup:
        Set<IRI> expected = Collections.singleton(vf.createIRI("http://mobi.com/ontology#annotationProperty1b"));

        IRI start = vf.createIRI("http://mobi.com/ontology#annotationProperty1a");
        Set<IRI> results = queryOntology.getSubPropertiesFor(start);
        assertEquals(expected, results);
    }

    @Test
    public void testSubPropertiesForWithDifference() {
        // Setup:
        IRI newProp = vf.createIRI("http://test.com/ontology1#PropNew");
        Set<IRI> expected = Stream.of(vf.createIRI("http://mobi.com/ontology#annotationProperty1b"), newProp).collect(Collectors.toSet());

        Model additions = mf.createEmptyModel();
        additions.add(newProp, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ANNOTATIONPROPERTY.stringValue()));
        additions.add(newProp, vf.createIRI(RDFS.SUBPROPERTYOF.stringValue()), vf.createIRI("http://mobi.com/ontology#annotationProperty1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        IRI start = vf.createIRI("http://mobi.com/ontology#annotationProperty1a");
        Set<IRI> results = queryOntology.getSubPropertiesFor(start);
        assertEquals(expected, results);
    }

    @Test
    public void testGetClassesWithIndividuals() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#Class1a"), vf.createIRI("http://mobi.com/ontology#Class1b"),
                vf.createIRI("http://mobi.com/ontology#Class1c"), vf.createIRI("http://mobi.com/ontology#Class2a"),
                vf.createIRI("http://mobi.com/ontology#Class2b"), vf.createIRI("http://mobi.com/ontology#Individual1a"),
                vf.createIRI("http://mobi.com/ontology#Individual1b"), vf.createIRI("http://mobi.com/ontology#Individual1c"),
                vf.createIRI("http://mobi.com/ontology#Individual2a"), vf.createIRI("http://mobi.com/ontology#Individual2b"))
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#Class1a", Collections.singleton("http://mobi.com/ontology#Individual1a"));
        expectedParentMap.put("http://mobi.com/ontology#Class1b", Collections.singleton("http://mobi.com/ontology#Individual1b"));
        expectedParentMap.put("http://mobi.com/ontology#Class1c", Collections.singleton("http://mobi.com/ontology#Individual1c"));
        expectedParentMap.put("http://mobi.com/ontology#Class2a", Collections.singleton("http://mobi.com/ontology#Individual2a"));
        expectedParentMap.put("http://mobi.com/ontology#Class2b", Collections.singleton("http://mobi.com/ontology#Individual2b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#Individual1a", Collections.singleton("http://mobi.com/ontology#Class1a"));
        expectedChildMap.put("http://mobi.com/ontology#Individual1b", Collections.singleton("http://mobi.com/ontology#Class1b"));
        expectedChildMap.put("http://mobi.com/ontology#Individual1c", Collections.singleton("http://mobi.com/ontology#Class1c"));
        expectedChildMap.put("http://mobi.com/ontology#Individual2a", Collections.singleton("http://mobi.com/ontology#Class2a"));
        expectedChildMap.put("http://mobi.com/ontology#Individual2b", Collections.singleton("http://mobi.com/ontology#Class2b"));

        Hierarchy result = queryOntology.getClassesWithIndividuals();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetClassesWithIndividualsWithDifference() throws Exception {
        // Setup:
        IRI newIndividual = vf.createIRI("http://test.com/ontology1#IndividualNew");
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#Class1a"), vf.createIRI("http://mobi.com/ontology#Class1b"),
                vf.createIRI("http://mobi.com/ontology#Class1c"), vf.createIRI("http://mobi.com/ontology#Class2a"),
                vf.createIRI("http://mobi.com/ontology#Class2b"), vf.createIRI("http://mobi.com/ontology#Individual1a"),
                vf.createIRI("http://mobi.com/ontology#Individual1b"), vf.createIRI("http://mobi.com/ontology#Individual1c"),
                vf.createIRI("http://mobi.com/ontology#Individual2a"), vf.createIRI("http://mobi.com/ontology#Individual2b"), newIndividual)
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#Class1a", Stream.of("http://mobi.com/ontology#Individual1a", newIndividual.stringValue()).collect(Collectors.toSet()));
        expectedParentMap.put("http://mobi.com/ontology#Class1b", Collections.singleton("http://mobi.com/ontology#Individual1b"));
        expectedParentMap.put("http://mobi.com/ontology#Class1c", Collections.singleton("http://mobi.com/ontology#Individual1c"));
        expectedParentMap.put("http://mobi.com/ontology#Class2a", Collections.singleton("http://mobi.com/ontology#Individual2a"));
        expectedParentMap.put("http://mobi.com/ontology#Class2b", Collections.singleton("http://mobi.com/ontology#Individual2b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#Individual1a", Collections.singleton("http://mobi.com/ontology#Class1a"));
        expectedChildMap.put("http://mobi.com/ontology#Individual1b", Collections.singleton("http://mobi.com/ontology#Class1b"));
        expectedChildMap.put("http://mobi.com/ontology#Individual1c", Collections.singleton("http://mobi.com/ontology#Class1c"));
        expectedChildMap.put("http://mobi.com/ontology#Individual2a", Collections.singleton("http://mobi.com/ontology#Class2a"));
        expectedChildMap.put("http://mobi.com/ontology#Individual2b", Collections.singleton("http://mobi.com/ontology#Class2b"));
        expectedChildMap.put(newIndividual.stringValue(), Collections.singleton("http://mobi.com/ontology#Class1a"));

        Model additions = mf.createEmptyModel();
        additions.add(newIndividual, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI("http://mobi.com/ontology#Class1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        Hierarchy result = ont.getClassesWithIndividuals();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetEntityUsages() throws Exception {
        Set<String> subjects = Stream.of("http://mobi.com/ontology#Class1b",
                "http://mobi.com/ontology#Individual1a").collect(Collectors.toSet());
        Set<String> predicates = Stream.of("http://www.w3.org/2000/01/rdf-schema#subClassOf",
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type").collect(Collectors.toSet());

        TupleQueryResult result = queryOntology.getEntityUsages(vf.createIRI("http://mobi.com/ontology#Class1a"));
        assertTrue(result.hasNext());
        result.forEach(b -> {
            Optional<Binding> optionalSubject = Optional.ofNullable(b.getBinding("s"));
            if (optionalSubject.isPresent()) {
                String subject = optionalSubject.get().getValue().stringValue();
                assertTrue(subjects.contains(subject));
                subjects.remove(subject);
            }
            Optional<Binding> optionalPredicate = Optional.ofNullable(b.getBinding("p"));
            if (optionalPredicate.isPresent()) {
                String predicate = optionalPredicate.get().getValue().stringValue();
                assertTrue(predicates.contains(predicate));
                predicates.remove(predicate);
            }
        });
        assertEquals(0, subjects.size());
        assertEquals(0, predicates.size());
    }

    @Test
    public void testGetEntityUsagesWithDifference() throws Exception {
        IRI newIndividual = vf.createIRI("http://test.com/ontology1#IndividualNew");
        List<String> subjects = Stream.of("http://mobi.com/ontology#Class1b",
                "http://mobi.com/ontology#Individual1a", newIndividual.stringValue()).collect(Collectors.toList());
        List<String> predicates = Stream.of("http://www.w3.org/2000/01/rdf-schema#subClassOf",
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://www.w3.org/1999/02/22-rdf-syntax-ns#type").collect(Collectors.toList());

        Model additions = mf.createEmptyModel();
        additions.add(newIndividual, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI("http://mobi.com/ontology#Class1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        TupleQueryResult result = queryOntology.getEntityUsages(vf.createIRI("http://mobi.com/ontology#Class1a"));
        assertTrue(result.hasNext());
        result.forEach(b -> {
            Optional<Binding> optionalSubject = Optional.ofNullable(b.getBinding("s"));
            if (optionalSubject.isPresent()) {
                String subject = optionalSubject.get().getValue().stringValue();
                assertTrue(subjects.contains(subject));
                subjects.remove(subject);
            }
            Optional<Binding> optionalPredicate = Optional.ofNullable(b.getBinding("p"));
            if (optionalPredicate.isPresent()) {
                String predicate = optionalPredicate.get().getValue().stringValue();
                assertTrue(predicates.contains(predicate));
                predicates.remove(predicate);
            }
        });
        assertEquals(0, subjects.size());
        assertEquals(0, predicates.size());
    }

    @Test
    public void testConstructEntityUsages() throws Exception {
        Resource class1a = vf.createIRI("http://mobi.com/ontology#Class1a");
        Resource class1b = vf.createIRI("http://mobi.com/ontology#Class1b");
        IRI subClassOf = vf.createIRI("http://www.w3.org/2000/01/rdf-schema#subClassOf");
        Resource individual1a = vf.createIRI("http://mobi.com/ontology#Individual1a");
        IRI type = vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
        Model expected = mf.createEmptyModel();
        expected.addAll(Stream.of(vf.createStatement(class1b, subClassOf,
                class1a), vf.createStatement(individual1a, type, class1a)).collect(Collectors.toSet()));

        Model result = queryOntology.constructEntityUsages(class1a);
        assertEquals(result, expected);
    }

    @Test
    public void testConstructEntityUsagesWithDifference() throws Exception {
        IRI newIndividual = vf.createIRI("http://test.com/ontology1#IndividualNew");
        Resource class1a = vf.createIRI("http://mobi.com/ontology#Class1a");
        Resource class1b = vf.createIRI("http://mobi.com/ontology#Class1b");
        IRI subClassOf = vf.createIRI("http://www.w3.org/2000/01/rdf-schema#subClassOf");
        Resource individual1a = vf.createIRI("http://mobi.com/ontology#Individual1a");
        IRI type = vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
        Model expected = mf.createEmptyModel();
        expected.addAll(Stream.of(vf.createStatement(class1b, subClassOf,
                class1a), vf.createStatement(individual1a, type, class1a), vf.createStatement(newIndividual, type, class1a))
                .collect(Collectors.toSet()));

        Model additions = mf.createEmptyModel();
        additions.add(newIndividual, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI("http://mobi.com/ontology#Class1a"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        Model result = ont.constructEntityUsages(class1a);
        assertEquals(result, expected);
    }

    @Test
    public void testGetConceptRelationships() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("https://mobi.com/vocabulary#Concept1"), vf.createIRI("https://mobi.com/vocabulary#Concept2"),
                vf.createIRI("https://mobi.com/vocabulary#Concept3"), vf.createIRI("https://mobi.com/vocabulary#Concept4"))
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("https://mobi.com/vocabulary#Concept1", Stream.of("https://mobi.com/vocabulary#Concept2", "https://mobi.com/vocabulary#Concept3").collect(Collectors.toSet()));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("https://mobi.com/vocabulary#Concept2", Collections.singleton("https://mobi.com/vocabulary#Concept1"));
        expectedChildMap.put("https://mobi.com/vocabulary#Concept3", Collections.singleton("https://mobi.com/vocabulary#Concept1"));

        Hierarchy result = queryVocabulary.getConceptRelationships();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetConceptRelationshipsWithDifference() throws Exception {
        // Setup:
        IRI newIndividual = vf.createIRI("http://test.com/ontology1#IndividualNew");
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("https://mobi.com/vocabulary#Concept1"), vf.createIRI("https://mobi.com/vocabulary#Concept2"),
                vf.createIRI("https://mobi.com/vocabulary#Concept3"), vf.createIRI("https://mobi.com/vocabulary#Concept4"), newIndividual)
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("https://mobi.com/vocabulary#Concept1", Stream.of("https://mobi.com/vocabulary#Concept2", "https://mobi.com/vocabulary#Concept3", newIndividual.stringValue()).collect(Collectors.toSet()));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("https://mobi.com/vocabulary#Concept2", Collections.singleton("https://mobi.com/vocabulary#Concept1"));
        expectedChildMap.put("https://mobi.com/vocabulary#Concept3", Collections.singleton("https://mobi.com/vocabulary#Concept1"));
        expectedChildMap.put(newIndividual.stringValue(), Collections.singleton("https://mobi.com/vocabulary#Concept1"));

        Model additions = mf.createEmptyModel();
        additions.add(newIndividual, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(SKOS.CONCEPT.stringValue()));
        additions.add(newIndividual, vf.createIRI(SKOS.BROADER.stringValue()), vf.createIRI("https://mobi.com/vocabulary#Concept1"));

        SimpleOntology ont = (SimpleOntology) queryVocabulary;
        ont.setDifference(createDifference(additions, null));

        Hierarchy result = ont.getConceptRelationships();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetConceptRelationshipsDeclared() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology/only-declared#ConceptA"))
                .collect(Collectors.toSet());

        Hierarchy result = onlyDeclared.getConceptRelationships();
        Map<String, Set<String>> parentMap = result.getParentMap();
        assertEquals(0, parentMap.size());
        Map<String, Set<String>> childMap = result.getChildMap();
        assertEquals(0, childMap.size());

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetConceptSchemeRelationships() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("https://mobi.com/vocabulary#ConceptScheme1"), vf.createIRI("https://mobi.com/vocabulary#ConceptScheme2"),
                vf.createIRI("https://mobi.com/vocabulary#ConceptScheme3"), vf.createIRI("https://mobi.com/vocabulary#Concept1"),
                vf.createIRI("https://mobi.com/vocabulary#Concept2"), vf.createIRI("https://mobi.com/vocabulary#Concept3"))
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("https://mobi.com/vocabulary#ConceptScheme1", Collections.singleton("https://mobi.com/vocabulary#Concept1"));
        expectedParentMap.put("https://mobi.com/vocabulary#ConceptScheme2", Collections.singleton("https://mobi.com/vocabulary#Concept2"));
        expectedParentMap.put("https://mobi.com/vocabulary#ConceptScheme3", Collections.singleton("https://mobi.com/vocabulary#Concept3"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("https://mobi.com/vocabulary#Concept1", Collections.singleton("https://mobi.com/vocabulary#ConceptScheme1"));
        expectedChildMap.put("https://mobi.com/vocabulary#Concept2", Collections.singleton("https://mobi.com/vocabulary#ConceptScheme2"));
        expectedChildMap.put("https://mobi.com/vocabulary#Concept3", Collections.singleton("https://mobi.com/vocabulary#ConceptScheme3"));

        Hierarchy result = queryVocabulary.getConceptSchemeRelationships();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetConceptSchemeRelationshipsWithDifference() throws Exception {
        // Setup:
        IRI newIndividual = vf.createIRI("http://test.com/ontology1#IndividualNew");
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("https://mobi.com/vocabulary#ConceptScheme1"), vf.createIRI("https://mobi.com/vocabulary#ConceptScheme2"),
                vf.createIRI("https://mobi.com/vocabulary#ConceptScheme3"), vf.createIRI("https://mobi.com/vocabulary#Concept1"),
                vf.createIRI("https://mobi.com/vocabulary#Concept2"), vf.createIRI("https://mobi.com/vocabulary#Concept3"), newIndividual)
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("https://mobi.com/vocabulary#ConceptScheme1", Stream.of("https://mobi.com/vocabulary#Concept1", newIndividual.stringValue()).collect(Collectors.toSet()));
        expectedParentMap.put("https://mobi.com/vocabulary#ConceptScheme2", Collections.singleton("https://mobi.com/vocabulary#Concept2"));
        expectedParentMap.put("https://mobi.com/vocabulary#ConceptScheme3", Collections.singleton("https://mobi.com/vocabulary#Concept3"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("https://mobi.com/vocabulary#Concept1", Collections.singleton("https://mobi.com/vocabulary#ConceptScheme1"));
        expectedChildMap.put("https://mobi.com/vocabulary#Concept2", Collections.singleton("https://mobi.com/vocabulary#ConceptScheme2"));
        expectedChildMap.put("https://mobi.com/vocabulary#Concept3", Collections.singleton("https://mobi.com/vocabulary#ConceptScheme3"));
        expectedChildMap.put(newIndividual.stringValue(), Collections.singleton("https://mobi.com/vocabulary#ConceptScheme1"));

        Model additions = mf.createEmptyModel();
        additions.add(newIndividual, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(SKOS.CONCEPT.stringValue()));
        additions.add(newIndividual, vf.createIRI(SKOS.IN_SCHEME.stringValue()), vf.createIRI("https://mobi.com/vocabulary#ConceptScheme1"));

        SimpleOntology ont = (SimpleOntology) queryVocabulary;
        ont.setDifference(createDifference(additions, null));

        Hierarchy result = ont.getConceptSchemeRelationships();
        Map<String, Set<String>> parentMap = result.getParentMap();
        Set<String> parentKeys = parentMap.keySet();
        assertEquals(expectedParentMap.keySet(), parentKeys);
        parentKeys.forEach(iri -> assertEquals(expectedParentMap.get(iri), parentMap.get(iri)));

        Map<String, Set<String>> childMap = result.getChildMap();
        Set<String> childKeys = childMap.keySet();
        assertEquals(expectedChildMap.keySet(), childKeys);
        childKeys.forEach(iri -> assertEquals(expectedChildMap.get(iri), childMap.get(iri)));

        assertEquals(expectedSubjects, result.getModel().subjects());
    }

    @Test
    public void testGetSearchResults() throws Exception {
        Set<String> entities = Stream.of("http://mobi.com/ontology#Class3a", "http://mobi.com/ontology#Class2a",
                "http://mobi.com/ontology#Class2b", "http://mobi.com/ontology#Class1b", "http://mobi.com/ontology#Class1c",
                "http://mobi.com/ontology#Class1a", "http://mobi.com/ontology#Class4a", "http://mobi.com/ontology#Class4b")
                .collect(Collectors.toSet());

        TupleQueryResult result = queryOntology.getSearchResults("class");
        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "entity").stringValue();
            assertTrue(entities.contains(parent));
            entities.remove(parent);
            assertEquals("http://www.w3.org/2002/07/owl#Class", Bindings.requiredResource(b, "type").stringValue());
        });
        assertEquals(0, entities.size());
    }

    @Test
    public void testGetSearchResultsWithDifference() throws Exception {
        IRI newClass = vf.createIRI("http://test.com/ontology1#ClassNew");
        Set<String> entities = Stream.of("http://mobi.com/ontology#Class3a", "http://mobi.com/ontology#Class2a",
                "http://mobi.com/ontology#Class2b", "http://mobi.com/ontology#Class1b", "http://mobi.com/ontology#Class1c",
                "http://mobi.com/ontology#Class1a", "http://mobi.com/ontology#Class4a", "http://mobi.com/ontology#Class4b",
                newClass.stringValue()).collect(Collectors.toSet());

        Model additions = mf.createEmptyModel();
        additions.add(newClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));
        additions.add(newClass, vf.createIRI(DC.TITLE.stringValue()), vf.createLiteral("ClassNew"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));

        TupleQueryResult result = ont.getSearchResults("class");
        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "entity").stringValue();
            assertTrue(entities.contains(parent));
            entities.remove(parent);
            assertEquals("http://www.w3.org/2002/07/owl#Class", Bindings.requiredResource(b, "type").stringValue());
        });
        assertEquals(0, entities.size());
    }

    @Test
    public void testGetTupleQueryResults() throws Exception {
        List<BindingSet> result = QueryResults.asList(queryOntology.getTupleQueryResults("select distinct ?s where { ?s ?p ?o . }", true));
        assertEquals(21, result.size());
    }

    @Test
    public void testGetTupleQueryResultsWithDifference() throws Exception {
        IRI newClass = vf.createIRI("http://test.com/ontology1#ClassNew");
        Model additions = mf.createEmptyModel();
        additions.add(newClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));
        additions.add(newClass, vf.createIRI(DC.TITLE.stringValue()), vf.createLiteral("ClassNew"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));
        List<BindingSet> result = QueryResults.asList(ont.getTupleQueryResults("select distinct ?s where { ?s ?p ?o . }", true));
        assertEquals(22, result.size());
    }

    @Test
    public void testGetGraphQueryResults() throws Exception {
        Model result = queryOntology.getGraphQueryResults("construct {?s ?p ?o} where { ?s ?p ?o . }", true);
        assertEquals(queryOntology.asModel().size(), result.size());
    }

    private void getGraphQueryResultStreamHelper(RDFFormat rdfFormat) throws Exception{
        OutputStream stream = queryOntology.getGraphQueryResultsStream("construct {?s ?p ?o} where { ?s ?p ?o . }", true, rdfFormat, false);
        assertTrue(org.eclipse.rdf4j.model.util.Models.isomorphic(queryOntModel, Models.createModel(new ByteArrayInputStream(stream.toString().getBytes()))));

        stream = queryOntology.getGraphQueryResultsStream("construct {?s ?p ?o} where { ?s ?p ?o . }", false, rdfFormat, false);
        assertTrue(org.eclipse.rdf4j.model.util.Models.isomorphic(queryOntModel, Models.createModel(new ByteArrayInputStream(stream.toString().getBytes()))));

        stream = queryOntology.getGraphQueryResultsStream("construct {?s ?p ?o} where { ?s ?p ?o . }", false, rdfFormat, true);
        assertTrue(org.eclipse.rdf4j.model.util.Models.isomorphic(queryOntModel, Models.createModel(new ByteArrayInputStream(stream.toString().getBytes()))));

        stream = queryOntology.getGraphQueryResultsStream("construct {?s ?p ?o} where { ?s ?p ?o . }", true, rdfFormat, true);
        assertTrue(org.eclipse.rdf4j.model.util.Models.isomorphic(queryOntModel, Models.createModel(new ByteArrayInputStream(stream.toString().getBytes()))));
    }

    private void getGraphQueryResultStreamParameterHelper(RDFFormat rdfFormat) throws Exception {
        OutputStream stream = new ByteArrayOutputStream();
        queryOntology.getGraphQueryResultsStream("construct {?s ?p ?o} where { ?s ?p ?o . }", true, rdfFormat, false, stream);
        assertTrue(org.eclipse.rdf4j.model.util.Models.isomorphic(queryOntModel, Models.createModel(new ByteArrayInputStream(stream.toString().getBytes()))));

        stream = new ByteArrayOutputStream();
        queryOntology.getGraphQueryResultsStream("construct {?s ?p ?o} where { ?s ?p ?o . }", false, rdfFormat, false, stream);
        assertTrue(org.eclipse.rdf4j.model.util.Models.isomorphic(queryOntModel, Models.createModel(new ByteArrayInputStream(stream.toString().getBytes()))));

        stream = new ByteArrayOutputStream();
        queryOntology.getGraphQueryResultsStream("construct {?s ?p ?o} where { ?s ?p ?o . }", false, rdfFormat, true, stream);
        assertTrue(org.eclipse.rdf4j.model.util.Models.isomorphic(queryOntModel, Models.createModel(new ByteArrayInputStream(stream.toString().getBytes()))));

        stream = new ByteArrayOutputStream();
        queryOntology.getGraphQueryResultsStream("construct {?s ?p ?o} where { ?s ?p ?o . }", true, rdfFormat, true, stream);
        assertTrue(org.eclipse.rdf4j.model.util.Models.isomorphic(queryOntModel, Models.createModel(new ByteArrayInputStream(stream.toString().getBytes()))));
    }

    @Test
    public void testGetGraphQueryResultsStreamJsonLd() throws Exception {
        RDFFormat rdfFormat = RDFFormat.JSONLD;
        int actualLength = 5457;

        getGraphQueryResultStreamHelper(rdfFormat);
        getGraphQueryResultStreamParameterHelper(rdfFormat);
    }

    @Test
    public void testGetGraphQueryResultsStreamRDFXml() throws Exception {
        RDFFormat rdfFormat = RDFFormat.RDFXML;
        int actualLength = 9180;

        getGraphQueryResultStreamHelper(rdfFormat);
        getGraphQueryResultStreamParameterHelper(rdfFormat);
    }

    @Test
    public void testGetGraphQueryResultsStreamTurtle() throws Exception {
        RDFFormat rdfFormat = RDFFormat.TURTLE;
        int actualLength = 3908;

        getGraphQueryResultStreamHelper(rdfFormat);
        getGraphQueryResultStreamParameterHelper(rdfFormat);
    }

    @Test
    public void testGetGraphQueryResultsWithDifference() throws Exception {
        IRI newClass = vf.createIRI("http://test.com/ontology1#ClassNew");
        Model additions = mf.createEmptyModel();
        additions.add(newClass, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue()));
        additions.add(newClass, vf.createIRI(DC.TITLE.stringValue()), vf.createLiteral("ClassNew"));

        SimpleOntology ont = (SimpleOntology) queryOntology;
        ont.setDifference(createDifference(additions, null));
        Model result = ont.getGraphQueryResults("construct {?s ?p ?o} where { ?s ?p ?o . }", true);
        assertEquals(ont.asModel().size(), result.size());
    }

    // Imports Difference Tests

    @Test
    public void addImportLocalTest() throws Exception {
        IRI ontIRI = vf.createIRI("http://mobi.com/ontology/ont");
        Model model = mf.createEmptyModel();
        model.add(ontIRI, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ONTOLOGY.stringValue()));
        File file = setupOntologyMocks(model);
        SimpleOntology ontology = new SimpleOntology(ontIRI, file, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        Model additionsModel = mf.createEmptyModel();
        additionsModel.add(ontIRI, vf.createIRI(OWL.IMPORTS.stringValue()), TEST_LOCAL_IMPORT_3);
        ontology.setDifference(createDifference(additionsModel, null));

        Set<IRI> importsClosureIRIs = ontology.getImportsClosure()
                .stream()
                .map(ont -> ont.getOntologyId().getOntologyIRI().get())
                .collect(Collectors.toSet());
        assertEquals(2, ontology.getImportsClosure().size());
        assertTrue(importsClosureIRIs.contains(TEST_LOCAL_IMPORT_3));
        assertTrue(importsClosureIRIs.contains(ontIRI));
        assertTrue(ontology.getImportedOntologyIRIs().contains(TEST_LOCAL_IMPORT_3));
        assertEquals(Collections.emptySet(), ontology.getUnloadableImportIRIs());
    }

    @Test
    public void addImportWebTest() throws Exception {
        IRI ontIRI = vf.createIRI("http://mobi.com/ontology/ont");
        Model model = mf.createEmptyModel();
        model.add(ontIRI, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ONTOLOGY.stringValue()));
        File file = setupOntologyMocks(model);
        SimpleOntology ontology = new SimpleOntology(ontIRI, file, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        Model additionsModel = mf.createEmptyModel();
        additionsModel.add(ontIRI, vf.createIRI(OWL.IMPORTS.stringValue()), skosIRI);
        ontology.setDifference(createDifference(additionsModel, null));

        Set<IRI> importsClosureIRIs = ontology.getImportsClosure()
                .stream()
                .map(ont -> ont.getOntologyId().getOntologyIRI().get())
                .collect(Collectors.toSet());
        assertEquals(2, ontology.getImportsClosure().size());
        assertTrue(importsClosureIRIs.contains(skosIRI));
        assertTrue(importsClosureIRIs.contains(ontIRI));
        assertTrue(ontology.getImportedOntologyIRIs().contains(skosIRI));
        assertEquals(Collections.emptySet(), ontology.getUnloadableImportIRIs());
    }

    @Test
    public void addImportUnresolvedWebTest() throws Exception {
        when(importsResolver.retrieveOntologyLocalFile(eq(vf.createIRI("urn:unresolvable")))).thenReturn(Optional.empty());
        when(importsResolver.retrieveOntologyFromWebFile(eq(vf.createIRI("urn:unresolvable")))).thenReturn(Optional.empty());

        IRI ontIRI = vf.createIRI("http://mobi.com/ontology/ont");
        Model model = mf.createEmptyModel();
        model.add(ontIRI, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ONTOLOGY.stringValue()));
        File file = setupOntologyMocks(model);
        SimpleOntology ontology = new SimpleOntology(ontIRI, file, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        Model additionsModel = mf.createEmptyModel();
        additionsModel.add(ontIRI, vf.createIRI(OWL.IMPORTS.stringValue()), vf.createIRI("urn:unresolvable"));
        ontology.setDifference(createDifference(additionsModel, null));

        Set<IRI> importsClosureIRIs = ontology.getImportsClosure()
                .stream()
                .map(ont -> ont.getOntologyId().getOntologyIRI().get())
                .collect(Collectors.toSet());
        assertEquals(1, ontology.getImportsClosure().size());
        assertFalse(importsClosureIRIs.contains(vf.createIRI("urn:unresolvable")));
        assertTrue(importsClosureIRIs.contains(ontIRI));
        assertTrue(ontology.getImportedOntologyIRIs().contains(vf.createIRI("urn:unresolvable")));
        assertEquals(Collections.singleton(vf.createIRI("urn:unresolvable")), ontology.getUnloadableImportIRIs());
    }

    @Test
    public void transitiveRemovalTest() throws Exception {
        assertEquals(3, ont1.getImportsClosure().size());

        SimpleOntology ont1Simple = (SimpleOntology) ont1;
        Model deletionsModel = mf.createEmptyModel();
        deletionsModel.add(TEST_LOCAL_IMPORT_1, vf.createIRI(OWL.IMPORTS.stringValue()), TEST_LOCAL_IMPORT_2);
        ont1Simple.setDifference(createDifference(null, deletionsModel));

        assertEquals(1, ont1Simple.getImportsClosure().size());
    }

    @Test
    public void transitiveRemovalDirectImportThatIsAlsoTransitiveTest() throws Exception {
        IRI ontIRI = vf.createIRI("http://mobi.com/ontology/transitive");
        Model model = mf.createEmptyModel();
        model.add(ontIRI, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ONTOLOGY.stringValue()));
        model.add(ontIRI, vf.createIRI(OWL.IMPORTS.stringValue()), TEST_LOCAL_IMPORT_1);
        model.add(ontIRI, vf.createIRI(OWL.IMPORTS.stringValue()), TEST_LOCAL_IMPORT_2);
        File file = setupOntologyMocks(model);
        SimpleOntology transitive = new SimpleOntology(ontIRI, file, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        Set<IRI> importsClosureIRIs = transitive.getImportsClosure()
                .stream()
                .map(ont -> ont.getOntologyId().getOntologyIRI().get())
                .collect(Collectors.toSet());
        assertEquals(4, transitive.getImportsClosure().size());
        assertEquals(4, importsClosureIRIs.size());
        assertTrue(importsClosureIRIs.contains(TEST_LOCAL_IMPORT_1));
        assertTrue(importsClosureIRIs.contains(TEST_LOCAL_IMPORT_2));
        assertTrue(importsClosureIRIs.contains(TEST_LOCAL_IMPORT_3));
        assertTrue(importsClosureIRIs.contains(ontIRI));
        assertEquals(Collections.emptySet(), transitive.getUnloadableImportIRIs());

        Model deletionsModel = mf.createEmptyModel();
        deletionsModel.add(ontIRI, vf.createIRI(OWL.IMPORTS.stringValue()), TEST_LOCAL_IMPORT_2);
        transitive.setDifference(createDifference(null, deletionsModel));

        importsClosureIRIs = transitive.getImportsClosure()
                .stream()
                .map(ont -> ont.getOntologyId().getOntologyIRI().get())
                .collect(Collectors.toSet());
        assertEquals(4, transitive.getImportsClosure().size());
        assertEquals(4, importsClosureIRIs.size());
        assertTrue(importsClosureIRIs.contains(TEST_LOCAL_IMPORT_1));
        assertTrue(importsClosureIRIs.contains(TEST_LOCAL_IMPORT_2));
        assertTrue(importsClosureIRIs.contains(TEST_LOCAL_IMPORT_3));
        assertTrue(importsClosureIRIs.contains(ontIRI));
        assertEquals(Collections.emptySet(), transitive.getUnloadableImportIRIs());
    }

    @Test
    public void transitiveAdditionTest() throws Exception {
        IRI ontIRI = vf.createIRI("http://mobi.com/ontology/transitiveAddition");
        Model model = mf.createEmptyModel();
        model.add(ontIRI, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ONTOLOGY.stringValue()));
        File transAddFile = setupOntologyMocks(model);
        SimpleOntology transitiveAdd = new SimpleOntology(ontIRI, transAddFile, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        assertEquals(1, transitiveAdd.getImportsClosure().size());

        Model additionsModel = mf.createEmptyModel();
        additionsModel.add(ontIRI, vf.createIRI(OWL.IMPORTS.stringValue()), TEST_LOCAL_IMPORT_1);
        transitiveAdd.setDifference(createDifference(additionsModel, null));

        assertEquals(4, transitiveAdd.getImportsClosure().size());
    }

    @Test
    public void multUnresolvedFullReplaceWithMultUnresolvedTest() throws Exception {
        Model model = createModelFromFile("/differenceTesting/multiple-unresolved-1.ttl");
        File file = setupOntologyMocks(model);
        when(importsResolver.retrieveOntologyFromWebFile(any(IRI.class))).thenReturn(Optional.empty());
        when(importsResolver.retrieveOntologyLocalFile(any(IRI.class))).thenReturn(Optional.empty());
        SimpleOntology multUnresolved1 = new SimpleOntology(vf.createIRI("https://mobi.com/ontologies/multipleunresolved1"), file, repo, ontologyManager, catalogConfigProvider, dsUtilsService, importsResolver, bNodeService, branchManager, commitManager);

        Set<IRI> expectedUnresolved = Stream.of(vf.createIRI("https://mobi.com/ontologies/unresolvable1.owl"), vf.createIRI("https://mobi.com/ontologies/unresolvable2.owl"), vf.createIRI("https://mobi.com/ontologies/unresolvable3.owl")).collect(Collectors.toSet());
        Set<IRI> actualUnresolved = multUnresolved1.getUnloadableImportIRIs();
        assertEquals(expectedUnresolved.size(), actualUnresolved.size());
        assertEquals(expectedUnresolved, actualUnresolved);

        Model additionsModel = createModelFromFile("/differenceTesting/multiple-unresolved-2.ttl");
        Difference diff = createDifference(additionsModel, model);
        multUnresolved1.setDifference(diff);

        Set<IRI> diffExpectedUnresolved = Stream.of(vf.createIRI("https://mobi.com/ontologies/unresolvable4.owl"), vf.createIRI("https://mobi.com/ontologies/unresolvable5.owl")).collect(Collectors.toSet());
        Set<IRI> diffActualUnresolved = multUnresolved1.getUnloadableImportIRIs();
        assertEquals(diffExpectedUnresolved.size(), diffActualUnresolved.size());
        assertEquals(diffExpectedUnresolved, diffActualUnresolved);
    }

    private File setupOntologyMocks(Model model) throws Exception{
        Path path = Files.createTempFile(null, null);
        Rio.write(model, Files.newOutputStream(path), RDFFormat.TURTLE);
        File file = path.toFile();
        file.deleteOnExit();
        return file;
    }

    private Difference createDifference(Model additions, Model deletions) {
        Difference.Builder builder = new Difference.Builder();
        builder.additions(additions == null ? mf.createEmptyModel() : additions);
        builder.deletions(deletions == null ? mf.createEmptyModel() : deletions);
        return builder.build();
    }

    private String replaceBlankNodeSuffix(String s) {
        String s1 = s.replaceAll("/genid/[a-zA-Z0-9-]+\"", "\"");
        return s1.replaceAll("/genid/[a-zA-Z0-9]+\"", "\"");
    }

    private Model createModelFromFile(String filename) throws Exception {
        return Models.createModel(this.getClass().getResourceAsStream(filename));
    }

    private String removeWhitespace(String s) {
        return s.replaceAll("\\s+", "");
    }
}

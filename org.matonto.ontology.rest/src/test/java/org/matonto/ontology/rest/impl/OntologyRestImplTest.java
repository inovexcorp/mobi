package org.matonto.ontology.rest.impl;

/*-
 * #%L
 * org.matonto.ontology.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Difference;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.catalog.impl.SimpleDifference;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.ontology.core.impl.owlapi.SimpleAnnotation;
import org.matonto.ontology.core.impl.owlapi.SimpleNamedIndividual;
import org.matonto.ontology.core.impl.owlapi.SimpleOntology;
import org.matonto.ontology.core.impl.owlapi.SimpleOntologyManager;
import org.matonto.ontology.core.impl.owlapi.classexpression.SimpleClass;
import org.matonto.ontology.core.impl.owlapi.datarange.SimpleDatatype;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleAnnotationProperty;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleDataProperty;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleObjectProperty;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.query.TupleQueryResult;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.rest.util.MatontoRestTestNg;
import org.matonto.rest.util.UsernameTestFilter;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.rio.WriterConfig;
import org.openrdf.rio.helpers.JSONLDMode;
import org.openrdf.rio.helpers.JSONLDSettings;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import static org.matonto.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anySetOf;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

public class OntologyRestImplTest extends MatontoRestTestNg {
    private OntologyRestImpl rest;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private OntologyId ontologyId;

    @Mock
    private OntologyId importedOntologyId;

    @Mock
    private Ontology ontology;

    @Mock
    private Ontology importedOntology;

    @Mock
    private SesameTransformer sesameTransformer;

    private ValueConverterRegistry vcr;
    private ModelFactory modelFactory;
    private ValueFactory valueFactory;
    private CatalogFactory catalogFactory;
    private CommitFactory commitFactory;
    private BranchFactory branchFactory;
    private OntologyRecordFactory ontologyRecordFactory;
    private InProgressCommitFactory inProgressCommitFactory;
    private UserFactory userFactory;
    private Resource catalogId;
    private Catalog catalog;
    private Resource recordId;
    private OntologyRecord record;
    private Resource inProgressCommitId;
    private InProgressCommit inProgressCommit;
    private Resource commitId;
    private Commit commit;
    private Resource branchId;
    private Branch branch;
    private Resource userId;
    private User user;
    private Resource classId;
    private Difference difference;
    private Model additions;
    private Model deletions;
    private Model ontologyModel;
    private Model importedOntologyModel;
    private Set<Annotation> annotations;
    private Set<AnnotationProperty> annotationProperties;
    private Set<OClass> classes;
    private Set<Datatype> datatypes;
    private Set<ObjectProperty> objectProperties;
    private Set<DataProperty> dataProperties;
    private Set<Individual> individuals;
    private IRI classIRI;
    private IRI datatypeIRI;
    private IRI objectPropertyIRI;
    private IRI dataPropertyIRI;
    private IRI individualIRI;
    private Set<Ontology> importedOntologies;
    private IRI ontologyIRI;
    private IRI importedOntologyIRI;
    private JSONObject entityUsagesResult;
    private JSONObject subClassesOfResult;
    private JSONObject subObjectPropertiesOfResult;
    private JSONObject subDatatypePropertiesOfResult;
    private JSONObject conceptHierarchyResult;
    private JSONObject searchResults;
    private SimpleOntologyManager simpleOntologyManager;
    private OutputStream ontologyJsonLd;
    private OutputStream importedOntologyJsonLd;
    private JSONArray importedOntologyResults;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);

        vcr = new DefaultValueConverterRegistry();
        modelFactory = LinkedHashModelFactory.getInstance();
        valueFactory = SimpleValueFactory.getInstance();
        catalogFactory = new CatalogFactory();
        commitFactory = new CommitFactory();
        branchFactory = new BranchFactory();
        ontologyRecordFactory = new OntologyRecordFactory();
        inProgressCommitFactory = new InProgressCommitFactory();
        userFactory = new UserFactory();

        catalogFactory.setModelFactory(modelFactory);
        catalogFactory.setValueFactory(valueFactory);
        catalogFactory.setValueConverterRegistry(vcr);

        commitFactory.setModelFactory(modelFactory);
        commitFactory.setValueFactory(valueFactory);
        commitFactory.setValueConverterRegistry(vcr);

        branchFactory.setModelFactory(modelFactory);
        branchFactory.setValueFactory(valueFactory);
        branchFactory.setValueConverterRegistry(vcr);

        ontologyRecordFactory.setModelFactory(modelFactory);
        ontologyRecordFactory.setValueFactory(valueFactory);
        ontologyRecordFactory.setValueConverterRegistry(vcr);

        inProgressCommitFactory.setModelFactory(modelFactory);
        inProgressCommitFactory.setValueFactory(valueFactory);
        inProgressCommitFactory.setValueConverterRegistry(vcr);

        userFactory.setModelFactory(modelFactory);
        userFactory.setValueFactory(valueFactory);
        userFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(catalogFactory);
        vcr.registerValueConverter(commitFactory);
        vcr.registerValueConverter(branchFactory);
        vcr.registerValueConverter(ontologyRecordFactory);
        vcr.registerValueConverter(inProgressCommitFactory);
        vcr.registerValueConverter(userFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        rest = new OntologyRestImpl();
        rest.setModelFactory(modelFactory);
        rest.setValueFactory(valueFactory);
        rest.setOntologyManager(ontologyManager);
        rest.setCatalogManager(catalogManager);
        rest.setOntologyRecordFactory(ontologyRecordFactory);
        rest.setInProgressCommitFactory(inProgressCommitFactory);
        rest.setEngineManager(engineManager);
        rest.setSesameTransformer(sesameTransformer);

        simpleOntologyManager = new SimpleOntologyManager();
        simpleOntologyManager.setModelFactory(modelFactory);
        simpleOntologyManager.setValueFactory(valueFactory);

        catalogId = valueFactory.createIRI("http://matonto.org/catalog");
        catalog = catalogFactory.createNew(catalogId);
        recordId = valueFactory.createIRI("http://matonto.org/record");
        record = ontologyRecordFactory.createNew(recordId);
        inProgressCommitId = valueFactory.createIRI("http://matonto.org/in-progress-commit");
        inProgressCommit = inProgressCommitFactory.createNew(inProgressCommitId);
        commitId = valueFactory.createIRI("http://matonto.org/commit");
        commit = commitFactory.createNew(commitId);
        branchId = valueFactory.createIRI("http://matonto.org/branch");
        branch = branchFactory.createNew(branchId);
        userId = valueFactory.createIRI("http://matonto.org/users/tester");
        user = userFactory.createNew(userId);
        record.setMasterBranch(branch);
        classId = valueFactory.createIRI("http://matonto.org/ontology#Class1a");
        IRI titleIRI = valueFactory.createIRI(DCTERMS.TITLE.stringValue());
        additions = modelFactory.createModel();
        additions.add(catalogId, titleIRI, valueFactory.createLiteral("Addition"));
        deletions = modelFactory.createModel();
        deletions.add(catalogId, titleIRI, valueFactory.createLiteral("Deletion"));
        difference = new SimpleDifference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build();
        WriterConfig config = new WriterConfig();
        config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        ontologyModel = modelFactory.createModel(Values.matontoModel(Rio.parse(testOntology, "", RDFFormat.TURTLE)));
        ontologyJsonLd = new ByteArrayOutputStream();
        Rio.write(Values.sesameModel(ontologyModel), ontologyJsonLd, RDFFormat.JSONLD, config);
        InputStream testVocabulary = getClass().getResourceAsStream("/test-vocabulary.ttl");
        importedOntologyModel = modelFactory.createModel(Values.matontoModel(Rio.parse(testVocabulary, "",
                RDFFormat.TURTLE)));
        importedOntologyJsonLd = new ByteArrayOutputStream();
        Rio.write(Values.sesameModel(importedOntologyModel), importedOntologyJsonLd, RDFFormat.JSONLD, config);
        IRI annotationPropertyIRI = valueFactory.createIRI("http://matonto.org/annotation-property");
        annotationProperties = Collections.singleton(new SimpleAnnotationProperty(annotationPropertyIRI));
        IRI annotationIRI = valueFactory.createIRI("http://matonto.org/annotation");
        AnnotationProperty annotationProperty = new SimpleAnnotationProperty(annotationIRI);
        annotations = Collections.singleton(new SimpleAnnotation(annotationProperty, valueFactory.createLiteral("word"),
                Collections.emptySet()));
        classIRI = valueFactory.createIRI("http://matonto.org/class");
        classes = Collections.singleton(new SimpleClass(classIRI));
        datatypeIRI = valueFactory.createIRI("http://matonto.org/datatype");
        datatypes = Collections.singleton(new SimpleDatatype(datatypeIRI));
        objectPropertyIRI = valueFactory.createIRI("http://matonto.org/object-property");
        objectProperties = Collections.singleton(new SimpleObjectProperty(objectPropertyIRI));
        dataPropertyIRI = valueFactory.createIRI("http://matonto.org/data-property");
        dataProperties = Collections.singleton(new SimpleDataProperty(dataPropertyIRI));
        individualIRI = valueFactory.createIRI("http://matonto.org/individual");
        individuals = Collections.singleton(new SimpleNamedIndividual(individualIRI));
        importedOntologies = Collections.singleton(importedOntology);
        ontologyIRI = valueFactory.createIRI("http://matonto.org/ontology-id");
        importedOntologyIRI = valueFactory.createIRI("http://matonto.org/imported-ontology-id");
        entityUsagesResult = getResource("/entity-usages-results.json");
        subClassesOfResult = getResource("/sub-classes-of-results.json");
        subObjectPropertiesOfResult = getResource("/sub-object-properties-of-results.json");
        subDatatypePropertiesOfResult = getResource("/sub-datatype-properties-of-results.json");
        conceptHierarchyResult = getResource("/concept-hierarchy-results.json");
        searchResults = getResource("/search-results.json");
        importedOntologyResults = getResourceArray("/imported-ontology-results.json");

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class)
                .register(UsernameTestFilter.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(engineManager);
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.of(user));
        reset(ontologyId);
        when(ontologyId.getOntologyIdentifier()).thenReturn(ontologyIRI);
        reset(ontology);
        when(ontology.getOntologyId()).thenReturn(ontologyId);
        when(ontology.asModel(any(ModelFactory.class))).thenReturn(ontologyModel);
        when(ontology.getAllAnnotations()).thenReturn(annotations);
        when(ontology.getAllAnnotationProperties()).thenReturn(annotationProperties);
        when(ontology.getAllClasses()).thenReturn(classes);
        when(ontology.getAllDatatypes()).thenReturn(datatypes);
        when(ontology.getAllObjectProperties()).thenReturn(objectProperties);
        when(ontology.getAllDataProperties()).thenReturn(dataProperties);
        when(ontology.getAllIndividuals()).thenReturn(individuals);
        when(ontology.getImportsClosure()).thenReturn(importedOntologies);
        when(ontology.asJsonLD()).thenReturn(ontologyJsonLd);
        reset(importedOntologyId);
        when(importedOntologyId.getOntologyIdentifier()).thenReturn(importedOntologyIRI);
        reset(importedOntology);
        when(importedOntology.getOntologyId()).thenReturn(importedOntologyId);
        when(importedOntology.asModel(any(ModelFactory.class))).thenReturn(importedOntologyModel);
        when(importedOntology.getAllAnnotations()).thenReturn(annotations);
        when(importedOntology.getAllAnnotationProperties()).thenReturn(annotationProperties);
        when(importedOntology.getAllClasses()).thenReturn(classes);
        when(importedOntology.getAllDatatypes()).thenReturn(datatypes);
        when(importedOntology.getAllObjectProperties()).thenReturn(objectProperties);
        when(importedOntology.getAllDataProperties()).thenReturn(dataProperties);
        when(importedOntology.getAllIndividuals()).thenReturn(individuals);
        when(importedOntology.asJsonLD()).thenReturn(importedOntologyJsonLd);
        reset(catalogManager);
        when(catalogManager.getLocalCatalog()).thenReturn(catalog);
        when(catalogManager.createRecord(any(RecordConfig.class), any(OntologyRecordFactory.class))).thenReturn(record);
        when(catalogManager.getRecord(eq(catalogId), eq(recordId), any(OntologyRecordFactory.class)))
                .thenReturn(Optional.of(record));
        when(catalogManager.getRecord(anyString(), eq(ontologyRecordFactory))).thenReturn(Optional.of(record));
        when(catalogManager.createInProgressCommit(any(User.class), eq(recordId))).thenReturn(inProgressCommit);
        when(catalogManager.getCommit(eq(inProgressCommitId), any(InProgressCommitFactory.class))).thenReturn(Optional
                .of(inProgressCommit));
        when(catalogManager.createCommit(eq(inProgressCommit), anySetOf(Commit.class), anyString())).thenReturn(commit);
        when(catalogManager.getInProgressCommitIRI(any(Resource.class), eq(recordId))).thenReturn(Optional
                .of(inProgressCommitId));
        when(catalogManager.applyInProgressCommit(eq(inProgressCommitId), any(Model.class))).thenReturn(modelFactory
                .createModel());
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);
        reset(ontologyManager);
        when(ontologyManager.createOntology(any(FileInputStream.class))).thenReturn(ontology);
        when(ontologyManager.createOntology(any(Model.class))).thenReturn(ontology);
        when(ontologyManager.retrieveOntology(eq(ontologyIRI), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntology(eq(ontologyIRI), any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntology(eq(ontologyIRI))).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntology(eq(importedOntologyIRI), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.of(importedOntology));
        when(ontologyManager.retrieveOntology(eq(importedOntologyIRI), any(Resource.class)))
                .thenReturn(Optional.of(importedOntology));
        when(ontologyManager.retrieveOntology(eq(importedOntologyIRI))).thenReturn(Optional.of(importedOntology));
        TupleQueryResult subClassesOf = simpleOntologyManager.getSubClassesOf(ontology);
        when(ontologyManager.getSubClassesOf(eq(ontology))).thenReturn(subClassesOf);
        TupleQueryResult subObjectPropertiesOf = simpleOntologyManager.getSubObjectPropertiesOf(ontology);
        when(ontologyManager.getSubObjectPropertiesOf(eq(ontology))).thenReturn(subObjectPropertiesOf);
        TupleQueryResult subDatatypePropertiesOf = simpleOntologyManager.getSubDatatypePropertiesOf(ontology);
        when(ontologyManager.getSubDatatypePropertiesOf(eq(ontology))).thenReturn(subDatatypePropertiesOf);
        TupleQueryResult classesWithIndividuals = simpleOntologyManager.getClassesWithIndividuals(ontology);
        when(ontologyManager.getClassesWithIndividuals(eq(ontology))).thenReturn(classesWithIndividuals);
        TupleQueryResult conceptRelationships = simpleOntologyManager.getConceptRelationships(importedOntology);
        when(ontologyManager.getConceptRelationships(eq(ontology))).thenReturn(conceptRelationships);
        TupleQueryResult entityUsages = simpleOntologyManager.getEntityUsages(ontology, classId);
        when(ontologyManager.getEntityUsages(eq(ontology), any(Resource.class))).thenReturn(entityUsages);
        when(ontologyManager.getSearchResults(eq(ontology), anyString())).thenAnswer(invocationOnMock ->
                simpleOntologyManager.getSearchResults(ontology, invocationOnMock.getArgumentAt(1, String.class)));
        reset(sesameTransformer);
        when(sesameTransformer.matontoModel(any(org.openrdf.model.Model.class))).thenReturn(modelFactory.createModel());
    }

    private JSONObject getResource(String path) throws Exception {
        return JSONObject.fromObject(IOUtils.toString(getClass().getResourceAsStream(path)));
    }

    private JSONArray getResourceArray(String path) throws Exception {
        return JSONArray.fromObject(IOUtils.toString(getClass().getResourceAsStream(path)));
    }

    private void assertGetUserInProgressCommitIRI(boolean hasInProgressCommit) {
        assertGetUserFromContext();
        verify(catalogManager, atLeastOnce()).getRecord(anyString(), eq(ontologyRecordFactory));
        verify(catalogManager, atLeastOnce()).getInProgressCommitIRI(any(Resource.class), any(Resource.class));
        if (!hasInProgressCommit) {
            verify(catalogManager, times(1)).createInProgressCommit(any(User.class), any(Resource.class));
            verify(catalogManager, times(1)).addInProgressCommit(any(InProgressCommit.class));
        }
    }

    private void assertGetUserFromContext() {
        verify(engineManager, atLeastOnce()).retrieveUser(anyString(), anyString());
    }

    private void assertGetOntology(boolean hasInProgressCommit) {
        assertGetUserFromContext();
        verify(catalogManager, atLeastOnce()).getRecord(anyString(), eq(ontologyRecordFactory));
        verify(catalogManager, atLeastOnce()).getInProgressCommitIRI(any(Resource.class), any(Resource.class));
        if (hasInProgressCommit) {
            verify(catalogManager, times(1)).applyInProgressCommit(any(Resource.class), any(Model.class));
            verify(ontologyManager, times(1)).createOntology(any(Model.class));
        }
    }

    private JSONObject createJsonIRI(IRI iri) {
        JSONObject object = new JSONObject();
        object.put("namespace", iri.getNamespace());
        object.put("localName", iri.getLocalName());
        return object;
    }

    private void assertAnnotations(JSONObject responseObject) {
        JSONArray jsonAnnotations = responseObject.getJSONArray("annotationProperties");
        assertEquals(jsonAnnotations.size(), annotationProperties.size() + annotations.size());
        annotationProperties.forEach(annotationProperty ->
                assertTrue(jsonAnnotations.contains(createJsonIRI(annotationProperty.getIRI()))));
        annotations.forEach(annotation ->
                assertTrue(jsonAnnotations.contains(createJsonIRI(annotation.getProperty().getIRI()))));
    }

    private void assertClasses(JSONObject responseObject) {
        JSONArray jsonClasses = responseObject.getJSONArray("classes");
        assertEquals(jsonClasses.size(), classes.size());
        classes.forEach(oClass -> assertTrue(jsonClasses.contains(createJsonIRI(oClass.getIRI()))));
    }

    private void assertDatatypes(JSONObject responseObject) {
        JSONArray jsonDatatypes = responseObject.getJSONArray("datatypes");
        assertEquals(jsonDatatypes.size(), datatypes.size());
        datatypes.forEach(datatype -> assertTrue(jsonDatatypes.contains(createJsonIRI(datatype.getIRI()))));
    }

    private void assertObjectProperties(JSONObject responseObject) {
        JSONArray jsonObjectProperties = responseObject.getJSONArray("objectProperties");
        assertEquals(jsonObjectProperties.size(), objectProperties.size());
        objectProperties.forEach(objectProperty -> assertTrue(jsonObjectProperties.contains(createJsonIRI(objectProperty
                .getIRI()))));
    }

    private void assertDataProperties(JSONObject responseObject) {
        JSONArray jsonDataProperties = responseObject.getJSONArray("dataProperties");
        assertEquals(jsonDataProperties.size(), dataProperties.size());
        dataProperties.forEach(dataProperty -> assertTrue(jsonDataProperties.contains(createJsonIRI(dataProperty
                .getIRI()))));
    }

    private void assertIndividuals(JSONObject responseObject) {
        JSONArray jsonIndividuals = responseObject.getJSONArray("namedIndividuals");
        assertEquals(jsonIndividuals.size(), individuals.size());
        individuals.forEach(individual -> assertTrue(jsonIndividuals.contains(createJsonIRI(
                ((NamedIndividual)individual).getIRI()))));
    }

    private void assertAdditionsToInProgressCommit(boolean hasInProgressCommit) {
        assertGetUserInProgressCommitIRI(hasInProgressCommit);
        verify(catalogManager, times(1)).addAdditions(any(Model.class), any(Resource.class));
    }

    private void assertDeletionsToInProgressCommit(boolean hasInProgressCommit) {
        assertGetUserInProgressCommitIRI(hasInProgressCommit);
        verify(catalogManager, times(1)).addDeletions(any(Model.class), any(Resource.class));
    }

    private void assertImportedOntologies(JSONArray responseArray, Consumer<JSONObject> assertConsumer) {
        for (Object o : responseArray) {
            String ontologyId = ((JSONObject)o).get("id").toString();
            assertTrue(importedOntologies.stream()
                    .filter(ont -> ont.getOntologyId().getOntologyIdentifier().stringValue().equals(ontologyId))
                    .collect(Collectors.toList()).size() != 0);
            assertConsumer.accept((JSONObject)o);
        }
    }

    private void setNoInProgressCommit() {
        when(catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class))).thenReturn(Optional
                .empty());
    }

    // Test upload file

    @Test
    public void testUploadFile() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("file", getClass().getResourceAsStream("/test-ontology.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("keywords", "keyword1,keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
        assertGetUserFromContext();
        verify(ontologyManager, times(1)).createOntology(any(FileInputStream.class));
        verify(ontology, times(1)).getOntologyId();
        verify(ontologyId, times(1)).getOntologyIdentifier();
        verify(catalogManager, times(1)).getLocalCatalog();
        verify(catalogManager, times(1)).createRecord(any(RecordConfig.class), eq(ontologyRecordFactory));
        verify(catalogManager, times(1)).addRecord(eq(catalogId), eq(record));
        verify(catalogManager, times(1)).addMasterBranch(eq(recordId));
        verify(catalogManager, times(1)).getRecord(eq(catalogId), eq(recordId), eq(ontologyRecordFactory));
        verify(catalogManager, times(1)).createInProgressCommit(eq(user), eq(recordId));
        verify(catalogManager, times(1)).addInProgressCommit(eq(inProgressCommit));
        verify(catalogManager, times(1)).addAdditions(any(Model.class), eq(inProgressCommitId));
        verify(catalogManager, times(1)).getCommit(eq(inProgressCommitId), eq(inProgressCommitFactory));
        verify(catalogManager, times(1)).createCommit(eq(inProgressCommit), eq(null), anyString());
        verify(catalogManager, times(1)).addCommitToBranch(eq(commit), eq(branchId));
        verify(catalogManager, times(1)).removeInProgressCommit(eq(inProgressCommitId));
    }

    @Test
    public void testUploadFileWithoutTitle() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("file", getClass().getResourceAsStream("/test-ontology.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        fd.field("description", "description");
        fd.field("keywords", "keyword1,keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testUploadFileWithoutFile() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("keywords", "keyword1,keyword2");

        Response response = target().path("ontologies").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);
    }

    // Test save changes to ontology

    @Test
    public void testSaveChangesToOntology() {
        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/entity");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertGetUserInProgressCommitIRI(true);
        verify(catalogManager, times(1)).addAdditions(any(Model.class), eq(inProgressCommitId));
        verify(catalogManager, times(1)).addDeletions(any(Model.class), eq(inProgressCommitId));
    }

    @Test
    public void testSaveChangesToOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/entity");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertGetUserInProgressCommitIRI(false);
        verify(catalogManager, times(1)).addAdditions(any(Model.class), eq(inProgressCommitId));
        verify(catalogManager, times(1)).addDeletions(any(Model.class), eq(inProgressCommitId));
    }

    @Test
    public void testSaveChangesToOntologyWithNoDifference() {
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(new SimpleDifference.Builder()
                .build());

        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/entity");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("entityId", catalogId.stringValue()).request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertGetUserInProgressCommitIRI(true);
        verify(catalogManager, times(0)).addAdditions(any(Model.class), any(Resource.class));
        verify(catalogManager, times(0)).addDeletions(any(Model.class), any(Resource.class));
    }

    // Test get IRIs in ontology

    @Test
    public void testGetIRIsInOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
        assertAnnotations(responseObject);
        assertClasses(responseObject);
        assertDatatypes(responseObject);
        assertObjectProperties(responseObject);
        assertDataProperties(responseObject);
        assertIndividuals(responseObject);
    }

    @Test
    public void testGetIRIsInOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
        assertAnnotations(responseObject);
        assertClasses(responseObject);
        assertDatatypes(responseObject);
        assertObjectProperties(responseObject);
        assertDataProperties(responseObject);
        assertIndividuals(responseObject);
    }

    @Test
    public void testGetIRIsInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/iris")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetIRIsInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/iris")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
        assertAnnotations(responseObject);
        assertClasses(responseObject);
        assertDatatypes(responseObject);
        assertObjectProperties(responseObject);
        assertDataProperties(responseObject);
        assertIndividuals(responseObject);
    }

    @Test
    public void testGetIRIsInOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/iris").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
        assertAnnotations(responseObject);
        assertClasses(responseObject);
        assertDatatypes(responseObject);
        assertObjectProperties(responseObject);
        assertDataProperties(responseObject);
        assertIndividuals(responseObject);
    }

    @Test
    public void testGetIRIsInOntologyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get annotations in ontology

    @Test
    public void testGetAnnotationsInOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertAnnotations(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetAnnotationsInOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertAnnotations(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetAnnotationsInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/annotations")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetAnnotationsInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(false);
        assertAnnotations(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetAnnotationsInOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/annotations")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(false);
        assertAnnotations(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetAnnotationsInOntologyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test add annotation to ontology

    @Test
    public void testAddAnnotationToOntology() {
        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-annotation");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/annotations").request()
                .post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddAnnotationToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-annotation");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/annotations").request()
                .post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(false);
    }

    // Test get classes in ontology

    @Test
    public void testGetClassesInOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertClasses(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetClassesInOntologyWithNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertClasses(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetClassesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetClassesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertClasses(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetClassesInOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes").request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertClasses(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetClassesInOntologyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test add class to ontology

    @Test
    public void testAddClassToOntology() {
        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-class");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes").request()
                .post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddClassToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-class");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes").request()
                .post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete class from ontology

    @Test
    public void testDeleteClassFromOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()) .queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteClassFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteClassFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes/"
                + encode(classId.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteClassFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/classes/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get datatypes in ontology

    @Test
    public void testGetDatatypesInOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertDatatypes(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetDatatypesInOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertDatatypes(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetDatatypesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetDatatypesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertDatatypes(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetDatatypesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes").request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertDatatypes(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetDatatypesInOntologyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test add datatype to ontology

    @Test
    public void testAddDatatypeToOntology() {
        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-datatype");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes").request()
                .post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddDatatypeToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-datatype");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes").request()
                .post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete datatype from ontology

    @Test
    public void testDeleteDatatypeFromOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteDatatypeFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteDatatypeFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyMissingBranchIdAndMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDatatypeFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/datatypes/"
                + encode(datatypeIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get object properties in ontology

    @Test
    public void testGetObjectPropertiesInOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertObjectProperties(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetObjectPropertiesInOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertObjectProperties(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetObjectPropertiesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetObjectPropertiesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertObjectProperties(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetObjectPropertiesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertObjectProperties(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetObjectPropertiesInOntologyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test add object property to ontology

    @Test
    public void testAddObjectPropertyToOntology() {
        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-object-property");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties")
                .request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddObjectPropertyToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-object-property");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties")
                .request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete object property from ontology

    @Test
    public void testDeleteObjectPropertyFromOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteObjectPropertyFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/object-properties/"
                + encode(objectPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get data properties in ontology

    @Test
    public void testGetDataPropertiesInOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertDataProperties(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetDataPropertiesInOntologyWhenNoInProgressCommit() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertDataProperties(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetDataPropertiesInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetDataPropertiesInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertDataProperties(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetDataPropertiesInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertDataProperties(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetDataPropertiesInOntologyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test add data property to ontology

    @Test
    public void testAddDataPropertyToOntology() {
        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-data-property");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddDataPropertyToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-data-property");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties")
                .request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete data property from ontology

    @Test
    public void testDeleteDataPropertyFromOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteDataPropertyFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/data-properties/"
                + encode(dataPropertyIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get named individuals in ontology

    @Test
    public void testGetNamedIndividualsInOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertIndividuals(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetNamedIndividualsInOntologyWhenNoInProgressCommit() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertIndividuals(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetNamedIndividualsInOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetNamedIndividualsInOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertIndividuals(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetNamedIndividualsInOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertIndividuals(JSONObject.fromObject(response.readEntity(String.class)));
    }

    @Test
    public void testGetNamedIndividualsInOntologyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test add named individual to ontology

    @Test
    public void testAddNamedIndividualToOntology() {
        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-named-individual");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals")
                .request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(true);
    }

    @Test
    public void testAddNamedIndividualToOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        JSONObject entity = new JSONObject();
        entity.put("@id", "http://matonto.org/new-named-individual");

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals")
                .request().post(Entity.json(entity));

        assertEquals(response.getStatus(), 200);
        assertAdditionsToInProgressCommit(false);
    }

    // Test delete named individual from ontology

    @Test
    public void testDeleteNamedIndividualFromOntology() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertDeletionsToInProgressCommit(false);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("commitId", commitId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue()).request()
                .delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).request().delete();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertDeletionsToInProgressCommit(true);
    }

    @Test
    public void testDeleteNamedIndividualFromOntologyWhenRetrieveOntologyIsEmpty() {
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/named-individuals/"
                + encode(individualIRI.stringValue())).queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue()).request().delete();

        assertEquals(response.getStatus(), 400);
    }

    // Test get IRIs in imported ontologies

    @Test
    public void testGetIRIsInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->{
            assertAnnotations(responseObject);
            assertClasses(responseObject);
            assertDatatypes(responseObject);
            assertObjectProperties(responseObject);
            assertDataProperties(responseObject);
            assertIndividuals(responseObject);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->{
            assertAnnotations(responseObject);
            assertClasses(responseObject);
            assertDatatypes(responseObject);
            assertObjectProperties(responseObject);
            assertDataProperties(responseObject);
            assertIndividuals(responseObject);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-iris")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetIRIsInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->{
            assertAnnotations(responseObject);
            assertClasses(responseObject);
            assertDatatypes(responseObject);
            assertObjectProperties(responseObject);
            assertDataProperties(responseObject);
            assertIndividuals(responseObject);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-iris")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), (responseObject) ->{
            assertAnnotations(responseObject);
            assertClasses(responseObject);
            assertDatatypes(responseObject);
            assertObjectProperties(responseObject);
            assertDataProperties(responseObject);
            assertIndividuals(responseObject);
        });
    }

    @Test
    public void testGetIRIsInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-iris")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get imports closure

    @Test
    public void testGetImportsClosure() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importedOntologyResults);
    }

    @Test
    public void testGetImportsClosureWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importedOntologyResults);
    }

    @Test
    public void testGetImportsClosureWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-ontologies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetImportsClosureMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importedOntologyResults);
    }

    @Test
    public void testGetImportsClosureMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-ontologies")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONArray.fromObject(response.readEntity(String.class)), importedOntologyResults);
    }

    @Test
    public void testGetImportsClosureWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-ontologies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get annotations in imported ontologies

    @Test
    public void testGetAnnotationsInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertAnnotations);
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertAnnotations);
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-annotations")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertAnnotations);
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-annotations")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertAnnotations);
    }

    @Test
    public void testGetAnnotationsInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-annotations")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get classes in imported ontologies

    @Test
    public void testGetClassesInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertClasses);
    }

    @Test
    public void testGetClassesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertClasses);
    }

    @Test
    public void testGetClassesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-classes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetClassesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertClasses);
    }

    @Test
    public void testGetClassesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-classes")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertClasses);
    }

    @Test
    public void testGetClassesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-classes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get datatypes in imported ontologies

    @Test
    public void testGetDatatypesInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertDatatypes);
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertDatatypes);
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-datatypes")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetDatatypesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertDatatypes);
    }

    @Test
    public void testGetDatatypesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-datatypes")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertDatatypes);
    }

    @Test
    public void testGetDatatypesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/imported-datatypes")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get object properties in imported ontologies

    @Test
    public void testGetObjectPropertiesInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertObjectProperties);
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertObjectProperties);
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-object-properties").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertObjectProperties);
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-object-properties").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertObjectProperties);
    }

    @Test
    public void testGetObjectPropertiesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-object-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get data properties in imported ontologies

    @Test
    public void testGetDataPropertiesInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertDataProperties);
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertDataProperties);
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-data-properties").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertDataProperties);
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesMissingBranchIdAndCommmitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-data-properties").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertDataProperties);
    }

    @Test
    public void testGetDataPropertiesInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-data-properties").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get named individuals in imported ontologies

    @Test
    public void testGetNamedIndividualsInImportedOntologies() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWithCommitIdMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-named-individuals").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-named-individuals").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertImportedOntologies(JSONArray.fromObject(response.readEntity(String.class)), this::assertIndividuals);
    }

    @Test
    public void testGetNamedIndividualsInImportedOntologiesWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/imported-named-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get ontology class hierarchy

    @Test
    public void testGetOntologyClassHierarchy() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())+ "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subClassesOfResult);
    }

    @Test
    public void testGetOntologyClassHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())+ "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subClassesOfResult);
    }

    @Test
    public void testGetOntologyClassHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())+ "/class-hierarchies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetOntologyClassHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())+ "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subClassesOfResult);
    }

    @Test
    public void testGetOntologyClassHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())+ "/class-hierarchies")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subClassesOfResult);
    }

    @Test
    public void testGetOntologyClassHierarchyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/class-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get ontology object property hierarchy

    @Test
    public void testGetOntologyObjectPropertyHierarchy() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subObjectPropertiesOfResult);
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subObjectPropertiesOfResult);
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/object-property-hierarchies").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subObjectPropertiesOfResult);
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/object-property-hierarchies").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subObjectPropertiesOfResult);
    }

    @Test
    public void testGetOntologyObjectPropertyHierarchyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/object-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get ontology data property hierarchy

    @Test
    public void testGetOntologyDataPropertyHierarchy() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subDatatypePropertiesOfResult);
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subDatatypePropertiesOfResult);
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/data-property-hierarchies").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subDatatypePropertiesOfResult);
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/data-property-hierarchies").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subDatatypePropertiesOfResult);
    }

    @Test
    public void testGetOntologyDataPropertyHierarchyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/data-property-hierarchies").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get concept hierarchy

    @Test
    public void testGetConceptHierarchy() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), conceptHierarchyResult);
    }

    @Test
    public void testGetConceptHierarchyWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), conceptHierarchyResult);
    }

    @Test
    public void testGetConceptHierarchyWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/concept-hierarchies")
                .queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetConceptHierarchyMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), conceptHierarchyResult);
    }

    @Test
    public void testGetConceptHierarchyMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/concept-hierarchies")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), conceptHierarchyResult);
    }

    @Test
    public void testGetConceptHierarchyWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/concept-hierarchies")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get classes with individuals

    @Test
    public void testGetClassesWithIndividuals() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subClassesOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subClassesOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/classes-with-individuals").queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetClassesWithIndividualsMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subClassesOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/classes-with-individuals").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), subClassesOfResult);
    }

    @Test
    public void testGetClassesWithIndividualsWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue())
                + "/classes-with-individuals").queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get entity usages

    @Test
    public void testGetEntityUsages() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("commitId", commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetEntityUsagesMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), entityUsagesResult);
    }

    @Test
    public void testGetEntityUsagesWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/entity-usages/"
                + encode(classId.stringValue())).queryParam("branchId", branchId.stringValue()).queryParam("commitId",
                commitId.stringValue()).request().get();

        assertEquals(response.getStatus(), 400);
    }

    // Test get search results

    @Test
    public void testGetSearchResults() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), searchResults);
    }

    @Test
    public void testGetSearchResultsWhenNoInProgressCommit() {
        setNoInProgressCommit();

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(false);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), searchResults);
    }

    @Test
    public void testGetSearchResultsWithNoMatches() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "nothing").request().get();

        assertEquals(response.getStatus(), 204);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class),
                any(Resource.class));
        assertGetOntology(true);
    }

    @Test
    public void testGetSearchResultsMissingSearchText() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue()).request()
                .get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetSearchResultsWithCommitIdAndMissingBranchId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/search-results")
                .queryParam("commitId", commitId.stringValue()).queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testGetSearchResultsMissingCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class), any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), searchResults);
    }

    @Test
    public void testGetSearchResultsMissingBranchIdAndCommitId() {
        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/search-results")
                .queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 200);
        verify(ontologyManager, times(1)).retrieveOntology(any(Resource.class));
        assertGetOntology(true);
        assertEquals(JSONObject.fromObject(response.readEntity(String.class)), searchResults);
    }

    @Test
    public void testGetSearchResultsWhenRetrieveOntologyIsEmpty() {
        reset(ontologyManager);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("ontologies/" + encode(ontologyIRI.stringValue()) + "/search-results")
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("searchText", "class").request().get();

        assertEquals(response.getStatus(), 400);
    }
}

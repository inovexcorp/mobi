package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.ontology.core.api.Hierarchy;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.classexpression.OClass;
import com.mobi.ontology.core.api.propertyexpression.DataProperty;
import com.mobi.ontology.core.api.propertyexpression.ObjectProperty;
import com.mobi.ontology.core.impl.owlapi.classexpression.SimpleClass;
import com.mobi.ontology.core.impl.owlapi.propertyExpression.SimpleDataProperty;
import com.mobi.ontology.core.impl.owlapi.propertyExpression.SimpleObjectProperty;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.persistence.utils.impl.SimpleBNodeService;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.BindingSet;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import com.mobi.vocabularies.xsd.XSD;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Statement;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class FullSimpleOntologyTest {
    private ValueFactory vf;
    private ModelFactory mf;
    private RepositoryManager repoManager = new SimpleRepositoryManager();
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
    private Ontology ontology;
    private Ontology ont1;
    private Ontology queryOntology;
    private Ontology queryVocabulary;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private OntologyId ontologyId;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private BNodeService bNodeService;

    @Before
    public void setUp() {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
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
        SimpleOntologyValues values = new SimpleOntologyValues();
        values.setValueFactory(vf);

        MockitoAnnotations.initMocks(this);

        when(transformer.mobiModel(any(Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameModel(any(com.mobi.rdf.api.Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, com.mobi.rdf.api.Model.class)));
        when(transformer.mobiStatement(any(Statement.class))).thenAnswer(i -> Values.mobiStatement(i.getArgumentAt(0, Statement.class)));

        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyId.getVersionIRI()).thenReturn(Optional.of(versionIRI));
        when(ontologyManager.createOntologyId(any(IRI.class), any(IRI.class))).thenReturn(ontologyId);
        when(ontologyManager.createOntologyId(any(IRI.class))).thenReturn(ontologyId);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());
        when(ontologyId.getOntologyIdentifier()).thenReturn(vf.createIRI("https://mobi.com/ontology-id"));

        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
        ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, true);
        Resource ont3IRI = vf.createIRI("http://mobi.com/ontology/test-local-imports-3");
        Resource ont3RecordIRI = vf.createIRI("https://mobi.com/record/test-local-imports-3");
        InputStream stream3 = this.getClass().getResourceAsStream("/test-local-imports-3.ttl");
        Ontology ont3 = new SimpleOntology(stream3, ontologyManager, transformer, bNodeService, repoManager, true);
        when(ontologyManager.getOntologyRecordResource(ont3IRI)).thenReturn(Optional.of(ont3RecordIRI));
        when(ontologyManager.retrieveOntology(ont3RecordIRI)).thenReturn(Optional.of(ont3));
        com.mobi.rdf.api.Model ont3Model = ont3.asModel(mf);
        when(ontologyManager.getOntologyModel(ont3RecordIRI)).thenReturn(ont3Model);

        Resource ont2IRI = vf.createIRI("http://mobi.com/ontology/test-local-imports-2");
        Resource ont2RecordIRI = vf.createIRI("https://mobi.com/record/test-local-imports-2");
        InputStream stream2 = this.getClass().getResourceAsStream("/test-local-imports-2.ttl");
        Ontology ont2 = new SimpleOntology(stream2, ontologyManager, transformer, bNodeService, repoManager, true);
        when(ontologyManager.getOntologyRecordResource(ont2IRI)).thenReturn(Optional.of(ont2RecordIRI));
        when(ontologyManager.retrieveOntology(ont2RecordIRI)).thenReturn(Optional.of(ont2));
        com.mobi.rdf.api.Model ont2Model = ont2.asModel(mf);
        when(ontologyManager.getOntologyModel(ont2RecordIRI)).thenReturn(ont2Model);

        InputStream stream1 = this.getClass().getResourceAsStream("/test-local-imports-1.ttl");
        ont1 = new SimpleOntology(stream1, ontologyManager, transformer, bNodeService, repoManager, true);

        InputStream streamQueryOntology = this.getClass().getResourceAsStream("/test-ontology.ttl");
        queryOntology = new SimpleOntology(streamQueryOntology, ontologyManager, transformer, bNodeService, repoManager, true);

        InputStream streamQueryVocabulary = this.getClass().getResourceAsStream("/test-vocabulary.ttl");
        queryVocabulary= new SimpleOntology(streamQueryVocabulary, ontologyManager, transformer, bNodeService, repoManager, true);

        values.setOntologyManager(ontologyManager);
        values.setTransformer(transformer);
    }

    @Test
    public void withAndWithoutImportsEqualsTest() throws Exception {
        InputStream stream = getClass().getResourceAsStream("/test-imports.owl");
        Ontology withImports = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, true);
        stream = getClass().getResourceAsStream("/test-imports.owl");
        Ontology withoutImports = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, false);
        assertEquals(withImports, withoutImports);
    }

    @Test
    public void getImportedOntologyIRIsTest() throws Exception {
        // Setup:
        InputStream stream = this.getClass().getResourceAsStream("/test-imports.owl");
        Ontology ont = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, true);

        Set<IRI> iris = ont.getImportedOntologyIRIs();
        assertEquals(2, iris.size());
        assertTrue(iris.contains(vf.createIRI("http://xmlns.com/foaf/0.1")));
    }

    /*@Test
    public void getImportsClosureFromStreamTest() throws Exception {
        // Setup:
        InputStream stream = this.getClass().getResourceAsStream("/test-imports.owl");
        Ontology ont = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, true);

        Set<Ontology> ontologies = ont.getImportsClosure();
        assertEquals(5, ontologies.size());
    }*/

    @Test
    public void getImportsClosureWithLocalImportsTest() throws Exception {
        Set<Ontology> ontologies = ont1.getImportsClosure();
        assertEquals(3, ontologies.size());
    }

    @Test
    public void getDataPropertyTest() throws Exception {
        Optional<DataProperty> optional = ontology.getDataProperty(dataProp1IRI);
        assertTrue(optional.isPresent());
        Assert.assertEquals(dataProp1IRI, optional.get().getIRI());
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

    @Test(expected = IllegalArgumentException.class)
    public void getMissingDataPropertyRangeTest() throws Exception {
        // Setup:
        DataProperty dataProperty = new SimpleDataProperty(errorIRI);

        ontology.getDataPropertyRange(dataProperty);
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

    @Test(expected = IllegalArgumentException.class)
    public void getMissingObjectPropertyRangeTest() throws Exception {
        // Setup:
        ObjectProperty objectProperty = new SimpleObjectProperty(errorIRI);

        ontology.getObjectPropertyRange(objectProperty);
    }

    @Test
    public void getObjectPropertyRangeWithNonClassTest() throws Exception {
        // Setup:
        ObjectProperty objectProperty = new SimpleObjectProperty(objectProp2IRI);

        Set<Resource> ranges = ontology.getObjectPropertyRange(objectProperty);
        assertEquals(1, ranges.size());
    }

    @Test
    public void getIndividualsOfTypeIRITest() throws Exception {
        Set<Individual> individuals = ontology.getIndividualsOfType(classIRI);
        assertEquals(1, individuals.size());
    }

    @Test
    public void getIndividualsOfSubClassTypeIRITest() throws Exception {
        Set<Individual> individuals = ontology.getIndividualsOfType(classIRIC);
        assertEquals(1, individuals.size());
    }

    @Test
    public void getIndividualsOfTypeTest() throws Exception {
        // Setup:
        OClass clazz = new SimpleClass(classIRI);

        Set<Individual> individuals = ontology.getIndividualsOfType(clazz);
        assertEquals(1, individuals.size());
    }

    @Test
    public void getIndividualsOfSubClassTypeTest() throws Exception {
        // Setup:
        OClass clazz = new SimpleClass(classIRIC);

        Set<Individual> individuals = ontology.getIndividualsOfType(clazz);
        assertEquals(1, individuals.size());
    }

    @Test
    public void containsClassTest() {
        assertTrue(ontology.containsClass(classIRI));
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
    public void getAllClassObjectPropertiesWithImportsTest() throws Exception {
        assertEquals(2, ont1.getAllClassObjectProperties(importedIRI0).size());
        assertEquals(2, ont1.getAllClassObjectProperties(importedIRI).size());
    }


    @Test(expected = IllegalArgumentException.class)
    public void getAllClassObjectPropertiesWhenMissingTest() throws Exception {
        ontology.getAllClassObjectProperties(errorIRI);
    }

    @Test
    public void getAllNoDomainObjectPropertiesTest() {
        assertEquals(1, ontology.getAllNoDomainObjectProperties().size());
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
    public void getAllClassDataPropertiesWithImportsTest() throws Exception {
        assertEquals(2, ont1.getAllClassDataProperties(importedIRI0).size());
        assertEquals(2, ont1.getAllClassDataProperties(importedIRI).size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void getAllClassDataPropertiesWhenMissingTest() throws Exception {
        ontology.getAllClassDataProperties(errorIRI);
    }

    @Test
    public void getAllNoDomainDataPropertiesTest() {
        assertEquals(1, ontology.getAllNoDomainDataProperties().size());
    }

    @Test
    public void getAllNoDomainDataPropertiesWithImportsTest() {
        assertEquals(1, ont1.getAllNoDomainDataProperties().size());
    }

    @Test
    public void asJsonldWithSkolemizeTest() throws Exception {
        // Setup
        SimpleBNodeService blankNodeService = Mockito.spy(new SimpleBNodeService());
        blankNodeService.setModelFactory(mf);
        blankNodeService.setValueFactory(vf);
        InputStream stream = this.getClass().getResourceAsStream("/list-ontology.ttl");
        InputStream expected = this.getClass().getResourceAsStream("/list-ontology-skolemize.jsonld");
        Ontology listOntology = new SimpleOntology(stream, ontologyManager, transformer, blankNodeService, repoManager, true);

        String jsonld = listOntology.asJsonLD(true).toString();
        assertEquals(removeWhitespace(replaceBlankNodeSuffix(IOUtils.toString(expected, Charset.defaultCharset()))), removeWhitespace(replaceBlankNodeSuffix(jsonld)));

        verify(blankNodeService).skolemize(any(com.mobi.rdf.api.Model.class));
    }

    @Test
    public void asJsonldWithoutSkolemizeTest() throws Exception {
        // Setup
        SimpleBNodeService blankNodeService = Mockito.spy(new SimpleBNodeService());
        blankNodeService.setModelFactory(mf);
        blankNodeService.setValueFactory(vf);
        InputStream stream = this.getClass().getResourceAsStream("/list-ontology.ttl");
        InputStream expected = this.getClass().getResourceAsStream("/list-ontology.jsonld");
        Ontology listOntology = new SimpleOntology(stream, ontologyManager, transformer, blankNodeService, repoManager, true);

        String jsonld = listOntology.asJsonLD(false).toString();
        assertEquals(removeWhitespace(IOUtils.toString(expected, Charset.defaultCharset()).replaceAll("_:node[a-zA-Z0-9]+\"", "\"")),
                removeWhitespace(jsonld.replaceAll("_:node[a-zA-Z0-9]+\"", "\"")));
        verify(blankNodeService, times(0)).skolemize(any(com.mobi.rdf.api.Model.class));
    }

    @Test
    public void testGetSubClassesOf() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#Class1a"), vf.createIRI("http://mobi.com/ontology#Class1b"),
                vf.createIRI("http://mobi.com/ontology#Class1c"), vf.createIRI("http://mobi.com/ontology#Class2a"), vf.createIRI("http://mobi.com/ontology#Class2b"),
                vf.createIRI("http://mobi.com/ontology#Class3a")).collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#Class1a", Collections.singleton("http://mobi.com/ontology#Class1b"));
        expectedParentMap.put("http://mobi.com/ontology#Class1b", Collections.singleton("http://mobi.com/ontology#Class1c"));
        expectedParentMap.put("http://mobi.com/ontology#Class2a", Collections.singleton("http://mobi.com/ontology#Class2b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#Class1b", Collections.singleton("http://mobi.com/ontology#Class1a"));
        expectedChildMap.put("http://mobi.com/ontology#Class1c", Collections.singleton("http://mobi.com/ontology#Class1b"));
        expectedChildMap.put("http://mobi.com/ontology#Class2b", Collections.singleton("http://mobi.com/ontology#Class2a"));

        Hierarchy result = queryOntology.getSubClassesOf(vf, mf);
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
    public void testGetSubDatatypePropertiesOf() throws Exception {
        // Setup:
        Set<Resource> expectedSubjects = Stream.of(vf.createIRI("http://mobi.com/ontology#dataProperty1a"), vf.createIRI("http://mobi.com/ontology#dataProperty1b"))
                .collect(Collectors.toSet());
        Map<String, Set<String>> expectedParentMap = new HashMap<>();
        expectedParentMap.put("http://mobi.com/ontology#dataProperty1a", Collections.singleton("http://mobi.com/ontology#dataProperty1b"));
        Map<String, Set<String>> expectedChildMap = new HashMap<>();
        expectedChildMap.put("http://mobi.com/ontology#dataProperty1b", Collections.singleton("http://mobi.com/ontology#dataProperty1a"));

        Hierarchy result = queryOntology.getSubDatatypePropertiesOf(vf, mf);
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

        Hierarchy result = queryOntology.getSubAnnotationPropertiesOf(vf, mf);
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

        Hierarchy result = queryOntology.getSubObjectPropertiesOf(vf, mf);
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

        Hierarchy result = queryOntology.getClassesWithIndividuals(vf, mf);
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
            Optional<Binding> optionalSubject = b.getBinding("s");
            if (optionalSubject.isPresent()) {
                String subject = optionalSubject.get().getValue().stringValue();
                assertTrue(subjects.contains(subject));
                subjects.remove(subject);
            }
            Optional<Binding> optionalPredicate = b.getBinding("p");
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
        com.mobi.rdf.api.Model expected = mf.createModel(Stream.of(vf.createStatement(class1b, subClassOf,
                class1a), vf.createStatement(individual1a, type, class1a)).collect(Collectors.toSet()));

        com.mobi.rdf.api.Model result = queryOntology.constructEntityUsages(class1a, mf);
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

        Hierarchy result = queryVocabulary.getConceptRelationships(vf, mf);
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

        Hierarchy result = queryVocabulary.getConceptSchemeRelationships(vf, mf);
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
                "http://mobi.com/ontology#Class1a").collect(Collectors.toSet());

        TupleQueryResult result = queryOntology.getSearchResults("class", vf);
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
        assertEquals(19, result.size());
    }

    @Test
    public void testGetGraphQueryResults() throws Exception {
        com.mobi.rdf.api.Model result = queryOntology.getGraphQueryResults("construct {?s ?p ?o} where { ?s ?p ?o . }", true, mf);
        assertEquals(queryOntology.asModel(mf).size(), result.size());
    }

    private String replaceBlankNodeSuffix(String s) {
        String s1 = s.replaceAll("/genid/genid[a-zA-Z0-9-]+\"", "\"");
        return s1.replaceAll("/genid/node[a-zA-Z0-9]+\"", "\"");
    }

    private String removeWhitespace(String s) {
        return s.replaceAll("\\s+", "");
    }
}

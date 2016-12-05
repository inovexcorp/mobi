package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.persistence.utils.Bindings;
import org.matonto.query.api.Binding;
import org.matonto.query.api.BindingSet;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.powermock.api.easymock.PowerMock;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.easymock.EasyMock.*;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.powermock.api.easymock.PowerMock.mockStatic;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyManagerTest {

    private SimpleOntologyManager manager;
    private ValueFactory valueFactory = SimpleValueFactory.getInstance();
    private ModelFactory modelFactory = LinkedHashModelFactory.getInstance();
    private SesameTransformer sesameTransformer;
    private CatalogManager catalogManager;
    private OntologyRecordFactory ontologyRecordFactory = new OntologyRecordFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private BranchFactory branchFactory = new BranchFactory();
    private CatalogFactory catalogFactory = new CatalogFactory();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private IRI missingIRI;
    private IRI recordIRI;
    private IRI branchIRI;
    private IRI commitIRI;
    private IRI catalogIRI;
    private IRI ontologyIRI;
    private IRI versionIRI;
    private org.semanticweb.owlapi.model.IRI owlOntologyIRI;
    private org.semanticweb.owlapi.model.IRI owlVersionIRI;
    private Ontology ontology;
    private Ontology vocabulary;

    @Before
    public void setUp() throws Exception {
        missingIRI = valueFactory.createIRI("http://matonto.org/missing");
        recordIRI = valueFactory.createIRI("http://matonto.org/record");
        branchIRI = valueFactory.createIRI("http://matonto.org/branch");
        commitIRI = valueFactory.createIRI("http://matonto.org/commit");
        catalogIRI = valueFactory.createIRI("http://matonto.org/catalog");
        ontologyIRI = valueFactory.createIRI("http://matonto.org/ontology");
        versionIRI = valueFactory.createIRI("http://matonto.org/ontology/1.0");
        owlOntologyIRI = org.semanticweb.owlapi.model.IRI.create("http://matonto.org/ontology");
        owlVersionIRI = org.semanticweb.owlapi.model.IRI.create("http://matonto.org/ontology/1.0");

        ontologyRecordFactory.setModelFactory(modelFactory);
        ontologyRecordFactory.setValueFactory(valueFactory);
        ontologyRecordFactory.setValueConverterRegistry(vcr);

        commitFactory.setModelFactory(modelFactory);
        commitFactory.setValueFactory(valueFactory);
        commitFactory.setValueConverterRegistry(vcr);

        branchFactory.setModelFactory(modelFactory);
        branchFactory.setValueFactory(valueFactory);
        branchFactory.setValueConverterRegistry(vcr);

        catalogFactory.setModelFactory(modelFactory);
        catalogFactory.setValueFactory(valueFactory);
        catalogFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(ontologyRecordFactory);
        vcr.registerValueConverter(commitFactory);
        vcr.registerValueConverter(branchFactory);
        vcr.registerValueConverter(catalogFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        Catalog catalog = catalogFactory.createNew(catalogIRI);

        catalogManager = mock(CatalogManager.class);
        expect(catalogManager.getLocalCatalog()).andReturn(catalog);
        sesameTransformer = mock(SesameTransformer.class);

        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        ontology = mock(Ontology.class);
        expect(ontology.asModel(modelFactory)).andReturn(Values.matontoModel(Rio.parse(testOntology, "",
                RDFFormat.TURTLE))).anyTimes();
        replay(ontology);

        InputStream testVocabulary = getClass().getResourceAsStream("/test-vocabulary.ttl");
        vocabulary = mock(Ontology.class);
        expect(vocabulary.asModel(modelFactory)).andReturn(Values.matontoModel(Rio.parse(testVocabulary, "",
                RDFFormat.TURTLE))).anyTimes();
        replay(vocabulary);

        mockStatic(SimpleOntologyValues.class);
        expect(SimpleOntologyValues.owlapiIRI(ontologyIRI)).andReturn(owlOntologyIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(versionIRI)).andReturn(owlVersionIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(owlOntologyIRI)).andReturn(ontologyIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(owlVersionIRI)).andReturn(versionIRI).anyTimes();
        expect(SimpleOntologyValues.matontoOntology(anyObject())).andReturn(ontology).anyTimes();
        PowerMock.replay(SimpleOntologyValues.class);

        manager = new SimpleOntologyManager();
        manager.setValueFactory(valueFactory);
        manager.setModelFactory(modelFactory);
        manager.setSesameTransformer(sesameTransformer);
        manager.setCatalogManager(catalogManager);
        manager.setOntologyRecordFactory(ontologyRecordFactory);
        manager.setCommitFactory(commitFactory);
        manager.setBranchFactory(branchFactory);
    }

    // Testing retrieveOntology(Resource ontologyId)

    @Test
    public void testRetrieveOntologyWithMissingIdentifier() {
        expect(catalogManager.getRecord(missingIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.empty());
        replay(catalogManager);

        Optional<Ontology> result = manager.retrieveOntology(missingIRI);
        assertFalse(result.isPresent());
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyWithMasterBranchNotSet() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The master Branch was not set on the OntologyRecord.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyWithMissingMasterBranch() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.empty());
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The master Branch could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyWithHeadCommitNotSet() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        Branch branch = branchFactory.createNew(branchIRI);

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The head Commit was not set on the master Branch.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyWhenCompiledResourceCannotBeFound() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCompiledResource(commitIRI)).andReturn(Optional.empty());
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The compiled resource could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test
    public void testRetrieveOntology() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        Model model = modelFactory.createModel();

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCompiledResource(commitIRI)).andReturn(Optional.of(model));
        replay(catalogManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
    }

    // Testing retrieveOntology(Resource ontologyId, Resource branchId)

    @Test
    public void testRetrieveOntologyUsingABranchWithMissingIdentifier() throws Exception {
        expect(catalogManager.getRecord(missingIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.empty());
        replay(catalogManager);

        Optional<Ontology> result = manager.retrieveOntology(missingIRI, branchIRI);
        assertFalse(result.isPresent());
    }

    @Test
    public void testRetrieveOntologyUsingABranchWithNoBranches() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        replay(catalogManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, missingIRI);
        assertFalse(optionalOntology.isPresent());
    }

    @Test
    public void testRetrieveOntologyUsingABranchNotForThisRecord() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        replay(catalogManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, missingIRI);
        assertFalse(optionalOntology.isPresent());
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyUsingABranchThatCannotBeRetrieved() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.empty());
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI, branchIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The identified Branch could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyUsingABranchWithHeadCommitNotSet() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI, branchIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The head Commit was not set on the Branch.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyUsingABranchWhenCompiledResourceCannotBeFound() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCompiledResource(commitIRI)).andReturn(Optional.empty());
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI, branchIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The compiled resource could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test
    public void testRetrieveOntologyUsingABranch() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        Model model = modelFactory.createModel();

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCompiledResource(commitIRI)).andReturn(Optional.of(model));
        replay(catalogManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
    }

    // Testing retrieveOntology(Resource ontologyId, Resource branchId, Resource commitId)

    @Test
    public void testRetrieveOntologyUsingACommitWithMissingIdentifier() throws Exception {
        expect(catalogManager.getRecord(missingIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.empty());
        replay(catalogManager);

        Optional<Ontology> result = manager.retrieveOntology(missingIRI, branchIRI, commitIRI);
        assertFalse(result.isPresent());
    }

    @Test
    public void testRetrieveOntologyUsingACommitWithNoBranches() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        replay(catalogManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertFalse(optionalOntology.isPresent());
    }

    @Test
    public void testRetrieveOntologyUsingACommitWithABranchNotForThisRecord() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        replay(catalogManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, missingIRI, commitIRI);
        assertFalse(optionalOntology.isPresent());
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyUsingACommitWithABranchThatCannotBeRetrieved() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.empty());
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The identified Branch could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyUsingACommitWithHeadCommitNotSetOnBranch() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The head Commit was not set on the Branch.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test
    public void testRetrieveOntologyUsingACommitNotPartOfTheBranch() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCommitChain(commitIRI)).andReturn(Stream.of(commitIRI).collect(Collectors.toList()));
        replay(catalogManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, missingIRI);
        assertFalse(optionalOntology.isPresent());
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyUsingACommitBotRetrievableButPartOfTheBranch() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCommitChain(commitIRI)).andReturn(Stream.of(commitIRI).collect(Collectors.toList()));
        expect(catalogManager.getCommit(commitIRI, commitFactory)).andReturn(Optional.empty());
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The identified Commit could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyUsingACommitWhenCompiledResourceCannotBeFound() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Commit commit = commitFactory.createNew(commitIRI);

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commit);

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCommitChain(commitIRI)).andReturn(Stream.of(commitIRI).collect(Collectors.toList()));
        expect(catalogManager.getCommit(commitIRI, commitFactory)).andReturn(Optional.of(commit));
        expect(catalogManager.getCompiledResource(commitIRI)).andReturn(Optional.empty());
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The compiled resource could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test
    public void testRetrieveOntologyUsingACommit() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Commit commit = commitFactory.createNew(commitIRI);

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commit);

        Model model = modelFactory.createModel();

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCommitChain(commitIRI)).andReturn(Stream.of(commitIRI).collect(Collectors.toList()));
        expect(catalogManager.getCommit(commitIRI, commitFactory)).andReturn(Optional.of(commit));
        expect(catalogManager.getCompiledResource(commitIRI)).andReturn(Optional.of(model));
        replay(catalogManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
    }

    // Testing deleteOntology(Resource ontologyId)

    @Test(expected = MatontoOntologyException.class)
    public void testDeleteMissingOntologyRecord() {
        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.empty());
        replay(catalogManager);

        try {
            manager.deleteOntology(recordIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "The OntologyRecord could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test
    public void testDeleteOntology() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        catalogManager.removeRecord(catalogIRI, recordIRI);
        expectLastCall().times(1);
        replay(catalogManager);

        manager.deleteOntology(recordIRI);
        verify(catalogManager);
    }

    @Test
    public void testGetSubClassesOf() throws Exception {
        Set<String> parents = Stream.of("http://matonto.org/ontology#Class2a", "http://matonto.org/ontology#Class2b",
                "http://matonto.org/ontology#Class1b", "http://matonto.org/ontology#Class1c",
                "http://matonto.org/ontology#Class1a").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://matonto.org/ontology#Class1b", "http://matonto.org/ontology#Class1c");
        children.put("http://matonto.org/ontology#Class1a", "http://matonto.org/ontology#Class1b");
        children.put("http://matonto.org/ontology#Class2a", "http://matonto.org/ontology#Class2b");

        Set<BindingSet> result = manager.getSubClassesOf(ontology);

        assertEquals(parents.size(), result.size());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetSubDatatypePropertiesOf() throws Exception {
        Set<String> parents = Stream.of("http://matonto.org/ontology#dataProperty1b",
                "http://matonto.org/ontology#dataProperty1a").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://matonto.org/ontology#dataProperty1a", "http://matonto.org/ontology#dataProperty1b");

        Set<BindingSet> result = manager.getSubDatatypePropertiesOf(ontology);

        assertEquals(parents.size(), result.size());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetSubObjectPropertiesOf() throws Exception {
        Set<String> parents = Stream.of("http://matonto.org/ontology#objectProperty1b",
                "http://matonto.org/ontology#objectProperty1a").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://matonto.org/ontology#objectProperty1a", "http://matonto.org/ontology#objectProperty1b");

        Set<BindingSet> result = manager.getSubObjectPropertiesOf(ontology);

        assertEquals(parents.size(), result.size());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetClassesWithIndividuals() throws Exception {
        Set<String> parents = Stream.of("http://matonto.org/ontology#Class2a", "http://matonto.org/ontology#Class2b",
                "http://matonto.org/ontology#Class1b", "http://matonto.org/ontology#Class1c",
                "http://matonto.org/ontology#Class1a").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://matonto.org/ontology#Class1b", "http://matonto.org/ontology#Class1c");
        children.put("http://matonto.org/ontology#Class1a", "http://matonto.org/ontology#Class1b");
        children.put("http://matonto.org/ontology#Class2a", "http://matonto.org/ontology#Class2b");

        Set<BindingSet> result = manager.getClassesWithIndividuals(ontology);

        assertEquals(parents.size(), result.size());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetEntityUsages() throws Exception {
        Set<String> subjects = Stream.of("http://matonto.org/ontology#Class1b",
                "http://matonto.org/ontology#Individual1a").collect(Collectors.toSet());
        Set<String> predicates = Stream.of("http://www.w3.org/2000/01/rdf-schema#subClassOf",
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type").collect(Collectors.toSet());

        Set<BindingSet> result = manager.getEntityUsages(ontology, "http://matonto.org/ontology#Class1a");

        assertEquals(subjects.size(), result.size());
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
    public void testGetConceptRelationships() throws Exception {
        Set<String> parents = Stream.of("https://matonto.org/vocabulary#Concept1",
                "https://matonto.org/vocabulary#Concept2").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("https://matonto.org/vocabulary#Concept1", "https://matonto.org/vocabulary#Concept2");

        Set<BindingSet> result = manager.getConceptRelationships(vocabulary);

        assertEquals(parents.size(), result.size());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetSearchResults() throws Exception {
        Set<String> entities = Stream.of("http://matonto.org/ontology#Class2a", "http://matonto.org/ontology#Class2b",
                "http://matonto.org/ontology#Class1b", "http://matonto.org/ontology#Class1c",
                "http://matonto.org/ontology#Class1a").collect(Collectors.toSet());

        Set<BindingSet> result = manager.getSearchResults(ontology, "class");

        assertEquals(entities.size(), result.size());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "entity").stringValue();
            assertTrue(entities.contains(parent));
            entities.remove(parent);
            assertEquals("http://www.w3.org/2002/07/owl#Class", Bindings.requiredResource(b, "type").stringValue());
        });
        assertEquals(0, entities.size());
    }
}

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
import org.matonto.query.TupleQueryResult;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.powermock.api.easymock.PowerMock;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.io.File;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.easymock.EasyMock.*;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.powermock.api.easymock.PowerMock.mockStatic;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyManagerTest {

    private SimpleOntologyManager manager;
    private ValueFactory valueFactory = SimpleValueFactory.getInstance();
    private ModelFactory modelFactory = LinkedHashModelFactory.getInstance();
    private SesameTransformer sesameTransformer;
    private CatalogManager catalogManager;
    private SimpleOntology simpleOntology;
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
        simpleOntology = createMockBuilder(SimpleOntology.class).createMock();

        mockStatic(SimpleOntologyValues.class);
        expect(SimpleOntologyValues.owlapiIRI(ontologyIRI)).andReturn(owlOntologyIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(versionIRI)).andReturn(owlVersionIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(owlOntologyIRI)).andReturn(ontologyIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(owlVersionIRI)).andReturn(versionIRI).anyTimes();
        PowerMock.replay(SimpleOntologyValues.class);

        manager = new SimpleOntologyManager();
        manager.setValueFactory(valueFactory);
        manager.setModelFactory(modelFactory);
        manager.setSesameTransformer(sesameTransformer);
        manager.setCatalogManager(catalogManager);
        manager.setOntologyRecordFactory(ontologyRecordFactory);
        manager.setCommitFactory(commitFactory);
        manager.setBranchFactory(branchFactory);

        File file = Paths.get(getClass().getResource("/test-ontology.ttl").toURI()).toFile();
        ontology = new SimpleOntology(file, manager);
    }

    /*@Test
    public void testCreateOntologyWithOntologyId() throws Exception {
        OntologyId ontologyId = new SimpleOntologyId.Builder(valueFactory).build();
        simpleOntology = createMockBuilder(SimpleOntology.class)
                .withConstructor(OntologyId.class, OntologyManager.class)
                .withArgs(ontologyId, manager)
                .createMock();
        replay(simpleOntology);

        manager.createOntology(ontologyId);
        verify(simpleOntology);
    }

    @Test
    public void testCreateOntologyWithFile() throws Exception {
        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();
        simpleOntology = createMockBuilder(SimpleOntology.class)
                .withConstructor(File.class, OntologyManager.class)
                .withArgs(file, manager)
                .createMock();
        replay(simpleOntology);

        manager.createOntology(file);
        verify(simpleOntology);
    }

    @Test
    public void testCreateOntologyWithIRI() throws Exception {
        IRI ontologyIRI = valueFactory.createIRI("http://matonto.org/ontology");
        simpleOntology = createMockBuilder(SimpleOntology.class)
                .withConstructor(IRI.class, OntologyManager.class)
                .withArgs(ontologyIRI, manager)
                .createMock();
        replay(simpleOntology);

        manager.createOntology(ontologyIRI);
        verify(simpleOntology);
    }*/

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

    /*@Test(expected = MatontoOntologyException.class)
    public void testRetrieveOntologyWithEmptyModel() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        Model model = modelFactory.createModel();

        expect(catalogManager.getRecord(recordIRI.stringValue(), ontologyRecordFactory)).andReturn(Optional.of(record));
        expect(catalogManager.getBranch(branchIRI, branchFactory)).andReturn(Optional.of(branch));
        expect(catalogManager.getCompiledResource(commitIRI)).andReturn(Optional.of(model));
        replay(catalogManager);

        try {
            manager.retrieveOntology(recordIRI);
        } catch (MatontoOntologyException e) {
            String expectedMessage = "Unable to create an ontology object.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }*/

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

    /*@Test
    public void testGetSubClassesOf() throws Exception {
        System.out.println("here");
        ontology.asModel(modelFactory).forEach(s -> System.out.println(s.getSubject() + " " + s.getPredicate() + " "
                + s.getObject()));
        TupleQueryResult result = manager.getSubClassesOf(ontology);
        result.forEach(b -> System.out.println(Bindings.requiredResource(b, "parent") + " "
                + Bindings.requiredResource(b, "child")));
    }*/
}

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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.ehcache.Cache;
import org.ehcache.config.builders.CacheConfigurationBuilder;
import org.ehcache.config.builders.CacheManagerBuilder;
import org.ehcache.config.builders.ResourcePoolsBuilder;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.cache.api.CacheManager;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.persistence.utils.Bindings;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.Binding;
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
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.impl.core.SimpleRepositoryManager;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.OWLOntology;

import java.io.InputStream;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyManagerTest {

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private SesameTransformer sesameTransformer;

    @Mock
    private Ontology ontology;

    @Mock
    private Ontology vocabulary;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache<String, Ontology> mockCache;

    private SimpleOntologyManager manager;
    private ValueFactory valueFactory = SimpleValueFactory.getInstance();
    private ModelFactory modelFactory = LinkedHashModelFactory.getInstance();
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
    private RepositoryManager repoManager = new SimpleRepositoryManager();

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

        MockitoAnnotations.initMocks(this);

        Catalog catalog = catalogFactory.createNew(catalogIRI);
        when(catalogManager.getLocalCatalogIRI()).thenReturn(catalogIRI);
        when(catalogManager.getLocalCatalog()).thenReturn(catalog);
        when(catalogManager.getRecord(catalogIRI, missingIRI, ontologyRecordFactory)).thenReturn(Optional.empty());

        when(sesameTransformer.sesameModel(any(Model.class))).thenReturn(new org.openrdf.model.impl.LinkedHashModel());

        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        when(ontology.asModel(modelFactory)).thenReturn(Values.matontoModel(Rio.parse(testOntology, "",
                RDFFormat.TURTLE)));

        InputStream testVocabulary = getClass().getResourceAsStream("/test-vocabulary.ttl");
        when(vocabulary.asModel(modelFactory)).thenReturn(Values.matontoModel(Rio.parse(testVocabulary, "",
                RDFFormat.TURTLE)));

        PowerMockito.mockStatic(SimpleOntologyValues.class);
        when(SimpleOntologyValues.owlapiIRI(ontologyIRI)).thenReturn(owlOntologyIRI);
        when(SimpleOntologyValues.owlapiIRI(versionIRI)).thenReturn(owlVersionIRI);
        when(SimpleOntologyValues.matontoIRI(owlOntologyIRI)).thenReturn(ontologyIRI);
        when(SimpleOntologyValues.matontoIRI(owlVersionIRI)).thenReturn(versionIRI);
        when(SimpleOntologyValues.matontoOntology(any(OWLOntology.class))).thenReturn(ontology);

        when(mockCache.containsKey(Mockito.anyString())).thenReturn(false);

        manager = new SimpleOntologyManager();
        manager.setValueFactory(valueFactory);
        manager.setModelFactory(modelFactory);
        manager.setSesameTransformer(sesameTransformer);
        manager.setCatalogManager(catalogManager);
        manager.setOntologyRecordFactory(ontologyRecordFactory);
        manager.setCommitFactory(commitFactory);
        manager.setBranchFactory(branchFactory);
        manager.setRepositoryManager(repoManager);
    }

    @Test
    public void testGetTransformer() throws Exception {
        SesameTransformer result = manager.getTransformer();
        assertEquals(sesameTransformer, result);
    }

    @Test
    public void testCreateOntology() throws Exception {
        Ontology result = manager.createOntology(modelFactory.createModel());
        assertEquals(ontology, result);
    }

    // Testing retrieveOntology(Resource recordId)

    @Test
    public void testRetrieveOntologyWithMissingIdentifier() {
        Optional<Ontology> result = manager.retrieveOntology(missingIRI);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyWithMasterBranchNotSet() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));

        manager.retrieveOntology(recordIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyWithMissingMasterBranch() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.empty());

        manager.retrieveOntology(recordIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyWithHeadCommitNotSet() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        Branch branch = branchFactory.createNew(branchIRI);

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));

        manager.retrieveOntology(recordIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyWhenCompiledResourceCannotBeFound() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.empty());

        manager.retrieveOntology(recordIRI);
    }

    @Test
    public void testRetrieveOntologyWithCacheMiss() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        Model model = modelFactory.createModel();

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.of(model));
        when(cacheManager.getCache(Mockito.anyString(), Mockito.eq(String.class), Mockito.eq(Ontology.class))).thenReturn(Optional.ofNullable(mockCache));

        manager.setCacheManager(cacheManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
        String key = OntologyManager.getOntologyCacheKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache, Mockito.times(0)).get(Mockito.matches(key));
        verify(mockCache).containsKey(Mockito.matches(key));
        verify(mockCache).put(Mockito.matches(key), Mockito.eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyWithCacheHit() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setMasterBranch(branchFactory.createNew(branchIRI));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        Model model = modelFactory.createModel();

        String key = OntologyManager.getOntologyCacheKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.of(model));
        when(cacheManager.getCache(Mockito.anyString(), Mockito.eq(String.class), Mockito.eq(Ontology.class))).thenReturn(Optional.ofNullable(mockCache));
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        manager.setCacheManager(cacheManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        verify(mockCache).get(Mockito.matches(key));
        verify(mockCache, Mockito.times(0)).put(Mockito.matches(key), Mockito.eq(optionalOntology.get()));
    }

    // Testing retrieveOntology(Resource recordId, Resource branchId)

    @Test
    public void testRetrieveOntologyUsingABranchWithMissingIdentifier() throws Exception {
        Optional<Ontology> result = manager.retrieveOntology(missingIRI, branchIRI);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingABranchWithNoBranches() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, missingIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingABranchNotForThisRecord() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingABranchThatCannotBeRetrieved() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.empty());

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingABranchWithHeadCommitNotSet() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingABranchWhenCompiledResourceCannotBeFound() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.empty());

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheMiss() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        Model model = modelFactory.createModel();

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.of(model));
        when(cacheManager.getCache(Mockito.anyString(), Mockito.eq(String.class), Mockito.eq(Ontology.class))).thenReturn(Optional.ofNullable(mockCache));

        manager.setCacheManager(cacheManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
        String key = OntologyManager.getOntologyCacheKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache, Mockito.times(0)).get(Mockito.matches(key));
        verify(mockCache).containsKey(Mockito.matches(key));
        verify(mockCache).put(Mockito.matches(key), Mockito.eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheHit() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        Model model = modelFactory.createModel();

        String key = OntologyManager.getOntologyCacheKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.of(model));
        when(cacheManager.getCache(Mockito.anyString(), Mockito.eq(String.class), Mockito.eq(Ontology.class))).thenReturn(Optional.ofNullable(mockCache));
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        manager.setCacheManager(cacheManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        verify(mockCache).get(Mockito.matches(key));
        verify(mockCache, Mockito.times(0)).put(Mockito.matches(key), Mockito.eq(optionalOntology.get()));
    }

    // Testing retrieveOntology(Resource recordId, Resource branchId, Resource commitId)

    @Test
    public void testRetrieveOntologyUsingACommitWithMissingIdentifier() throws Exception {
        Optional<Ontology> result = manager.retrieveOntology(missingIRI, branchIRI, commitIRI);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingACommitWithNoBranches() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingACommitWithABranchNotForThisRecord() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));

        manager.retrieveOntology(recordIRI, missingIRI, commitIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingACommitWithABranchThatCannotBeRetrieved() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.empty());

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingACommitWithHeadCommitNotSetOnBranch() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingACommitNotPartOfTheBranch() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCommitChain(commitIRI)).thenReturn(Stream.of(commitIRI).collect(Collectors.toList()));

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingACommitNotRetrievableButPartOfTheBranch() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCommitChain(commitIRI)).thenReturn(Stream.of(commitIRI).collect(Collectors.toList()));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.empty());

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingACommitWhenCompiledResourceCannotBeFound() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Commit commit = commitFactory.createNew(commitIRI);

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commit);

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCommitChain(commitIRI)).thenReturn(Stream.of(commitIRI).collect(Collectors.toList()));
        when(catalogManager.getCommit(commitIRI, commitFactory)).thenReturn(Optional.of(commit));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.empty());

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheMiss() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Commit commit = commitFactory.createNew(commitIRI);

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commit);

        Model model = modelFactory.createModel();

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCommitChain(commitIRI)).thenReturn(Stream.of(commitIRI).collect(Collectors.toList()));
        when(catalogManager.getCommit(commitIRI, commitFactory)).thenReturn(Optional.of(commit));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.of(model));
        when(cacheManager.getCache(Mockito.anyString(), Mockito.eq(String.class), Mockito.eq(Ontology.class))).thenReturn(Optional.ofNullable(mockCache));

        manager.setCacheManager(cacheManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
        String key = OntologyManager.getOntologyCacheKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache, Mockito.times(0)).get(Mockito.matches(key));
        verify(mockCache, Mockito.times(2)).containsKey(Mockito.matches(key));
        verify(mockCache).put(Mockito.matches(key), Mockito.eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheHit() {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);
        record.setBranch(Stream.of(branchFactory.createNew(branchIRI)).collect(Collectors.toSet()));

        Commit commit = commitFactory.createNew(commitIRI);

        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commit);

        Model model = modelFactory.createModel();

        String key = OntologyManager.getOntologyCacheKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.getBranch(branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCommitChain(commitIRI)).thenReturn(Stream.of(commitIRI).collect(Collectors.toList()));
        when(catalogManager.getCommit(commitIRI, commitFactory)).thenReturn(Optional.of(commit));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(Optional.of(model));
        when(cacheManager.getCache(Mockito.anyString(), Mockito.eq(String.class), Mockito.eq(Ontology.class))).thenReturn(Optional.ofNullable(mockCache));
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        manager.setCacheManager(cacheManager);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        verify(mockCache).get(Mockito.matches(key));
        verify(mockCache, Mockito.times(0)).put(Mockito.matches(key), Mockito.eq(optionalOntology.get()));
    }

    // Testing deleteOntology(Resource recordId)

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteMissingOntologyRecord() {
        doThrow(new MatOntoException("The Record could not be removed.")).when(catalogManager).removeRecord(catalogIRI, recordIRI);

        try {
            manager.deleteOntology(recordIRI);
        } catch (IllegalArgumentException e) {
            String expectedMessage = "The OntologyRecord could not be retrieved.";
            assertEquals(expectedMessage, e.getMessage());
            throw e;
        }
    }

    @Test
    public void testDeleteOntology() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        Cache<String, Ontology> testCache =  Mockito.spy(CacheManagerBuilder.newCacheManagerBuilder()
                .withCache("testCache",
                        CacheConfigurationBuilder.newCacheConfigurationBuilder(String.class, Ontology.class, ResourcePoolsBuilder.heap(100))
                                .build())
                .build(true).getCache("testCache", String.class, Ontology.class));

        testCache.put(recordIRI.stringValue(), ontology);
        verify(testCache).put(Mockito.any(), Mockito.any());

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(cacheManager.getCache(Mockito.anyString(), Mockito.eq(String.class), Mockito.eq(Ontology.class))).thenReturn(Optional.ofNullable(testCache));

        manager.setCacheManager(cacheManager);

        manager.deleteOntology(recordIRI);

        verify(catalogManager).removeRecord(catalogIRI, recordIRI);
        verify(testCache).remove(Mockito.anyString());
        verify(testCache).get(Mockito.anyString());
    }

    @Test
    public void testDeleteOntologyBranch() throws Exception {
        OntologyRecord record = ontologyRecordFactory.createNew(recordIRI);

        Cache<String, Ontology> testCache =  Mockito.spy(CacheManagerBuilder.newCacheManagerBuilder()
                .withCache("testCache",
                        CacheConfigurationBuilder.newCacheConfigurationBuilder(String.class, Ontology.class, ResourcePoolsBuilder.heap(100))
                                .build())
                .build(true).getCache("testCache", String.class, Ontology.class));

        testCache.put(OntologyManager.getOntologyCacheKey(recordIRI.stringValue(), branchIRI.stringValue(), ""), ontology);
        verify(testCache).put(Mockito.any(), Mockito.any());

        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(cacheManager.getCache(Mockito.anyString(), Mockito.eq(String.class), Mockito.eq(Ontology.class))).thenReturn(Optional.ofNullable(testCache));

        manager.setCacheManager(cacheManager);

        manager.deleteOntologyBranch(recordIRI, branchIRI);

        verify(catalogManager).removeBranch(branchIRI, recordIRI);
        verify(testCache, Mockito.atLeastOnce()).remove(Mockito.anyString());
        verify(testCache).get(Mockito.anyString());
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

        TupleQueryResult result = manager.getSubClassesOf(ontology);

        assertTrue(result.hasNext());
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

        TupleQueryResult result = manager.getSubDatatypePropertiesOf(ontology);

        assertTrue(result.hasNext());
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

        TupleQueryResult result = manager.getSubObjectPropertiesOf(ontology);

        assertTrue(result.hasNext());
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

        TupleQueryResult result = manager.getClassesWithIndividuals(ontology);

        assertTrue(result.hasNext());
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

        TupleQueryResult result = manager.getEntityUsages(ontology, valueFactory
                .createIRI("http://matonto.org/ontology#Class1a"));

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
        Resource class1b = valueFactory.createIRI("http://matonto.org/ontology#Class1b");
        IRI subClassOf = valueFactory.createIRI("http://www.w3.org/2000/01/rdf-schema#subClassOf");
        Resource class1a = valueFactory.createIRI("http://matonto.org/ontology#Class1a");
        Resource individual1a = valueFactory.createIRI("http://matonto.org/ontology#Individual1a");
        IRI type = valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
        Model expected = modelFactory.createModel(Stream.of(valueFactory.createStatement(class1b, subClassOf,
                class1a), valueFactory.createStatement(individual1a, type, class1a)).collect(Collectors.toSet()));

        Model result = manager.constructEntityUsages(ontology, class1a);

        assertTrue(result.equals(expected));
    }

    @Test
    public void testGetConceptRelationships() throws Exception {
        Set<String> parents = Stream.of("https://matonto.org/vocabulary#Concept1",
                "https://matonto.org/vocabulary#Concept2").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("https://matonto.org/vocabulary#Concept1", "https://matonto.org/vocabulary#Concept2");

        TupleQueryResult result = manager.getConceptRelationships(vocabulary);

        assertTrue(result.hasNext());
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

        TupleQueryResult result = manager.getSearchResults(ontology, "class");

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "entity").stringValue();
            assertTrue(entities.contains(parent));
            entities.remove(parent);
            assertEquals("http://www.w3.org/2002/07/owl#Class", Bindings.requiredResource(b, "type").stringValue());
        });
        assertEquals(0, entities.size());
    }
}

package com.mobi.cache.impl.repository.jcache;

/*-
 * #%L
 * com.mobi.cache.impl.repository
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyBoolean;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.impl.SimpleDatasetRepositoryConnection;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.cache.Cache;
import javax.cache.CacheManager;
import javax.cache.configuration.Configuration;

public class OntologyRepositoryCacheTest extends OrmEnabledTestCase {

    private ModelFactory mf;
    private ValueFactory vf;
    private Repository repo;
    private OntologyRepositoryCache cache;
    private OrmFactory<Dataset> datasetFactory = getRequiredOrmFactory(Dataset.class);

    private IRI timestampIRI;
    private Model ontNoImportsModel;
    private Model ontOneImportModel;
    private Model ontMultipleImportsModel;
    private Model import1Model;
    private Model import2Model;
    private Model import3Model;
    private IRI ontNoImportsIRI;
    private IRI ontOneImportIRI;
    private IRI ontMultipleImportsIRI;
    private IRI import1IRI;
    private IRI import2IRI;
    private IRI import3IRI;
    private IRI ontNoImportsSdNgIRI;
    private IRI ontOneImportSdNgIRI;
    private IRI ontMultipleImportsSdNgIRI;
    private IRI import1SdNgIRI;
    private IRI import2SdNgIRI;
    private IRI import3SdNgIRI;
    private String key1;
    private String key2;
    private String key3;

    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";

    @Mock
    private Ontology ontNoImports;

    @Mock
    private Ontology ontOneImport;

    @Mock
    private Ontology ontMultipleImports;

    @Mock
    private Ontology import1;

    @Mock
    private Ontology import2;

    @Mock
    private Ontology import3;

    @Mock
    private OntologyId ontIdNoImports;

    @Mock
    private OntologyId ontIdOneImport;

    @Mock
    private OntologyId ontIdMultipleImports;

    @Mock
    private OntologyId import1Id;

    @Mock
    private OntologyId import2Id;

    @Mock
    private OntologyId import3Id;

    @Mock
    private RepositoryConfig repositoryConfig;

    @Mock
    private SesameTransformer sesameTransformer;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private Configuration configuration;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);

        mf = getModelFactory();
        vf = getValueFactory();

        key1 = "record1&commit1";
        key2 = "record2&commit1";
        key3 = "record3&commit1";

        timestampIRI = vf.createIRI("http://mobi.com/ontologies/graph#lastAccessed");
        ontNoImportsIRI = vf.createIRI("urn:ontNoImports");
        ontOneImportIRI = vf.createIRI("urn:ontOneImport");
        ontMultipleImportsIRI = vf.createIRI("urn:ontIdMultipleImports");
        import1IRI = vf.createIRI("urn:import1");
        import2IRI = vf.createIRI("urn:import2");
        import3IRI = vf.createIRI("urn:import3");

        ontNoImportsSdNgIRI = vf.createIRI("urn:ontNoImports" + SYSTEM_DEFAULT_NG_SUFFIX);
        ontOneImportSdNgIRI = vf.createIRI("urn:ontOneImport" + SYSTEM_DEFAULT_NG_SUFFIX);
        ontMultipleImportsSdNgIRI = vf.createIRI("urn:ontIdMultipleImports" + SYSTEM_DEFAULT_NG_SUFFIX);
        import1SdNgIRI = vf.createIRI("urn:import1" + SYSTEM_DEFAULT_NG_SUFFIX);
        import2SdNgIRI = vf.createIRI("urn:import2" + SYSTEM_DEFAULT_NG_SUFFIX);
        import3SdNgIRI = vf.createIRI("urn:import3" + SYSTEM_DEFAULT_NG_SUFFIX);

        repo = spy(new SesameRepositoryWrapper(new SailRepository(new MemoryStore())));
        repo.initialize();
        when(repo.getConfig()).thenReturn(repositoryConfig);
        when(repositoryConfig.id()).thenReturn("repoCacheId");

        when(sesameTransformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(sesameTransformer.mobiIRI(any(org.eclipse.rdf4j.model.IRI.class))).thenAnswer(i -> Values.mobiIRI(i.getArgumentAt(0, org.eclipse.rdf4j.model.IRI.class)));
        when(sesameTransformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(sesameTransformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        ontNoImportsModel = Models.createModel(getClass().getResourceAsStream("/OntologyNoImports.ttl"), sesameTransformer);
        ontOneImportModel = Models.createModel(getClass().getResourceAsStream("/OntologyOneImport.ttl"), sesameTransformer);
        ontMultipleImportsModel = Models.createModel(getClass().getResourceAsStream("/OntologyMultipleImports.ttl"), sesameTransformer);
        import1Model = Models.createModel(getClass().getResourceAsStream("/Import1.ttl"), sesameTransformer);
        import2Model = Models.createModel(getClass().getResourceAsStream("/Import2.ttl"), sesameTransformer);
        import3Model = Models.createModel(getClass().getResourceAsStream("/Import3.ttl"), sesameTransformer);

        when(import1.asModel(any(ModelFactory.class))).thenReturn(import1Model);
        when(import1.getOntologyId()).thenReturn(import1Id);
        when(import1.getImportsClosure()).thenReturn(Collections.emptySet());
        when(import1Id.getOntologyIRI()).thenReturn(Optional.of(import1IRI));
        when(import1Id.getOntologyIdentifier()).thenReturn(import1IRI);

        when(import2.asModel(any(ModelFactory.class))).thenReturn(import2Model);
        when(import2.getOntologyId()).thenReturn(import2Id);
        when(import2.getImportsClosure()).thenReturn(Collections.emptySet());
        when(import2Id.getOntologyIRI()).thenReturn(Optional.of(import2IRI));
        when(import2Id.getOntologyIdentifier()).thenReturn(import2IRI);

        when(import3.asModel(any(ModelFactory.class))).thenReturn(import3Model);
        when(import3.getOntologyId()).thenReturn(import3Id);
        when(import3.getImportsClosure()).thenReturn(Collections.emptySet());
        when(import3Id.getOntologyIRI()).thenReturn(Optional.of(import3IRI));
        when(import3Id.getOntologyIdentifier()).thenReturn(import3IRI);
        
        when(ontNoImports.asModel(any(ModelFactory.class))).thenReturn(ontNoImportsModel);
        when(ontNoImports.getOntologyId()).thenReturn(ontIdNoImports);
        when(ontNoImports.getImportsClosure()).thenReturn(Collections.emptySet());
        when(ontIdNoImports.getOntologyIRI()).thenReturn(Optional.of(ontNoImportsIRI));
        when(ontIdNoImports.getOntologyIdentifier()).thenReturn(ontNoImportsIRI);

        when(ontOneImport.asModel(any(ModelFactory.class))).thenReturn(ontOneImportModel);
        when(ontOneImport.getOntologyId()).thenReturn(ontIdOneImport);
        when(ontOneImport.getImportsClosure()).thenReturn(Collections.singleton(import1));
        when(ontIdOneImport.getOntologyIRI()).thenReturn(Optional.of(ontOneImportIRI));
        when(ontIdOneImport.getOntologyIdentifier()).thenReturn(ontOneImportIRI);

        when(ontMultipleImports.asModel(any(ModelFactory.class))).thenReturn(ontMultipleImportsModel);
        when(ontMultipleImports.getOntologyId()).thenReturn(ontIdMultipleImports);
        when(ontMultipleImports.getImportsClosure()).thenReturn(Stream.of(import1, import2, import3).collect(Collectors.toSet()));
        when(ontIdMultipleImports.getOntologyIRI()).thenReturn(Optional.of(ontMultipleImportsIRI));
        when(ontIdMultipleImports.getOntologyIdentifier()).thenReturn(ontMultipleImportsIRI);

        when(ontologyManager.createOntology(eq(ontNoImportsModel))).thenReturn(ontNoImports);
        when(ontologyManager.createOntology(eq(ontOneImportModel))).thenReturn(ontOneImport);
        when(ontologyManager.createOntology(eq(ontMultipleImportsModel))).thenReturn(ontMultipleImports);

        ArgumentCaptor<Resource> resource = ArgumentCaptor.forClass(Resource.class);
        when(datasetManager.getConnection(resource.capture(), anyString(), anyBoolean())).thenAnswer(invocation -> new SimpleDatasetRepositoryConnection(repo.getConnection(), resource.getValue(), repositoryConfig.id(), vf));
        doNothing().when(datasetManager).safeDeleteDataset(any(Resource.class), anyString(), anyBoolean());
        ArgumentCaptor<String> datasetIRIStr = ArgumentCaptor.forClass(String.class);
        when(datasetManager.createDataset(datasetIRIStr.capture(), anyString())).thenAnswer(invocation -> {
            try (RepositoryConnection conn = repo.getConnection()) {
                Resource datasetIRI = vf.createIRI(datasetIRIStr.getValue());
                Dataset dataset = datasetFactory.createNew(datasetIRI);
                dataset.setSystemDefaultNamedGraph(vf.createIRI(datasetIRIStr.getValue() + SYSTEM_DEFAULT_NG_SUFFIX));
                conn.add(dataset.getModel(), datasetIRI);
            }
            return true;
        });

        cache = new OntologyRepositoryCache("Ontology Repository Cache", repo, cacheManager, configuration);
        injectOrmFactoryReferencesIntoService(cache);
        cache.setModelFactory(mf);
        cache.setValueFactory(vf);
        cache.setOntologyManager(ontologyManager);
        cache.setDatasetManager(datasetManager);
    }

    /* get() */

    @Test
    public void getDoesNotExistTest() {
        Ontology ontology = cache.get(key1);
        assertNull(ontology);
    }

    // TODO: Change get tests when Repository based Ontology is implemented
    @Test
    public void getNoImportsTest() throws Exception {
        cache.put(key1, ontNoImports);
        OffsetDateTime timestamp;
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), false)) {
            List<Statement> statements = RepositoryResults.asList(dc.getStatements(dc.getSystemDefaultNamedGraph(), timestampIRI, null, dc.getSystemDefaultNamedGraph()));
            assertEquals(1, statements.size());
            timestamp = OffsetDateTime.parse(statements.get(0).getObject().stringValue());
        }

        Thread.sleep(1000);
        Ontology ontology = cache.get(key1);
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), false)) {
            List<Statement> statements = RepositoryResults.asList(dc.getStatements(dc.getSystemDefaultNamedGraph(), timestampIRI, null, dc.getSystemDefaultNamedGraph()));
            assertEquals(1, statements.size());
            assertTrue(timestamp.isBefore(OffsetDateTime.parse(statements.get(0).getObject().stringValue())));
        }
        assertEquals(ontNoImports, ontology);
        verify(ontologyManager).createOntology(eq(ontNoImportsModel));
    }

    @Test
    public void getOneImportTest() throws Exception {
        cache.put(key2, ontOneImport);
        OffsetDateTime timestamp;
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2)), false)) {
            List<Statement> statements = RepositoryResults.asList(dc.getStatements(dc.getSystemDefaultNamedGraph(), timestampIRI, null, dc.getSystemDefaultNamedGraph()));
            assertEquals(1, statements.size());
            timestamp = OffsetDateTime.parse(statements.get(0).getObject().stringValue());
        }

        Thread.sleep(1000);
        Ontology ontology = cache.get(key2);
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2)), false)) {
            List<Statement> statements = RepositoryResults.asList(dc.getStatements(dc.getSystemDefaultNamedGraph(), timestampIRI, null, dc.getSystemDefaultNamedGraph()));
            assertEquals(1, statements.size());
            assertTrue(timestamp.isBefore(OffsetDateTime.parse(statements.get(0).getObject().stringValue())));
        }
        assertEquals(ontOneImport, ontology);
        verify(ontologyManager).createOntology(eq(ontOneImportModel));
    }

    @Test
    public void getMultipleImportsTest() throws Exception {
        cache.put(key3, ontMultipleImports);
        OffsetDateTime timestamp;
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3)), false)) {
            List<Statement> statements = RepositoryResults.asList(dc.getStatements(dc.getSystemDefaultNamedGraph(), timestampIRI, null, dc.getSystemDefaultNamedGraph()));
            assertEquals(1, statements.size());
            timestamp = OffsetDateTime.parse(statements.get(0).getObject().stringValue());
        }

        Thread.sleep(1000);
        Ontology ontology = cache.get(key3);
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3)), false)) {
            List<Statement> statements = RepositoryResults.asList(dc.getStatements(dc.getSystemDefaultNamedGraph(), timestampIRI, null, dc.getSystemDefaultNamedGraph()));
            assertEquals(1, statements.size());
            assertTrue(timestamp.isBefore(OffsetDateTime.parse(statements.get(0).getObject().stringValue())));
        }
        assertEquals(ontMultipleImports, ontology);
        verify(ontologyManager).createOntology(eq(ontMultipleImportsModel));
    }

    /* getAll() */

    @Test
    public void getAllKeysDoNotExistTest() {
        Map<String, Ontology> map = cache.getAll(Stream.of("wrongKey1", "wrongKey2").collect(Collectors.toSet()));
        assertEquals(0, map.size());
    }

    @Test
    public void getAllTest() {
        cache.put(key1, ontNoImports);
        cache.put(key2, ontOneImport);
        cache.put(key3, ontMultipleImports);
        Map<String, Ontology> map = cache.getAll(Stream.of(key1, key2, key3).collect(Collectors.toSet()));
        assertEquals(3, map.size());
        assertEquals(map.get(key1), ontNoImports);
        assertEquals(map.get(key2), ontOneImport);
        assertEquals(map.get(key3), ontMultipleImports);
    }

    @Test
    public void getAllOneKeyDoesNotExistTest() {
        cache.put(key1, ontNoImports);
        cache.put(key3, ontMultipleImports);
        Map<String, Ontology> map = cache.getAll(Stream.of(key1, "wrongKey1", key3).collect(Collectors.toSet()));
        assertEquals(2, map.size());
        assertEquals(map.get(key1), ontNoImports);
        assertEquals(map.get(key3), ontMultipleImports);
    }

    /* containsKey() */

    @Test
    public void containsKeyTest() {
        cache.put(key1, ontNoImports);
        assertTrue(cache.containsKey(key1));
    }

    @Test
    public void containsKeyDoesNotTest() {
        assertFalse(cache.containsKey(key1));
    }

    /* loadAll() */

    @Test(expected = UnsupportedOperationException.class)
    public void loadAllTest() {
        cache.loadAll(Collections.EMPTY_SET, false, null);
    }

    /* put() */

    @Test
    public void putNoImportsTest() {
        cache.put(key1, ontNoImports);
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), false)) {
            RepositoryResult<Statement> statements = dc.getStatements(null, null, null, dc.getSystemDefaultNamedGraph());
            Model ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), ontNoImportsModel.size());
            assertEquals(ontologyModel, ontNoImportsModel);
        }
    }

    @Test
    public void putOneImportsTest() {
        cache.put(key2, ontOneImport);
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2)), false)) {
            RepositoryResult<Statement> statements = dc.getStatements(null, null, null, dc.getSystemDefaultNamedGraph());
            Model ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), ontOneImportModel.size());
            assertEquals(ontologyModel, ontOneImportModel);

            statements = dc.getStatements(null, null, null, import1SdNgIRI);
            ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), import1Model.size());
            assertEquals(ontologyModel, import1Model);
        }
    }

    @Test
    public void putMultipleImportsTest() {
        cache.put(key3, ontMultipleImports);
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3)), false)) {
            RepositoryResult<Statement> statements = dc.getStatements(null, null, null, dc.getSystemDefaultNamedGraph());
            Model ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), ontMultipleImportsModel.size());
            assertEquals(ontologyModel, ontMultipleImportsModel);

            statements = dc.getStatements(null, null, null, import1SdNgIRI);
            ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), import1Model.size());
            assertEquals(ontologyModel, import1Model);

            statements = dc.getStatements(null, null, null, import2SdNgIRI);
            ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), import2Model.size());
            assertEquals(ontologyModel, import2Model);

            statements = dc.getStatements(null, null, null, import3SdNgIRI);
            ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), import3Model.size());
            assertEquals(ontologyModel, import3Model);
        }
    }

    @Test
    public void putOntWithSharedExternalImportTest() {
        cache.put(key3, ontMultipleImports);
        cache.put(key2, ontOneImport);
        try (RepositoryConnection connection = repo.getConnection()) {
            List<Resource> contexts = RepositoryResults.asList(connection.getContextIDs());
            assertEquals(7, contexts.size());
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3))));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2))));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3) + SYSTEM_DEFAULT_NG_SUFFIX)));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2) + SYSTEM_DEFAULT_NG_SUFFIX)));
            assertTrue(contexts.contains(import1SdNgIRI));
            assertTrue(contexts.contains(import2SdNgIRI));
            assertTrue(contexts.contains(import3SdNgIRI));
        }
    }

    /* getAndPut() */

    @Test(expected = UnsupportedOperationException.class)
    public void getAndPutTest() {
        cache.getAndPut(key1, ontNoImports);
    }

    /* putAll() */

    @Test
    public void putAllTest() {
        Map<String, Ontology> map = Stream.of(new Object[][] {
                {key1, ontNoImports},
                {key2, ontOneImport}
        }).collect(Collectors.toMap(x -> (String) x[0], x -> (Ontology) x[1]));
        cache.putAll(map);

        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), false)) {
            RepositoryResult<Statement> statements = dc.getStatements(null, null, null, dc.getSystemDefaultNamedGraph());
            Model ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), ontNoImportsModel.size());
            assertEquals(ontologyModel, ontNoImportsModel);
        }

        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2)), false)) {
            RepositoryResult<Statement> statements = dc.getStatements(null, null, null, dc.getSystemDefaultNamedGraph());
            Model ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), ontOneImportModel.size());
            assertEquals(ontologyModel, ontOneImportModel);

            statements = dc.getStatements(null, null, null, import1SdNgIRI);
            ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), import1Model.size());
            assertEquals(ontologyModel, import1Model);
        }
    }

    /* putIfAbsent() */

    @Test
    public void putIfAbsentIsAbsentTest() {
        assertTrue(cache.putIfAbsent(key1, ontNoImports));
    }

    @Test
    public void putIfAbsentIsNotAbsentTest() {
        cache.put(key1, ontNoImports);
        assertFalse(cache.putIfAbsent(key1, ontNoImports));
        assertFalse(cache.putIfAbsent(key1, ontMultipleImports));
    }

    /* remove() */

    @Test
    public void removeNoHitTest() {
        assertTrue(cache.remove(key1));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), repo.getConfig().id(), false);
    }

    @Test
    public void removeNoImportsTest() {
        cache.put(key1, ontNoImports);
        try (RepositoryConnection connection = repo.getConnection()) {
            List<Resource> contexts = RepositoryResults.asList(connection.getContextIDs());
            assertEquals(2, contexts.size());
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1))));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1) + SYSTEM_DEFAULT_NG_SUFFIX)));
        }

        assertTrue(cache.remove(key1));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), repo.getConfig().id(), false);
    }

    @Test
    public void removeOneImportsTest() {
        cache.put(key2, ontOneImport);
        try (RepositoryConnection connection = repo.getConnection()) {
            List<Resource> contexts = RepositoryResults.asList(connection.getContextIDs());
            assertEquals(3, contexts.size());
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2))));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2) + SYSTEM_DEFAULT_NG_SUFFIX)));
            assertTrue(contexts.contains(import1SdNgIRI));
        }

        assertTrue(cache.remove(key2));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2)), repo.getConfig().id(), false);
    }

    @Test
    public void removeMultipleImportsTest() {
        cache.put(key3, ontMultipleImports);
        try (RepositoryConnection connection = repo.getConnection()) {
            List<Resource> contexts = RepositoryResults.asList(connection.getContextIDs());
            assertEquals(5, contexts.size());
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3))));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3) + SYSTEM_DEFAULT_NG_SUFFIX)));
            assertTrue(contexts.contains(import1SdNgIRI));
            assertTrue(contexts.contains(import2SdNgIRI));
            assertTrue(contexts.contains(import3SdNgIRI));
        }

        assertTrue(cache.remove(key3));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3)), repo.getConfig().id(), false);
    }

    @Test
    public void removeOntWithSharedImportTest() {
        cache.put(key3, ontMultipleImports);
        cache.put(key2, ontOneImport);
        try (RepositoryConnection connection = repo.getConnection()) {
            List<Resource> contexts = RepositoryResults.asList(connection.getContextIDs());
            assertEquals(7, contexts.size());
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3))));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2))));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3) + SYSTEM_DEFAULT_NG_SUFFIX)));
            assertTrue(contexts.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2) + SYSTEM_DEFAULT_NG_SUFFIX)));
            assertTrue(contexts.contains(import1SdNgIRI));
            assertTrue(contexts.contains(import2SdNgIRI));
            assertTrue(contexts.contains(import3SdNgIRI));
        }

        assertTrue(cache.remove(key3));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3)), repo.getConfig().id(), false);
    }

    @Test
    public void removeOntologyDoesNotMatchTest() {
        cache.put(key1, ontNoImports);
        assertFalse(cache.remove(key1, ontMultipleImports));
    }

    @Test
    public void removeOntologyMatchesTest() {
        cache.put(key1, ontNoImports);
        assertTrue(cache.remove(key1, ontNoImports));
    }

    /* getAndRemove() */

    @Test(expected = UnsupportedOperationException.class)
    public void getAndRemoveTest() {
        cache.getAndRemove(key1);
    }

    /* replace() */

    @Test
    public void replaceTest() {
        cache.put(key1, ontNoImports);
        assertTrue(cache.replace(key1, ontOneImport));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), repo.getConfig().id(), false);
    }

    @Test
    public void replaceKeyDoesNotExistTest() {
        assertFalse(cache.replace(key1, ontOneImport));
    }

    @Test
    public void replaceMatchTest() {
        cache.put(key1, ontNoImports);
        assertTrue(cache.replace(key1, ontNoImports, ontOneImport));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), repo.getConfig().id(), false);
    }

    @Test
    public void replaceMismatchTest() {
        cache.put(key1, ontNoImports);
        assertFalse(cache.replace(key1, ontMultipleImports, ontOneImport));
        try (DatasetConnection dc = cache.getDatasetConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), false)) {
            RepositoryResult<Statement> statements = dc.getStatements(null, null, null, dc.getSystemDefaultNamedGraph());
            Model ontologyModel = RepositoryResults.asModelNoContext(statements, mf);
            ontologyModel.remove(null, timestampIRI, null);
            assertEquals(ontologyModel.size(), ontNoImportsModel.size());
            assertEquals(ontologyModel, ontNoImportsModel);
        }
    }

    @Test
    public void replaceMatchKeyDoesNotExistTest() {
        assertFalse(cache.replace(key1, ontOneImport, ontOneImport));
    }

    /* getAndReplace() */

    @Test(expected = UnsupportedOperationException.class)
    public void getAndReplaceTest() {
        cache.getAndRemove(key1);
    }

    /* removeAll() */

    @Test
    public void removeAllWithSetNotInCacheTest() {
        cache.removeAll(Stream.of(key1, key2).collect(Collectors.toSet()));
        try (RepositoryConnection connection = repo.getConnection()) {
            assertEquals(0, connection.size());
        }
    }

    @Test
    public void removeAllWithSetTest() {
        cache.put(key1, ontNoImports);
        cache.put(key2, ontOneImport);
        cache.removeAll(Stream.of(key1, key2).collect(Collectors.toSet()));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), repo.getConfig().id(), false);
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2)), repo.getConfig().id(), false);
    }

    @Test
    public void removeAllWithSetSharedImportTest() {
        cache.put(key2, ontOneImport);
        cache.put(key3, ontMultipleImports);
        cache.removeAll(Stream.of(key3, key2).collect(Collectors.toSet()));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2)), repo.getConfig().id(), false);
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key3)), repo.getConfig().id(), false);
    }

    @Test
    public void removeAllWithSetOneNotInCacheTest() {
        cache.put(key1, ontNoImports);
        cache.removeAll(Stream.of(key1, key2).collect(Collectors.toSet()));
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key1)), repo.getConfig().id(), false);
        verify(datasetManager).safeDeleteDataset(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(key2)), repo.getConfig().id(), false);
    }

    @Test
    public void removeAllTest() {
        cache.put(key1, ontNoImports);
        cache.put(key2, ontOneImport);
        cache.removeAll();
        try (RepositoryConnection connection = repo.getConnection()) {
            assertEquals(0, connection.size());
        }
    }

    /* clear() */

    @Test
    public void clearTest() {
        cache.put(key1, ontNoImports);
        cache.put(key2, ontOneImport);
        cache.clear();
        try (RepositoryConnection connection = repo.getConnection()) {
            assertEquals(0, connection.size());
        }
    }

    /* getConfiguration() */

    @Test
    public void getConfigurationTest() {
        assertEquals(configuration, cache.getConfiguration(Configuration.class));
    }

    /* invoke() */

    @Test(expected = UnsupportedOperationException.class)
    public void invokeTest() {
        cache.invoke(key1, null, null, null);
    }

    /* invokeAll() */

    @Test(expected = UnsupportedOperationException.class)
    public void invokeAllTest() {
        cache.invokeAll(null, null, null, null, null);
    }

    /* getName() */

    @Test
    public void getNameTest() {
        assertEquals("Ontology Repository Cache", cache.getName());
    }

    /* getCacheManager() */

    @Test
    public void getCacheManagerTest() {
        assertEquals(cacheManager, cache.getCacheManager());
    }

    /* close() */

    @Test
    public void closeTest() {
        cache.close();
        verify(cacheManager).destroyCache(anyString());
    }

    /* isClosed() */

    @Test
    public void isClosedTest() {
        assertEquals(false, cache.isClosed());
    }

    @Test
    public void isClosedClosedTest() {
        cache.close();
        assertEquals(true, cache.isClosed());
    }

    /* registerCacheEntryListener() */

    @Test(expected = UnsupportedOperationException.class)
    public void registerCacheEntryListenerTest() {
        cache.registerCacheEntryListener(null);
    }

    /* deregisterCacheEntryListener() */

    @Test(expected = UnsupportedOperationException.class)
    public void deregisterCacheEntryListenerTest() {
        cache.deregisterCacheEntryListener(null);
    }

    /* iterator() */

    @Test
    public void iteratorTest() {
        cache.put(key1, ontNoImports);
        cache.put(key2, ontOneImport);
        cache.put(key3, ontMultipleImports);
        Map<String, Ontology> map = new HashMap<>();
        for (Cache.Entry<String, Ontology> entry : cache) {
            map.put(entry.getKey(), entry.getValue());
        }

        assertEquals(ontNoImports, map.get(key1));
        assertEquals(ontOneImport, map.get(key2));
        assertEquals(ontMultipleImports, map.get(key3));
    }

    @Test
    public void iteratorEmptyTest() {
        Iterator it = cache.iterator();
        assertFalse(it.hasNext());
    }
}

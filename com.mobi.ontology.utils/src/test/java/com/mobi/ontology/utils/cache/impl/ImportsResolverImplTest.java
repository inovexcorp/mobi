package com.mobi.ontology.utils.cache.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
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
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyBoolean;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.impl.SimpleDatasetRepositoryConnection;
import com.mobi.dataset.ontology.dataset.Dataset;
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
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class ImportsResolverImplTest extends OrmEnabledTestCase {

    private ImportsResolverImpl resolver;
    private ModelFactory mf;
    private ValueFactory vf;
    private Repository repo;
    private IRI headCommitIRI;
    private IRI circularHeadCommitIRI;
    private IRI recordIRI;
    private IRI catalogIRI;
    private IRI ontologyIRI;
    private IRI circular1IRI;
    private IRI circular2IRI;
    private Model localModel;
    private Model circular1Model;
    private Model circular2Model;

    private OrmFactory<Dataset> datasetFactory = getRequiredOrmFactory(Dataset.class);

    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private RepositoryConfig repositoryConfig;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private Branch masterBranch;

    @Mock
    private Branch circularMasterBranch;

    @Mock
    private Catalog catalog;

    @Before
    public void setUp() throws Exception{
        MockitoAnnotations.initMocks(this);
        mf = getModelFactory();
        vf = getValueFactory();
        resolver = new ImportsResolverImpl();

        headCommitIRI = vf.createIRI("urn:headCommit");
        circularHeadCommitIRI = vf.createIRI("urn:circularHeadCommit");
        catalogIRI = vf.createIRI("urn:catalog");
        recordIRI = vf.createIRI("urn:recordIRI");
        ontologyIRI = vf.createIRI("urn:ontologyIRI");
        circular1IRI = vf.createIRI("https://mobi.com/ontologies/4/2019/OntologyCircular1");
        circular2IRI = vf.createIRI("https://mobi.com/ontologies/4/2019/OntologyCircular2");

        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(transformer.mobiIRI(any(org.eclipse.rdf4j.model.IRI.class))).thenAnswer(i -> Values.mobiIRI(i.getArgumentAt(0, org.eclipse.rdf4j.model.IRI.class)));
        when(transformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        localModel = Models.createModel(getClass().getResourceAsStream("/Ontology.ttl"), transformer);
        circular1Model = Models.createModel(getClass().getResourceAsStream("/OntologyCircular1.ttl"), transformer);
        circular2Model = Models.createModel(getClass().getResourceAsStream("/OntologyCircular2.ttl"), transformer);

        repo = spy(new SesameRepositoryWrapper(new SailRepository(new MemoryStore())));
        repo.initialize();
        when(repo.getConfig()).thenReturn(repositoryConfig);
        when(repositoryConfig.id()).thenReturn("repoCacheId");

        when(masterBranch.getHead_resource()).thenReturn(Optional.of(headCommitIRI));
        when(circularMasterBranch.getHead_resource()).thenReturn(Optional.of(circularHeadCommitIRI));
        when(catalog.getResource()).thenReturn(catalogIRI);

        when(catalogManager.getLocalCatalog()).thenReturn(catalog);
        when(catalogManager.getMasterBranch(eq(catalogIRI), eq(recordIRI))).thenReturn(masterBranch);
        when(catalogManager.getMasterBranch(eq(catalogIRI), eq(circular2IRI))).thenReturn(circularMasterBranch);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());
        when(ontologyManager.getOntologyRecordResource(eq(ontologyIRI))).thenReturn(Optional.of(recordIRI));
        when(ontologyManager.getOntologyRecordResource(eq(circular2IRI))).thenReturn(Optional.of(circular2IRI));
        when(ontologyManager.getOntologyRecordResource(eq(vf.createIRI("urn:localOntology")))).thenReturn(Optional.of(recordIRI));

        when(catalogManager.getCompiledResource(eq(headCommitIRI))).thenReturn(localModel);
        when(catalogManager.getCompiledResource(eq(circularHeadCommitIRI))).thenReturn(circular2Model);

        ArgumentCaptor<Resource> resource = ArgumentCaptor.forClass(Resource.class);
        when(datasetManager.getConnection(resource.capture(), anyString(), anyBoolean())).thenAnswer(invocation -> new SimpleDatasetRepositoryConnection(repo.getConnection(), resource.getValue(), repositoryConfig.id(), vf));
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
        resolver.setModelFactory(mf);
        resolver.setValueFactory(vf);
        resolver.setTransformer(transformer);
        resolver.setCatalogManager(catalogManager);
        resolver.setDatasetManager(datasetManager);
    }

    @Test
    public void retrieveOntologyFromWebTest() {
        // .rdf
        IRI rdf = vf.createIRI("http://www.w3.org/2004/02/skos/core");
        Optional<Model> rdfModel = resolver.retrieveOntologyFromWeb(rdf);
        assertTrue(rdfModel.isPresent());
        assertTrue(rdfModel.get().size() > 0);

        // .ttl
        IRI ttl = vf.createIRI("https://www.w3.org/2013/TurtleTests/Literal2");
        Optional<Model> ttlModel = resolver.retrieveOntologyFromWeb(ttl);
        assertTrue(ttlModel.isPresent());
        assertTrue(ttlModel.get().size() > 0);

        // .owl
        IRI owl = vf.createIRI("https://protege.stanford.edu/ontologies/pizza/pizza");
        Optional<Model> owlModel = resolver.retrieveOntologyFromWeb(owl);
        assertTrue(owlModel.isPresent());
        assertTrue(owlModel.get().size() > 0);

        // .jsonld
        IRI jsonld = vf.createIRI("https://raw.githubusercontent.com/GeoscienceAustralia/geosciml.org/master/resource/static/ontology/timescale/thors/w3c");
        Optional<Model> jsonldModel = resolver.retrieveOntologyFromWeb(jsonld);
        assertTrue(jsonldModel.isPresent());
        assertTrue(jsonldModel.get().size() > 0);

        // .trig
        IRI trig = vf.createIRI("https://www.w3.org/2013/TrigTests/IRI_subject");
        Optional<Model> trigModel = resolver.retrieveOntologyFromWeb(trig);
        assertTrue(trigModel.isPresent());
        assertTrue(trigModel.get().size() > 0);

        // .nq
        IRI nq = vf.createIRI("https://www.w3.org/2013/N-QuadsTests/literal");
        Optional<Model> nqModel = resolver.retrieveOntologyFromWeb(nq);
        assertTrue(nqModel.isPresent());
        assertTrue(nqModel.get().size() > 0);

        // .nt
        IRI nt = vf.createIRI("https://www.w3.org/2013/N-TriplesTests/literal");
        Optional<Model> ntModel = resolver.retrieveOntologyFromWeb(nt);
        assertTrue(ntModel.isPresent());
        assertTrue(ntModel.get().size() > 0);
    }

    @Test
    public void retrieveOntologyFromWebWithEndSlashTest() {
        // .rdf
        IRI rdf = vf.createIRI("http://www.w3.org/2004/02/skos/core/");
        Optional<Model> rdfModel = resolver.retrieveOntologyFromWeb(rdf);
        assertTrue(rdfModel.isPresent());
        assertTrue(rdfModel.get().size() > 0);
    }

    @Test
    public void retrieveOntologyFromWebFailureTest() {
        IRI failure = vf.createIRI("http://www.w3.org/2004/02/skos/core/INVALID/URL/");
        Optional<Model> failureModel = resolver.retrieveOntologyFromWeb(failure);
        assertFalse(failureModel.isPresent());
    }

    @Test
    public void retrieveOntologyLocalTest() {
        IRI iri = vf.createIRI("urn:localOntology");
        Optional<Model> local = resolver.retrieveOntologyLocal(iri, ontologyManager);
        assertTrue(local.isPresent());
        assertTrue(local.get().size() > 0);
    }

    @Test
    public void loadOntologyWithWebImportIntoCache() {
        Map<String, Set<Resource>> map = resolver.loadOntologyIntoCache(ontologyIRI, "record1&commit2", localModel, repo, ontologyManager);
        try (DatasetConnection conn = datasetManager.getConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode("record1&commit2")), repo.getConfig().id(), false)) {
            List<Resource> namedGraphs = RepositoryResults.asList(conn.getNamedGraphs());
            assertEquals(2, namedGraphs.size());
            assertTrue(namedGraphs.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode("record1&commit2" + SYSTEM_DEFAULT_NG_SUFFIX))));
            assertTrue(namedGraphs.contains(vf.createIRI("http://www.w3.org/2004/02/skos/core" + SYSTEM_DEFAULT_NG_SUFFIX)));
        }
        Set<Resource> closure = map.get("closure");
        assertEquals(2, closure.size());
        assertTrue(closure.contains(ontologyIRI));
        assertTrue(closure.contains(vf.createIRI("http://www.w3.org/2004/02/skos/core")));
        assertEquals(0, map.get("unresolved").size());
    }

    @Test
    public void loadOntologyWithBadWebImportIntoCache() {
        localModel.remove(null, vf.createIRI(OWL.IMPORTS.stringValue()), null);
        localModel.add(circular2IRI, vf.createIRI(OWL.IMPORTS.stringValue()), vf.createIRI("urn:importThatDoesNotResolve"));
        Map<String, Set<Resource>> map = resolver.loadOntologyIntoCache(ontologyIRI, "record1&commit2", localModel, repo, ontologyManager);
        try (DatasetConnection conn = datasetManager.getConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode("record1&commit2")), repo.getConfig().id(), false)) {
            List<Resource> namedGraphs = RepositoryResults.asList(conn.getNamedGraphs());
            assertEquals(1, namedGraphs.size());
            assertTrue(namedGraphs.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode("record1&commit2" + SYSTEM_DEFAULT_NG_SUFFIX))));
        }
        Set<Resource> closure = map.get("closure");
        assertEquals(2, closure.size());
        assertTrue(closure.contains(ontologyIRI));
        assertTrue(closure.contains(vf.createIRI("urn:importThatDoesNotResolve")));
        Set<Resource> unresolved = map.get("unresolved");
        assertEquals(1, unresolved.size());
        assertTrue(unresolved.contains(vf.createIRI("urn:importThatDoesNotResolve")));
    }

    @Test
    public void loadOntologyWithCircularImportIntoCache() {
        Map<String, Set<Resource>> map = resolver.loadOntologyIntoCache(circular1IRI, circular1IRI.stringValue() + "&commit3", circular1Model, repo, ontologyManager);
        try (DatasetConnection conn = datasetManager.getConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(circular1IRI.stringValue() + "&commit3")), repo.getConfig().id(), false)) {
            List<Resource> namedGraphs = RepositoryResults.asList(conn.getNamedGraphs());
            assertEquals(2, namedGraphs.size());
            assertTrue(namedGraphs.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(circular1IRI.stringValue() + "&commit3" + SYSTEM_DEFAULT_NG_SUFFIX))));
            assertTrue(namedGraphs.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode( circular2IRI.stringValue() + "&" + circularHeadCommitIRI.stringValue() + SYSTEM_DEFAULT_NG_SUFFIX))));
        }
        Set<Resource> closure = map.get("closure");
        assertEquals(2, closure.size());
        assertTrue(closure.contains(circular1IRI));
        assertTrue(closure.contains(circular2IRI));
        assertEquals(0, map.get("unresolved").size());
    }

    @Test
    public void loadOntologyWithCircularImportAndBadImportIntoCache() {
        circular2Model.add(circular2IRI, vf.createIRI(OWL.IMPORTS.stringValue()), vf.createIRI("urn:importThatDoesNotResolve"));
        Map<String, Set<Resource>> map = resolver.loadOntologyIntoCache(circular1IRI, circular1IRI.stringValue() + "&commit3", circular1Model, repo, ontologyManager);
        try (DatasetConnection conn = datasetManager.getConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(circular1IRI.stringValue() + "&commit3")), repo.getConfig().id(), false)) {
            List<Resource> namedGraphs = RepositoryResults.asList(conn.getNamedGraphs());
            assertEquals(2, namedGraphs.size());
            assertTrue(namedGraphs.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(circular1IRI.stringValue() + "&commit3" + SYSTEM_DEFAULT_NG_SUFFIX))));
            assertTrue(namedGraphs.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode( circular2IRI.stringValue() + "&" + circularHeadCommitIRI.stringValue() + SYSTEM_DEFAULT_NG_SUFFIX))));
        }
        Set<Resource> closure = map.get("closure");
        assertEquals(3, closure.size());
        assertTrue(closure.contains(circular1IRI));
        assertTrue(closure.contains(circular2IRI));
        assertTrue(closure.contains(vf.createIRI("urn:importThatDoesNotResolve")));
        Set<Resource> unresolved = map.get("unresolved");
        assertEquals(1, unresolved.size());
        assertTrue(unresolved.contains(vf.createIRI("urn:importThatDoesNotResolve")));
    }

    @Test
    public void loadOntologyWithoutKeyIntoCache() {
        IRI resource = vf.createIRI("urn:otherOnt");
        Map<String, Set<Resource>> map = resolver.loadOntologyIntoCache(resource, null, localModel, repo, ontologyManager);
        try (DatasetConnection conn = datasetManager.getConnection(resource, repo.getConfig().id(), false)) {
            List<Resource> namedGraphs = RepositoryResults.asList(conn.getNamedGraphs());
            assertEquals(2, namedGraphs.size());
            assertTrue(namedGraphs.contains(vf.createIRI(resource.stringValue() + SYSTEM_DEFAULT_NG_SUFFIX)));
            assertTrue(namedGraphs.contains(vf.createIRI("http://www.w3.org/2004/02/skos/core" + SYSTEM_DEFAULT_NG_SUFFIX)));
        }
        Set<Resource> closure = map.get("closure");
        assertEquals(2, closure.size());
        assertTrue(closure.contains(resource));
        assertTrue(closure.contains(vf.createIRI("http://www.w3.org/2004/02/skos/core")));
        assertEquals(0, map.get("unresolved").size());
    }

    @Test
    public void getDatasetIRITest() {
        IRI iri = resolver.getDatasetIRI(circular2IRI, ontologyManager);
        assertEquals(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode(circular2IRI.stringValue() + "&" + circularHeadCommitIRI.stringValue())), iri);
    }

    @Test
    public void getDatasetIRINoRecordTest() {
        IRI iri = resolver.getDatasetIRI(circular1IRI, ontologyManager);
        assertEquals(circular1IRI, iri);
    }
}

package com.mobi.ontology.utils.cache.impl;

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
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

public class CacheImportsResolverImplTest extends OrmEnabledTestCase {

    private CacheImportsResolverImpl resolver;
    private ModelFactory mf;
    private ValueFactory vf;
    private Repository repo;
    private IRI headCommitIRI;
    private IRI recordIRI;
    private IRI catalogIRI;
    private IRI ontologyIRI;
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
    private OntologyId ontologyId;

    @Mock
    private Branch masterBranch;

    @Mock
    private Catalog catalog;

    @Before
    public void setUp() throws Exception{
        MockitoAnnotations.initMocks(this);
        mf = getModelFactory();
        vf = getValueFactory();
        resolver = new CacheImportsResolverImpl();

        headCommitIRI = vf.createIRI("urn:headCommit");
        catalogIRI = vf.createIRI("urn:catalog");
        recordIRI = vf.createIRI("urn:recordIRI");
        ontologyIRI = vf.createIRI("urn:recordIRI");

        localModel = Models.createModel(getClass().getResourceAsStream("/Ontology.ttl"), transformer);
        circular1Model = Models.createModel(getClass().getResourceAsStream("/Circular1.ttl"), transformer);
        circular2Model = Models.createModel(getClass().getResourceAsStream("/Circular2.ttl"), transformer);

        repo = spy(new SesameRepositoryWrapper(new SailRepository(new MemoryStore())));
        repo.initialize();
        when(repo.getConfig()).thenReturn(repositoryConfig);
        when(repositoryConfig.id()).thenReturn("repoCacheId");

        when(masterBranch.getHead_resource()).thenReturn(Optional.of(headCommitIRI));
        when(catalog.getResource()).thenReturn(catalogIRI);

        when(catalogManager.getLocalCatalog()).thenReturn(catalog);
        when(catalogManager.getMasterBranch(eq(catalogIRI), eq(recordIRI))).thenReturn(masterBranch);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());
        when(ontologyManager.getOntologyRecordResource(eq(recordIRI))).thenReturn(Optional.of(recordIRI));
        when(ontologyManager.getOntologyRecordResource(eq(vf.createIRI("urn:localOntology")))).thenReturn(Optional.of(recordIRI));

        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(transformer.mobiIRI(any(org.eclipse.rdf4j.model.IRI.class))).thenAnswer(i -> Values.mobiIRI(i.getArgumentAt(0, org.eclipse.rdf4j.model.IRI.class)));
        when(transformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        when(catalogManager.getCompiledResource(eq(headCommitIRI))).thenReturn(localModel);
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyId.getOntologyIdentifier()).thenReturn(ontologyIRI);

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
    public void loadOntologyWithSkosImportIntoCache() {
        resolver.loadOntologyIntoCache(ontologyId, "record1&commit2", localModel, repo, ontologyManager);
        try (DatasetConnection conn = datasetManager.getConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode("record1&commit2")), repo.getConfig().id(), false)) {
            List<Resource> namedGraphs = RepositoryResults.asList(conn.getNamedGraphs());
            assertEquals(2, namedGraphs.size());
            assertTrue(namedGraphs.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode("record1&commit2" + SYSTEM_DEFAULT_NG_SUFFIX))));
            assertTrue(namedGraphs.contains(vf.createIRI("http://www.w3.org/2004/02/skos/core" + SYSTEM_DEFAULT_NG_SUFFIX)));
        }
    }

    @Test
    public void loadOntologyWithCircularImportIntoCache() {
        resolver.loadOntologyIntoCache(ontologyId, "record1&commit2", localModel, repo, ontologyManager);
//        try (DatasetConnection conn = datasetManager.getConnection(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode("record1&commit2")), repo.getConfig().id(), false)) {
//            List<Resource> namedGraphs = RepositoryResults.asList(conn.getNamedGraphs());
//            assertEquals(2, namedGraphs.size());
//            assertTrue(namedGraphs.contains(vf.createIRI("http://mobi.com/dataset/" + ResourceUtils.encode("record1&commit2" + SYSTEM_DEFAULT_NG_SUFFIX))));
//            assertTrue(namedGraphs.contains(vf.createIRI("http://www.w3.org/2004/02/skos/core" + SYSTEM_DEFAULT_NG_SUFFIX)));
//        }
    }
}

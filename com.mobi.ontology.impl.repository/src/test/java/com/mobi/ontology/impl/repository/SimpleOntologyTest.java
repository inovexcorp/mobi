package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
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

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyBoolean;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.impl.SimpleDatasetRepositoryConnection;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.cache.ImportsResolver;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

public class SimpleOntologyTest extends OrmEnabledTestCase {
    private ValueFactory vf;
    private ModelFactory mf;
    private Repository repo;
    private OrmFactory<Dataset> datasetFactory = getRequiredOrmFactory(Dataset.class);

    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private OntologyId ontologyId;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private BNodeService bNodeService;

    @Mock
    private RepositoryConfig repositoryConfig;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private ImportsResolver importsResolver;

    @Before
    public void setUp() {
        vf = getValueFactory();
        mf = getModelFactory();
        IRI ontologyIRI = vf.createIRI("http://test.com/ontology1");
        IRI versionIRI = vf.createIRI("http://test.com/ontology1/1.0.0");

        MockitoAnnotations.initMocks(this);

        repo = spy(new SesameRepositoryWrapper(new SailRepository(new MemoryStore())));
        repo.initialize();
        when(repo.getConfig()).thenReturn(repositoryConfig);
        when(repositoryConfig.id()).thenReturn("ontologyCache");

        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(transformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, com.mobi.rdf.api.Model.class)));
        when(transformer.sesameResource(any(Resource.class))).thenAnswer(i -> Values.sesameResource(i.getArgumentAt(0, Resource.class)));
        when(transformer.mobiStatement(any(Statement.class))).thenAnswer(i -> Values.mobiStatement(i.getArgumentAt(0, Statement.class)));

        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyId.getVersionIRI()).thenReturn(Optional.of(versionIRI));
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyId);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());
        when(ontologyId.getOntologyIdentifier()).thenReturn(vf.createIRI("https://mobi.com/ontology-id"));

//        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
//        ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, true, threadPool);
//        Resource ont3IRI = vf.createIRI("http://mobi.com/ontology/test-local-imports-3");
//        Resource ont3RecordIRI = vf.createIRI("https://mobi.com/record/test-local-imports-3");
//        InputStream stream3 = this.getClass().getResourceAsStream("/test-local-imports-3.ttl");
//        Ontology ont3 = new SimpleOntology(stream3, ontologyManager, transformer, bNodeService, repoManager, true, threadPool);
//        when(ontologyManager.getOntologyRecordResource(ont3IRI)).thenReturn(Optional.of(ont3RecordIRI));
//        when(ontologyManager.retrieveOntology(ont3RecordIRI)).thenReturn(Optional.of(ont3));
//        com.mobi.rdf.api.Model ont3Model = ont3.asModel(mf);
//        when(ontologyManager.getOntologyModel(ont3RecordIRI)).thenReturn(ont3Model);
//
//        Resource ont2IRI = vf.createIRI("http://mobi.com/ontology/test-local-imports-2");
//        Resource ont2RecordIRI = vf.createIRI("https://mobi.com/record/test-local-imports-2");
//        InputStream stream2 = this.getClass().getResourceAsStream("/test-local-imports-2.ttl");
//        Ontology ont2 = new SimpleOntology(stream2, ontologyManager, transformer, bNodeService, repoManager, true, threadPool);
//        when(ontologyManager.getOntologyRecordResource(ont2IRI)).thenReturn(Optional.of(ont2RecordIRI));
//        when(ontologyManager.retrieveOntology(ont2RecordIRI)).thenReturn(Optional.of(ont2));
//        com.mobi.rdf.api.Model ont2Model = ont2.asModel(mf);
//        when(ontologyManager.getOntologyModel(ont2RecordIRI)).thenReturn(ont2Model);
//
//        Resource dctermsIRI = vf.createIRI("http://purl.org/dc/terms/");
//        Resource dctermsRecordIRI = vf.createIRI("https://mobi.com/record/dcterms");
//        InputStream dctermsStream = this.getClass().getResourceAsStream("/dcterms.rdf");
//        Ontology dcterms = new SimpleOntology(dctermsStream, ontologyManager, transformer, bNodeService, repoManager, true, threadPool);
//        when(ontologyManager.getOntologyRecordResource(dctermsIRI)).thenReturn(Optional.of(dctermsRecordIRI));
//        when(ontologyManager.retrieveOntology(dctermsRecordIRI)).thenReturn(Optional.of(dcterms));
//        com.mobi.rdf.api.Model dctermsModel = dcterms.asModel(mf);
//        when(ontologyManager.getOntologyModel(dctermsRecordIRI)).thenReturn(dctermsModel);
//
//        InputStream stream1 = this.getClass().getResourceAsStream("/test-local-imports-1.ttl");
//        ont1 = new SimpleOntology(stream1, ontologyManager, transformer, bNodeService, repoManager, true, threadPool);
//
//        InputStream streamQueryOntology = this.getClass().getResourceAsStream("/test-ontology.ttl");
//        queryOntology = new SimpleOntology(streamQueryOntology, ontologyManager, transformer, bNodeService, repoManager, true, threadPool);
//
//        InputStream streamQueryVocabulary = this.getClass().getResourceAsStream("/test-vocabulary.ttl");
//        queryVocabulary= new SimpleOntology(streamQueryVocabulary, ontologyManager, transformer, bNodeService, repoManager, true, threadPool);
//
//        InputStream streamOnlyDeclared = this.getClass().getResourceAsStream("/only-declared.ttl");
//        onlyDeclared = new SimpleOntology(streamOnlyDeclared, ontologyManager, transformer, bNodeService, repoManager, true, threadPool);

        ArgumentCaptor<Resource> resource = ArgumentCaptor.forClass(Resource.class);
        when(datasetManager.getConnection(resource.capture(), anyString(), anyBoolean())).thenAnswer(invocation
                -> new SimpleDatasetRepositoryConnection(repo.getConnection(), resource.getValue(), repositoryConfig.id(), vf));
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
    }

//    @Test
//    public someTest() {
//        SimpleOntology(model, repo, ontologyManager, datasetManager, importsResolver, transformer, bNodeService, vf, mf);
//    }
}

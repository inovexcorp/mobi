package com.mobi.ontology.utils.imports.impl;

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

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.Optional;

public class ImportsResolverImplTest extends OrmEnabledTestCase {

    private ImportsResolverImpl resolver;
    private ModelFactory mf;
    private ValueFactory vf;
    private Repository repo;
    private IRI headCommitIRI;
    private IRI recordIRI;
    private IRI catalogIRI;
    private IRI ontologyIRI;
    private Model localModel;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private RepositoryConfig repositoryConfig;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private Branch masterBranch;

    @Mock
    private Catalog catalog;

    @Before
    public void setUp() throws Exception{
        MockitoAnnotations.initMocks(this);
        mf = getModelFactory();
        vf = getValueFactory();
        resolver = new ImportsResolverImpl();

        headCommitIRI = vf.createIRI("urn:headCommit");
        catalogIRI = vf.createIRI("urn:catalog");
        recordIRI = vf.createIRI("urn:recordIRI");
        ontologyIRI = vf.createIRI("urn:ontologyIRI");

        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(transformer.mobiIRI(any(org.eclipse.rdf4j.model.IRI.class))).thenAnswer(i -> Values.mobiIRI(i.getArgumentAt(0, org.eclipse.rdf4j.model.IRI.class)));
        when(transformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        localModel = Models.createModel(getClass().getResourceAsStream("/Ontology.ttl"), transformer);

        repo = spy(new SesameRepositoryWrapper(new SailRepository(new MemoryStore())));
        repo.initialize();
        when(repo.getConfig()).thenReturn(repositoryConfig);
        when(repositoryConfig.id()).thenReturn("repoCacheId");

        when(masterBranch.getHead_resource()).thenReturn(Optional.of(headCommitIRI));
        when(catalog.getResource()).thenReturn(catalogIRI);

        when(catalogManager.getLocalCatalog()).thenReturn(catalog);
        when(catalogManager.getMasterBranch(eq(catalogIRI), eq(recordIRI))).thenReturn(masterBranch);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());
        when(ontologyManager.getOntologyRecordResource(eq(ontologyIRI))).thenReturn(Optional.of(recordIRI));
        when(ontologyManager.getOntologyRecordResource(eq(vf.createIRI("urn:localOntology")))).thenReturn(Optional.of(recordIRI));

        when(catalogManager.getCompiledResource(eq(headCommitIRI))).thenReturn(localModel);

        resolver.setModelFactory(mf);
        resolver.setTransformer(transformer);
        resolver.setCatalogManager(catalogManager);
        resolver.activate(Collections.singletonMap("userAgent", "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:64.0) Gecko/20100101 Firefox/64.0"));
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
    public void retrieveOntologyFromWebWithExtensionTest() {
        IRI rdf = vf.createIRI("http://www.w3.org/2004/02/skos/core.rdf");
        Optional<Model> rdfModel = resolver.retrieveOntologyFromWeb(rdf);
        assertTrue(rdfModel.isPresent());
        assertTrue(rdfModel.get().size() > 0);
    }

    @Test
    public void retrieveOntologyFromWebRedirectTest() {
        IRI iri = vf.createIRI("http://purl.obolibrary.org/obo/bfo.owl");
        Optional<Model> rdfModel = resolver.retrieveOntologyFromWeb(iri);
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
}

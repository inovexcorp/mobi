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
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.config.CatalogConfigProvider;
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
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLStreamHandler;
import java.net.URLStreamHandlerFactory;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
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

    private static HttpUrlStreamHandler httpUrlStreamHandler;

    @Mock
    private CatalogConfigProvider configProvider;
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

    @BeforeClass
    public static void setupURLStreamHandlerFactory() {
        // Allows for mocking URL connections
        URLStreamHandlerFactory urlStreamHandlerFactory = mock(URLStreamHandlerFactory.class);
        URL.setURLStreamHandlerFactory(urlStreamHandlerFactory);

        httpUrlStreamHandler = new HttpUrlStreamHandler();
        when(urlStreamHandlerFactory.createURLStreamHandler("http")).thenReturn(httpUrlStreamHandler);
        when(urlStreamHandlerFactory.createURLStreamHandler("https")).thenReturn(httpUrlStreamHandler);
    }

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

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIRI);
        when(catalogManager.getMasterBranch(eq(catalogIRI), eq(recordIRI))).thenReturn(masterBranch);
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());
        when(ontologyManager.getOntologyRecordResource(eq(ontologyIRI))).thenReturn(Optional.of(recordIRI));
        when(ontologyManager.getOntologyRecordResource(eq(vf.createIRI("urn:localOntology")))).thenReturn(Optional.of(recordIRI));

        when(catalogManager.getCompiledResource(eq(headCommitIRI))).thenReturn(localModel);

        resolver.setModelFactory(mf);
        resolver.setTransformer(transformer);
        resolver.setCatalogConfigProvider(configProvider);
        resolver.setCatalogManager(catalogManager);
        resolver.activate(Collections.singletonMap("userAgent", "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:64.0) Gecko/20100101 Firefox/64.0"));
    }

    @After
    public void reset() {
        httpUrlStreamHandler.resetConnections();
    }

    @Test
    public void retrieveOntologyFromWebRdfTest() throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core";
        addMockConnections(url, getClass().getResourceAsStream("/skos.rdf"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebTtlTest() throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core";
        addMockConnections(url, getClass().getResourceAsStream("/skos.ttl"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebOwlTest() throws Exception {
        String url = "https://protege.stanford.edu/ontologies/pizza/pizza.owl";
        addMockConnections(url, getClass().getResourceAsStream("/pizza.owl"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebJsonLDTest() throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core";
        addMockConnections(url, getClass().getResourceAsStream("/skos.jsonld"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebTrigTest() throws Exception {
        String url = "http://www.w3.org/2013/TrigTests/IRI_subject";
        addMockConnections(url, getClass().getResourceAsStream("/IRI_subject.trig"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebNqTest() throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core";
        addMockConnections(url, getClass().getResourceAsStream("/output.nq"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebNtTest() throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core";
        addMockConnections(url, getClass().getResourceAsStream("/ResourceTypes.nt"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebWithEndSlashTest()  throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core";
        addMockConnections(url, getClass().getResourceAsStream("/skos.rdf"));
        assertModelFromWebPresent(url + "/");
    }

    @Test
    public void retrieveOntologyFromWebWithExtensionTest() throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core.rdf";
        addMockConnections(url, getClass().getResourceAsStream("/skos.rdf"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebWithWrongExtensionTest() throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core.bleh";
        HttpURLConnection connection = getMockConnection();
        when(connection.getInputStream()).thenReturn(new ByteArrayInputStream("invalid rdf".getBytes()));
        httpUrlStreamHandler.addConnection(new URL(url), connection);
        assertModelFromWebEmpty(url);
    }

    @Test
    public void retrieveOntologyFromWebRedirectProtocolTest() throws Exception {
        String url = "http://protege.stanford.edu/ontologies/pizza/pizza.owl";

        HttpURLConnection connection = getMockConnection();
        when(connection.getResponseCode()).thenReturn(HttpURLConnection.HTTP_MOVED_PERM);
        when(connection.getHeaderField("Location")).thenReturn("https://protege.stanford.edu/ontologies/pizza/pizza.owl");
        httpUrlStreamHandler.addConnection(new URL(url), connection);

        addMockConnections("https://protege.stanford.edu/ontologies/pizza/pizza.owl", getClass().getResourceAsStream("/pizza.owl"));
        assertModelFromWebPresent(url);
    }

    @Test
    public void retrieveOntologyFromWebFailureTest() throws Exception {
        String url = "http://www.w3.org/2004/02/skos/core/INVALID/URL";
        HttpURLConnection connection = getMockConnection();
        when(connection.getInputStream()).thenReturn(new ByteArrayInputStream("invalid rdf".getBytes()));
        httpUrlStreamHandler.addConnection(new URL(url), connection);
        assertModelFromWebEmpty(url);    }

    @Test
    public void retrieveOntologyLocalTest() {
        IRI iri = vf.createIRI("urn:localOntology");
        Optional<Model> local = resolver.retrieveOntologyLocal(iri, ontologyManager);
        assertTrue(local.isPresent());
        assertTrue(local.get().size() > 0);
    }

    @Test
    public void retrieveOntologyLocalDoesNotExistTest() {
        IRI iri = vf.createIRI("urn:localOntology1");
        Optional<Model> local = resolver.retrieveOntologyLocal(iri, ontologyManager);
        assertFalse(local.isPresent());
    }

    @Test
    public void retrieveOntologyLocalMasterDoesNotExistTest() {
        when(masterBranch.getHead_resource()).thenReturn(Optional.empty());

        IRI iri = vf.createIRI("urn:localOntology");
        Optional<Model> local = resolver.retrieveOntologyLocal(iri, ontologyManager);
        assertFalse(local.isPresent());
    }

    private void assertModelFromWebPresent(String url) {
        IRI iri = vf.createIRI(url);
        Optional<Model> model = resolver.retrieveOntologyFromWeb(iri);
        assertTrue(model.isPresent());
        assertTrue(model.get().size() > 0);
    }

    private void assertModelFromWebEmpty(String url) {
        IRI iri = vf.createIRI(url);
        Optional<Model> model = resolver.retrieveOntologyFromWeb(iri);
        assertFalse(model.isPresent());
    }

    /**
     * Adds mock connection that returns the inputstream for the provided URL
     * @param url the URL to create mock connections for
     * @param inputStream the inputStream to return for the 200 connection
     */
    private void addMockConnections(String url, InputStream inputStream) throws Exception {
        HttpURLConnection httpURLConnection = getMockConnection();
        when(httpURLConnection.getInputStream()).thenReturn(inputStream);
        when(httpURLConnection.getResponseCode()).thenReturn(200);
        httpUrlStreamHandler.addConnection(new URL(url), httpURLConnection);
    }

    private HttpURLConnection getMockConnection() throws Exception {
        HttpURLConnection urlConnection = mock(HttpURLConnection.class);
        doNothing().when(urlConnection).setRequestMethod(anyString());
        doNothing().when(urlConnection).setRequestProperty(anyString(), anyString());
        doNothing().when(urlConnection).setConnectTimeout(anyInt());
        return urlConnection;
    }

    /**
     * {@link URLStreamHandler} that allows us to control the {@link URLConnection URLConnections} that are returned
     * by {@link URL URLs} in the code under test.
     */
    public static class HttpUrlStreamHandler extends URLStreamHandler {

        private Map<String, HttpURLConnection> connections = new HashMap<>();

        @Override
        protected HttpURLConnection openConnection(URL url) {
            try {
                return connections.get(url.toURI().toString());
            } catch (URISyntaxException e) {
                return null;
            }
        }

        public void resetConnections() {
            connections = new HashMap();
        }

        public HttpUrlStreamHandler addConnection(URL url, HttpURLConnection urlConnection) throws URISyntaxException {
            connections.put(url.toURI().toString(), urlConnection);
            return this;
        }
    }
}

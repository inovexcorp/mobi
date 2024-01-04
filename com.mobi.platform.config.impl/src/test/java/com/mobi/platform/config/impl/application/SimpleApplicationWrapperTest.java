package com.mobi.platform.config.impl.application;

/*-
 * #%L
 * com.mobi.platform.config.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.platform.config.api.application.ApplicationConfig;
import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class SimpleApplicationWrapperTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleApplicationWrapper wrapper;
    private MemoryRepositoryWrapper repo;

    @Mock
    private ApplicationConfig config;

    private String namespace = "http://mobi.com/applications#";

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        wrapper = new SimpleApplicationWrapper();
        injectOrmFactoryReferencesIntoService(wrapper);
        wrapper.repository = repo;
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void validateConfigTest() throws Exception {
        // Setup:
        when(config.id()).thenReturn("id");
        when(config.title()).thenReturn("Title");

        wrapper.validateConfig(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateConfigWithNoTitle() {
        // Setup:
        when(config.id()).thenReturn("id");
        when(config.title()).thenReturn("");

        wrapper.validateConfig(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateConfigWithInvalidId() {
        // Setup:
        when(config.id()).thenReturn("$@ ^");
        when(config.title()).thenReturn("Title");

        wrapper.validateConfig(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateConfigWithNoId() {
        // Setup:
        when(config.id()).thenReturn("");
        when(config.title()).thenReturn("Title");

        wrapper.validateConfig(config);
    }

    @Test
    public void startTest() throws Exception {
        // Setup:
        when(config.id()).thenReturn("id");
        when(config.title()).thenReturn("Title");
        when(config.description()).thenReturn("Description");

        wrapper.start(config);
        assertEquals(config.id(), wrapper.applicationId);
        RepositoryConnection conn = repo.getConnection();
        Model appModel = MODEL_FACTORY.createEmptyModel();
        Resource appIri = VALUE_FACTORY.createIRI(namespace + config.id());
        conn.getStatements(appIri, null, null).forEach(appModel::add);
        assertFalse(appModel.isEmpty());
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE)));
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()),
                VALUE_FACTORY.createLiteral(config.title())));
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(DCTERMS.DESCRIPTION.stringValue()),
                VALUE_FACTORY.createLiteral(config.description())));
        conn.close();
    }

    @Test
    public void stopTest() throws Exception {
        // Setup:
        wrapper.applicationId = "id";
        RepositoryConnection conn = repo.getConnection();
        conn.add(VALUE_FACTORY.createIRI(namespace + "id"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE));

        wrapper.stop();
        assertFalse(ConnectionUtils.contains(conn, VALUE_FACTORY.createIRI(namespace + "id"), null, null));
        conn.close();
    }

    @Test
    public void modifiedTest() throws Exception {
        // Setup:
        wrapper.applicationId = "id";
        RepositoryConnection conn = repo.getConnection();
        conn.add(VALUE_FACTORY.createIRI(namespace + "id"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE));
        when(config.id()).thenReturn("new");
        when(config.title()).thenReturn("Title");
        when(config.description()).thenReturn("Description");

        wrapper.modified(config);
        assertFalse(ConnectionUtils.contains(conn, VALUE_FACTORY.createIRI(namespace + "id"), null, null));
        assertEquals(config.id(), wrapper.applicationId);
        Resource appIri = VALUE_FACTORY.createIRI(namespace + config.id());
        Model appModel = MODEL_FACTORY.createEmptyModel();
        conn.getStatements(appIri, null, null).forEach(appModel::add);
        assertFalse(appModel.isEmpty());
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE)));
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()),
                VALUE_FACTORY.createLiteral(config.title().toString())));
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(DCTERMS.DESCRIPTION.stringValue()),
                VALUE_FACTORY.createLiteral(config.description())));
        conn.close();
    }

    @Test
    public void getIdTest() throws Exception {
        wrapper.applicationId = "id";

        String result = wrapper.getId();
        assertEquals(wrapper.applicationId, result);
    }

    @Test
    public void getApplicationTest() throws Exception {
        wrapper.applicationId = "id";
        RepositoryConnection conn = repo.getConnection();
        conn.add(VALUE_FACTORY.createIRI(namespace + "id"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE));

        Application app = wrapper.getApplication();
        assertNotEquals(app, null);
        assertTrue(app.getModel().contains(VALUE_FACTORY.createIRI(namespace + "id"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE)));
    }
}

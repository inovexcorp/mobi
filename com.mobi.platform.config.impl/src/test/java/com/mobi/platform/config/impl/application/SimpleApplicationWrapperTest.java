package com.mobi.platform.config.impl.application;

/*-
 * #%L
 * com.mobi.platform.config.impl
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
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

public class SimpleApplicationWrapperTest extends OrmEnabledTestCase {
    private SimpleApplicationWrapper wrapper;
    private Repository repo;

    private String namespace = "http://mobi.com/applications#";

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        wrapper = new SimpleApplicationWrapper();
        injectOrmFactoryReferencesIntoService(wrapper);
        wrapper.setRepository(repo);
        wrapper.setFactory(VALUE_FACTORY);
        wrapper.setModelFactory(MODEL_FACTORY);
    }

    @Test
    public void validateConfigTest() throws Exception {
        // Setup:
        Map<String, Object> props = new HashMap<>();
        props.put("id", "id");
        props.put("title", "Title");

        wrapper.validateConfig(props);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateConfigWithNoTitle() {
        // Setup:
        Map<String, Object> props = new HashMap<>();
        props.put("id", "id");
        props.put("title", "");

        wrapper.validateConfig(props);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateConfigWithInvalidId() {
        // Setup:
        Map<String, Object> props = new HashMap<>();
        props.put("id", "$@ ^");
        props.put("title", "Title");

        wrapper.validateConfig(props);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateConfigWithNoId() {
        // Setup:
        Map<String, Object> props = new HashMap<>();
        props.put("id", "");
        props.put("title", "Title");

        wrapper.validateConfig(props);
    }

    @Test
    public void startTest() throws Exception {
        // Setup:
        Map<String, Object> props = new HashMap<>();
        props.put("id", "id");
        props.put("title", "Title");
        props.put("description", "Description");

        wrapper.start(props);
        assertEquals(props.get("id").toString(), wrapper.applicationId);
        RepositoryConnection conn = repo.getConnection();
        Model appModel = MODEL_FACTORY.createModel();
        Resource appIri = VALUE_FACTORY.createIRI(namespace + props.get("id"));
        conn.getStatements(appIri, null, null).forEach(appModel::add);
        assertFalse(appModel.isEmpty());
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE)));
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()),
                VALUE_FACTORY.createLiteral(props.get("title").toString())));
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(DCTERMS.DESCRIPTION.stringValue()),
                VALUE_FACTORY.createLiteral(props.get("description").toString())));
        conn.close();
    }

    @Test
    public void stopTest() throws Exception {
        // Setup:
        wrapper.applicationId = "id";
        RepositoryConnection conn = repo.getConnection();
        conn.add(VALUE_FACTORY.createIRI(namespace + "id"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE));

        wrapper.stop();
        assertFalse(conn.getStatements(VALUE_FACTORY.createIRI(namespace + "id"), null, null).hasNext());
        conn.close();
    }

    @Test
    public void modifiedTest() throws Exception {
        // Setup:
        wrapper.applicationId = "id";
        RepositoryConnection conn = repo.getConnection();
        conn.add(VALUE_FACTORY.createIRI(namespace + "id"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE));
        Map<String, Object> props = new HashMap<>();
        props.put("id", "new");
        props.put("title", "Title");
        props.put("description", "Description");

        wrapper.modified(props);
        assertFalse(conn.getStatements(VALUE_FACTORY.createIRI(namespace + "id"), null, null).hasNext());
        assertEquals(props.get("id").toString(), wrapper.applicationId);
        Resource appIri = VALUE_FACTORY.createIRI(namespace + props.get("id"));
        Model appModel = MODEL_FACTORY.createModel();
        conn.getStatements(appIri, null, null).forEach(appModel::add);
        assertFalse(appModel.isEmpty());
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(Application.TYPE)));
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()),
                VALUE_FACTORY.createLiteral(props.get("title").toString())));
        assertTrue(appModel.contains(appIri, VALUE_FACTORY.createIRI(DCTERMS.DESCRIPTION.stringValue()),
                VALUE_FACTORY.createLiteral(props.get("description").toString())));
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

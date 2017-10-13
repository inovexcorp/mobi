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

import org.junit.Before;
import org.junit.Test;
import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import com.mobi.platform.config.api.ontologies.platformconfig.ApplicationFactory;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

public class SimpleApplicationWrapperTest {
    private SimpleApplicationWrapper wrapper;
    private Repository repo;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private ApplicationFactory applicationFactory = new ApplicationFactory();

    private String namespace = "http://mobi.com/applications#";

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        applicationFactory.setValueFactory(vf);
        applicationFactory.setModelFactory(mf);
        applicationFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(applicationFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        wrapper = new SimpleApplicationWrapper();
        wrapper.setRepository(repo);
        wrapper.setFactory(vf);
        wrapper.setModelFactory(mf);
        wrapper.setAppFactory(applicationFactory);
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
    public void validateConfigWithExistingIdTest() {
        // Setup:
        Map<String, Object> props = new HashMap<>();
        props.put("id", "id");
        props.put("title", "Title");
        RepositoryConnection conn = repo.getConnection();
        conn.add(vf.createIRI(namespace + "id"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(Application.TYPE));
        conn.close();

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
        Model appModel = mf.createModel();
        Resource appIri = vf.createIRI(namespace + props.get("id"));
        conn.getStatements(appIri, null, null).forEach(appModel::add);
        assertFalse(appModel.isEmpty());
        assertTrue(appModel.contains(appIri, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(Application.TYPE)));
        assertTrue(appModel.contains(appIri, vf.createIRI(DCTERMS.TITLE.stringValue()),
                vf.createLiteral(props.get("title").toString())));
        assertTrue(appModel.contains(appIri, vf.createIRI(DCTERMS.DESCRIPTION.stringValue()),
                vf.createLiteral(props.get("description").toString())));
        conn.close();
    }

    @Test
    public void stopTest() throws Exception {
        // Setup:
        wrapper.applicationId = "id";
        RepositoryConnection conn = repo.getConnection();
        conn.add(vf.createIRI(namespace + "id"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(Application.TYPE));

        wrapper.stop();
        assertFalse(conn.getStatements(vf.createIRI(namespace + "id"), null, null).hasNext());
        conn.close();
    }

    @Test
    public void modifiedTest() throws Exception {
        // Setup:
        wrapper.applicationId = "id";
        RepositoryConnection conn = repo.getConnection();
        conn.add(vf.createIRI(namespace + "id"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(Application.TYPE));
        Map<String, Object> props = new HashMap<>();
        props.put("id", "new");
        props.put("title", "Title");
        props.put("description", "Description");

        wrapper.modified(props);
        assertFalse(conn.getStatements(vf.createIRI(namespace + "id"), null, null).hasNext());
        assertEquals(props.get("id").toString(), wrapper.applicationId);
        Resource appIri = vf.createIRI(namespace + props.get("id"));
        Model appModel = mf.createModel();
        conn.getStatements(appIri, null, null).forEach(appModel::add);
        assertFalse(appModel.isEmpty());
        assertTrue(appModel.contains(appIri, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(Application.TYPE)));
        assertTrue(appModel.contains(appIri, vf.createIRI(DCTERMS.TITLE.stringValue()),
                vf.createLiteral(props.get("title").toString())));
        assertTrue(appModel.contains(appIri, vf.createIRI(DCTERMS.DESCRIPTION.stringValue()),
                vf.createLiteral(props.get("description").toString())));
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
        conn.add(vf.createIRI(namespace + "id"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(Application.TYPE));

        Application app = wrapper.getApplication();
        assertNotEquals(app, null);
        assertTrue(app.getModel().contains(vf.createIRI(namespace + "id"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(Application.TYPE)));
    }
}

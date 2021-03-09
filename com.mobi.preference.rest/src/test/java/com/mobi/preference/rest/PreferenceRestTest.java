package com.mobi.preference.rest;

/*-
 * #%L
 * com.mobi.preference.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import static com.mobi.persistence.utils.ResourceUtils.encode;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.PreferenceImpl;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Matchers;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;

public class PreferenceRestTest extends MobiRestTestNg {

    private PreferenceRest rest;
    private OrmFactory<User> userFactory;

    @Mock
    private EngineManager engineManager;

    @Mock
    private PreferenceService preferenceService;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private OrmFactoryRegistry factoryRegistry;

    @Mock
    private Client client;

    @Mock
    private Invocation.Builder builder;

    @Mock
    private WebTarget webTarget;

    ValueFactory vf;

    private User user;
    private String simplePreferenceJson;
    private String complexPreferenceJson;

    private interface TestComplexPreference extends Thing, Preference {
        String TYPE = "http://example.com/ExampleComplexPreference";
    }

    static class TestComplexPreferenceImpl extends PreferenceImpl implements TestComplexPreference, Thing, Preference {

        public TestComplexPreferenceImpl(Resource subjectIri, Model backingModel, ValueFactory valueFactory,
                                         ValueConverterRegistry valueConverterRegistry) {
            super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
        }
    }

    private interface TestSimplePreference extends Thing, Preference {
        String TYPE = "http://example.com/ExampleSimplePreference";
    }

    static class TestSimplePreferenceImpl extends PreferenceImpl implements TestSimplePreference, Thing, Preference {

        public TestSimplePreferenceImpl(Resource subjectIri, Model backingModel, ValueFactory valueFactory, ValueConverterRegistry valueConverterRegistry) {
            super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
        }
    }

    @Mock
    private OrmFactory<TestComplexPreference> testComplexPreferenceFactory;

    @Mock
    private OrmFactory<TestSimplePreference> testSimplePreferenceFactory;


    @Override
    protected Application configureApp() throws Exception {
        userFactory = getRequiredOrmFactory(User.class);
        vf = getValueFactory();
        user = userFactory.createNew(vf.createIRI("http://test.org/" + UsernameTestFilter.USERNAME));
        rest = spy(new PreferenceRest());
        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }
//
    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }
//
    @BeforeMethod
    public void setUpMocks() throws Exception {
        MockitoAnnotations.initMocks(this);

        user = userFactory.createNew(vf.createIRI("http://test.com/user"));
        InputStream firstInputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        InputStream secondInputStream = getClass().getResourceAsStream("/complexPreference.ttl");

        Model simplePrefModel = Values.mobiModel(Rio.parse(firstInputStream, "", RDFFormat.TURTLE));
        Model complexPrefModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));

        TestSimplePreference simplePreference = new TestSimplePreferenceImpl(vf.createIRI("http://example.com/MySimplePreference"), simplePrefModel, vf, null);
        TestComplexPreference complexPreference = new TestComplexPreferenceImpl(vf.createIRI("http://example.com/MyComplexPreference"), complexPrefModel, vf, null);
        Set<Preference>  preferenceSet = new HashSet<>();
        preferenceSet.add(simplePreference);
        preferenceSet.add(complexPreference);

        simplePreferenceJson = IOUtils.toString(getClass().getResourceAsStream("/simplePreference.json"), StandardCharsets.UTF_8);
        complexPreferenceJson = IOUtils.toString(getClass().getResourceAsStream("/complexPreference.json"), StandardCharsets.UTF_8);

        when(preferenceService.getUserPreferences(any())).thenReturn(preferenceSet);
        when(testComplexPreferenceFactory.getTypeIRI()).thenReturn(vf.createIRI(TestComplexPreference.TYPE));
        when(testComplexPreferenceFactory.getExisting(complexPreference.getResource(), complexPrefModel)).thenReturn(Optional.of(complexPreference));
        when(testComplexPreferenceFactory.getExisting(simplePreference.getResource(), simplePrefModel)).thenReturn(Optional.empty());
        when(testComplexPreferenceFactory.getAllExisting(complexPrefModel)).thenReturn(Collections.singleton(complexPreference));
        when(testComplexPreferenceFactory.getAllExisting(simplePrefModel)).thenReturn(Collections.emptySet());
        when(testSimplePreferenceFactory.getExisting(simplePreference.getResource(), simplePrefModel)).thenReturn(Optional.of(simplePreference));
        when(testSimplePreferenceFactory.getExisting(complexPreference.getResource(), complexPrefModel)).thenReturn(Optional.empty());
        when(testSimplePreferenceFactory.getAllExisting(simplePrefModel)).thenReturn(Collections.singleton(simplePreference));
        when(testSimplePreferenceFactory.getAllExisting(complexPrefModel)).thenReturn(Collections.emptySet());
        when(testSimplePreferenceFactory.getTypeIRI()).thenReturn(vf.createIRI(TestSimplePreference.TYPE));
        when(factoryRegistry.getFactoryOfType(TestSimplePreference.TYPE)).thenReturn(Optional.ofNullable(testSimplePreferenceFactory));
        when(factoryRegistry.getFactoryOfType(TestComplexPreference.TYPE)).thenReturn(Optional.ofNullable(testComplexPreferenceFactory));
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(UsernameTestFilter.USERNAME)).thenReturn(Optional.of(user));
        when(client.target(any(String.class))).thenReturn(webTarget);
        when(client.register(any())).thenReturn(client);
        when(webTarget.queryParam(anyString(), Matchers.<Object>anyVararg())).thenReturn(webTarget);
        when(webTarget.request()).thenReturn(builder);
        when(builder.header(any(), any())).thenReturn(builder);
        when(builder.property(any(), any())).thenReturn(builder);
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(transformer.sesameModel(any(com.mobi.rdf.api.Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, com.mobi.rdf.api.Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        rest.engineManager = engineManager;
        rest.transformer = transformer;
        rest.factoryRegistry = factoryRegistry;
        rest.preferenceService = preferenceService;
        rest.vf = vf;
    }

    @Test
    public void getPreferencesWithNoneTest() throws Exception {
        when(preferenceService.getUserPreferences(any())).thenReturn(new HashSet<>());
        Response response = target().path("preference").request().get();
        assertEquals(200, response.getStatus());
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertEquals(0, result.size());
    }

    @Test
    public void getUserPreferencesTest() throws Exception {
        Response response = target().path("preference").request().get();
        assertEquals(200, response.getStatus());
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertEquals(2, result.size());
        assertEquals(1, result.getJSONArray("http://example.com/MySimplePreference").size());
        assertEquals(2, result.getJSONArray("http://example.com/MyComplexPreference").size());
    }

    @Test
    public void createUserPreferenceTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("preference")
                .queryParam("preferenceType", encode(TestSimplePreference.TYPE)).request().post(Entity.json(entity));
        assertEquals(201, response.getStatus());
    }

    @Test
    public void createUserInvalidPreferenceType() throws Exception {
        when(factoryRegistry.getFactoryOfType(Thing.TYPE)).thenReturn(Optional.empty());
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("preference")
                .queryParam("preferenceType", encode(Thing.TYPE)).request().post(Entity.json(entity));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createUserPreferenceTypeNotPresentInBodyTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("preference")
                .queryParam("preferenceType", encode(TestComplexPreference.TYPE)).request().post(Entity.json(entity));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createUserPreferenceBadJson() throws Exception {
        Response response = target().path("preference")
                .queryParam("preferenceType", encode(TestComplexPreference.TYPE)).request().post(Entity.json("fdas"));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createUserNoPreferenceType() throws Exception {
        Response response = target().path("preference")
                .request().post(Entity.json("fdas"));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUserPreferenceTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("preference/" + encode("http://example.com/MySimplePreference"))
                .queryParam("preferenceType", encode(TestSimplePreference.TYPE)).request().put(Entity.json(entity));
        assertEquals(200, response.getStatus());
    }

    @Test
    public void updateUserPreferenceInvalidType() throws Exception {
        when(factoryRegistry.getFactoryOfType(Thing.TYPE)).thenReturn(Optional.empty());
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("preference/" + encode("http://example.com/MySimplePreference"))
                .queryParam("preferenceType", encode(Thing.TYPE)).request().put(Entity.json(entity));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUserPreferenceTypeNotPresentInBodyTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("preference/" + encode("http://example.com/MySimplePreference"))
                .queryParam("preferenceType", encode(TestComplexPreference.TYPE)).request().put(Entity.json(entity));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUserPreferenceBadJson() throws Exception {
        Response response = target().path("preference/" + encode("http://example.com/MySimplePreference"))
                .queryParam("preferenceType", encode(TestComplexPreference.TYPE)).request().put(Entity.json("fdas"));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUserNoPreferenceType() throws Exception {
        Response response = target().path("preference/" + encode("http://example.com/MySimplePreference"))
                .request().put(Entity.json("fdas"));
        assertEquals(400, response.getStatus());
    }
}
package com.mobi.setting.rest;

/*-
 * #%L
 * com.mobi.setting.rest
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
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.ApplicationSetting;
import com.mobi.setting.api.ontologies.ApplicationSettingImpl;
import com.mobi.setting.api.ontologies.Preference;
import com.mobi.setting.api.ontologies.PreferenceImpl;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
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
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;

public class SettingRestTest extends MobiRestTestNg {
    private SettingRest rest;
    private OrmFactory<User> userFactory;
    private OrmFactory<Role> roleFactory;
    private ValueFactory vf;
    private User adminUser;
    private String simplePreferenceJson;
    private String simpleApplicationSettingJson;

    @Mock
    private EngineManager engineManager;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private SettingService<Preference> preferenceService;

    @Mock
    private SettingService<ApplicationSetting> applicationSettingService;

    @Override
    protected Application configureApp() throws Exception {
        rest = new SettingRest();
        userFactory = getRequiredOrmFactory(User.class);
        roleFactory = getRequiredOrmFactory(Role.class);
        vf = getValueFactory();
        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setUpMocks() throws Exception {
        MockitoAnnotations.initMocks(this);
        reset(engineManager, preferenceService, applicationSettingService);

        User user = userFactory.createNew(vf.createIRI("http://test.com/user"));
        user.setUsername(vf.createLiteral(UsernameTestFilter.USERNAME));
        adminUser = userFactory.createNew(vf.createIRI("http://test.com/admin"));
        adminUser.setUsername(vf.createLiteral(UsernameTestFilter.ADMIN_USER));
        Role adminRole = roleFactory.createNew(vf.createIRI("urn:admin"));
        adminUser.setHasUserRole(Collections.singleton(adminRole));

        InputStream firstInputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        InputStream secondInputStream = getClass().getResourceAsStream("/complexPreference.ttl");

        Model simplePrefModel = Values.mobiModel(Rio.parse(firstInputStream, "", RDFFormat.TURTLE));
        Model complexPrefModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));

        TestSimplePreference simplePreference = new TestSimplePreferenceImpl(vf.createIRI("http://example.com/MySimplePreference"), simplePrefModel, vf, null);
        TestComplexPreference complexPreference = new TestComplexPreferenceImpl(vf.createIRI("http://example.com/MyComplexPreference"), complexPrefModel, vf, null);
        Set<Preference> preferenceSet = new HashSet<>();
        preferenceSet.add(simplePreference);
        preferenceSet.add(complexPreference);

        simplePreferenceJson = IOUtils.toString(getClass().getResourceAsStream("/simplePreference.json"), StandardCharsets.UTF_8);

        // Get mocks
        when(preferenceService.getTypeIRI()).thenReturn(Preference.TYPE);
        when(preferenceService.getSettings(any())).thenReturn(preferenceSet);
        when(preferenceService.getSetting(simplePreference.getResource())).thenReturn(Optional.of(simplePreference));
        when(preferenceService.getSetting(complexPreference.getResource())).thenReturn(Optional.of(complexPreference));
        when(preferenceService.createSetting(any(Model.class), eq(vf.createIRI(TestSimplePreference.TYPE)), any(User.class))).thenReturn(simplePreference.getResource());
        when(preferenceService.createSetting(any(Model.class), eq(vf.createIRI(TestComplexPreference.TYPE)), any(User.class))).thenReturn(complexPreference.getResource());
        when(preferenceService.getSettingByType(eq(vf.createIRI(TestSimplePreference.TYPE)), any())).thenReturn(Optional.of(simplePreference));
        when(preferenceService.getSettingByType(eq(vf.createIRI(TestComplexPreference.TYPE)), any())).thenReturn(Optional.of(complexPreference));
        when(preferenceService.getSettingType(simplePreference)).thenReturn(vf.createIRI(simplePreference.TYPE));
        when(preferenceService.getSettingType(complexPreference)).thenReturn(vf.createIRI(complexPreference.TYPE));

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(UsernameTestFilter.USERNAME)).thenReturn(Optional.of(user));
        when(engineManager.retrieveUser(UsernameTestFilter.ADMIN_USER)).thenReturn(Optional.of(adminUser));
        when(engineManager.getUserRoles(eq(UsernameTestFilter.USERNAME))).thenReturn(Collections.emptySet());
        when(engineManager.getUserRoles(eq(UsernameTestFilter.ADMIN_USER))).thenReturn(Collections.singleton(adminRole));

        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(transformer.sesameModel(any(com.mobi.rdf.api.Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, com.mobi.rdf.api.Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        InputStream thirdInputStream = getClass().getResourceAsStream("/simpleApplicationSetting.ttl");
        InputStream fourthInputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");

        Model simpleAppSettingModel = Values.mobiModel(Rio.parse(thirdInputStream, "", RDFFormat.TURTLE));
        Model complexAppSettingModel = Values.mobiModel(Rio.parse(fourthInputStream, "", RDFFormat.TURTLE));

        TestSimpleApplicationSetting simpleApplicationSetting = new TestSimpleApplicationSettingImpl(vf.createIRI("http://example.com/MySimpleApplicationSetting"), simpleAppSettingModel, vf, null);
        TestComplexApplicationSetting complexApplicationSetting = new TestComplexApplicationSettingImpl(vf.createIRI("http://example.com/MyComplexApplicationSetting"), complexAppSettingModel, vf, null);
        Set<ApplicationSetting> applicationSettingSet = new HashSet<>();
        applicationSettingSet.add(simpleApplicationSetting);
        applicationSettingSet.add(complexApplicationSetting);

        simpleApplicationSettingJson = IOUtils.toString(getClass().getResourceAsStream("/simpleApplicationSetting.json"), StandardCharsets.UTF_8);

        when(applicationSettingService.getTypeIRI()).thenReturn(ApplicationSetting.TYPE);
        when(applicationSettingService.getSettings(user)).thenReturn(applicationSettingSet);
        when(applicationSettingService.getSetting(simpleApplicationSetting.getResource())).thenReturn(Optional.of(simpleApplicationSetting));
        when(applicationSettingService.getSetting(complexApplicationSetting.getResource())).thenReturn(Optional.of(complexApplicationSetting));
        when(applicationSettingService.createSetting(any(Model.class), eq(vf.createIRI(TestSimpleApplicationSetting.TYPE)), eq(adminUser))).thenReturn(simpleApplicationSetting.getResource());
        when(applicationSettingService.createSetting(any(Model.class), eq(vf.createIRI(TestComplexApplicationSetting.TYPE)), eq(adminUser))).thenReturn(complexApplicationSetting.getResource());
        when(applicationSettingService.getSettingByType(eq(vf.createIRI(TestSimpleApplicationSetting.TYPE)), eq(user))).thenReturn(Optional.of(simpleApplicationSetting));
        when(applicationSettingService.getSettingByType(eq(vf.createIRI(TestComplexApplicationSetting.TYPE)), eq(user))).thenReturn(Optional.of(complexApplicationSetting));
        when(applicationSettingService.getSettingType(simpleApplicationSetting)).thenReturn(vf.createIRI(simpleApplicationSetting.TYPE));
        when(applicationSettingService.getSettingType(complexApplicationSetting)).thenReturn(vf.createIRI(complexApplicationSetting.TYPE));

        rest.engineManager = engineManager;
        rest.transformer = transformer;
        rest.setSettingService(preferenceService);
        rest.setSettingService(applicationSettingService);
        rest.vf = vf;
    }

    // GET /settings

    @Test
    public void getPreferencesTest() throws Exception {
        Response response = target().path("settings").queryParam("type", Preference.TYPE).request().get();
        assertEquals(200, response.getStatus());
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertEquals(2, result.size());
        assertEquals(1, result.getJSONArray(TestSimplePreference.TYPE).size());
        assertEquals(2, result.getJSONArray(TestComplexPreference.TYPE).size());
    }

    @Test
    public void getPreferencesWithNoneTest() throws Exception {
        when(preferenceService.getSettings(any())).thenReturn(new HashSet<>());
        Response response = target().path("settings").queryParam("type", Preference.TYPE).request().get();
        assertEquals(200, response.getStatus());
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertEquals(0, result.size());
    }


    // GET /settings
    // type = ApplicationSetting.TYPE

    @Test
    public void getApplicationSettingsTest() throws Exception {
        Response response = target().path("settings").queryParam("type", ApplicationSetting.TYPE).request().get();
        assertEquals(200, response.getStatus());
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertEquals(2, result.size());
        assertEquals(1, result.getJSONArray(SettingRestTest.TestSimpleApplicationSetting.TYPE).size());
        assertEquals(2, result.getJSONArray(SettingRestTest.TestComplexApplicationSetting.TYPE).size());
    }

    @Test
    public void getApplicationSettingsWithNoneTest() throws Exception {
        when(applicationSettingService.getSettings(any())).thenReturn(new HashSet<>());
        Response response = target().path("settings").queryParam("type", ApplicationSetting.TYPE).request().get();
        assertEquals(200, response.getStatus());
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertEquals(0, result.size());
    }

    // GET /settings/{settingId}
    // type = Preference.TYPE
    @Test
    public void getPreferenceTest() throws Exception {
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .request().get();
        JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(1, result.size());

        Response secondResponse = target().path("settings/" + encode("http://example.com/MyComplexPreference"))
                .queryParam("type", Preference.TYPE)
                .request().get();
        JSONArray secondResult = JSONArray.fromObject(secondResponse.readEntity(String.class));
        assertEquals(2, secondResult.size());
    }

    @Test
    public void getPreferenceResourceNotExistsTest() throws Exception {
        when(preferenceService.getSetting(any())).thenReturn(Optional.empty());
        Response response = target().path("settings/" + encode("http://example.com/MyComplexPreference"))
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getPreferenceIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(preferenceService).getSetting(any());
        Response response = target().path("settings/" + encode("http://example.com/MyComplexPreference"))
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getPreferenceIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(preferenceService).getSetting(any());
        Response response = target().path("settings/" + encode("http://example.com/MyComplexPreference"))
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET /settings/{settingId}
    // type = ApplicationSetting.TYPE
    @Test
    public void getApplicationSettingTest() throws Exception {
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(1, result.size());

        Response secondResponse = target().path("settings/" + encode("http://example.com/MyComplexApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        JSONArray secondResult = JSONArray.fromObject(secondResponse.readEntity(String.class));
        assertEquals(2, secondResult.size());
    }

    @Test
    public void getApplicationSettingResourceNotExistsTest() throws Exception {
        when(applicationSettingService.getSetting(any())).thenReturn(Optional.empty());
        Response response = target().path("settings/" + encode("http://example.com/MyComplexApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getApplicationSettingIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(applicationSettingService).getSetting(any());
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getApplicationSettingIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(applicationSettingService).getSetting(any());
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // POST /settings
    // type = Preference.TYPE

    @Test
    public void createPreferenceTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings")
                .queryParam("type", Preference.TYPE)
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(201, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void createPreferenceBadJson() throws Exception {
        Response response = target().path("settings")
                .queryParam("type", Preference.TYPE)
                .queryParam("preferenceType", TestComplexPreference.TYPE)
                .request().post(Entity.json("fdas"));
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void createPreferenceNoTypeTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings")
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void createPreferenceNoSubTypeTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings")
                .queryParam("type", Preference.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void createPreferenceIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(preferenceService).createSetting(any(), any(), any());
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings")
                .queryParam("type", Preference.TYPE)
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void createPreferenceIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(preferenceService).createSetting(any(), any(), any());
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings")
                .queryParam("type", Preference.TYPE)
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(500, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    // POST /settings
    // type = ApplicationSettings.TYPE

    @Test
    public void createApplicationSettingWithNonAdminTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings")
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(401, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.USERNAME);
    }

    @Test
    public void createApplicationSettingWithAdminTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings")
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(201, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void createApplicationSettingBadJson() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        Response response = target().path("settings")
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestComplexApplicationSetting.TYPE)
                .request().post(Entity.json("fdas"));
        assertEquals(400, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void createApplicationSettingNoSubType() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings")
                .queryParam("type", ApplicationSetting.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createApplicationSettingNoType() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings")
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createApplicationIllegalArgumentTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        doThrow(IllegalArgumentException.class).when(applicationSettingService).createSetting(any(), any(), any());
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings")
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(400, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void createApplicationIllegalStateTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        doThrow(IllegalStateException.class).when(applicationSettingService).createSetting(any(), any(), any());
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings")
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().post(Entity.json(entity));
        assertEquals(500, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    // PUT /settings/{settingId}
    // type = Preference.TYPE

    @Test
    public void updatePreferenceTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(200, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void updatePreferenceBadJsonTest() throws Exception {
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .queryParam("subType", TestComplexPreference.TYPE)
                .request().put(Entity.json("fdas"));
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void updatePreferenceNoSubTypeTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void updatePreferenceNoTypeTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("subType", TestComplexPreference.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void updatePreferenceIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(preferenceService).updateSetting(any(), any(), any(), any());
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void updatePreferenceIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(preferenceService).updateSetting(any(), any(), any(), any());
        JSONArray entity = JSONArray.fromObject(simplePreferenceJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .queryParam("subType", TestSimplePreference.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(500, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    // PUT /settings/{settingId}
    // type = ApplicationSetting.TYPE

    @Test
    public void updateApplicationSettingNonAdminTest() throws Exception {
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(401, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.USERNAME);
    }

    @Test
    public void updateApplicationSettingWithAdminTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(200, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void updateApplicationSettingBadJsonTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().put(Entity.json("fdas"));
        assertEquals(400, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void updateApplicationSettingNoSubTypeTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", TestSimpleApplicationSetting.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateApplicationSettingNoTypeTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateApplicationSettingIllegalArgumentTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        doThrow(IllegalArgumentException.class).when(applicationSettingService).updateSetting(any(), any(), any(), any());
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(400, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void updateApplicationSettingIllegalStateTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        doThrow(IllegalStateException.class).when(applicationSettingService).updateSetting(any(), any(), any(), any());
        JSONArray entity = JSONArray.fromObject(simpleApplicationSettingJson);
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .queryParam("subType", TestSimpleApplicationSetting.TYPE)
                .request().put(Entity.json(entity));
        assertEquals(500, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    // DELETE /settings/{settingId}
    // type = Preference.TYPE

    @Test
    public void deletePreferenceTest() throws Exception {
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void deletePreferenceNoTypeTest() throws Exception {
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("subType", TestComplexPreference.TYPE)
                .request().delete();
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void deletePreferenceIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(preferenceService).deleteSetting(any());
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .request().delete();
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void deletePreferenceIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(preferenceService).deleteSetting(any());
        Response response = target().path("settings/" + encode("http://example.com/MySimplePreference"))
                .queryParam("type", Preference.TYPE)
                .request().delete();
        assertEquals(500, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    // DELETE /settings/{settingId}
    // type = ApplicationSetting.TYPE

    @Test
    public void deleteApplicationSettingNonAdminTest() throws Exception {
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().delete();
        assertEquals(401, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.USERNAME);
    }

    @Test
    public void deleteApplicationSettingWithAdminTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void deleteApplicationSettingNoTypeTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .request().delete();
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void deleteApplicationSettingIllegalArgumentTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        doThrow(IllegalArgumentException.class).when(applicationSettingService).deleteSetting(any());
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().delete();
        assertEquals(400, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void deleteApplicationSettingIllegalStateTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        doThrow(IllegalStateException.class).when(applicationSettingService).deleteSetting(any());
        Response response = target().path("settings/" + encode("http://example.com/MySimpleApplicationSetting"))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().delete();
        assertEquals(500, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    // GET /settings/types/{settingType}
    // type = Preference.TYPE
    @Test
    public void getPreferenceByTypeTest() throws Exception {
        Response response = target().path("settings/types/" + encode(TestSimplePreference.TYPE))
                .queryParam("type", Preference.TYPE)
                .request().get();
        JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(1, result.size());

        Response secondResponse = target().path("settings/types/" + encode(TestComplexPreference.TYPE))
                .queryParam("type", Preference.TYPE)
                .request().get();
        JSONArray secondResult = JSONArray.fromObject(secondResponse.readEntity(String.class));
        assertEquals(2, secondResult.size());
    }

    @Test
    public void getPreferenceByTypeTypeNotExistsTest() throws Exception {
        when(preferenceService.getSettingByType(any(), any())).thenReturn(Optional.empty());
        Response response = target().path("settings/types/" + encode(TestSimplePreference.TYPE))
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getPreferenceByTypeIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(preferenceService).getSettingByType(any(), any());
        Response response = target().path("settings/types/" + encode(TestSimplePreference.TYPE))
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getPreferenceByTypeIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(preferenceService).getSettingByType(any(), any());
        Response response = target().path("settings/types/" + encode(TestSimplePreference.TYPE))
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET /settings/types/{settingType}
    // type = ApplicationSetting.TYPE
    @Test
    public void getApplicationByTypeSettingTest() throws Exception {
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(1, result.size());

        Response secondResponse = target().path("settings/types/" + encode(TestComplexApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        JSONArray secondResult = JSONArray.fromObject(secondResponse.readEntity(String.class));
        assertEquals(2, secondResult.size());
    }

    @Test
    public void getApplicationSettingByTypeResourceNotExistsTest() throws Exception {
        when(applicationSettingService.getSettingByType(any(), any())).thenReturn(Optional.empty());
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getApplicationSettingByTypeIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(applicationSettingService).getSettingByType(any(), any());
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getApplicationSettingByTypeIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(applicationSettingService).getSettingByType(any(), any());
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // DELETE /settings/{settingId}
    // type = Preference.TYPE

    @Test
    public void deletePreferenceByTypeTest() throws Exception {
        Response response = target().path("settings/types/" + encode(TestSimplePreference.TYPE))
                .queryParam("type", Preference.TYPE)
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void deletePreferenceByTypeNoTypeTest() throws Exception {
        Response response = target().path("settings/types/" + encode(TestSimplePreference.TYPE))
                .queryParam("subType", TestComplexPreference.TYPE)
                .request().delete();
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void deletePreferenceByTypeIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(preferenceService).deleteSettingByType(any(), any());
        Response response = target().path("settings/types/" + encode(TestSimplePreference.TYPE))
                .queryParam("type", Preference.TYPE)
                .request().delete();
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void deletePreferenceByTypeIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(preferenceService).deleteSettingByType(any(), any());
        Response response = target().path("settings/types/" + encode(TestSimplePreference.TYPE))
                .queryParam("type", Preference.TYPE)
                .request().delete();
        assertEquals(500, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    // DELETE /settings/{settingId}
    // type = ApplicationSetting.TYPE

    @Test
    public void deleteApplicationSettingByTypeNonAdminTest() throws Exception {
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().delete();
        assertEquals(401, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.USERNAME);
    }

    @Test
    public void deleteApplicationSettingByTypeWithAdminTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void deleteApplicationSettingByTypeNoTypeTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .request().delete();
        assertEquals(400, response.getStatus());
        verify(engineManager, never()).getUserRoles(anyString());
    }

    @Test
    public void deleteApplicationSettingByTypeIllegalArgumentTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        doThrow(IllegalArgumentException.class).when(applicationSettingService).deleteSettingByType(any(), any());
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().delete();
        assertEquals(400, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    @Test
    public void deleteApplicationSettingByTypeIllegalStateTest() throws Exception {
        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(adminUser));
        doThrow(IllegalStateException.class).when(applicationSettingService).deleteSettingByType(any(), any());
        Response response = target().path("settings/types/" + encode(TestSimpleApplicationSetting.TYPE))
                .queryParam("type", ApplicationSetting.TYPE)
                .request().delete();
        assertEquals(500, response.getStatus());
        verify(engineManager).getUserRoles(UsernameTestFilter.ADMIN_USER);
    }

    // GET /settings/groups
    // type = Preference.TYPE

    @Test
    public void getPreferenceGroupsTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceGroups.ttl");
        Model model = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));

        when(preferenceService.getSettingGroups()).thenReturn(model);
        Response response = target().path("settings/groups/")
                .queryParam("type", Preference.TYPE)
                .request().get();
        JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(200, response.getStatus());
        assertEquals(2, result.size());
    }

    @Test
    public void getPreferenceGroupsNoTypeTest() throws Exception {
        Response response = target().path("settings/groups/")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getPreferenceGroupsIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(preferenceService).getSettingGroups();
        Response response = target().path("settings/groups/")
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getPreferenceGroupsIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(preferenceService).getSettingGroups();
        Response response = target().path("settings/groups/")
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET /settings/groups
    // type = ApplicationSetting.TYPE

    @Test
    public void getApplicationSettingGroupsTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/applicationSettingGroups.ttl");
        Model model = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));

        when(applicationSettingService.getSettingGroups()).thenReturn(model);
        Response response = target().path("settings/groups")
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(200, response.getStatus());
        assertEquals(2, result.size());
    }

    @Test
    public void getApplicationSettingGroupsNoTypeTest() throws Exception {
        Response response = target().path("settings/groups/")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getApplicationSettingGroupsIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(applicationSettingService).getSettingGroups();
        Response response = target().path("settings/groups/")
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getApplicationSettingGroupsIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(applicationSettingService).getSettingGroups();
        Response response = target().path("settings/groups/")
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET /settings/groups/{groupId}/definitions
    // type = Preference.TYPE

    @Test
    public void getPreferenceDefinitions() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceDefinitions.ttl");
        Model model = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));

        when(preferenceService.getSettingDefinitions(any())).thenReturn(model);
        Response response = target().path("settings/groups/" +
                encode("http://example.com/SomeOtherPreferenceGroup") + "/definitions")
                .queryParam("type", Preference.TYPE)
                .request().get();
        JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(200, response.getStatus());
        assertEquals(4, result.size());
    }

    @Test
    public void getPreferenceDefinitionsNoType() throws Exception {
        Response response = target().path("settings/groups/" + encode("http://example.com/SomeOtherPreferenceGroup") + "/definitions")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getPreferenceDefinitionsIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(preferenceService).getSettingDefinitions(any());
        Response response = target().path("settings/groups/" + encode("http://example.com/SomeOtherPreferenceGroup") + "/definitions")
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getPreferenceDefinitionsIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(preferenceService).getSettingDefinitions(any());
        Response response = target().path("settings/groups/" + encode("http://example.com/SomeOtherPreferenceGroup") + "/definitions")
                .queryParam("type", Preference.TYPE)
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET /settings/groups/{groupId}/definitions
    // type = ApplicationSetting.TYPE

    @Test
    public void getApplicationSettingDefinitions() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/applicationSettingDefinitions.ttl");
        Model model = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));

        when(applicationSettingService.getSettingDefinitions(any())).thenReturn(model);
        Response response = target().path("settings/groups/" +
                encode("http://example.com/SomeOtherApplicationSettingGroup") + "/definitions")
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(200, response.getStatus());
        assertEquals(4, result.size());
    }

    @Test
    public void getApplicationSettingDefinitionsIllegalArgumentTest() throws Exception {
        doThrow(IllegalArgumentException.class).when(applicationSettingService).getSettingDefinitions(any());
        Response response = target().path("settings/groups/" + encode("http://example.com/SomeOtherPreferenceGroup") + "/definitions")
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getApplicationSettingDefinitionsIllegalStateTest() throws Exception {
        doThrow(IllegalStateException.class).when(applicationSettingService).getSettingDefinitions(any());
        Response response = target().path("settings/groups/" + encode("http://example.com/SomeOtherPreferenceGroup") + "/definitions")
                .queryParam("type", ApplicationSetting.TYPE)
                .request().get();
        assertEquals(500, response.getStatus());
    }

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
        public TestSimplePreferenceImpl(Resource subjectIri, Model backingModel, ValueFactory valueFactory,
                                        ValueConverterRegistry valueConverterRegistry) {
            super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
        }
    }

    private interface TestComplexApplicationSetting extends Thing, ApplicationSetting {
        String TYPE = "http://example.com/ExampleComplexApplicationSetting";
    }

    static class TestComplexApplicationSettingImpl extends ApplicationSettingImpl implements SettingRestTest.TestComplexApplicationSetting, Thing, ApplicationSetting {
        public TestComplexApplicationSettingImpl(Resource subjectIri, Model backingModel, ValueFactory valueFactory,
                                                 ValueConverterRegistry valueConverterRegistry) {
            super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
        }
    }

    private interface TestSimpleApplicationSetting extends Thing, ApplicationSetting {
        String TYPE = "http://example.com/ExampleSimpleApplicationSetting";
    }

    static class TestSimpleApplicationSettingImpl extends ApplicationSettingImpl implements SettingRestTest.TestSimpleApplicationSetting, Thing, ApplicationSetting {
        public TestSimpleApplicationSettingImpl(Resource subjectIri, Model backingModel, ValueFactory valueFactory,
                                                ValueConverterRegistry valueConverterRegistry) {
            super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
        }
    }
}
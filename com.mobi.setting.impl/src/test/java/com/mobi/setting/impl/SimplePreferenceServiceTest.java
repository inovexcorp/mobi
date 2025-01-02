package com.mobi.setting.impl;

/*-
 * #%L
 * com.mobi.setting.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.base.OsgiRepositoryWrapper;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.setting.Preference;
import com.mobi.setting.api.ontologies.setting.Setting;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class SimplePreferenceServiceTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private OsgiRepositoryWrapper repo;
    private SimplePreferenceService service;
    private final OrmFactory<Preference> preferenceFactory = getRequiredOrmFactory(Preference.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

    private IRI simplePreferenceIRI;
    private IRI complexPreferenceIRI;

    @Mock
    private OrmFactoryRegistry registry;
    @Mock
    private OrmFactory<TestComplexPreference> testComplexPreferenceFactory;
    @Mock
    private OrmFactory<TestSimplePreference> testSimplePreferenceFactory;
    @Mock
    private CatalogConfigProvider configProvider;

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        simplePreferenceIRI = VALUE_FACTORY.createIRI("http://example.com/MySimplePreference");
        complexPreferenceIRI = VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference");

        closeable = MockitoAnnotations.openMocks(this);

        when(registry.getFactoriesOfType(User.class)).thenReturn(Collections.singletonList(userFactory));
        when(testComplexPreferenceFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(TestComplexPreference.TYPE));
        when(testSimplePreferenceFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(TestSimplePreference.TYPE));
        when(registry.getSortedFactoriesOfType(Preference.class)).thenReturn(Arrays.asList(testComplexPreferenceFactory, testSimplePreferenceFactory, preferenceFactory));

        when(configProvider.getRepository()).thenReturn(repo);

        service = new SimplePreferenceService();
        injectOrmFactoryReferencesIntoService(service);
        service.configProvider = configProvider;
        service.factoryRegistry = registry;
        service.start();
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    // createPreference

    @Test
    public void createPreferenceWithObjectValueTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(preference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void createPreferenceWithDataValueTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), testDataModel).get();

        service.createSetting(preference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void createPreferenceWithExistingPreferenceTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), testDataModel).get();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(preference.getModel(), VALUE_FACTORY.createIRI(SettingService.GRAPH));
        }

        service.createSetting(preference, user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void createPreferenceWithExistingPreferenceTypeTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), testDataModel).get();

        service.createSetting(preference, user);

        InputStream secondInputStream = getClass().getResourceAsStream("/altSimplePreference.ttl");
        Model secondTestDataModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/AltSimplePreference"), secondTestDataModel).get();

        service.createSetting(preference, user);
    }

    @Test
    public void createPreferencePreventUserInjectionTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        testDataModel.add(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"), VALUE_FACTORY.createIRI(
                "http://mobi.com/ontologies/setting#forUser"), VALUE_FACTORY.createIRI("http://test" +
                ".com/injectedUser"));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), testDataModel).get();

        service.createSetting(preference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
            assertTrue(ConnectionUtils.contains(conn, VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"),
                    VALUE_FACTORY.createIRI("http://mobi.com/ontologies/setting#forUser"),
                    VALUE_FACTORY.createIRI("http://test.com/user")));
            assertFalse(ConnectionUtils.contains(conn, VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"),
                    VALUE_FACTORY.createIRI("http://mobi.com/ontologies/setting#forUser"),
                    VALUE_FACTORY.createIRI("http://test.com/injectedUser")));
        }
    }

    // validatePreference

    @Test
    public void validatePreferenceTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.validateSetting(preference); // Should not throw exception
    }

    @Test(expected = IllegalArgumentException.class)
    public void validatePreferenceWithoutReferenceTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexPreferenceMissingReference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.validateSetting(preference);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validatePreferenceWithoutValueTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceNoValue.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.validateSetting(preference);
    }

    // getUserPreference

    @Test
    public void getUserPreferenceByTypeTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(preference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        Preference retrievedPreference = service.getSettingByType(VALUE_FACTORY.createIRI(TestComplexPreference.TYPE),
                user).get();
        Model retrievedPreferenceModel = retrievedPreference.getModel();
        assertTrue(retrievedPreferenceModel.contains(complexPreferenceIRI,
                VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));

        preference.getModel().forEach(statement -> assertTrue(retrievedPreference.getModel().contains(statement)));
    }

    @Test
    public void getUserPreferenceThatDoesNotExistTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Optional<Preference> retrievedPreference = service.getSettingByType(
                VALUE_FACTORY.createIRI("http://mobi.com/ontologies/notification#EmailNotificationPreference"), user);
        assertFalse(retrievedPreference.isPresent());
    }

    // getUserPreferences

    @Test
    public void getUserPreferencesTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(firstPreference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model secondTestModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), secondTestModel).get();

        service.createSetting(secondPreference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            secondPreference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        Set<Preference> retrievedPreferences = service.getSettings(user);
        Model retrievedPreferencesModel = MODEL_FACTORY.createEmptyModel();
        retrievedPreferences.forEach(retrievedPreference -> {
            retrievedPreferencesModel.addAll(retrievedPreference.getModel());
        });

        assertTrue(retrievedPreferencesModel.contains(simplePreferenceIRI,
                VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));
        assertTrue(retrievedPreferencesModel.contains(complexPreferenceIRI,
                VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));

        Model combinedModel = MODEL_FACTORY.createEmptyModel();
        combinedModel.addAll(firstPreference.getModel());
        combinedModel.addAll(secondPreference.getModel());
        combinedModel.forEach(statement -> assertTrue(retrievedPreferencesModel.contains(statement)));
    }

    @Test
    public void getUserPreferencesCorruptPreferenceTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(firstPreference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        Set<Preference> preferences = service.getSettings(user);
        assertEquals(1, preferences.size());

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.remove((Resource) null, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()),
                    VALUE_FACTORY.createIRI(TestComplexPreference.TYPE));
            conn.remove((Resource) null, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()),
                    VALUE_FACTORY.createIRI(Preference.TYPE));
        }

        preferences = service.getSettings(user);
        assertEquals(0, preferences.size());
    }

    // deleteUserPreference

    @Test
    public void deleteUserPreferenceByTypeTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(firstPreference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deleteSettingByType(VALUE_FACTORY.createIRI(TestComplexPreference.TYPE), user);

        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertFalse(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void deleteUserPreferenceTestByResource() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(firstPreference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deleteSetting(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"));

        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertFalse(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteUserPreferenceByTypeDoesNotExistTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(firstPreference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deleteSettingByType(VALUE_FACTORY.createIRI(TestSimplePreference.TYPE), user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteUserPreferenceResourceDoesNotExistTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(firstPreference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deleteSetting(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"));

        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertFalse(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    // updatePreference

    @Test
    public void updatePreferenceTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(preference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/updatedComplexPreference.ttl");
        Model secondTestDataModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), secondTestDataModel).get();

        service.updateSetting(secondPreference.getResource(), secondPreference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            secondPreference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.contains(conn, null, null, preference.getHasObjectValue_resource().iterator().next()));
            assertFalse(ConnectionUtils.contains(conn, preference.getHasObjectValue_resource().iterator().next(), null, null));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void updatePreferenceForDifferentUserTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(preference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/updatedComplexPreference.ttl");
        Model secondTestDataModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), secondTestDataModel).get();

        User differentUser = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/differentUser"));
        service.updateSetting(secondPreference.getResource(), secondPreference, differentUser);
    }

    @Test(expected = IllegalArgumentException.class)
    public void updatePreferenceDoesNotExistTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(preference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model secondTestDataModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), secondTestDataModel).get();

        service.updateSetting(secondPreference.getResource(), secondPreference, user);
    }

    // getPreferenceGroups

    @Test
    public void getPreferenceGroupsTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceDefinitions.ttl");
        Model preferenceDefinitionsModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);

        InputStream groupsInputStream = getClass().getResourceAsStream("/preferenceDefinitions.ttl");
        Model preferenceGroupsModel = Rio.parse(groupsInputStream, "", RDFFormat.TURTLE);

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(preferenceDefinitionsModel);
        }
        service.getSettingGroups().forEach(statement -> {
            assertTrue(preferenceGroupsModel.contains(statement));
        });
    }

    // getPreferenceDefinitions

    @Test
    public void getPreferenceDefinitions() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceDefinitions.ttl");
        Model preferenceDefinitionsModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(preferenceDefinitionsModel);
        }
        assertEquals(4, service.getSettingDefinitions(VALUE_FACTORY.createIRI("http://example" +
                ".com/SomeOtherPreferenceGroup"))
                .subjects().size());
        assertEquals(2, service.getSettingDefinitions(VALUE_FACTORY.createIRI("http://example.com/SomePreferenceGroup"))
                .subjects().size());
        assertEquals(0, service.getSettingDefinitions(VALUE_FACTORY.createIRI("http://example" +
                ".com/SomeNonexistentPreferenceGroup"))
                .subjects().size());
    }

    // getSetting

    @Test
    public void getSettingTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.createSetting(preference, user);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        Setting retrievedSetting = service.getSetting(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"
        )).get();
        Model retrievedSettingModel = retrievedSetting.getModel();
        assertTrue(retrievedSettingModel.contains(complexPreferenceIRI, VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));

        preference.getModel().forEach(statement -> assertTrue(retrievedSetting.getModel().contains(statement)));
    }

    @Test
    public void getSettingResourceDoesNotExistTest() throws Exception {
        Optional<Preference> retrievedPreference = service.getSetting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"));
        assertFalse(retrievedPreference.isPresent());
    }

    private interface TestComplexPreference extends Thing, Setting, Preference {
        String TYPE = "http://example.com/ExampleComplexPreference";
    }

    private interface TestSimplePreference extends Thing, Setting, Preference {
        String TYPE = "http://example.com/ExampleSimplePreference";
    }
}

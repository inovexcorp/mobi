package com.mobi.preference.impl;

/*-
 * #%L
 * com.mobi.preference.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.notification.impl.SimpleNotificationService;
import com.mobi.notification.impl.ontologies.EmailNotificationPreference;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.Setting;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
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

    private Repository repo;
    private SimplePreferenceService service;
    private SimpleNotificationService notificationService;
    private OrmFactory<Preference> preferenceFactory = getRequiredOrmFactory(Preference.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

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
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        simplePreferenceIRI = VALUE_FACTORY.createIRI("http://example.com/MySimplePreference");
        complexPreferenceIRI = VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference");

        MockitoAnnotations.initMocks(this);

        when(registry.getFactoriesOfType(User.class)).thenReturn(Collections.singletonList(userFactory));
        when(testComplexPreferenceFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(TestComplexPreference.TYPE));
        when(testSimplePreferenceFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(TestSimplePreference.TYPE));
        when(registry.getSortedFactoriesOfType(Preference.class)).thenReturn(Arrays.asList(testComplexPreferenceFactory, testSimplePreferenceFactory, preferenceFactory));

        when(configProvider.getRepository()).thenReturn(repo);

        service = new SimplePreferenceService();
        injectOrmFactoryReferencesIntoService(service);
        notificationService = new SimpleNotificationService();
        injectOrmFactoryReferencesIntoService(notificationService);
        service.vf = VALUE_FACTORY;
        service.mf = MODEL_FACTORY;
        service.configProvider = configProvider;
        service.factoryRegistry = registry;
        service.start();
    }

    @Test
    public void addPreferenceWithObjectValueTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void addPreferenceWithDataValueTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    // addPreference

    @Test(expected = IllegalArgumentException.class)
    public void addPreferenceWithExistingPreferenceTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), testDataModel).get();
        repo.getConnection().add(preference.getModel(), VALUE_FACTORY.createIRI(PreferenceService.GRAPH));

        service.addPreference(user, preference);
    }

    @Test(expected = IllegalArgumentException.class)
    public void addPreferenceWithExistingPreferenceTypeTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), testDataModel).get();

        service.addPreference(user, preference);

        InputStream secondInputStream = getClass().getResourceAsStream("/altSimplePreference.ttl");
        Model secondTestDataModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/AltSimplePreference"), secondTestDataModel).get();

        service.addPreference(user, secondPreference);
    }

    @Test
    public void addPreferencePreventUserInjectionTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        testDataModel.add(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"), VALUE_FACTORY.createIRI(
                "http://mobi.com/ontologies/preference#forUser"), VALUE_FACTORY.createIRI("http://test" +
                ".com/injectedUser"));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
            assertTrue(conn.contains(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"),
                    VALUE_FACTORY.createIRI("http://mobi.com/ontologies/preference#forUser"),
                    VALUE_FACTORY.createIRI("http://test.com/user")));
            assertFalse(conn.contains(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"),
                    VALUE_FACTORY.createIRI("http://mobi.com/ontologies/preference#forUser"),
                    VALUE_FACTORY.createIRI("http://test.com/injectedUser")));
        }
    }

    @Test
    public void validatePreferenceTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.validatePreference(preference); // Should not throw exception
    }

    @Test(expected = IllegalArgumentException.class)
    public void validatePreferenceWithoutReferenceTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexPreferenceMissingReference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.validatePreference(preference);
    }

    // validatePreference

    @Test(expected = IllegalArgumentException.class)
    public void validatePreferenceWithoutValueTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceNoValue.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.validatePreference(preference);
    }

    @Test
    public void getSettingTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
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
        Optional<Setting> retrievedPreference = service.getSetting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"));
        assertFalse(retrievedPreference.isPresent());
    }

    // getUserPreference

    @Test
    public void getUserPreferenceByTypeTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        Preference retrievedPreference = service.getUserPreference(user,
                VALUE_FACTORY.createIRI(TestComplexPreference.TYPE)).get();
        Model retrievedPreferenceModel = retrievedPreference.getModel();
        assertTrue(retrievedPreferenceModel.contains(complexPreferenceIRI,
                VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));

        preference.getModel().forEach(statement -> assertTrue(retrievedPreference.getModel().contains(statement)));
    }

    @Test
    public void getUserPreferenceThatDoesNotExistTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Optional<Preference> retrievedPreference = service.getUserPreference(user,
                VALUE_FACTORY.createIRI(EmailNotificationPreference.TYPE));
        assertFalse(retrievedPreference.isPresent());
    }

    @Test
    public void getUserPreferencesTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, firstPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model secondTestModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), secondTestModel).get();

        service.addPreference(user, secondPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            secondPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.getUserPreferences(user);

        Set<Preference> retrievedPreferences = service.getUserPreferences(user);
        Model retrievedPreferencesModel = MODEL_FACTORY.createModel();
        retrievedPreferences.forEach(retrievedPreference -> {
            retrievedPreferencesModel.addAll(retrievedPreference.getModel());
        });

        assertTrue(retrievedPreferencesModel.contains(simplePreferenceIRI,
                VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));
        assertTrue(retrievedPreferencesModel.contains(complexPreferenceIRI,
                VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));

        Model combinedModel = MODEL_FACTORY.createModel();
        combinedModel.addAll(firstPreference.getModel());
        combinedModel.addAll(secondPreference.getModel());
        combinedModel.forEach(statement -> assertTrue(retrievedPreferencesModel.contains(statement)));
    }

    @Test(expected = IllegalStateException.class)
    public void getUserPreferencesCorruptPreferenceTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, firstPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.remove((Resource) null, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()),
                    VALUE_FACTORY.createIRI(TestComplexPreference.TYPE));
            conn.remove((Resource) null, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()),
                    VALUE_FACTORY.createIRI(Preference.TYPE));
        }

        service.getUserPreferences(user);
    }

    // TODO: test for Preference when multiple preferences of the same type exist in the repo. Assert
    //  RepositoryException

    // getUserPreferences

    @Test
    public void deleteUserPreferenceTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, firstPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deletePreference(user, VALUE_FACTORY.createIRI(TestComplexPreference.TYPE));

        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void deleteUserPreferenceTestByResource() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, firstPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deletePreference(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"));

        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteUserPreferenceTypeDoesNotExistTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, firstPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deletePreference(user, VALUE_FACTORY.createIRI(TestSimplePreference.TYPE));
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteUserPreferenceResourceDoesNotExistTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, firstPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deletePreference(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"));

        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updatePreferenceTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/updatedComplexPreference.ttl");
        Model secondTestDataModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), secondTestDataModel).get();

        service.updatePreference(user, secondPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            secondPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.contains(null, null, preference.getHasObjectValue_resource().iterator().next()));
            assertFalse(conn.contains(preference.getHasObjectValue_resource().iterator().next(), null, null));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void updatePreferenceForDifferentUserTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/updatedComplexPreference.ttl");
        Model secondTestDataModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), secondTestDataModel).get();

        User differentUser = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/differentUser"));
        service.updatePreference(differentUser, secondPreference);
    }

    @Test(expected = IllegalArgumentException.class)
    public void updatePreferenceDoesNotExistTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model secondTestDataModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimplePreference"), secondTestDataModel).get();

        service.updatePreference(user, secondPreference);
    }

    @Test
    public void getPreferenceGroupsTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceDefinitions.ttl");
        Model preferenceDefinitionsModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));

        InputStream groupsInputStream = getClass().getResourceAsStream("/preferenceDefinitions.ttl");
        Model preferenceGroupsModel = Values.mobiModel(Rio.parse(groupsInputStream, "", RDFFormat.TURTLE));

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(preferenceDefinitionsModel);
        }
        service.getPreferenceGroups().forEach(statement -> {
            assertTrue(preferenceGroupsModel.contains(statement));
        });
    }

    @Test
    public void getPreferenceDefinitions() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceDefinitions.ttl");
        Model preferenceDefinitionsModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(preferenceDefinitionsModel);
        }
        assertTrue(service.getPreferenceDefinitions(VALUE_FACTORY.createIRI("http://example" +
                ".com/SomeOtherPreferenceGroup"))
                .subjects().size() == 4);
        assertTrue(service.getPreferenceDefinitions(VALUE_FACTORY.createIRI("http://example.com/SomePreferenceGroup"))
                .subjects().size() == 2);
        assertTrue(service.getPreferenceDefinitions(VALUE_FACTORY.createIRI("http://example" +
                ".com/SomeNonexistentPreferenceGroup"))
                .subjects().size() == 0);
    }

    private interface TestComplexPreference extends Thing, Setting, Preference {
        String TYPE = "http://example.com/ExampleComplexPreference";
    }

    private interface TestSimplePreference extends Thing, Setting, Preference {
        String TYPE = "http://example.com/ExampleSimplePreference";
    }
}
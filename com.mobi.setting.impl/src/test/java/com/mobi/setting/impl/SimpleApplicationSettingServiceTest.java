package com.mobi.setting.impl;

/*-
 * #%L
 * com.mobi.setting.impl
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
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.setting.ApplicationSetting;
import com.mobi.setting.api.ontologies.setting.Setting;
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

public class SimpleApplicationSettingServiceTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleApplicationSettingService service;
    private final OrmFactory<ApplicationSetting> applicationSettingFactory = getRequiredOrmFactory(ApplicationSetting.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

    @Mock
    private OrmFactoryRegistry registry;
    @Mock
    private OrmFactory<SimpleApplicationSettingServiceTest.TestComplexApplicationSetting> testComplexApplicationSettingFactory;
    @Mock
    private OrmFactory<SimpleApplicationSettingServiceTest.TestSimpleApplicationSetting> testSimpleApplicationSettingFactory;
    @Mock
    private CatalogConfigProvider configProvider;

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        closeable = MockitoAnnotations.openMocks(this);

        when(registry.getFactoriesOfType(User.class)).thenReturn(Collections.singletonList(userFactory));
        when(testComplexApplicationSettingFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(SimpleApplicationSettingServiceTest.TestComplexApplicationSetting.TYPE));
        when(testSimpleApplicationSettingFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(SimpleApplicationSettingServiceTest.TestSimpleApplicationSetting.TYPE));
        when(registry.getSortedFactoriesOfType(ApplicationSetting.class)).thenReturn(Arrays.asList(testComplexApplicationSettingFactory, testSimpleApplicationSettingFactory, applicationSettingFactory));

        when(configProvider.getRepository()).thenReturn(repo);

        service = new SimpleApplicationSettingService();
        injectOrmFactoryReferencesIntoService(service);
        service.configProvider = configProvider;
        service.factoryRegistry = registry;
        service.start();
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    // createApplicationSetting

    @Test
    public void createApplicationSettingWithObjectValueTest() throws Exception {
        // Setup:
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(applicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            applicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void createApplicationSettingWithDataValueTest() throws Exception {
        // Setup:
        InputStream inputStream = getClass().getResourceAsStream("/simpleApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimpleApplicationSetting"), testDataModel).get();

        service.createSetting(applicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            applicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void createApplicationSettingWithExistingApplicationSettingTest() throws Exception {
        // Setup:
        InputStream inputStream = getClass().getResourceAsStream("/simpleApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimpleApplicationSetting"), testDataModel).get();
        repo.getConnection().add(applicationSetting.getModel(), VALUE_FACTORY.createIRI(SettingService.GRAPH));

        service.createSetting(applicationSetting);
    }

    @Test(expected = IllegalArgumentException.class)
    public void createApplicationSettingWithExistingApplicationSettingTypeTest() throws Exception {
        // Setup:
        InputStream inputStream = getClass().getResourceAsStream("/simpleApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimpleApplicationSetting"), testDataModel).get();

        service.createSetting(applicationSetting);

        InputStream secondInputStream = getClass().getResourceAsStream("/altSimpleApplicationSetting.ttl");
        Model secondTestDataModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        ApplicationSetting secondApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/AltSimpleApplicationSetting"), secondTestDataModel).get();

        service.updateSetting(secondApplicationSetting.getResource(), secondApplicationSetting);
    }

    // validateApplicationSetting

    @Test
    public void validateApplicationSettingTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.validateSetting(applicationSetting); // Should not throw exception
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateApplicationSettingWithoutReferenceTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSettingMissingReference.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.validateSetting(applicationSetting);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateApplicationSettingWithoutValueTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/applicationSettingNoValue.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.validateSetting(applicationSetting);
    }

    // getApplicationSettingByType

    @Test
    public void getApplicationSettingByTypeTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(applicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            applicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        ApplicationSetting retrievedApplicationSetting = service.getSettingByType(
                VALUE_FACTORY.createIRI(SimpleApplicationSettingServiceTest.TestComplexApplicationSetting.TYPE)).get();
        Model retrievedApplicationSettingModel = retrievedApplicationSetting.getModel();

        applicationSetting.getModel().forEach(statement -> assertTrue(retrievedApplicationSetting.getModel().contains(statement)));
    }

    @Test
    public void getUserApplicationSettingThatDoesNotExistTest() throws Exception {
        Optional<ApplicationSetting> retrievedApplicationSetting = service.getSettingByType(
                VALUE_FACTORY.createIRI("http://mobi.com/ontologies/notification#EmailNotificationPreference"));
        assertFalse(retrievedApplicationSetting.isPresent());
    }

    // getUserApplicationSettings

    @Test
    public void getUserApplicationSettingsTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting firstApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(firstApplicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/simpleApplicationSetting.ttl");
        Model secondTestModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        ApplicationSetting secondApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimpleApplicationSetting"), secondTestModel).get();

        service.createSetting(secondApplicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            secondApplicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.getSettings();

        Set<ApplicationSetting> retrievedApplicationSettings = service.getSettings();
        Model retrievedApplicationSettingsModel = MODEL_FACTORY.createEmptyModel();
        retrievedApplicationSettings.forEach(retrievedApplicationSetting -> {
            retrievedApplicationSettingsModel.addAll(retrievedApplicationSetting.getModel());
        });

        Model combinedModel = MODEL_FACTORY.createEmptyModel();
        combinedModel.addAll(firstApplicationSetting.getModel());
        combinedModel.addAll(secondApplicationSetting.getModel());
        combinedModel.forEach(statement -> assertTrue(retrievedApplicationSettingsModel.contains(statement)));
    }

    @Test
    public void getApplicationSettingsCorruptApplicationSettingTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting firstApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(firstApplicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.remove((Resource) null, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()),
                    VALUE_FACTORY.createIRI(SimpleApplicationSettingServiceTest.TestComplexApplicationSetting.TYPE));
            conn.remove((Resource) null, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()),
                    VALUE_FACTORY.createIRI(ApplicationSetting.TYPE));
        }

        service.getSettings(); // TODO:
    }

    // deleteUserApplicationSetting

    @Test
    public void deleteApplicationSettingTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting firstApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(firstApplicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deleteSettingByType(VALUE_FACTORY.createIRI(SimpleApplicationSettingServiceTest.TestComplexApplicationSetting.TYPE));

        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertFalse(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void deleteUserApplicationSettingTestByResource() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting firstApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(firstApplicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deleteSetting(VALUE_FACTORY.createIRI("http://example.com/MyComplexApplicationSetting"));

        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertFalse(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteUserApplicationSettingTypeDoesNotExistTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting firstApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(firstApplicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deleteSetting(VALUE_FACTORY.createIRI(SimpleApplicationSettingServiceTest.TestSimpleApplicationSetting.TYPE));
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteUserApplicationSettingResourceDoesNotExistTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting firstApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(firstApplicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        service.deleteSetting(VALUE_FACTORY.createIRI("http://example.com/MySimpleApplicationSetting"));

        try (RepositoryConnection conn = repo.getConnection()) {
            firstApplicationSetting.getModel().forEach(statement -> assertFalse(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }
    }

    // updateApplicationSetting

    @Test
    public void updateApplicationSettingTest() throws Exception {
        // Setup:
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(applicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            applicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/updatedComplexApplicationSetting.ttl");
        Model secondTestDataModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        ApplicationSetting secondApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), secondTestDataModel).get();

        service.updateSetting(secondApplicationSetting.getResource(), secondApplicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            secondApplicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.contains(conn, null, null, applicationSetting.getHasObjectValue_resource().iterator().next()));
            assertFalse(ConnectionUtils.contains(conn, applicationSetting.getHasObjectValue_resource().iterator().next(), null, null));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void updateApplicationSettingDoesNotExistTest() throws Exception {
        // Setup:
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.updateSetting(applicationSetting.getResource(), applicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            applicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/simpleApplicationSetting.ttl");
        Model secondTestDataModel = Rio.parse(secondInputStream, "", RDFFormat.TURTLE);
        ApplicationSetting secondApplicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MySimpleApplicationSetting"), secondTestDataModel).get();

        service.updateSetting(secondApplicationSetting.getResource(), secondApplicationSetting);
    }

    // getApplicationSettingGroups

    @Test
    public void getApplicationSettingGroupsTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/applicationSettingDefinitions.ttl");
        Model applicationSettingDefinitionsModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);

        InputStream groupsInputStream = getClass().getResourceAsStream("/applicationSettingDefinitions.ttl");
        Model applicationSettingGroupsModel = Rio.parse(groupsInputStream, "", RDFFormat.TURTLE);

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(applicationSettingDefinitionsModel);
        }
        service.getSettingGroups().forEach(statement -> {
            assertTrue(applicationSettingGroupsModel.contains(statement));
        });
    }

    // getApplicationSettingDefinitions

    @Test
    public void getApplicationSettingDefinitions() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/applicationSettingDefinitions.ttl");
        Model applicationSettingDefinitionsModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(applicationSettingDefinitionsModel);
        }
        assertEquals(4, service.getSettingDefinitions(VALUE_FACTORY.createIRI("http://example" +
                ".com/SomeOtherApplicationSettingGroup"))
                .subjects().size());
        assertEquals(2, service.getSettingDefinitions(VALUE_FACTORY.createIRI("http://example.com/SomeApplicationSettingGroup"))
                .subjects().size());
        assertEquals(0, service.getSettingDefinitions(VALUE_FACTORY.createIRI("http://example" +
                ".com/SomeNonexistentApplicationSettingGroup"))
                .subjects().size());
    }

    // getSetting

    @Test
    public void getSettingTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexApplicationSetting.ttl");
        Model testDataModel = Rio.parse(inputStream, "", RDFFormat.TURTLE);
        ApplicationSetting applicationSetting = applicationSettingFactory.getExisting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"), testDataModel).get();

        service.createSetting(applicationSetting);
        try (RepositoryConnection conn = repo.getConnection()) {
            applicationSetting.getModel().forEach(statement -> assertTrue(ConnectionUtils.contains(conn, statement.getSubject(),
                    statement.getPredicate(), statement.getObject())));
        }

        Setting retrievedSetting = service.getSetting(VALUE_FACTORY.createIRI("http://example.com/MyComplexApplicationSetting"
        )).get();

        applicationSetting.getModel().forEach(statement -> assertTrue(retrievedSetting.getModel().contains(statement)));
    }

    @Test
    public void getSettingResourceDoesNotExistTest() throws Exception {
        Optional<ApplicationSetting> retrievedApplicationSetting = service.getSetting(VALUE_FACTORY.createIRI("http://example" +
                ".com/MyComplexApplicationSetting"));
        assertFalse(retrievedApplicationSetting.isPresent());
    }

    private interface TestComplexApplicationSetting extends Thing, Setting, ApplicationSetting {
        String TYPE = "http://example.com/ExampleComplexApplicationSetting";
    }

    private interface TestSimpleApplicationSetting extends Thing, Setting, ApplicationSetting {
        String TYPE = "http://example.com/ExampleSimpleApplicationSetting";
    }
}

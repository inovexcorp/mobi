package com.mobi.webhooks.impl.record;

/*-
 * #%L
 * com.mobi.webhooks.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.Objects;
import java.util.Optional;

public class WebhookRecordServiceImplTest extends OrmEnabledTestCase {

    private AutoCloseable closeable;
    private WebhookRecordServiceImpl recordService;
    private WebhookRecord testRecord;
    private MemoryRepositoryWrapper repository;

    private final IRI catalogIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI recordIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#webhook-record");
    private final IRI recordPolicyIRI = VALUE_FACTORY.createIRI("http://mobi.com/policies/record/encoded-record-policy");

    private DeleteActivity deleteActivity;
    private User user;

    private final OrmFactory<WebhookRecord> recordFactory = getRequiredOrmFactory(WebhookRecord.class);
    private final OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private final OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);

    @Mock
    private ThingManager thingManager;

    @Mock
    private CatalogProvUtils provUtils;

    @Mock
    private XACMLPolicyManager xacmlPolicyManager;

    @Mock
    private WebhookConfigurationService webhookConfigurationService;

    @Mock
    private CreateActivity createActivity;

    @Before
    public void setUp() throws NullPointerException {
        System.setProperty("karaf.etc", Objects.requireNonNull(WebhookRecordServiceImplTest.class.getResource("/")).getPath());
        repository = new MemoryRepositoryWrapper();
        repository.setDelegate(new SailRepository(new MemoryStore()));

        recordService = new WebhookRecordServiceImpl();
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));
        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));

        testRecord = recordFactory.createNew(recordIRI);
        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Webhook Record"), DCTERMS.TITLE);
        testRecord.setCatalog(catalogFactory.createNew(catalogIRI));

        closeable = MockitoAnnotations.openMocks(this);
        when(thingManager.optObject(any(IRI.class), any(OrmFactory.class), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(testRecord));
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
        when(provUtils.startCreateActivity(any(User.class))).thenReturn(createActivity);
        when(xacmlPolicyManager.addPolicy(any(XACMLPolicy.class))).thenReturn(recordPolicyIRI);
        doNothing().when(webhookConfigurationService).createConfiguration(any(WebhookRecord.class));
        doNothing().when(webhookConfigurationService).deleteConfiguration(any(WebhookRecord.class), any(RepositoryConnection.class));

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.thingManager = thingManager;
        recordService.provUtils = provUtils;
        recordService.xacmlPolicyManager = xacmlPolicyManager;
        recordService.webhookConfigurationService = webhookConfigurationService;
        recordService.recordFactory = recordService.webhookRecordFactory;
        recordService.start();
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.clear();
        }
    }

    /* getType() */

    @Test
    public void getTypeTest() {
        assertEquals(WebhookRecord.class, recordService.getType());
    }

    /* getTypeIRI() */

    @Test
    public void getTypeIRITest() {
        assertEquals(WebhookRecord.TYPE, recordService.getTypeIRI());
    }

    /* create Record Tests */

    @Test
    public void createRecordTest() {
        RecordOperationConfig config = new OperationConfig();
        config.set(RecordCreateSettings.CATALOG_ID, catalogIRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "Test Webhook Record");
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, Collections.singleton(user));

        try (RepositoryConnection connection = repository.getConnection()) {
            WebhookRecord record = recordService.create(user, config, connection);
            record.getResource();
        }

        verify(webhookConfigurationService).createConfiguration(any(WebhookRecord.class));
        verify(thingManager).addObject(any(WebhookRecord.class), any(RepositoryConnection.class));
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(eq(createActivity), any(IRI.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void createWithoutCatalogIdTest() {
        RecordOperationConfig config = new OperationConfig();
        config.set(RecordCreateSettings.RECORD_TITLE, "Test Webhook Record");
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, Collections.singleton(user));

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void createWithoutTitleTest() {
        RecordOperationConfig config = new OperationConfig();
        config.set(RecordCreateSettings.CATALOG_ID, catalogIRI.stringValue());
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, Collections.singleton(user));

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void createWithoutPublisherTest() {
        RecordOperationConfig config = new OperationConfig();
        config.set(RecordCreateSettings.CATALOG_ID, catalogIRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "Test Webhook Record");

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }
    }

    /* delete() */

    @Test
    public void deleteTest() {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testRecord.getModel(), testRecord.getResource());
            WebhookRecord deletedRecord = recordService.delete(recordIRI, user, connection);

            assertEquals(testRecord, deletedRecord);
        }
        verify(thingManager).optObject(eq(recordIRI), eq(recordFactory), any(RepositoryConnection.class));
        verify(webhookConfigurationService).deleteConfiguration(eq(testRecord), any(RepositoryConnection.class));
        verify(provUtils).startDeleteActivity(eq(user), eq(recordIRI));
        verify(provUtils).endDeleteActivity(eq(deleteActivity), eq(testRecord));
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() {
        when(thingManager.optObject(eq(recordIRI), eq(recordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.empty());

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.delete(recordIRI, user, connection);
        }
    }

    @Test
    public void deleteRecordRemoveFails() {
        doThrow(RepositoryException.class).when(thingManager).removeObject(any(WebhookRecord.class), any(RepositoryConnection.class));

        try (RepositoryConnection connection = repository.getConnection()) {
            assertThrows(RepositoryException.class, () -> recordService.delete(recordIRI, user, connection));
        }

        verify(provUtils).removeActivity(eq(deleteActivity));
    }
}

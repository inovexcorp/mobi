package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.platform.config.api.server.Mobi;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.time.OffsetDateTime;
import java.util.UUID;

@RunWith(PowerMockRunner.class)
@PrepareForTest(RepositoryResults.class)
public class CatalogProvUtilsImplTest extends OrmEnabledTestCase {
    private static final String recordIri = "http://test.org/record";
    private static final String predAtLocation = "http://www.w3.org/ns/prov#atLocation";

    private CatalogProvUtilsImpl utils = new CatalogProvUtilsImpl();
    private OrmFactory<Activity> activityFactory = getRequiredOrmFactory(Activity.class);
    private OrmFactory<CreateActivity> createActivityFactory = getRequiredOrmFactory(CreateActivity.class);
    private OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);
    private OrmFactory<Entity> entityFactory = getRequiredOrmFactory(Entity.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<Record> recordFactory = getRequiredOrmFactory(Record.class);
    private Record record;
    private CreateActivity createActivity;
    private DeleteActivity deleteActivity;
    private Entity entity;
    private User user;

    @Mock
    private Mobi mobi;

    @Mock
    private ProvenanceService provenanceService;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private RepositoryConnection connProv;

    @Mock
    private RepositoryResult<Statement> resultEntity;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);

        createActivity = createActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/create"));
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));
        entity = entityFactory.createNew(VALUE_FACTORY.createIRI(recordIri));
        entity.addProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now()), VALUE_FACTORY.createIRI(Entity.generatedAtTime_IRI));
        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));

        when(mobi.getServerIdentifier()).thenReturn(UUID.randomUUID());
        when(catalogManager.getRepositoryId()).thenReturn("system");

        IRI recordIRI = VALUE_FACTORY.createIRI(recordIri);

        PowerMockito.mockStatic(RepositoryResults.class);

        when(provenanceService.getConnection()).thenReturn(connProv);
        when(connProv.getStatements(recordIRI, null, null)).thenReturn(resultEntity);
        when(RepositoryResults.asModel(resultEntity, MODEL_FACTORY)).thenReturn(entity.getModel());

        record = recordFactory.createNew(recordIRI);
        record.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));

        injectOrmFactoryReferencesIntoService(utils);
        utils.setVf(VALUE_FACTORY);
        utils.setMobi(mobi);
        utils.setProvenanceService(provenanceService);
        utils.setCatalogManager(catalogManager);
        utils.setModelFactory(MODEL_FACTORY);
    }

    @Test
    public void startCreateActivityTest() throws Exception {
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(createActivity);
        CreateActivity result = utils.startCreateActivity(user);
        verify(provenanceService).createActivity(any(ActivityConfig.class));
        verify(provenanceService).addActivity(createActivity);
        verify(mobi).getServerIdentifier();
        assertTrue(result.getModel().contains(createActivity.getResource(), VALUE_FACTORY.createIRI(Activity.startedAtTime_IRI), null));
        assertTrue(result.getModel().contains(createActivity.getResource(), VALUE_FACTORY.createIRI(predAtLocation), null));
    }

    @Test(expected = IllegalStateException.class)
    public void startCreateActivityWithNoCreateActivityTest() {
        // Setup:
        Activity activity1 = activityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity"));
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(activity1);

        utils.startCreateActivity(user);
    }

    @Test
    public void endCreateActivityTest() throws Exception {
        // Setup:
        Resource recordIRI = VALUE_FACTORY.createIRI(recordIri);

        utils.endCreateActivity(createActivity, recordIRI);
        verify(provenanceService).updateActivity(createActivity);
        assertTrue(createActivity.getModel().contains(createActivity.getResource(), VALUE_FACTORY.createIRI(Activity.endedAtTime_IRI), null));
        assertEquals(1, createActivity.getGenerated().size());
        Entity resultEntity = createActivity.getGenerated().iterator().next();
        assertEquals(VALUE_FACTORY.createIRI(recordIri), resultEntity.getResource());
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), VALUE_FACTORY.createIRI(Entity.generatedAtTime_IRI), null));
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), VALUE_FACTORY.createIRI(predAtLocation), VALUE_FACTORY.createLiteral("system")));
    }

    @Test
    public void startDeleteActivityTest() throws Exception {
        // Setup
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(deleteActivity);
        entity.addProperty(VALUE_FACTORY.createLiteral("system"), VALUE_FACTORY.createIRI(predAtLocation));
        deleteActivity.addInvalidated(entity);
        deleteActivity.getModel().addAll(entity.getModel());

        DeleteActivity result = utils.startDeleteActivity(user, VALUE_FACTORY.createIRI(recordIri));
        verify(provenanceService).createActivity(any(ActivityConfig.class));
        verify(provenanceService).addActivity(any(DeleteActivity.class));
        verify(mobi).getServerIdentifier();
        assertTrue(result.getModel().contains(deleteActivity.getResource(), VALUE_FACTORY.createIRI(Activity.startedAtTime_IRI), null));
        assertTrue(result.getModel().contains(deleteActivity.getResource(), VALUE_FACTORY.createIRI(predAtLocation), VALUE_FACTORY.createLiteral(mobi.getServerIdentifier().toString())));
        assertEquals(1, deleteActivity.getInvalidated().size());
        Entity resultEntity = deleteActivity.getInvalidated().iterator().next();
        assertEquals(entity.getResource(), resultEntity.getResource());
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), VALUE_FACTORY.createIRI(Entity.generatedAtTime_IRI), null));
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), VALUE_FACTORY.createIRI(predAtLocation), VALUE_FACTORY.createLiteral("system")));
    }

    @Test(expected = IllegalStateException.class)
    public void startDeleteActivityWithNoDeleteActivityTest() {
        // Setup:
        Activity activity1 = activityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity"));
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(activity1);

        utils.startDeleteActivity(user, VALUE_FACTORY.createIRI(recordIri));
    }

    @Test
    public void startDeleteActivityWithNoEntityTest() {
        // Setup:
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(deleteActivity);
        Entity newEntity = entityFactory.createNew(VALUE_FACTORY.createIRI(recordIri));
        newEntity.addProperty(VALUE_FACTORY.createLiteral("system"), VALUE_FACTORY.createIRI(predAtLocation));
        deleteActivity.addInvalidated(newEntity);
        deleteActivity.getModel().addAll(newEntity.getModel());
        when(RepositoryResults.asModel(resultEntity, MODEL_FACTORY)).thenReturn(MODEL_FACTORY.createModel());

        DeleteActivity result = utils.startDeleteActivity(user, VALUE_FACTORY.createIRI(recordIri));
        verify(provenanceService).createActivity(any(ActivityConfig.class));
        verify(provenanceService).addActivity(any(DeleteActivity.class));
        verify(mobi).getServerIdentifier();
        assertTrue(result.getModel().contains(deleteActivity.getResource(), VALUE_FACTORY.createIRI(Activity.startedAtTime_IRI), null));
        assertTrue(result.getModel().contains(deleteActivity.getResource(), VALUE_FACTORY.createIRI(predAtLocation), VALUE_FACTORY.createLiteral(mobi.getServerIdentifier().toString())));
        assertEquals(1, deleteActivity.getInvalidated().size());
        Entity resultEntity = deleteActivity.getInvalidated().iterator().next();
        assertEquals(newEntity.getResource(), resultEntity.getResource());
        assertFalse(resultEntity.getModel().contains(resultEntity.getResource(), VALUE_FACTORY.createIRI(Entity.generatedAtTime_IRI), null));
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), VALUE_FACTORY.createIRI(predAtLocation), VALUE_FACTORY.createLiteral("system")));
    }

    @Test
    public void endDeleteActivityTest() throws Exception {
        // Setup
        entity.addProperty(VALUE_FACTORY.createLiteral("system"), VALUE_FACTORY.createIRI(predAtLocation));
        deleteActivity.addInvalidated(entity);
        deleteActivity.getModel().addAll(entity.getModel());

        utils.endDeleteActivity(deleteActivity, record);
        verify(provenanceService).updateActivity(deleteActivity);
        assertTrue(deleteActivity.getModel().contains(deleteActivity.getResource(), VALUE_FACTORY.createIRI(Activity.endedAtTime_IRI), null));
        assertEquals(1, deleteActivity.getInvalidated().size());
        Entity resultEntity = deleteActivity.getInvalidated().iterator().next();
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), VALUE_FACTORY.createIRI(Entity.invalidatedAtTime_IRI), null));
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), VALUE_FACTORY.createIRI(_Thing.title_IRI), VALUE_FACTORY.createLiteral("Test Record")));
    }

    @Test
    public void removeActivityTest() throws Exception {
        utils.removeActivity(createActivity);
        verify(provenanceService).deleteActivity(createActivity.getResource());
    }

    @Test
    public void removeActivityWithNullTest() throws Exception {
        utils.removeActivity(null);
        verify(provenanceService, times(0)).deleteActivity(any(Resource.class));
    }
}

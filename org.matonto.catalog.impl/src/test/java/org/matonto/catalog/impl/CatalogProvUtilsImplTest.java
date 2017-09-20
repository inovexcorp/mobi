package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
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
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.ontologies.provo.Activity;
import org.matonto.ontologies.provo.ActivityFactory;
import org.matonto.ontologies.provo.Entity;
import org.matonto.ontologies.provo.EntityFactory;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.platform.config.api.server.MatOnto;
import org.matonto.prov.api.ProvenanceService;
import org.matonto.prov.api.builder.ActivityConfig;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivity;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivityFactory;
import org.matonto.prov.api.ontologies.mobiprov.DeleteActivity;
import org.matonto.prov.api.ontologies.mobiprov.DeleteActivityFactory;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DateValueConverter;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.util.UUID;

@RunWith(PowerMockRunner.class)
@PrepareForTest(RepositoryResults.class)
public class CatalogProvUtilsImplTest {
    private static final String recordIri = "http://test.org/record";
    private static final String predAtLocation = "http://www.w3.org/ns/prov#atLocation";

    private CatalogProvUtilsImpl utils = new CatalogProvUtilsImpl();
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private ActivityFactory activityFactory= new ActivityFactory();
    private CreateActivityFactory createActivityFactory = new CreateActivityFactory();
    private DeleteActivityFactory deleteActivityFactory = new DeleteActivityFactory();
    private EntityFactory entityFactory = new EntityFactory();
    private UserFactory userFactory = new UserFactory();
    private RecordFactory recordFactory = new RecordFactory();
    private Record record;
    private CreateActivity createActivity;
    private DeleteActivity deleteActivity;
    private Entity entity;
    private User user;

    @Mock
    private MatOnto matOnto;

    @Mock
    private Repository repository;

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

        recordFactory.setModelFactory(mf);
        recordFactory.setValueFactory(vf);
        recordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(recordFactory);

        activityFactory.setModelFactory(mf);
        activityFactory.setValueFactory(vf);
        activityFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(activityFactory);

        createActivityFactory.setModelFactory(mf);
        createActivityFactory.setValueFactory(vf);
        createActivityFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(createActivityFactory);

        deleteActivityFactory = new DeleteActivityFactory();
        deleteActivityFactory.setModelFactory(mf);
        deleteActivityFactory.setValueFactory(vf);
        deleteActivityFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(deleteActivityFactory);

        entityFactory.setModelFactory(mf);
        entityFactory.setValueFactory(vf);
        entityFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(entityFactory);

        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(userFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());
        vcr.registerValueConverter(new DateValueConverter());

        createActivity = createActivityFactory.createNew(vf.createIRI("http://test.org/activity/create"));
        deleteActivity = deleteActivityFactory.createNew(vf.createIRI("http://test.org/activity/delete"));
        entity = entityFactory.createNew(vf.createIRI(recordIri));
        user = userFactory.createNew(vf.createIRI("http://test.org/user"));

        when(matOnto.getServerIdentifier()).thenReturn(UUID.randomUUID());
        when(catalogManager.getRepositoryId()).thenReturn("system");

        IRI recordIRI = vf.createIRI(recordIri);

        PowerMockito.mockStatic(RepositoryResults.class);

        when(provenanceService.getConnection()).thenReturn(connProv);
        when(connProv.getStatements(recordIRI, null, null)).thenReturn(resultEntity);
        when(RepositoryResults.asModel(resultEntity, mf)).thenReturn(entity.getModel());

        record = recordFactory.createNew(recordIRI);
        record.setProperty(vf.createLiteral("Test Record"), vf.createIRI(_Thing.title_IRI));

        utils.setCreateActivityFactory(createActivityFactory);
        utils.setDeleteActivityFactory(deleteActivityFactory);
        utils.setEntityFactory(entityFactory);
        utils.setVf(vf);
        utils.setMatOnto(matOnto);
        utils.setProvenanceService(provenanceService);
        utils.setCatalogManager(catalogManager);
        utils.setModelFactory(mf);
    }

    @Test
    public void startCreateActivityTest() throws Exception {
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(createActivity);
        CreateActivity result = utils.startCreateActivity(user);
        verify(provenanceService).createActivity(any(ActivityConfig.class));
        verify(provenanceService).addActivity(createActivity);
        verify(matOnto).getServerIdentifier();
        assertTrue(result.getModel().contains(createActivity.getResource(), vf.createIRI(Activity.startedAtTime_IRI), null));
        assertTrue(result.getModel().contains(createActivity.getResource(), vf.createIRI(predAtLocation), null));
    }

    @Test(expected = IllegalStateException.class)
    public void startCreateActivityWithNoCreateActivityTest() {
        // Setup:
        Activity activity1 = activityFactory.createNew(vf.createIRI("http://test.org/activity"));
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(activity1);

        utils.startCreateActivity(user);
    }

    @Test
    public void endCreateActivityTest() throws Exception {
        // Setup:
        Resource recordIRI = vf.createIRI(recordIri);

        utils.endCreateActivity(createActivity, recordIRI);
        verify(provenanceService).updateActivity(createActivity);
        assertTrue(createActivity.getModel().contains(createActivity.getResource(), vf.createIRI(Activity.endedAtTime_IRI), null));
        assertEquals(1, createActivity.getGenerated().size());
        Entity resultEntity = createActivity.getGenerated().iterator().next();
        assertEquals(vf.createIRI(recordIri), resultEntity.getResource());
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), vf.createIRI(Entity.generatedAtTime_IRI), null));
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), vf.createIRI(predAtLocation), vf.createLiteral("system")));
    }

    @Test
    public void startDeleteActivityTest() throws Exception {
        // Setup
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(deleteActivity);
        entity.addProperty(vf.createLiteral("system"), vf.createIRI(predAtLocation));

        DeleteActivity result = utils.startDeleteActivity(user, vf.createIRI(recordIri));
        verify(provenanceService).createActivity(any(ActivityConfig.class));
        verify(provenanceService).addActivity(any(DeleteActivity.class));
        verify(matOnto).getServerIdentifier();
        assertTrue(result.getModel().contains(deleteActivity.getResource(), vf.createIRI(Activity.startedAtTime_IRI), null));
        assertTrue(result.getModel().contains(deleteActivity.getResource(), vf.createIRI(predAtLocation), vf.createLiteral(matOnto.getServerIdentifier().toString())));
        assertEquals(1, deleteActivity.getInvalidated().size());
        Entity resultEntity = deleteActivity.getInvalidated().iterator().next();
        assertEquals(entity.getResource(), resultEntity.getResource());
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), vf.createIRI(predAtLocation), vf.createLiteral("system")));
    }

    @Test(expected = IllegalStateException.class)
    public void startDeleteActivityWithNoDeleteActivityTest() {
        // Setup:
        Activity activity1 = activityFactory.createNew(vf.createIRI("http://test.org/activity"));
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(activity1);

        utils.startDeleteActivity(user, vf.createIRI(recordIri));
    }

    @Test
    public void endDeleteActivityTest() throws Exception {
        // Setup
        entity.addProperty(vf.createLiteral("system"), vf.createIRI(predAtLocation));
        deleteActivity.addInvalidated(entity);
        deleteActivity.getModel().addAll(entity.getModel());

        utils.endDeleteActivity(deleteActivity, record);
        verify(provenanceService).updateActivity(deleteActivity);
        assertTrue(deleteActivity.getModel().contains(deleteActivity.getResource(), vf.createIRI(Activity.endedAtTime_IRI), null));
        assertEquals(1, deleteActivity.getInvalidated().size());
        Entity resultEntity = deleteActivity.getInvalidated().iterator().next();
        assertTrue(resultEntity.getModel().contains(resultEntity.getResource(), vf.createIRI(_Thing.title_IRI), vf.createLiteral("Test Record")));
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

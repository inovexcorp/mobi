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
import org.matonto.catalog.api.CatalogManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontologies.provo.Activity;
import org.matonto.ontologies.provo.ActivityFactory;
import org.matonto.ontologies.provo.Entity;
import org.matonto.ontologies.provo.EntityFactory;
import org.matonto.platform.config.api.server.MatOnto;
import org.matonto.prov.api.ProvenanceService;
import org.matonto.prov.api.builder.ActivityConfig;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivity;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivityFactory;
import org.matonto.prov.api.ontologies.mobiprov.DeleteActivity;
import org.matonto.prov.api.ontologies.mobiprov.DeleteActivityFactory;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
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
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.UUID;

public class CatalogProvUtilsImplTest {
    private CatalogProvUtilsImpl utils = new CatalogProvUtilsImpl();
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private ActivityFactory activityFactory= new ActivityFactory();
    private CreateActivityFactory createActivityFactory = new CreateActivityFactory();
    private DeleteActivityFactory deleteActivityFactory;
    private EntityFactory entityFactory = new EntityFactory();
    private UserFactory userFactory = new UserFactory();

    private CreateActivity createActivity;
    private DeleteActivity deleteActivity;
    private User user;

    @Mock
    private MatOnto matOnto;

    @Mock
    private ProvenanceService provenanceService;

    @Mock
    private CatalogManager catalogManager;

    @Before
    public void setUp() throws Exception {
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
        deleteActivity = deleteActivityFactory.createNew(vf.createIRI("http://test.org/activity/create"));
        user = userFactory.createNew(vf.createIRI("http://test.org/user"));

        MockitoAnnotations.initMocks(this);

        when(matOnto.getServerIdentifier()).thenReturn(UUID.randomUUID());
        when(catalogManager.getRepositoryId()).thenReturn("system");

        utils.setCreateActivityFactory(createActivityFactory);
        utils.setDeleteActivityFactory(deleteActivityFactory);
        utils.setEntityFactory(entityFactory);
        utils.setVf(vf);
        utils.setMatOnto(matOnto);
        utils.setProvenanceService(provenanceService);
        utils.setCatalogManager(catalogManager);
    }

    @Test
    public void startCreateActivityTest() throws Exception {
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(createActivity);
        CreateActivity result = utils.startCreateActivity(user);
        verify(provenanceService).createActivity(any(ActivityConfig.class));
        verify(provenanceService).addActivity(createActivity);
        verify(matOnto).getServerIdentifier();
        assertTrue(result.getModel().contains(createActivity.getResource(), vf.createIRI(Activity.startedAtTime_IRI), null));
        assertTrue(result.getModel().contains(createActivity.getResource(), vf.createIRI("http://www.w3.org/ns/prov#atLocation"), null));
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
        Resource recordIRI = vf.createIRI("http://test.org/record");

        utils.endCreateActivity(createActivity, recordIRI);
        verify(provenanceService).updateActivity(createActivity);
        assertTrue(createActivity.getModel().contains(createActivity.getResource(), vf.createIRI(Activity.endedAtTime_IRI), null));
        assertEquals(1, createActivity.getGenerated().size());
        Entity entity = createActivity.getGenerated().iterator().next();
        assertEquals(recordIRI, entity.getResource());
        assertTrue(entity.getModel().contains(entity.getResource(), vf.createIRI(Entity.generatedAtTime_IRI), null));
        assertTrue(entity.getModel().contains(entity.getResource(), vf.createIRI("http://www.w3.org/ns/prov#atLocation"), vf.createLiteral("system")));
    }

    @Test
    public void startDeleteActivityTest() throws Exception {
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(deleteActivity);
        DeleteActivity result = utils.startDeleteActivity(user);
        verify(provenanceService).createActivity(any(ActivityConfig.class));
        verify(provenanceService).addActivity(deleteActivity);
        verify(matOnto).getServerIdentifier();
        assertTrue(result.getModel().contains(deleteActivity.getResource(), vf.createIRI(Activity.startedAtTime_IRI), null));
        assertTrue(result.getModel().contains(deleteActivity.getResource(), vf.createIRI("http://www.w3.org/ns/prov#atLocation"), null));
    }

    @Test(expected = IllegalStateException.class)
    public void startDeleteActivityWithNoDeleteActivityTest() {
        // Setup:
        Activity activity1 = activityFactory.createNew(vf.createIRI("http://test.org/activity"));
        when(provenanceService.createActivity(any(ActivityConfig.class))).thenReturn(activity1);

        utils.startDeleteActivity(user);
    }

    @Test
    public void endDeleteActivityTest() throws Exception {
        // Setup:
        Resource recordIRI = vf.createIRI("http://test.org/record");

        utils.endDeleteActivity(deleteActivity, recordIRI);
        verify(provenanceService).updateActivity(deleteActivity);
        assertTrue(deleteActivity.getModel().contains(deleteActivity.getResource(), vf.createIRI(Activity.endedAtTime_IRI), null));
        assertEquals(1, deleteActivity.getInvalidated().size());
        Entity entity = deleteActivity.getInvalidated().iterator().next();
        assertEquals(recordIRI, entity.getResource());
        assertTrue(entity.getModel().contains(entity.getResource(), vf.createIRI(Entity.generatedAtTime_IRI), null));
        assertTrue(entity.getModel().contains(entity.getResource(), vf.createIRI("http://www.w3.org/ns/prov#atLocation"), vf.createLiteral("system")));
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

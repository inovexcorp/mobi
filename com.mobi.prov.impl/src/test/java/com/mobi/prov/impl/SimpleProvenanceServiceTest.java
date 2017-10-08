package com.mobi.prov.impl;

/*-
 * #%L
 * com.mobi.prov.impl
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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.EntityFactory;
import com.mobi.persistence.utils.ReadOnlyRepositoryConnection;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import junit.framework.TestCase;
import org.junit.Before;
import org.junit.Test;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.ActivityFactory;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.provo.EntityFactory;
import com.mobi.persistence.utils.ReadOnlyRepositoryConnection;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
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
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.util.Collections;
import java.util.Optional;

public class SimpleProvenanceServiceTest {

    private Repository repo;
    private SimpleProvenanceService service;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private UserFactory userFactory;
    private ActivityFactory activityFactory;
    private EntityFactory entityFactory;

    private IRI activityIRI;

    @Mock
    private OrmFactoryRegistry registry;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        userFactory = new UserFactory();
        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(userFactory);

        activityFactory = new ActivityFactory();
        activityFactory.setModelFactory(mf);
        activityFactory.setValueFactory(vf);
        activityFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(activityFactory);

        entityFactory = new EntityFactory();
        entityFactory.setModelFactory(mf);
        entityFactory.setValueFactory(vf);
        entityFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(entityFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        activityIRI = vf.createIRI("http://test.com/activity");

        MockitoAnnotations.initMocks(this);
        when(registry.getFactoriesOfType(Activity.class)).thenReturn(Collections.singletonList(activityFactory));

        service = new SimpleProvenanceService();
        service.setRepo(repo);
        service.setVf(vf);
        service.setMf(mf);
        service.setActivityFactory(activityFactory);
        service.setFactoryRegistry(registry);
    }

    @Test
    public void getConnectionTest() throws Exception {
        RepositoryConnection conn = service.getConnection();
        assertTrue(conn instanceof ReadOnlyRepositoryConnection);
    }

    @Test
    public void createActivityTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://test.com/user"));
        Entity generated = entityFactory.createNew(vf.createIRI("http://test.com/generated"));
        Entity invalidated = entityFactory.createNew(vf.createIRI("http://test.com/invalidated"));
        Entity used = entityFactory.createNew(vf.createIRI("http://test.com/used"));
        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(Activity.class), user)
                .generatedEntity(generated)
                .invalidatedEntity(invalidated)
                .usedEntity(used)
                .build();

        Activity result = service.createActivity(config);
        assertEquals(1, result.getWasAssociatedWith_resource().size());
        TestCase.assertEquals(user.getResource(), result.getWasAssociatedWith_resource().iterator().next());
        assertEquals(1, result.getGenerated().size());
        assertTrue(result.getModel().containsAll(generated.getModel()));
        assertEquals(1, result.getInvalidated().size());
        assertTrue(result.getModel().containsAll(invalidated.getModel()));
        assertEquals(1, result.getUsed().size());
        assertTrue(result.getModel().containsAll(used.getModel()));
    }

    @Test
    public void addActivityTest() throws Exception {
        // Setup:
        Activity activity = activityFactory.createNew(activityIRI);

        service.addActivity(activity);
        try (RepositoryConnection conn = repo.getConnection()) {
            activity.getModel().forEach(statement -> conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void addActivityThatAlreadyExistsTest() throws Exception {
        // Setup:
        Activity activity = activityFactory.createNew(activityIRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(activity.getModel());
        }

        service.addActivity(activity);
    }

    @Test
    public void getActivityTest() throws Exception {
        // Setup:
        Activity activity = activityFactory.createNew(activityIRI);
        Entity generated = entityFactory.createNew(vf.createIRI("http://test.com/generated"), activity.getModel());
        Entity invalidated = entityFactory.createNew(vf.createIRI("http://test.com/invalidated"), activity.getModel());
        Entity used = entityFactory.createNew(vf.createIRI("http://test.com/used"), activity.getModel());
        activity.setGenerated(Collections.singleton(generated));
        activity.setInvalidated(Collections.singleton(invalidated));
        activity.setUsed(Collections.singleton(used));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(activity.getModel());
        }

        Optional<Activity> result = service.getActivity(activity.getResource());
        assertTrue(result.isPresent());
        result.get().getModel().forEach(statement -> assertTrue(activity.getModel().contains(statement)));
    }

    @Test
    public void getActivityThatDoesNotExistTest() throws Exception {
        Optional<Activity> result = service.getActivity(activityIRI);
        assertFalse(result.isPresent());
    }

    @Test
    public void updateActivityTest() throws Exception {
        // Setup:
        IRI titleIRI = vf.createIRI(_Thing.title_IRI);
        Activity activity = activityFactory.createNew(activityIRI);
        Entity generated = entityFactory.createNew(vf.createIRI("http://test.com/generated"), activity.getModel());
        Entity invalidated = entityFactory.createNew(vf.createIRI("http://test.com/invalidated"), activity.getModel());
        Entity used = entityFactory.createNew(vf.createIRI("http://test.com/used"), activity.getModel());
        activity.setGenerated(Collections.singleton(generated));
        activity.setInvalidated(Collections.singleton(invalidated));
        activity.setUsed(Collections.singleton(used));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(activity.getModel());
        }
        activity.addProperty(vf.createLiteral("Activity"), titleIRI);
        generated.addProperty(vf.createLiteral("Generated"), titleIRI);
        invalidated.addProperty(vf.createLiteral("Invalidated"), titleIRI);
        used.addProperty(vf.createLiteral("Used"), titleIRI);

        service.updateActivity(activity);
        try (RepositoryConnection conn = repo.getConnection()) {
            activity.getModel().forEach(statement -> conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void updateActivityThatDoesNotExistTest() {
        service.updateActivity(activityFactory.createNew(vf.createIRI("http://test.com/missing")));
    }

    @Test(expected = IllegalStateException.class)
    public void updateActivityThatIsNotAnActivityTest() {
        // Setup:
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(activityIRI, vf.createIRI(_Thing.title_IRI), vf.createLiteral("Title"));
        }

        service.updateActivity(activityFactory.createNew(activityIRI));
    }

    @Test
    public void deleteActivityTest() throws Exception {
        // Setup:
        Activity toRemove = activityFactory.createNew(activityIRI);
        Activity other = activityFactory.createNew(vf.createIRI("http://test.com/other"));
        Entity generated1 = entityFactory.createNew(vf.createIRI("http://test.com/generated/1"));
        Entity invalidated1 = entityFactory.createNew(vf.createIRI("http://test.com/invalidated/1"));
        Entity used1 = entityFactory.createNew(vf.createIRI("http://test.com/used/1"));
        Entity generated2 = entityFactory.createNew(vf.createIRI("http://test.com/generated/2"));
        Entity invalidated2 = entityFactory.createNew(vf.createIRI("http://test.com/invalidated/2"));
        Entity used2 = entityFactory.createNew(vf.createIRI("http://test.com/used/2"));
        toRemove.setGenerated(Collections.singleton(generated1));
        toRemove.setInvalidated(Collections.singleton(invalidated1));
        toRemove.setUsed(Collections.singleton(used1));
        toRemove.setGenerated(Collections.singleton(generated2));
        toRemove.setInvalidated(Collections.singleton(invalidated2));
        toRemove.setUsed(Collections.singleton(used2));
        other.setGenerated(Collections.singleton(generated1));
        other.setInvalidated(Collections.singleton(invalidated1));
        other.setUsed(Collections.singleton(used1));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(toRemove.getModel());
            conn.add(generated1.getModel());
            conn.add(invalidated1.getModel());
            conn.add(used1.getModel());
            conn.add(generated2.getModel());
            conn.add(invalidated2.getModel());
            conn.add(used2.getModel());
            conn.add(other.getModel());
        }

        service.deleteActivity(activityIRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            toRemove.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            generated1.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            invalidated1.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            used1.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            generated2.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            invalidated2.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            used2.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            other.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }
}

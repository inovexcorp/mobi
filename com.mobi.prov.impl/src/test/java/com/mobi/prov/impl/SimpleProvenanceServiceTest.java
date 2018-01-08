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

import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.persistence.utils.ReadOnlyRepositoryConnection;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import junit.framework.TestCase;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.util.Collections;
import java.util.Optional;

public class SimpleProvenanceServiceTest extends OrmEnabledTestCase {

    private Repository repo;
    private SimpleProvenanceService service;
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<Activity> activityFactory = getRequiredOrmFactory(Activity.class);
    private OrmFactory<Entity> entityFactory = getRequiredOrmFactory(Entity.class);

    private IRI activityIRI;

    @Mock
    private OrmFactoryRegistry registry;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        activityIRI = VALUE_FACTORY.createIRI("http://test.com/activity");

        MockitoAnnotations.initMocks(this);
        when(registry.getFactoriesOfType(Activity.class)).thenReturn(Collections.singletonList(activityFactory));

        service = new SimpleProvenanceService();
        injectOrmFactoryReferencesIntoService(service);
        service.setRepo(repo);
        service.setVf(VALUE_FACTORY);
        service.setMf(MODEL_FACTORY);
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
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Entity generated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated"));
        Entity invalidated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated"));
        Entity used = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used"));
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
        Entity generated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated"), activity.getModel());
        Entity invalidated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated"), activity.getModel());
        Entity used = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used"), activity.getModel());
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
        IRI titleIRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);
        Activity activity = activityFactory.createNew(activityIRI);
        Entity generated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated"), activity.getModel());
        Entity invalidated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated"), activity.getModel());
        Entity used = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used"), activity.getModel());
        activity.setGenerated(Collections.singleton(generated));
        activity.setInvalidated(Collections.singleton(invalidated));
        activity.setUsed(Collections.singleton(used));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(activity.getModel());
        }
        activity.addProperty(VALUE_FACTORY.createLiteral("Activity"), titleIRI);
        generated.addProperty(VALUE_FACTORY.createLiteral("Generated"), titleIRI);
        invalidated.addProperty(VALUE_FACTORY.createLiteral("Invalidated"), titleIRI);
        used.addProperty(VALUE_FACTORY.createLiteral("Used"), titleIRI);

        service.updateActivity(activity);
        try (RepositoryConnection conn = repo.getConnection()) {
            activity.getModel().forEach(statement -> conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void updateActivityThatDoesNotExistTest() {
        service.updateActivity(activityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/missing")));
    }

    @Test(expected = IllegalStateException.class)
    public void updateActivityThatIsNotAnActivityTest() {
        // Setup:
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(activityIRI, VALUE_FACTORY.createIRI(_Thing.title_IRI), VALUE_FACTORY.createLiteral("Title"));
        }

        service.updateActivity(activityFactory.createNew(activityIRI));
    }

    @Test
    public void deleteActivityTest() throws Exception {
        // Setup:
        Activity toRemove = activityFactory.createNew(activityIRI);
        Activity other = activityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/other"));
        Entity generated1 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated/1"));
        Entity invalidated1 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated/1"));
        Entity used1 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used/1"));
        Entity generated2 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated/2"));
        Entity invalidated2 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated/2"));
        Entity used2 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used/2"));
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

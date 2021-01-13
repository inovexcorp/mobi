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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.notification.impl.SimpleNotificationService;
import com.mobi.notification.impl.ontologies.EmailNotificationPreference;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.shacl.Shape;
import com.mobi.persistence.utils.ReadOnlyRepositoryConnection;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.PreferenceFactory;
import com.mobi.preference.api.ontologies.PreferenceImpl;
import com.mobi.preference.api.ontologies.Prefix;
import com.mobi.preference.api.ontologies.PrefixFactory;
import com.mobi.preference.api.ontologies.PrefixPreference;
import com.mobi.preference.api.ontologies.PrefixPreferenceImpl;
import com.mobi.preference.impl.SimplePreferenceService;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.AbstractOrmFactory;
import com.mobi.rdf.orm.OrmException;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.impl.OrmFactoryRegistryImpl;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.service.component.annotations.Reference;

import java.util.Collections;
import java.util.HashMap;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public class SimplePreferenceServiceTest extends OrmEnabledTestCase {

    private static final String PREFERENCE_NAMESPACE = "http://mobi.com/preference#";
    private Repository repo;
    private SimplePreferenceService service;
    private SimpleNotificationService notificationService;
    private OrmFactory<Preference> preferenceFactory = getRequiredOrmFactory(Preference.class);
    private OrmFactory<PrefixPreference> prefixPreferenceFactory = getRequiredOrmFactory(PrefixPreference.class);
    private OrmFactory<EmailNotificationPreference> emailNotificationPreferenceFactory = getRequiredOrmFactory(EmailNotificationPreference.class);
    private OrmFactory<Prefix> prefixFactory = getRequiredOrmFactory(Prefix.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private ValueConverterRegistry vcr;


    private IRI preferenceIRI;

    @Mock
    private OrmFactoryRegistry registry;

    private OrmFactoryRegistryImpl registryImpl;


    @Mock
    private CatalogConfigProvider configProvider;

    private interface ComplexPreference extends Preference, Thing {
        String TYPE = "http://example.com/ExampleComplexPrefererence";
    }

    static class ComplexPreferenceImpl extends PreferenceImpl implements Preference, Thing {
        public ComplexPreferenceImpl(Resource subjectIri, Model backingModel, ValueFactory valueFactory,
                                     ValueConverterRegistry valueConverterRegistry) {
            super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
        }

        public ComplexPreferenceImpl(String subjectIriStr, Model backingModel, ValueFactory valueFactory,
                                     ValueConverterRegistry valueConversionRegistry) {
            super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
        }
    }

//    @Mock
//    private ComplexPreference complexPreference;

//    public class ComplexPreferenceFactory
//            extends AbstractOrmFactory<ComplexPreference> {
//        /**
//         * Construct a new instance of an {@link AbstractOrmFactory}.
//         * Implementations will call this constructor.
//         *
//         * @param type The type we're building
//         * @param impl The implementation under the covers
//         * @throws OrmException If there is an issue constructing our {@link OrmFactory}
//         *                      instance
//         */
////        public ComplexPreferenceFactory(Class<ComplexPreference> type, Class<? extends ComplexPreference> impl) throws OrmException {
//            super(type, impl);
//        }
//
//        public ComplexPreferenceFactory() throws OrmException {
//            super(ComplexPreference.class, impl);
//        }
//
//        @Override
//        public Optional<ComplexPreference> getExisting(Resource resource, Model model, ValueFactory valueFactory,
//                                                       ValueConverterRegistry valueConverterRegistry) {
//            return Optional.empty();
//        }
//
//        @Override
//        public IRI getTypeIRI() {
//            return null;
//        }
//
//        @Override
//        public Set<IRI> getParentTypeIRIs() {
//            return null;
//        }
//    }
//
//        /**
//         * Construct a new instance of an {@link AbstractOrmFactory}.
//         * Implementations will call this constructor.
//         *
//         * @param type The type we're building
//         * @param impl The implementation under the covers
//         * @throws OrmException If there is an issue constructing our {@link OrmFactory}
//         *                      instance
//         */
////        public ComplexPreferenceFactory() throws OrmException {
////            super(ComplexPreference.class, ComplexPreferenceImpl.class);
////        }
//
//        @Override
//        public Optional<ComplexPreference> getExisting(Resource resource, Model model, ValueFactory valueFactory,
//                                                ValueConverterRegistry valueConverterRegistry) {
//            return Optional.empty();
//        }
//
//        @Override
//        public IRI getTypeIRI() {
//            return null;
//        }
//
//        @Override
//        public Set<IRI> getParentTypeIRIs() {
//            return null;
//        }
//    }
//
//    private ComplexPreferenceFactory complexPreferenceFactory;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        preferenceIRI = VALUE_FACTORY.createIRI("http://test.com/testPreference");

//        ComplexPreference complexPreference1 = (ComplexPreference) preferenceFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/something"));


        MockitoAnnotations.initMocks(this);

//        when(registry.getFactoriesOfType(User.class)).thenReturn(Collections.singletonList(userFactory));
//        when(registry.getFactoriesOfType(Preference.class)).thenReturn(Collections.singletonList(preferenceFactory));
//        when(registry.getFactoriesOfType(PrefixPreference.class)).thenReturn(Collections.singletonList(prefixPreferenceFactory));
//        when(registry.getFactoriesOfType(EmailNotificationPreference.class)).thenReturn(Collections.singletonList(emailNotificationPreferenceFactory));
//        when(registry.getFactoriesOfType(Prefix.class)).thenReturn(Collections.singletonList(prefixFactory));
//        when(registry.getFactoriesOfType(ComplexPreference.class)).thenReturn((Collections.singletonList(complexPreferenceFactory)));

//        when(complexPreferenceFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(ComplexPreference.TYPE));
//        when(complexPreferenceFactory.getType()).thenReturn(ComplexPreference.class);
//        doReturn(ComplexPreferenceImpl.class).when(complexPreferenceFactory).getImpl();
//        when(complexPreferenceFactory.getParentTypeIRIs()).thenReturn(Collections.emptySet());
//        when(complexPreferenceFactory.createNew(any())).thenReturn(new ComplexPreferenceImpl());

        when(configProvider.getRepository()).thenReturn(repo);

        service = new SimplePreferenceService();
        injectOrmFactoryReferencesIntoService(service);
        notificationService = new SimpleNotificationService();
        injectOrmFactoryReferencesIntoService(notificationService);
        service.vf =  VALUE_FACTORY;
        service.mf = MODEL_FACTORY;
        service.configProvider = configProvider;
        service.factoryRegistry = ORM_FACTORY_REGISTRY;
        service.start();
    }

//    @Test
//    public void getObjectValueTest() throws Exception {
//        PrefixPreference prefixPreference = prefixPreferenceFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/testPrefixPref"));
//
//        Prefix prefix = prefixFactory.createNew(VALUE_FACTORY.createIRI(PREFERENCE_NAMESPACE + UUID.randomUUID()));
//        prefix.setHasNamespace("http://www.w3.org/2004/02/skos/core#");
//        prefix.setHasPrefix("skos");
//        prefixPreference.addHasObjectValue(prefix);
//        User adminUser = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"));
//
////        final Set<Value> value = prefixPreference.getProperties(prefixPreference.getValueFactory().createIRI(Preference.hasObjectValue_IRI));
////        vcr = new DefaultValueConverterRegistry();
//
////        mergeRequestFactory = new MergeRequestFactory();
////        mergeRequestFactory.setModelFactory(mf);
////        mergeRequestFactory.setValueFactory(vf);
////        mergeRequestFactory.setValueConverterRegistry(vcr);
////        vcr.registerValueConverter(mergeRequestFactory);
////        PrefixFactory secondPrefixFactory = new PrefixFactory();
////        vcr.convertValues(value, prefixPreference, Prefix.class);
//
//        assertTrue(prefixPreference.getHasObjectValue().contains(prefix));
//
//    }

//    @Test
//    public void getConnectionTest() throws Exception {
//        RepositoryConnection conn = service.getConnection();
//        assertTrue(conn instanceof ReadOnlyRepositoryConnection);
//    }

//    @Test
//    public void createPreferenceTest() throws Exception {
//        // Setup:
//        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
//        Prefix prefix = prefixFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/prefix"));
//
//        Preference preference = prefixPreferenceFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/testPreference"));
//        preference.addForUser(user);
//        preference.addHasObjectValue(prefix);
//
//
//    }
//
//    @Test
//    public void createActivityTest() throws Exception {
//        // Setup:
//        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
//        Entity generated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated"));
//        Entity invalidated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated"));
//        Entity used = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used"));
//        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(Activity.class), user)
//                .generatedEntity(generated)
//                .invalidatedEntity(invalidated)
//                .usedEntity(used)
//                .build();
//
//        Activity result = service.createActivity(config);
//        assertEquals(1, result.getWasAssociatedWith_resource().size());
//        TestCase.assertEquals(user.getResource(), result.getWasAssociatedWith_resource().iterator().next());
//        assertEquals(1, result.getGenerated().size());
//        assertTrue(result.getModel().containsAll(generated.getModel()));
//        assertEquals(1, result.getInvalidated().size());
//        assertTrue(result.getModel().containsAll(invalidated.getModel()));
//        assertEquals(1, result.getUsed().size());
//        assertTrue(result.getModel().containsAll(used.getModel()));
//    }
//
//    @Test
//    public void addActivityTest() throws Exception {
//        // Setup:
//        Activity activity = activityFactory.createNew(activityIRI);
//
//        service.addActivity(activity);
//        try (RepositoryConnection conn = repo.getConnection()) {
//            activity.getModel().forEach(statement -> conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
//        }
//    }

    @Test
    public void addPreferenceWithObjectValueTest() throws Exception {
        EmailNotificationPreference emailNotificationPreference = emailNotificationPreferenceFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com"));
        Set<Value> properties = emailNotificationPreference.getProperties(VALUE_FACTORY.createIRI(Shape.property_IRI));


        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Prefix prefix = prefixFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/prefix"));
        Preference preference = prefixPreferenceFactory.createNew(preferenceIRI);
        preference.getModel().addAll(prefix.getModel());
        preference.addHasObjectValue(prefix);

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void addPreferenceWithDataValueTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Preference preference = emailNotificationPreferenceFactory.createNew(preferenceIRI);
        preference.setHasDataValue(VALUE_FACTORY.createLiteral(true));

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void addPreferenceWithExistingPreferenceTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Preference preference = emailNotificationPreferenceFactory.createNew(preferenceIRI);
        preference.setHasDataValue(VALUE_FACTORY.createLiteral(true));
        repo.getConnection().add(preference.getModel(), VALUE_FACTORY.createIRI(PreferenceService.GRAPH));
        service.addPreference(user, preference);
    }


    @Test(expected = IllegalArgumentException.class)
    public void addPreferenceWithExistingPreferenceTypeTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Preference preference = emailNotificationPreferenceFactory.createNew(preferenceIRI);
        preference.setHasDataValue(VALUE_FACTORY.createLiteral(true));
        service.addPreference(user, preference);


        Preference preference2 = emailNotificationPreferenceFactory.createNew(preferenceIRI);
        preference2.setHasDataValue(VALUE_FACTORY.createLiteral(false));
        service.addPreference(user, preference2);
    }

    // TODO: Add test where it prevents user injection




    @Test
    public void validatePreferenceTest() throws Exception {
        Prefix prefix = prefixFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/prefix"));
        Preference preference = prefixPreferenceFactory.createNew(preferenceIRI);
        preference.getModel().addAll(prefix.getModel());
        preference.addHasObjectValue(prefix);
        service.validatePreference(preference); // Should not throw exception
    }

    @Test(expected = IllegalArgumentException.class)
    public void validatePreferenceWithoutReferenceTest() throws Exception {
        Prefix prefix = prefixFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/prefix"));
        Preference preference = prefixPreferenceFactory.createNew(preferenceIRI);
        preference.addHasObjectValue(prefix);
        service.validatePreference(preference);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validatePreferenceWithoutValueTest() throws Exception {
        Preference preference = prefixPreferenceFactory.createNew(preferenceIRI);
        service.validatePreference(preference);
    }


//
//    @Test(expected = IllegalArgumentException.class)
//    public void addActivityThatAlreadyExistsTest() throws Exception {
//        // Setup:
//        Activity activity = activityFactory.createNew(activityIRI);
//        try (RepositoryConnection conn = repo.getConnection()) {
//            conn.add(activity.getModel());
//        }
//
//        service.addActivity(activity);
//    }

    @Test
    public void getUserPreferenceTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Prefix prefix = prefixFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/prefix"));
        Preference preference = prefixPreferenceFactory.createNew(preferenceIRI);
        preference.getModel().addAll(prefix.getModel());
        preference.addHasObjectValue(prefix);

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }

        Preference retrievedPreference = service.getUserPreference(user, VALUE_FACTORY.createIRI(PrefixPreference.TYPE)).get();
        Model retrievedPreferenceModel = retrievedPreference.getModel();
        retrievedPreferenceModel.contains(preferenceIRI, VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource());

        preference.getModel().forEach(statement -> assertTrue(retrievedPreference.getModel().contains(statement)));
    }

    @Test
    public void getUserPreferenceThatDoesNotExistTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Optional<Preference> retrievedPreference = service.getUserPreference(user, VALUE_FACTORY.createIRI(EmailNotificationPreference.TYPE));
        assertFalse(retrievedPreference.isPresent());
    }

    // TODO: test for Preference when multiple preferences of the same type exist in the repo. Assert RepositoryException

    @Test
    public void getUserPreferencesTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Prefix prefix = prefixFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/prefix"));
        Preference firstPreference = prefixPreferenceFactory.createNew(preferenceIRI);
        firstPreference.getModel().addAll(prefix.getModel());
        firstPreference.addHasObjectValue(prefix);

        service.addPreference(user, firstPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }

//        Preference secondPreference = emailNotificationPreferenceFactory.createNew()

    }

//
//    @Test
//    public void getActivityTest() throws Exception {
//        // Setup:
//        Activity activity = activityFactory.createNew(activityIRI);
//        Entity generated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated"), activity.getModel());
//        Entity invalidated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated"), activity.getModel());
//        Entity used = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used"), activity.getModel());
//        activity.setGenerated(Collections.singleton(generated));
//        activity.setInvalidated(Collections.singleton(invalidated));
//        activity.setUsed(Collections.singleton(used));
//        try (RepositoryConnection conn = repo.getConnection()) {
//            conn.add(activity.getModel());
//        }
//
//        Optional<Activity> result = service.getActivity(activity.getResource());
//        assertTrue(result.isPresent());
//        result.get().getModel().forEach(statement -> assertTrue(activity.getModel().contains(statement)));
//    }
//
//    @Test
//    public void getActivityThatDoesNotExistTest() throws Exception {
//        Optional<Activity> result = service.getActivity(activityIRI);
//        assertFalse(result.isPresent());
//    }
//
//    @Test
//    public void updateActivityTest() throws Exception {
//        // Setup:
//        IRI titleIRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);
//        Activity activity = activityFactory.createNew(activityIRI);
//        Entity generated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated"), activity.getModel());
//        Entity invalidated = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated"), activity.getModel());
//        Entity used = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used"), activity.getModel());
//        activity.setGenerated(Collections.singleton(generated));
//        activity.setInvalidated(Collections.singleton(invalidated));
//        activity.setUsed(Collections.singleton(used));
//        try (RepositoryConnection conn = repo.getConnection()) {
//            conn.add(activity.getModel());
//        }
//        activity.addProperty(VALUE_FACTORY.createLiteral("Activity"), titleIRI);
//        generated.addProperty(VALUE_FACTORY.createLiteral("Generated"), titleIRI);
//        invalidated.addProperty(VALUE_FACTORY.createLiteral("Invalidated"), titleIRI);
//        used.addProperty(VALUE_FACTORY.createLiteral("Used"), titleIRI);
//
//        service.updateActivity(activity);
//        try (RepositoryConnection conn = repo.getConnection()) {
//            activity.getModel().forEach(statement -> conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
//        }
//    }
//
//    @Test(expected = IllegalArgumentException.class)
//    public void updateActivityThatDoesNotExistTest() {
//        service.updateActivity(activityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/missing")));
//    }
//
//    @Test(expected = IllegalStateException.class)
//    public void updateActivityThatIsNotAnActivityTest() {
//        // Setup:
//        try (RepositoryConnection conn = repo.getConnection()) {
//            conn.add(activityIRI, VALUE_FACTORY.createIRI(_Thing.title_IRI), VALUE_FACTORY.createLiteral("Title"));
//        }
//
//        service.updateActivity(activityFactory.createNew(activityIRI));
//    }
//
//    @Test
//    public void deleteActivityTest() throws Exception {
//        // Setup:
//        Activity toRemove = activityFactory.createNew(activityIRI);
//        Activity other = activityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/other"));
//        Entity generated1 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated/1"));
//        Entity invalidated1 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated/1"));
//        Entity used1 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used/1"));
//        Entity generated2 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/generated/2"));
//        Entity invalidated2 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/invalidated/2"));
//        Entity used2 = entityFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/used/2"));
//        toRemove.setGenerated(Collections.singleton(generated1));
//        toRemove.setInvalidated(Collections.singleton(invalidated1));
//        toRemove.setUsed(Collections.singleton(used1));
//        toRemove.setGenerated(Collections.singleton(generated2));
//        toRemove.setInvalidated(Collections.singleton(invalidated2));
//        toRemove.setUsed(Collections.singleton(used2));
//        other.setGenerated(Collections.singleton(generated1));
//        other.setInvalidated(Collections.singleton(invalidated1));
//        other.setUsed(Collections.singleton(used1));
//        try (RepositoryConnection conn = repo.getConnection()) {
//            conn.add(toRemove.getModel());
//            conn.add(generated1.getModel());
//            conn.add(invalidated1.getModel());
//            conn.add(used1.getModel());
//            conn.add(generated2.getModel());
//            conn.add(invalidated2.getModel());
//            conn.add(used2.getModel());
//            conn.add(other.getModel());
//        }
//
//        service.deleteActivity(activityIRI);
//        try (RepositoryConnection conn = repo.getConnection()) {
//            toRemove.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
//            generated1.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
//            invalidated1.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
//            used1.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
//            generated2.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
//            invalidated2.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
//            used2.getModel().forEach(statement -> assertFalse(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
//            other.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
//        }
//    }
}
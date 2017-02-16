package org.matonto.platform.config.impl.state;

/*-
 * #%L
 * org.matonto.platform.config.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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


import org.junit.Before;
import org.junit.Test;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.platform.config.api.application.ApplicationManager;
import org.matonto.platform.config.api.ontologies.platformconfig.Application;
import org.matonto.platform.config.api.ontologies.platformconfig.ApplicationFactory;
import org.matonto.platform.config.api.ontologies.platformconfig.ApplicationState;
import org.matonto.platform.config.api.ontologies.platformconfig.ApplicationStateFactory;
import org.matonto.platform.config.api.ontologies.platformconfig.State;
import org.matonto.platform.config.api.ontologies.platformconfig.StateFactory;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
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
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class SimpleStateManagerTest {
    private SimpleStateManager manager;
    private Repository repo;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private StateFactory stateFactory = new StateFactory();
    private ApplicationStateFactory applicationStateFactory = new ApplicationStateFactory();
    private ThingFactory thingFactory = new ThingFactory();
    private UserFactory userFactory = new UserFactory();
    private ApplicationFactory applicationFactory = new ApplicationFactory();
    private User user;
    private Application application;
    private Set<Resource> stateResource0, stateResource1;

    @Mock
    EngineManager engineManager;

    @Mock
    ApplicationManager applicationManager;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        stateFactory.setModelFactory(mf);
        stateFactory.setValueFactory(vf);
        stateFactory.setValueConverterRegistry(vcr);
        applicationStateFactory.setModelFactory(mf);
        applicationStateFactory.setValueFactory(vf);
        applicationStateFactory.setValueConverterRegistry(vcr);
        thingFactory.setModelFactory(mf);
        thingFactory.setValueFactory(vf);
        thingFactory.setValueConverterRegistry(vcr);
        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        applicationFactory.setModelFactory(mf);
        applicationFactory.setValueFactory(vf);
        applicationFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(stateFactory);
        vcr.registerValueConverter(applicationStateFactory);
        vcr.registerValueConverter(thingFactory);
        vcr.registerValueConverter(userFactory);
        vcr.registerValueConverter(applicationStateFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        user = userFactory.createNew(vf.createIRI("http://matonto.org/users/test"));
        application = applicationFactory.createNew(vf.createIRI("http://matonto.org/applications/test"));

        MockitoAnnotations.initMocks(this);

        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.of(user));
        when(applicationManager.getApplication(anyString())).thenReturn(Optional.of(application));

        manager = new SimpleStateManager();
        manager.setRepository(repo);
        manager.setModelFactory(mf);
        manager.setValueFactory(vf);
        manager.setStateFactory(stateFactory);
        manager.setApplicationStateFactory(applicationStateFactory);
        manager.setEngineManager(engineManager);
        manager.setApplicationManager(applicationManager);
        
        stateResource0 = Collections.singleton(vf.createIRI("http://example.com/example/0"));
        stateResource1 = Collections.singleton(vf.createIRI("http://example.com/example/1"));
    }

    @Test
    public void stateExistsTest() throws Exception {
        // Setup:
        RepositoryConnection conn = repo.getConnection();
        conn.add(vf.createIRI("http://matonto.org/states/0"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(State.TYPE));
        conn.add(vf.createIRI("http://matonto.org/states/0"), vf.createIRI(State.forUser_IRI), user.getResource());
        conn.add(vf.createIRI("http://matonto.org/states/1"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(State.TYPE));
        conn.add(vf.createIRI("http://matonto.org/states/2"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));


        assertTrue(manager.stateExists(vf.createIRI("http://matonto.org/states/0"), "test"));
        assertFalse(manager.stateExists(vf.createIRI("http://matonto.org/states/1"), "test"));
        assertFalse(manager.stateExists(vf.createIRI("http://matonto.org/states/2"), "test"));
        assertFalse(manager.stateExists(vf.createIRI("http://matonto.org/states/3"), "test"));
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void stateExistsWithUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        manager.stateExists(vf.createIRI("http://matonto.org/states/0"), "error");
    }

    @Test
    public void getStatesNoFiltersTest() throws Exception {
        // Setup:
        when(applicationManager.getApplication(anyString())).thenReturn(Optional.empty());
        Model newState = mf.createModel();
        newState.add(vf.createIRI("http://example.com/example"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        newState.add(vf.createIRI("http://example.com/example"), vf.createIRI(DCTERMS.DESCRIPTION.stringValue()), vf.createLiteral("Description"));
        State state0 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state0.setStateResource(Collections.singleton(vf.createIRI("http://example.com/example")));
        state0.setForUser(user);
        State state1 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/1"));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state1.getModel());
        conn.add(newState);

        Map<Resource, Model> result = manager.getStates("test", null, new HashSet<>());
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state0.getResource()));
        assertTrue(result.get(state0.getResource()).equals(newState));
        conn.close();
    }

    @Test
    public void getStatesApplicationFilterTest() throws Exception {
        // Setup:
        Model state0Model = mf.createModel();
        state0Model.add(vf.createIRI("http://example.com/example/0"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state0 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        Model state1Model = mf.createModel();
        state1Model.add(vf.createIRI("http://example.com/example/1"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        ApplicationState state1 = applicationStateFactory.createNew(vf.createIRI("http://matonto.org/states/1"));
        state1.setStateResource(stateResource1);
        state1.setForUser(user);
        state1.setApplication(application);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state0Model);
        conn.add(state1.getModel());
        conn.add(state1Model);

        Map<Resource, Model> result = manager.getStates("test", "test", new HashSet<>());
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state1.getResource()));
        assertTrue(result.get(state1.getResource()).equals(state1Model));
        conn.close();
    }

    @Test
    public void getStatesSubjectsFilterTest() throws Exception {
        // Setup:
        when(applicationManager.getApplication(anyString())).thenReturn(Optional.empty());
        Model state0Model = mf.createModel();
        state0Model.add(vf.createIRI("http://example.com/example/0"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state0 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        Model state1Model = mf.createModel();
        state1Model.add(vf.createIRI("http://example.com/example/1"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state1 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/1"));
        state1.setStateResource(stateResource1);
        state1.setForUser(user);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state0Model);
        conn.add(state1.getModel());
        conn.add(state1Model);

        Map<Resource, Model> result = manager.getStates("test", null, Collections.singleton(vf.createIRI("http://example.com/example/1")));
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state1.getResource()));
        assertTrue(result.get(state1.getResource()).equals(state1Model));
        conn.close();
    }

    @Test
    public void getStatesUserFilterTest() throws Exception {
        when(applicationManager.getApplication(anyString())).thenReturn(Optional.empty());
        Model state0Model = mf.createModel();
        state0Model.add(vf.createIRI("http://example.com/example/0"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state0 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        Model state1Model = mf.createModel();
        state1Model.add(vf.createIRI("http://example.com/example/1"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state1 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/1"));
        state1.setStateResource(stateResource1);
        state1.setForUser(userFactory.createNew(vf.createIRI("http://matonto.org/users/test1")));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state0Model);
        conn.add(state1.getModel());
        conn.add(state1Model);

        Map<Resource, Model> result = manager.getStates("test", "test", new HashSet<>());
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state0.getResource()));
        assertTrue(result.get(state0.getResource()).equals(state0Model));
        conn.close();
    }

    @Test
    public void getStatesAllFiltersTest() throws Exception {
        // Setup:
        Model state0Model = mf.createModel();
        state0Model.add(vf.createIRI("http://example.com/example/0"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state0 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        Model state1Model = mf.createModel();
        state1Model.add(vf.createIRI("http://example.com/example/1"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        ApplicationState state1 = applicationStateFactory.createNew(vf.createIRI("http://matonto.org/states/1"));
        state1.setStateResource(stateResource1);
        state1.setForUser(user);
        state1.setApplication(application);
        Model state2Model = mf.createModel();
        state2Model.add(vf.createIRI("http://example.com/example/2"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        ApplicationState state2 = applicationStateFactory.createNew(vf.createIRI("http://matonto.org/states/2"));
        state2.setStateResource(Collections.singleton(vf.createIRI("http://example.com/example/2")));
        state2.setForUser(user);
        state2.setApplication(application);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state0Model);
        conn.add(state1.getModel());
        conn.add(state1Model);
        conn.add(state2.getModel());
        conn.add(state2Model);

        Map<Resource, Model> result = manager.getStates("test", "test", Collections.singleton(vf.createIRI("http://example.com/example/2")));
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state2.getResource()));
        assertTrue(result.get(state2.getResource()).equals(state2Model));
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void getStatesWithUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        manager.getStates("error", null, new HashSet<>());
    }

    @Test
    public void storeStateTest() throws Exception {
        // Setup:
        Model newState = mf.createModel();
        newState.add(vf.createIRI("http://example.com/example"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Resource result = manager.storeState(newState, "test");
        verify(engineManager, times(1)).retrieveUser(anyString(), eq("test"));
        RepositoryConnection conn = repo.getConnection();
        Model stateModel = mf.createModel();
        conn.getStatements(result, null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        assertTrue(stateModel.contains(result, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(State.TYPE)));
        assertTrue(stateModel.contains(result, vf.createIRI(State.forUser_IRI), user.getResource()));
        newState.forEach(statement -> {
            assertTrue(stateModel.contains(result, vf.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void storeStateWithUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        manager.storeState(mf.createModel(), "error");
    }

    @Test
    public void storeApplicationStateTest() throws Exception {
        // Setup:
        Model newState = mf.createModel();
        newState.add(vf.createIRI("http://example.com/example"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Resource result = manager.storeState(newState, "test", "test");
        verify(engineManager, times(1)).retrieveUser(anyString(), eq("test"));
        verify(applicationManager, times(1)).getApplication("test");
        RepositoryConnection conn = repo.getConnection();
        Model stateModel = mf.createModel();
        conn.getStatements(result, null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        assertTrue(stateModel.contains(result, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(ApplicationState.TYPE)));
        assertTrue(stateModel.contains(result, vf.createIRI(State.forUser_IRI), user.getResource()));
        assertTrue(stateModel.contains(result, vf.createIRI(ApplicationState.application_IRI), application.getResource()));
        newState.forEach(statement -> {
            assertTrue(stateModel.contains(result, vf.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void storeApplicationStateWithUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        manager.storeState(mf.createModel(), "error", "test");
    }

    @Test(expected = MatOntoException.class)
    public void storeApplicationStateWithApplicationThatDoesNotExistTest() {
        // Setup:
        when(applicationManager.getApplication(anyString())).thenReturn(Optional.empty());

        manager.storeState(mf.createModel(), "test", "error");
    }

    @Test
    public void getStateTest() throws Exception {
        // Setup:
        Model resources = mf.createModel();
        resources.add(vf.createIRI("http://example.com/example"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state.setForUser(user);
        state.setStateResource(Collections.singleton(vf.createIRI("http://example.com/example")));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());
        conn.add(resources);

        Model result = manager.getState(state.getResource(), "test");
        assertFalse(result.isEmpty());
        assertTrue(result.containsAll(resources));
        conn.close();
    }

    @Test
    public void getStateThatIsEmptyTest() throws Exception {
        // Setup:
        State state = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state.setForUser(user);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());

        Model result = manager.getState(state.getResource(), "test");
        assertTrue(result.isEmpty());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void getStateThatDoesNotExistTest() {
        manager.getState(vf.createIRI("http://matonto.org/states/error"), "test");
    }

    @Test
    public void updateStateTest() throws Exception {
        // Setup:
        Model oldModel = mf.createModel();
        Model newModel = mf.createModel();
        oldModel.add(vf.createIRI("http://example.com/example/0"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        newModel.add(vf.createIRI("http://example.com/example/1"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state.setForUser(user);
        state.setStateResource(stateResource0);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());
        conn.add(oldModel);

        manager.updateState(state.getResource(), newModel, "test");
        Model stateModel = mf.createModel();
        conn.getStatements(state.getResource(), null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        oldModel.forEach(statement -> {
            assertFalse(stateModel.contains(state.getResource(), vf.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertFalse(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        newModel.forEach(statement -> {
            assertTrue(stateModel.contains(state.getResource(), vf.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test
    public void updateStateWithResourcesUsedForAnotherStateTest() throws Exception {
        // Setup:
        Model oldModel = mf.createModel();
        Model newModel = mf.createModel();
        oldModel.add(vf.createIRI("http://example.com/example/0"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        newModel.add(vf.createIRI("http://example.com/example/1"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state0 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        State state1 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/1"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        state1.setStateResource(stateResource0);
        state1.setForUser(user);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state1.getModel());
        conn.add(oldModel);

        manager.updateState(state0.getResource(), newModel, "test");
        Model stateModel = mf.createModel();
        conn.getStatements(state0.getResource(), null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        oldModel.forEach(statement -> {
            assertFalse(stateModel.contains(state0.getResource(), vf.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        newModel.forEach(statement -> {
            assertTrue(stateModel.contains(state0.getResource(), vf.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test
    public void updateStateThatWasEmptyTest() throws Exception {
        // Setup:
        Model newModel = mf.createModel();
        newModel.add(vf.createIRI("http://example.com/example"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state.setForUser(user);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());

        manager.updateState(state.getResource(), newModel, "test");
        Model stateModel = mf.createModel();
        conn.getStatements(state.getResource(), null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        newModel.forEach(statement -> {
            assertTrue(stateModel.contains(state.getResource(), vf.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void updateStateThatDoesNotExist() {
        manager.updateState(vf.createIRI("http://matonto.org/states/error"), mf.createModel(), "test");
    }

    @Test
    public void deleteStateTest() throws Exception {
        // Setup:
        Model model = mf.createModel();
        model.add(vf.createIRI("http://example.com/example"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state.setForUser(user);
        state.setStateResource(Collections.singleton(vf.createIRI("http://example.com/example")));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());
        conn.add(model);

        manager.deleteState(state.getResource(), "test");
        Model stateModel = mf.createModel();
        conn.getStatements(state.getResource(), null, null).forEach(stateModel::add);
        assertTrue(stateModel.isEmpty());
        model.forEach(statement ->
                assertFalse(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext()));
        conn.close();
    }

    @Test
    public void deleteStateWithResourcesUsedForAnotherStateTest() throws Exception {
        // Setup:
        Model model = mf.createModel();
        model.add(vf.createIRI("http://example.com/example"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        State state0 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        State state1 = stateFactory.createNew(vf.createIRI("http://matonto.org/states/1"));
        state0.setStateResource(Collections.singleton(vf.createIRI("http://example.com/example")));
        state0.setForUser(user);
        state1.setStateResource(Collections.singleton(vf.createIRI("http://example.com/example")));
        state1.setForUser(user);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state1.getModel());
        conn.add(model);

        manager.deleteState(state0.getResource(), "test");
        Model stateModel = mf.createModel();
        conn.getStatements(state0.getResource(), null, null).forEach(stateModel::add);
        assertTrue(stateModel.isEmpty());
        model.forEach(statement ->
                assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext()));
        conn.close();
    }

    @Test
    public void deleteStateThatWasEmptyTest() throws Exception {
        // Setup:
        State state = stateFactory.createNew(vf.createIRI("http://matonto.org/states/0"));
        state.setForUser(user);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());

        manager.deleteState(state.getResource(), "test");
        Model stateModel = mf.createModel();
        conn.getStatements(state.getResource(), null, null).forEach(stateModel::add);
        assertTrue(stateModel.isEmpty());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void deleteStateThatDoesNotExist() {
        manager.deleteState(vf.createIRI("http://matonto.org/states/error"), "test");
    }
}

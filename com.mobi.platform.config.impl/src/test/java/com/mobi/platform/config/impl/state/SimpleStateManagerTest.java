package com.mobi.platform.config.impl.state;

/*-
 * #%L
 * com.mobi.platform.config.impl
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


import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.platform.config.api.application.ApplicationManager;
import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import com.mobi.platform.config.api.ontologies.platformconfig.ApplicationState;
import com.mobi.platform.config.api.ontologies.platformconfig.State;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.junit.Before;
import org.junit.Test;
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

public class SimpleStateManagerTest extends OrmEnabledTestCase {
    private SimpleStateManager manager;
    private Repository repo;
    private OrmFactory<State> stateFactory = getRequiredOrmFactory(State.class);
    private OrmFactory<ApplicationState> applicationStateFactory = getRequiredOrmFactory(ApplicationState.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private User user;
    private Application application;
    private Set<Resource> stateResource0, stateResource1;

    @Mock
    private EngineManager engineManager;

    @Mock
    private ApplicationManager applicationManager;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        OrmFactory<Application> applicationFactory = getRequiredOrmFactory(Application.class);
        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/users/test"));
        application = applicationFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/applications/test"));

        MockitoAnnotations.initMocks(this);

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(applicationManager.getApplication(anyString())).thenReturn(Optional.of(application));

        manager = new SimpleStateManager();
        injectOrmFactoryReferencesIntoService(manager);
        manager.setRepository(repo);
        manager.setModelFactory(MODEL_FACTORY);
        manager.setValueFactory(VALUE_FACTORY);
        manager.setEngineManager(engineManager);
        manager.setApplicationManager(applicationManager);
        
        stateResource0 = Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example/0"));
        stateResource1 = Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example/1"));
    }

    @Test
    public void stateExistsTest() throws Exception {
        // Setup:
        RepositoryConnection conn = repo.getConnection();
        conn.add(VALUE_FACTORY.createIRI("http://mobi.com/states/0"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(State.TYPE));
        conn.add(VALUE_FACTORY.createIRI("http://mobi.com/states/1"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));


        assertTrue(manager.stateExists(VALUE_FACTORY.createIRI("http://mobi.com/states/0")));
        assertFalse(manager.stateExists(VALUE_FACTORY.createIRI("http://mobi.com/states/1")));
        assertFalse(manager.stateExists(VALUE_FACTORY.createIRI("http://mobi.com/states/2")));
        conn.close();
    }

    @Test
    public void stateExistsForUserTest() throws Exception {
        // Setup:
        RepositoryConnection conn = repo.getConnection();
        conn.add(VALUE_FACTORY.createIRI("http://mobi.com/states/0"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(State.TYPE));
        conn.add(VALUE_FACTORY.createIRI("http://mobi.com/states/0"), VALUE_FACTORY.createIRI(State.forUser_IRI), user.getResource());
        conn.add(VALUE_FACTORY.createIRI("http://mobi.com/states/1"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(State.TYPE));
        conn.add(VALUE_FACTORY.createIRI("http://mobi.com/states/2"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));

        assertTrue(manager.stateExistsForUser(VALUE_FACTORY.createIRI("http://mobi.com/states/0"), "test"));
        assertFalse(manager.stateExistsForUser(VALUE_FACTORY.createIRI("http://mobi.com/states/1"), "test"));
        conn.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void stateThatDoesNotExistExistsForUserTest() {
        manager.stateExistsForUser(VALUE_FACTORY.createIRI("http://mobi.com/states/0"), "test");
    }

    @Test(expected = IllegalArgumentException.class)
    public void stateExistsForUserThatDoesNotExistTest() {
        // Setup:
        RepositoryConnection conn = repo.getConnection();
        conn.add(VALUE_FACTORY.createIRI("http://mobi.com/states/0"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(State.TYPE));
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        manager.stateExistsForUser(VALUE_FACTORY.createIRI("http://mobi.com/states/0"), "error");
    }

    @Test
    public void getStatesNoFiltersTest() throws Exception {
        // Setup:
        Model newState = MODEL_FACTORY.createModel();
        newState.add(VALUE_FACTORY.createIRI("http://example.com/example"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        newState.add(VALUE_FACTORY.createIRI("http://example.com/example"), VALUE_FACTORY.createIRI(DCTERMS.DESCRIPTION.stringValue()), VALUE_FACTORY.createLiteral("Description"));
        State state0 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        state0.setStateResource(Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example")));
        state0.setForUser(user);
        State state1 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/1"));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state1.getModel());
        conn.add(newState);

        Map<Resource, Model> result = manager.getStates(null, null, new HashSet<>());
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state0.getResource()));
        assertTrue(result.get(state0.getResource()).equals(newState));
        conn.close();
    }

    @Test
    public void getStatesApplicationFilterTest() throws Exception {
        // Setup:
        Model state0Model = MODEL_FACTORY.createModel();
        state0Model.add(VALUE_FACTORY.createIRI("http://example.com/example/0"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state0 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        Model state1Model = MODEL_FACTORY.createModel();
        state1Model.add(VALUE_FACTORY.createIRI("http://example.com/example/1"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        ApplicationState state1 = applicationStateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/1"));
        state1.setStateResource(stateResource1);
        state1.setForUser(user);
        state1.setApplication(application);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state0Model);
        conn.add(state1.getModel());
        conn.add(state1Model);

        Map<Resource, Model> result = manager.getStates(null, "test", new HashSet<>());
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state1.getResource()));
        assertTrue(result.get(state1.getResource()).equals(state1Model));
        conn.close();
    }

    @Test
    public void getStatesSubjectsFilterTest() throws Exception {
        // Setup:
        Model state0Model = MODEL_FACTORY.createModel();
        state0Model.add(VALUE_FACTORY.createIRI("http://example.com/example/0"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state0 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        Model state1Model = MODEL_FACTORY.createModel();
        state1Model.add(VALUE_FACTORY.createIRI("http://example.com/example/1"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state1 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/1"));
        state1.setStateResource(stateResource1);
        state1.setForUser(user);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state0Model);
        conn.add(state1.getModel());
        conn.add(state1Model);

        Map<Resource, Model> result = manager.getStates(null, null, Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example/1")));
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state1.getResource()));
        assertTrue(result.get(state1.getResource()).equals(state1Model));
        conn.close();
    }

    @Test
    public void getStatesUserFilterTest() throws Exception {
        // Setup:
        Model state0Model = MODEL_FACTORY.createModel();
        state0Model.add(VALUE_FACTORY.createIRI("http://example.com/example/0"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state0 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        Model state1Model = MODEL_FACTORY.createModel();
        state1Model.add(VALUE_FACTORY.createIRI("http://example.com/example/1"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state1 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/1"));
        state1.setStateResource(stateResource1);
        state1.setForUser(userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/users/test1")));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state0Model);
        conn.add(state1.getModel());
        conn.add(state1Model);

        Map<Resource, Model> result = manager.getStates("test", null, new HashSet<>());
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state0.getResource()));
        assertTrue(result.get(state0.getResource()).equals(state0Model));
        conn.close();
    }

    @Test
    public void getStatesAllFiltersTest() throws Exception {
        // Setup:
        Model state0Model = MODEL_FACTORY.createModel();
        state0Model.add(VALUE_FACTORY.createIRI("http://example.com/example/0"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state0 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        state0.setStateResource(stateResource0);
        state0.setForUser(user);
        Model state1Model = MODEL_FACTORY.createModel();
        state1Model.add(VALUE_FACTORY.createIRI("http://example.com/example/1"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        ApplicationState state1 = applicationStateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/1"));
        state1.setStateResource(stateResource1);
        state1.setForUser(user);
        state1.setApplication(application);
        Model state2Model = MODEL_FACTORY.createModel();
        state2Model.add(VALUE_FACTORY.createIRI("http://example.com/example/2"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        ApplicationState state2 = applicationStateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/2"));
        state2.setStateResource(Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example/2")));
        state2.setForUser(user);
        state2.setApplication(application);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state0Model);
        conn.add(state1.getModel());
        conn.add(state1Model);
        conn.add(state2.getModel());
        conn.add(state2Model);

        Map<Resource, Model> result = manager.getStates("test", "test", Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example/2")));
        assertEquals(1, result.size());
        assertTrue(result.containsKey(state2.getResource()));
        assertTrue(result.get(state2.getResource()).equals(state2Model));
        conn.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void getStatesWithUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        manager.getStates("error", null, new HashSet<>());
    }

    @Test(expected = IllegalArgumentException.class)
    public void getStatesWithApplicationThatDoesNotExistTest() {
        // Setup:
        when(applicationManager.getApplication(anyString())).thenReturn(Optional.empty());

        manager.getStates(null, "error", new HashSet<>());
    }

    @Test
    public void storeStateTest() throws Exception {
        // Setup:
        Model newState = MODEL_FACTORY.createModel();
        newState.add(VALUE_FACTORY.createIRI("http://example.com/example"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));

        Resource result = manager.storeState(newState, "test");
        verify(engineManager, times(1)).retrieveUser(eq("test"));
        RepositoryConnection conn = repo.getConnection();
        Model stateModel = MODEL_FACTORY.createModel();
        conn.getStatements(result, null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        assertTrue(stateModel.contains(result, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(State.TYPE)));
        assertTrue(stateModel.contains(result, VALUE_FACTORY.createIRI(State.forUser_IRI), user.getResource()));
        newState.forEach(statement -> {
            assertTrue(stateModel.contains(result, VALUE_FACTORY.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void storeStateWithUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        manager.storeState(MODEL_FACTORY.createModel(), "error");
    }

    @Test
    public void storeApplicationStateTest() throws Exception {
        // Setup:
        Model newState = MODEL_FACTORY.createModel();
        newState.add(VALUE_FACTORY.createIRI("http://example.com/example"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));

        Resource result = manager.storeState(newState, "test", "test");
        verify(engineManager, times(1)).retrieveUser(eq("test"));
        verify(applicationManager, times(1)).getApplication("test");
        RepositoryConnection conn = repo.getConnection();
        Model stateModel = MODEL_FACTORY.createModel();
        conn.getStatements(result, null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        assertTrue(stateModel.contains(result, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(ApplicationState.TYPE)));
        assertTrue(stateModel.contains(result, VALUE_FACTORY.createIRI(State.forUser_IRI), user.getResource()));
        assertTrue(stateModel.contains(result, VALUE_FACTORY.createIRI(ApplicationState.application_IRI), application.getResource()));
        newState.forEach(statement -> {
            assertTrue(stateModel.contains(result, VALUE_FACTORY.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void storeApplicationStateWithUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        manager.storeState(MODEL_FACTORY.createModel(), "error", "test");
    }

    @Test(expected = IllegalArgumentException.class)
    public void storeApplicationStateWithApplicationThatDoesNotExistTest() {
        // Setup:
        when(applicationManager.getApplication(anyString())).thenReturn(Optional.empty());

        manager.storeState(MODEL_FACTORY.createModel(), "test", "error");
    }

    @Test
    public void getStateTest() throws Exception {
        // Setup:
        Model resources = MODEL_FACTORY.createModel();
        resources.add(VALUE_FACTORY.createIRI("http://example.com/example"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        state.setStateResource(Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example")));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());
        conn.add(resources);

        Model result = manager.getState(state.getResource());
        assertFalse(result.isEmpty());
        assertTrue(result.containsAll(resources));
        conn.close();
    }

    @Test
    public void getStateThatIsEmptyTest() throws Exception {
        // Setup:
        State state = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());

        Model result = manager.getState(state.getResource());
        assertTrue(result.isEmpty());
        conn.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void getStateThatDoesNotExistTest() {
        manager.getState(VALUE_FACTORY.createIRI("http://mobi.com/states/error"));
    }

    @Test
    public void updateStateTest() throws Exception {
        // Setup:
        Model oldModel = MODEL_FACTORY.createModel();
        Model newModel = MODEL_FACTORY.createModel();
        oldModel.add(VALUE_FACTORY.createIRI("http://example.com/example/0"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        newModel.add(VALUE_FACTORY.createIRI("http://example.com/example/1"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        state.setStateResource(stateResource0);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());
        conn.add(oldModel);

        manager.updateState(state.getResource(), newModel);
        Model stateModel = MODEL_FACTORY.createModel();
        conn.getStatements(state.getResource(), null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        oldModel.forEach(statement -> {
            assertFalse(stateModel.contains(state.getResource(), VALUE_FACTORY.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertFalse(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        newModel.forEach(statement -> {
            assertTrue(stateModel.contains(state.getResource(), VALUE_FACTORY.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test
    public void updateStateWithResourcesUsedForAnotherStateTest() throws Exception {
        // Setup:
        Model oldModel = MODEL_FACTORY.createModel();
        Model newModel = MODEL_FACTORY.createModel();
        oldModel.add(VALUE_FACTORY.createIRI("http://example.com/example/0"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        newModel.add(VALUE_FACTORY.createIRI("http://example.com/example/1"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state0 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        State state1 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/1"));
        state0.setStateResource(stateResource0);
        state1.setStateResource(stateResource0);
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state1.getModel());
        conn.add(oldModel);

        manager.updateState(state0.getResource(), newModel);
        Model stateModel = MODEL_FACTORY.createModel();
        conn.getStatements(state0.getResource(), null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        oldModel.forEach(statement -> {
            assertFalse(stateModel.contains(state0.getResource(), VALUE_FACTORY.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        newModel.forEach(statement -> {
            assertTrue(stateModel.contains(state0.getResource(), VALUE_FACTORY.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test
    public void updateStateThatWasEmptyTest() throws Exception {
        // Setup:
        Model newModel = MODEL_FACTORY.createModel();
        newModel.add(VALUE_FACTORY.createIRI("http://example.com/example"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());

        manager.updateState(state.getResource(), newModel);
        Model stateModel = MODEL_FACTORY.createModel();
        conn.getStatements(state.getResource(), null, null).forEach(stateModel::add);
        assertFalse(stateModel.isEmpty());
        newModel.forEach(statement -> {
            assertTrue(stateModel.contains(state.getResource(), VALUE_FACTORY.createIRI(State.stateResource_IRI), statement.getSubject()));
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
        });
        conn.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void updateStateThatDoesNotExist() {
        manager.updateState(VALUE_FACTORY.createIRI("http://mobi.com/states/error"), MODEL_FACTORY.createModel());
    }

    @Test
    public void deleteStateTest() throws Exception {
        // Setup:
        Model model = MODEL_FACTORY.createModel();
        model.add(VALUE_FACTORY.createIRI("http://example.com/example"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        state.setStateResource(Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example")));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());
        conn.add(model);

        manager.deleteState(state.getResource());
        Model stateModel = MODEL_FACTORY.createModel();
        conn.getStatements(state.getResource(), null, null).forEach(stateModel::add);
        assertTrue(stateModel.isEmpty());
        model.forEach(statement ->
                assertFalse(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext()));
        conn.close();
    }

    @Test
    public void deleteStateWithResourcesUsedForAnotherStateTest() throws Exception {
        // Setup:
        Model model = MODEL_FACTORY.createModel();
        model.add(VALUE_FACTORY.createIRI("http://example.com/example"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()), VALUE_FACTORY.createLiteral("Title"));
        State state0 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        State state1 = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/1"));
        state0.setStateResource(Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example")));
        state1.setStateResource(Collections.singleton(VALUE_FACTORY.createIRI("http://example.com/example")));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state0.getModel());
        conn.add(state1.getModel());
        conn.add(model);

        manager.deleteState(state0.getResource());
        Model stateModel = MODEL_FACTORY.createModel();
        conn.getStatements(state0.getResource(), null, null).forEach(stateModel::add);
        assertTrue(stateModel.isEmpty());
        model.forEach(statement ->
                assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext()));
        conn.close();
    }

    @Test
    public void deleteStateThatWasEmptyTest() throws Exception {
        // Setup:
        State state = stateFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/states/0"));
        RepositoryConnection conn = repo.getConnection();
        conn.add(state.getModel());

        manager.deleteState(state.getResource());
        Model stateModel = MODEL_FACTORY.createModel();
        conn.getStatements(state.getResource(), null, null).forEach(stateModel::add);
        assertTrue(stateModel.isEmpty());
        conn.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteStateThatDoesNotExist() {
        manager.deleteState(VALUE_FACTORY.createIRI("http://mobi.com/states/error"));
    }
}

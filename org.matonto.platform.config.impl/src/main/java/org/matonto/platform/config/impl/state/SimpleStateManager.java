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


import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Reference;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.engines.RdfEngine;
import org.matonto.persistence.utils.Bindings;
import org.matonto.platform.config.api.application.ApplicationManager;
import org.matonto.platform.config.api.ontologies.platformconfig.Application;
import org.matonto.platform.config.api.ontologies.platformconfig.ApplicationState;
import org.matonto.platform.config.api.ontologies.platformconfig.ApplicationStateFactory;
import org.matonto.platform.config.api.ontologies.platformconfig.State;
import org.matonto.platform.config.api.ontologies.platformconfig.StateFactory;
import org.matonto.platform.config.api.state.StateManager;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.config.RepositoryConsumerConfig;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.model.vocabulary.RDF;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component(
        name = SimpleStateManager.COMPONENT_NAME,
        designateFactory = RepositoryConsumerConfig.class,
        configurationPolicy = ConfigurationPolicy.require
    )
public class SimpleStateManager implements StateManager {
    protected static final String COMPONENT_NAME = "org.matonto.platform.config.state.StateManager";
    private Repository repository;
    private ValueFactory factory;
    private ModelFactory modelFactory;
    private StateFactory stateFactory;
    private ApplicationStateFactory applicationStateFactory;
    private ThingFactory thingFactory;
    private EngineManager engineManager;
    private ApplicationManager applicationManager;

    private static final String NAMESPACE = "http://matonto.org/states#";

    private static final String GET_STATES_QUERY;
    private static final String GET_APPLICATION_STATES_QUERY;
    private static final String STATE_ID_BINDING = "id";
    private static final String USER_BINDING = "user";
    private static final String APPLICATION_BINDING = "application";
    private static final String RESOURCES_BINDING = "resources";

    static {
        try {
            GET_STATES_QUERY = IOUtils.toString(
                    SimpleStateManager.class.getResourceAsStream("/get-states.rq"), "UTF-8");
            GET_APPLICATION_STATES_QUERY = IOUtils.toString(
                    SimpleStateManager.class.getResourceAsStream("/get-application-states.rq"), "UTF-8");
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    @Reference(name = "repository")
    protected void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    protected void setValueFactory(final ValueFactory vf) {
        factory = vf;
    }

    @Reference
    protected void setModelFactory(final ModelFactory mf) {
        modelFactory = mf;
    }

    @Reference
    protected void setStateFactory(StateFactory stateFactory) {
        this.stateFactory = stateFactory;
    }

    @Reference
    protected void setApplicationStateFactory(ApplicationStateFactory applicationStateFactory) {
        this.applicationStateFactory = applicationStateFactory;
    }

    @Reference
    protected void setThingFactory(ThingFactory thingFactory) {
        this.thingFactory = thingFactory;
    }

    @Reference
    protected void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    protected void setApplicationManager(ApplicationManager applicationManager) {
        this.applicationManager = applicationManager;
    }

    @Override
    public boolean stateExists(Resource stateId, String username) throws MatOntoException {
        User user = engineManager.retrieveUser(RdfEngine.COMPONENT_NAME, username).orElseThrow(() ->
                new MatOntoException("User not found"));
        try (RepositoryConnection conn = repository.getConnection()) {
            boolean stateExists = conn.getStatements(stateId, factory.createIRI(RDF.TYPE.stringValue()),
                    factory.createIRI(State.TYPE))
                    .hasNext();
            boolean forUser = conn.getStatements(stateId, factory.createIRI(State.forUser_IRI),
                    user.getResource()).hasNext();
            return stateExists && forUser;
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    @Override
    public Map<Resource, Model> getStates(String username, String applicationId, Set<Resource> subjects)
            throws MatOntoException {
        User user = engineManager.retrieveUser(RdfEngine.COMPONENT_NAME, username).orElseThrow(() ->
                new MatOntoException("User not found"));
        Optional<Application> app = applicationManager.getApplication(applicationId);
        Map<Resource, Model> states = new HashMap<>();
        try (RepositoryConnection conn = repository.getConnection()) {
            TupleQuery statesQuery = app.isPresent() ? conn.prepareTupleQuery(GET_APPLICATION_STATES_QUERY)
                    : conn.prepareTupleQuery(GET_STATES_QUERY);
            app.ifPresent(application -> statesQuery.setBinding(APPLICATION_BINDING, application.getResource()));
            statesQuery.setBinding(USER_BINDING, user.getResource());
            TupleQueryResult results = statesQuery.evaluate();

            BindingSet bindings;
            while (results.hasNext() && (bindings = results.next()).getBindingNames().contains(STATE_ID_BINDING)) {
                Resource stateId = Bindings.requiredResource(bindings, STATE_ID_BINDING);
                bindings.getBinding(RESOURCES_BINDING).ifPresent(binding -> {
                    Set<Resource> resources = Arrays.stream(StringUtils.split(binding.getValue().stringValue(), ","))
                            .map(factory::createIRI)
                            .collect(Collectors.toSet());

                    if (subjects.isEmpty() || resources.containsAll(subjects)) {
                        Model stateModel = modelFactory.createModel();
                        resources.forEach(resource -> conn.getStatements(resource, null, null)
                                .forEach(stateModel::add));
                        states.put(stateId, stateModel);
                    }
                });
            }
        }
        return states;
    }

    @Override
    public Resource storeState(Model newState, String username) throws MatOntoException {
        State state = createState(newState, username, stateFactory);

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(state.getModel());
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return state.getResource();
    }

    @Override
    public Resource storeState(Model newState, String username, String applicationId) throws MatOntoException {
        ApplicationState state = createState(newState, username, applicationStateFactory);
        Application app = applicationManager.getApplication(applicationId).orElseThrow(() ->
                new MatOntoException("Application not found"));
        state.setApplication(app);

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(state.getModel());
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return state.getResource();
    }

    @Override
    public Model getState(Resource stateId, String username) throws MatOntoException {
        if (!stateExists(stateId, username)) {
            throw new MatOntoException("State not found");
        }
        Model result = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            Model stateModel = modelFactory.createModel();
            conn.getStatements(stateId, null, null).forEach(stateModel::add);
            stateModel.filter(stateId, factory.createIRI(State.stateResource_IRI), null).objects().forEach(value -> {
                conn.getStatements((Resource) value, null, null).forEach(result::add);
            });
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return result;
    }

    @Override
    public void updateState(Resource stateId, Model newState, String username) throws MatOntoException {
        if (!stateExists(stateId, username)) {
            throw new MatOntoException("State not found");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            Model stateModel = modelFactory.createModel(newState);
            conn.getStatements(stateId, null, null).forEach(stateModel::add);
            State state = stateFactory.getExisting(stateId, stateModel);
            removeState(state, conn);
            state.setStateResource(newState.subjects().stream().map(thingFactory::createNew)
                    .collect(Collectors.toSet()));
            conn.add(state.getModel());
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    @Override
    public void deleteState(Resource stateId, String username) throws MatOntoException {
        if (!stateExists(stateId, username)) {
            throw new MatOntoException("State not found");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            Model stateModel = modelFactory.createModel();
            conn.getStatements(stateId, null, null).forEach(stateModel::add);
            State state = stateFactory.getExisting(stateId, stateModel);
            removeState(state, conn);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    private void removeState(State state, RepositoryConnection conn) {
        conn.remove(state.getResource(), null, null);
        state.getStateResource().stream()
                .filter(thing -> !conn.getStatements(null, factory.createIRI(State.stateResource_IRI),
                        thing.getResource()).hasNext())
                .forEach(thing -> conn.remove(thing.getResource(), null, null));
    }

    private <T extends State> T createState(Model newState, String username, OrmFactory<T> ormFactory) {
        User user = engineManager.retrieveUser(RdfEngine.COMPONENT_NAME, username).orElseThrow(() ->
                new MatOntoException("User not found"));
        T stateObj = ormFactory.createNew(factory.createIRI(NAMESPACE + UUID.randomUUID()));
        stateObj.setStateResource(newState.subjects().stream().map(thingFactory::createNew)
                .collect(Collectors.toSet()));
        stateObj.setForUser(user);
        stateObj.getModel().addAll(newState);
        return stateObj;
    }
}

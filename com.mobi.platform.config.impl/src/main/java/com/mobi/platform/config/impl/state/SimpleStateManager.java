package com.mobi.platform.config.impl.state;

/*-
 * #%L
 * com.mobi.platform.config.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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


import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.Bindings;
import com.mobi.platform.config.api.application.ApplicationManager;
import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import com.mobi.platform.config.api.ontologies.platformconfig.ApplicationState;
import com.mobi.platform.config.api.ontologies.platformconfig.ApplicationStateFactory;
import com.mobi.platform.config.api.ontologies.platformconfig.State;
import com.mobi.platform.config.api.ontologies.platformconfig.StateFactory;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.rdf.orm.OrmFactory;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nullable;

@Component(name = SimpleStateManager.COMPONENT_NAME)
public class SimpleStateManager implements StateManager {
    protected static final String COMPONENT_NAME = "com.mobi.platform.config.state.StateManager";

    private static final String NAMESPACE = "http://mobi.com/states#";

    private static final String GET_STATES_QUERY;
    private static final String GET_APPLICATION_STATES_QUERY;
    private static final String STATE_ID_BINDING = "id";
    private static final String USER_BINDING = "userId";
    private static final String APPLICATION_BINDING = "application";
    private static final String RESOURCES_BINDING = "resources";
    private static final String USER_NOT_FOUND = "User not found";
    private static final String STATE_NOT_FOUND = "State not found";

    static {
        try {
            GET_STATES_QUERY = IOUtils.toString(
                    SimpleStateManager.class.getResourceAsStream("/get-states.rq"), StandardCharsets.UTF_8);
            GET_APPLICATION_STATES_QUERY = IOUtils.toString(
                    SimpleStateManager.class.getResourceAsStream("/get-application-states.rq"),
                    StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory factory = new ValidatingValueFactory();
    final ModelFactory modelFactory = new DynamicModelFactory();

    @Reference(target = "(id=system)")
    OsgiRepository repository;

    @Reference
    StateFactory stateFactory;

    @Reference
    ApplicationStateFactory applicationStateFactory;

    @Reference
    EngineManager engineManager;

    @Reference
    ApplicationManager applicationManager;

    @Override
    public boolean stateExists(Resource stateId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return stateExists(stateId, conn);
        }
    }

    @Override
    public boolean stateExistsForUser(Resource stateId, String username) {
        User user = engineManager.retrieveUser(username).orElseThrow(() ->
                new IllegalArgumentException(USER_NOT_FOUND));
        try (RepositoryConnection conn = repository.getConnection()) {
            if (!stateExists(stateId, conn)) {
                throw new IllegalArgumentException(STATE_NOT_FOUND);
            }
            return ConnectionUtils.contains(conn, stateId, factory.createIRI(State.forUser_IRI), user.getResource());
        }
    }

    @Override
    public Map<Resource, Model> getStates(@Nullable String username, @Nullable String applicationId,
                                          Set<Resource> subjects) {
        Map<Resource, Model> states = new HashMap<>();
        try (RepositoryConnection conn = repository.getConnection()) {
            TupleQuery statesQuery;
            if (applicationId != null && !applicationId.isEmpty()) {
                Application app = applicationManager.getApplication(applicationId).orElseThrow(() ->
                        new IllegalArgumentException("Application not found"));
                statesQuery = conn.prepareTupleQuery(GET_APPLICATION_STATES_QUERY);
                statesQuery.setBinding(APPLICATION_BINDING, app.getResource());
            } else {
                statesQuery = conn.prepareTupleQuery(GET_STATES_QUERY);
            }
            if (username != null && !username.isEmpty()) {
                User user = engineManager.retrieveUser(username).orElseThrow(() ->
                        new IllegalArgumentException(USER_NOT_FOUND));
                statesQuery.setBinding(USER_BINDING, user.getResource());
            }
            TupleQueryResult results = statesQuery.evaluate();

            BindingSet bindings;
            while (results.hasNext() && (bindings = results.next()).getBindingNames().contains(STATE_ID_BINDING)) {
                Resource stateId = Bindings.requiredResource(bindings, STATE_ID_BINDING);
                Optional.ofNullable(bindings.getBinding(RESOURCES_BINDING)).ifPresent(binding -> {
                    Set<Resource> resources = Arrays.stream(StringUtils.split(binding.getValue().stringValue(), ","))
                            .map(factory::createIRI)
                            .collect(Collectors.toSet());

                    if (subjects.isEmpty() || resources.containsAll(subjects)) {
                        Model stateModel = modelFactory.createEmptyModel();
                        resources.forEach(resource -> conn.getStatements(resource, null, null)
                                .forEach(stateModel::add));
                        states.put(stateId, stateModel);
                    }
                });
            }
            results.close();
            return states;
        }
    }

    @Override
    public Resource storeState(Model newState, String username) {
        State state = createState(newState, username, stateFactory);
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(state.getModel());
            return state.getResource();
        }
    }

    @Override
    public Resource storeState(Model newState, String username, String applicationId) {
        ApplicationState state = createState(newState, username, applicationStateFactory);
        Application app = applicationManager.getApplication(applicationId).orElseThrow(() ->
                new IllegalArgumentException("Application not found"));
        state.setApplication(app);
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(state.getModel());
            return state.getResource();
        }
    }

    @Override
    public Model getState(Resource stateId) {
        if (!stateExists(stateId)) {
            throw new IllegalArgumentException(STATE_NOT_FOUND);
        }
        Model result = modelFactory.createEmptyModel();
        Model stateModel = modelFactory.createEmptyModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.getStatements(stateId, null, null).forEach(stateModel::add);
            stateModel.filter(stateId, factory.createIRI(State.stateResource_IRI), null).objects().forEach(value ->
                    conn.getStatements((Resource) value, null, null).forEach(result::add));
            return result;
        }
    }

    @Override
    public void updateState(Resource stateId, Model newState) throws MobiException {
        if (!stateExists(stateId)) {
            throw new IllegalArgumentException(STATE_NOT_FOUND);
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            Model stateModel = modelFactory.createEmptyModel();
            stateModel.addAll(newState);
            conn.getStatements(stateId, null, null).forEach(stateModel::add);
            stateFactory.getExisting(stateId, stateModel).ifPresent(state -> {
                removeState(state, conn);
                state.setStateResource(newState.subjects());
                conn.add(state.getModel());
            });
        }
    }

    @Override
    public void deleteState(Resource stateId) {
        if (!stateExists(stateId)) {
            throw new IllegalArgumentException(STATE_NOT_FOUND);
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            Model stateModel = modelFactory.createEmptyModel();
            conn.getStatements(stateId, null, null).forEach(stateModel::add);
            stateFactory.getExisting(stateId, stateModel).ifPresent(state -> removeState(state, conn));
        }
    }

    private void removeState(State state, RepositoryConnection conn) {
        conn.remove(state.getResource(), null, null);
        state.getStateResource().stream()
                .filter(resource ->
                        !ConnectionUtils.contains(conn, null, factory.createIRI(State.stateResource_IRI), resource))
                .forEach(resource -> conn.remove(resource, null, null));
    }

    private <T extends State> T createState(Model newState, String username, OrmFactory<T> ormFactory) {
        User user = engineManager.retrieveUser(username).orElseThrow(() ->
                new IllegalArgumentException(USER_NOT_FOUND));
        T stateObj = ormFactory.createNew(factory.createIRI(NAMESPACE + UUID.randomUUID()));
        stateObj.setStateResource(newState.subjects());
        stateObj.setForUser(user);
        stateObj.getModel().addAll(newState);
        return stateObj;
    }

    private boolean stateExists(Resource stateId, RepositoryConnection conn) {
        return ConnectionUtils.contains(conn, stateId, factory.createIRI(RDF.TYPE.stringValue()),
                factory.createIRI(State.TYPE));
    }
}

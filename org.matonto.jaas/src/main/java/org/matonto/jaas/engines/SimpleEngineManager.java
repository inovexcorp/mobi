package org.matonto.jaas.engines;

/*-
 * #%L
 * org.matonto.jaas
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.log4j.Logger;
import org.matonto.jaas.api.engines.Engine;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.engines.EngineManagerConfig;
import org.matonto.jaas.api.ontologies.usermanagement.Group;
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component(
        immediate = true,
        name = SimpleEngineManager.COMPONENT_NAME,
        designateFactory = EngineManagerConfig.class
    )
public class SimpleEngineManager implements EngineManager {
    public static final String COMPONENT_NAME = "org.matonto.jaas.api.engines.EngineManager";
    private final Logger log = Logger.getLogger(SimpleEngineManager.class);
    protected Map<String, Engine> engines = new HashMap<>();

    @Activate
    protected void start(BundleContext context, Map<String, Object> props) {
        log.info("Activating SimpleEngineManager");
        EngineManagerConfig config = Configurable.createConfigurable(EngineManagerConfig.class, props);
        for (String engineName : config.engines()) {
            if (!engines.containsKey(engineName)) {
                ServiceReference ref = context.getServiceReference(engineName);
                if (ref != null) {
                    log.info("Adding engine " + engineName);
                    engines.put(engineName, (Engine) context.getService(ref));
                } else {
                    log.info("Engine " + engineName + " could not be found");
                }
            }
        }
    }

    @Override
    public boolean containsEngine(String engine) {
        return engines.containsKey(engine);
    }

    @Override
    public User createUser(String username, String password) {
        return null;
    }

    @Override
    public Group createGroup(String title) {
        return null;
    }

    @Override
    public Set<User> getUsers(String engine) {
        return null;
    }

    @Override
    public boolean storeUser(String engine, User user) {
        return false;
    }

    @Override
    public Optional<User> retrieveUser(String engine, String userId) {
        return null;
    }

    @Override
    public boolean deleteUser(String engine, String userId) {
        return false;
    }

    @Override
    public boolean updateUser(String engine, String userId, User newUser) {
        return false;
    }

    @Override
    public boolean userExists(String engine, String userId) {
        if (engines.containsKey(engine)) {
            return ((Engine) engines.get(engine)).userExists(userId);
        }
        return false;
    }

    @Override
    public boolean userExists(String userId) {
        return false;
    }

    @Override
    public Set<Group> getGroups(String engine) {
        return null;
    }

    @Override
    public boolean storeGroup(String engine, Group group) {
        return false;
    }

    @Override
    public Optional<Group> retrieveGroup(String engine, String groupId) {
        return null;
    }

    @Override
    public boolean deleteGroup(String engine, String groupId) {
        return false;
    }

    @Override
    public boolean updateGroup(String engine, String groupId, Group newGroup) {
        return false;
    }

    @Override
    public boolean groupExists(String engine, String groupId) {
        return false;
    }

    @Override
    public boolean groupExists(String groupId) {
        return false;
    }

    @Override
    public Set<Role> getUserRoles(String engine, String userId) {
        return null;
    }

    @Override
    public Set<Role> getUserRoles(String userId) {
        return null;
    }

    @Override
    public boolean checkPassword(String engine, String userId, String password) {
        return false;
    }
}

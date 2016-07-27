package org.matonto.jaas.rest.impl;

/*-
 * #%L
 * org.matonto.jaas.rest
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
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONObject;
import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.matonto.jaas.modules.token.TokenBackingEngineFactory;
import org.matonto.jaas.rest.GroupsRest;

import javax.security.auth.login.AppConfigurationEntry;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component(immediate = true)
public class GroupsRestImpl implements GroupsRest {
    protected JaasRealm realm;
    protected BackingEngine engine;

    @Reference(target = "(realmId=matonto)")
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Activate
    protected void start(Map<String, Object> props) {
        AppConfigurationEntry[] entries = realm.getEntries();
        engine = new TokenBackingEngineFactory().build(entries[1].getOptions());
    }

    @Override
    public Response listGroups() {
        JSONObject obj = new JSONObject();
        engine.listGroups().forEach((groupPrincipal, string) -> obj.put(groupPrincipal.getName(), string));
        return Response.status(200).entity(obj.toString()).build();
    }

    @Override
    public Response createGroup(String groupName) {
        return null;
    }

    @Override
    public Response getGroup(String groupName) {
        return null;
    }

    @Override
    public Response updateGroup(String groupName) {
        return null;
    }

    @Override
    public Response deleteGroup(String groupName) {
        return null;
    }

    @Override
    public Response getGroupRoles(String groupName) {
        return null;
    }

    @Override
    public Response addGroupRole(String groupName, @QueryParam("role") String role) {
        return null;
    }

    @Override
    public Response removeGroupRole(String groupName, @QueryParam("role") String role) {
        return null;
    }

    /*private Optional<GroupPrincipal> findGroup(String groupName) {
        List<GroupPrincipal> groups = engine.listGroups();
        for (GroupPrincipal prin : groups) {
            if (prin.getName().equals(groupName)) {
                return Optional.of(prin);
            }
        }
        return Optional.empty();
    }*/
}

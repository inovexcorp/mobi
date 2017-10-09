package com.mobi.jaas.rest.impl;

/*-
 * #%L
 * com.mobi.jaas.rest
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
import aQute.bnd.annotation.component.Reference;
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.engines.RdfEngine;
import com.mobi.jaas.rest.GroupRest;
import com.mobi.ontologies.foaf.Agent;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import org.openrdf.model.vocabulary.DCTERMS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class GroupRestImpl implements GroupRest {
    protected EngineManager engineManager;
    protected ValueFactory factory;
    protected UserFactory userFactory;
    protected MobiConfiguration mobiConfiguration;
    private final Logger logger = LoggerFactory.getLogger(GroupRestImpl.class);

    @Reference
    protected void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    protected void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference
    protected void setUserFactory(UserFactory userFactory) {
        this.userFactory = userFactory;
    }

    @Reference
    protected void setMobiConfiguration(MobiConfiguration configuration) {
        this.mobiConfiguration = configuration;
    }

    @Override
    public Response listGroups() {
        Set<String> titles = engineManager.getGroups(RdfEngine.COMPONENT_NAME).stream()
                .map(group -> group.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())))
                .filter(Optional::isPresent)
                .map(title -> title.get().stringValue())
                .collect(Collectors.toSet());

        return Response.status(200).entity(titles).build();
    }

    @Override
    public Response createGroup(Group group) {
        Value title = group.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST));
        if (engineManager.groupExists(title.stringValue())) {
            throw ErrorUtils.sendError("Group " + title.stringValue() + " already exists", Response.Status.BAD_REQUEST);
        }

        engineManager.storeGroup(RdfEngine.COMPONENT_NAME, group);
        logger.info("Created group " + title.stringValue());
        return Response.status(201).entity(title.stringValue()).build();
    }

    @Override
    public Response getGroup(String groupTitle) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Group group = engineManager.retrieveGroup(RdfEngine.COMPONENT_NAME, groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.NOT_FOUND));

        return Response.status(200).entity(group).build();
    }

    @Override
    public Response updateGroup(String groupTitle, Group newGroup) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }
        Value title = newGroup.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                ErrorUtils.sendError("Group title must be present in new group", Response.Status.BAD_REQUEST));
        Group savedGroup = engineManager.retrieveGroup(RdfEngine.COMPONENT_NAME, groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        if (!savedGroup.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())).get().equals(title)) {
            throw ErrorUtils.sendError("Group titles must match", Response.Status.BAD_REQUEST);
        }
        if (!savedGroup.getHasGroupRole().isEmpty()) {
            newGroup.setHasGroupRole(savedGroup.getHasGroupRole());
        }
        if (!savedGroup.getMember().isEmpty()) {
            newGroup.setMember(savedGroup.getMember());
        }

        engineManager.updateGroup(RdfEngine.COMPONENT_NAME, newGroup);
        return Response.ok().build();
    }

    @Override
    public Response deleteGroup(String groupTitle) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }
        if (!engineManager.groupExists(groupTitle)) {
            throw ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST);
        }

        engineManager.deleteGroup(RdfEngine.COMPONENT_NAME, groupTitle);
        logger.info("Deleted group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response getGroupRoles(String groupTitle) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Group group = engineManager.retrieveGroup(RdfEngine.COMPONENT_NAME, groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));

        return Response.status(200).entity(new GenericEntity<Set<Role>>(group.getHasGroupRole()) {}).build();
    }

    @Override
    public Response addGroupRoles(String groupTitle, List<String> roles) {
        if (groupTitle == null || roles.isEmpty()) {
            throw ErrorUtils.sendError("Both group title and roles must be provided", Response.Status.BAD_REQUEST);
        }
        Group savedGroup = engineManager.retrieveGroup(RdfEngine.COMPONENT_NAME, groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Set<Role> roleObjs = new HashSet<>();
        roles.forEach(s -> roleObjs.add(engineManager.getRole(RdfEngine.COMPONENT_NAME, s).orElseThrow(() ->
                ErrorUtils.sendError("Role " + s + " not found", Response.Status.BAD_REQUEST))));
        Set<Role> allRoles = savedGroup.getHasGroupRole();
        allRoles.addAll(roleObjs);
        savedGroup.setHasGroupRole(allRoles);
        engineManager.updateGroup(RdfEngine.COMPONENT_NAME, savedGroup);
        logger.info("Role(s) " + String.join(", ", roles) + " to group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response removeGroupRole(String groupTitle, String role) {
        if (groupTitle == null || role == null) {
            throw ErrorUtils.sendError("Both group title and role must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(RdfEngine.COMPONENT_NAME, groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Role roleObj = engineManager.getRole(RdfEngine.COMPONENT_NAME, role).orElseThrow(() ->
                ErrorUtils.sendError("Role " + role + " not found", Response.Status.BAD_REQUEST));
        savedGroup.removeProperty(roleObj.getResource(), factory.createIRI(Group.hasGroupRole_IRI));
        engineManager.updateGroup(RdfEngine.COMPONENT_NAME, savedGroup);
        logger.info("Removed role " + role + " from group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response getGroupUsers(String groupTitle) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(RdfEngine.COMPONENT_NAME, groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Set<User> members = savedGroup.getMember().stream()
                .map(agent -> userFactory.getExisting(agent.getResource(), agent.getModel()).orElseThrow(() ->
                        new IllegalStateException("Unable to get User: " + agent.getResource().stringValue())))
                .collect(Collectors.toSet());

        return Response.status(200).entity(new GenericEntity<Set<User>>(members) {}).build();
    }

    @Override
    public Response addGroupUser(String groupTitle, List<String> usernames) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(RdfEngine.COMPONENT_NAME, groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Set<User> users = new HashSet<>();
        for (String username : usernames) {
            users.add(engineManager.retrieveUser(RdfEngine.COMPONENT_NAME, username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST)));
        }
        Set<Agent> newMembers = savedGroup.getMember();
        newMembers.addAll(users);
        savedGroup.setMember(newMembers);
        engineManager.updateGroup(RdfEngine.COMPONENT_NAME, savedGroup);
        logger.info("Added user(s) " + String.join(", ", usernames) + " to group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response removeGroupUser(String groupTitle, String username) {
        if (groupTitle == null || username == null) {
            throw ErrorUtils.sendError("Both group title and username must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(RdfEngine.COMPONENT_NAME, groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        User savedUser = engineManager.retrieveUser(RdfEngine.COMPONENT_NAME, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        savedGroup.removeProperty(savedUser.getResource(), factory.createIRI(Group.member_IRI));
        engineManager.updateGroup(RdfEngine.COMPONENT_NAME, savedGroup);
        logger.info("Removed user " + username + " from group " + groupTitle);
        return Response.ok().build();
    }
}

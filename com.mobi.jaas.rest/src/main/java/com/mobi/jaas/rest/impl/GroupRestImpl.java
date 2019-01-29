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

import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.GroupFactory;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.rest.GroupRest;
import com.mobi.ontologies.foaf.Agent;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import net.sf.json.JSONArray;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class GroupRestImpl implements GroupRest {
    private EngineManager engineManager;
    private ValueFactory vf;
    private ModelFactory mf;
    private UserFactory userFactory;
    private GroupFactory groupFactory;
    private SesameTransformer transformer;
    private Engine rdfEngine;
    private final Logger logger = LoggerFactory.getLogger(GroupRestImpl.class);

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setModelFactory(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setUserFactory(UserFactory userFactory) {
        this.userFactory = userFactory;
    }

    @Reference
    void setGroupFactory(GroupFactory groupFactory) {
        this.groupFactory = groupFactory;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference(target = "(engineName=RdfEngine)")
    void setRdfEngine(Engine engine) {
        this.rdfEngine = engine;
    }

    @Override
    public Response getGroups() {
        try {
            JSONArray result = JSONArray.fromObject(engineManager.getGroups(rdfEngine.getEngineName()).stream()
                    .map(group -> group.getModel().filter(group.getResource(), null, null))
                    .map(groupModel -> modelToJsonld(groupModel, transformer))
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(Collectors.toList()));
            return Response.ok(result).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createGroup(String title, String description, List<FormDataBodyPart> roles,
                                List<FormDataBodyPart> members) {
        checkStringParam(title, "Group title is required");
        if (engineManager.groupExists(title)) {
            throw ErrorUtils.sendError("Group " + title + " already exists", Response.Status.BAD_REQUEST);
        }

        Set<String> memberSet = members.stream().map(member -> member.getValue()).collect(Collectors.toSet());
        GroupConfig.Builder builder = new GroupConfig.Builder(title).members(memberSet);
        if (description != null) {
            builder.description(description);
        }
        if (roles != null && roles.size() > 0) {
            Set<String> roleSet = roles.stream().map(role -> role.getValue()).collect(Collectors.toSet());
             builder.roles(roleSet);
        }

        Group group = engineManager.createGroup(rdfEngine.getEngineName(), builder.build());
        engineManager.storeGroup(rdfEngine.getEngineName(), group);
        logger.info("Created group " + title);
        return Response.status(201).entity(group.getResource().stringValue()).build();
    }

    @Override
    public Response getGroup(String groupTitle) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Group group = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.NOT_FOUND));

        String json = groupedModelToString(group.getModel().filter(group.getResource(), null, null),
                getRDFFormat("jsonld"), transformer);
        return Response.ok(getObjectFromJsonld(json)).build();
    }

    @Override
    public Response updateGroup(String groupTitle, String newGroupStr) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Model groupModel = jsonldToModel(newGroupStr, transformer);
        Set<Resource> subjects = groupModel.filter(null, vf.createIRI(RDF.TYPE.stringValue()),
                vf.createIRI(Group.TYPE)).subjects();
        if (subjects.size() < 1) {
            throw ErrorUtils.sendError("Group must have an ID", Response.Status.BAD_REQUEST);
        }
        Group newGroup = groupFactory.createNew(subjects.iterator().next(), groupModel);

        Value title = newGroup.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                ErrorUtils.sendError("Group title must be present in new group", Response.Status.BAD_REQUEST));
        Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        if (!savedGroup.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).get().equals(title)) {
            throw ErrorUtils.sendError("Group titles must match", Response.Status.BAD_REQUEST);
        }
        if (!savedGroup.getHasGroupRole().isEmpty()) {
            newGroup.setHasGroupRole(savedGroup.getHasGroupRole());
        }
        if (!savedGroup.getMember().isEmpty()) {
            newGroup.setMember(savedGroup.getMember());
        }

        engineManager.updateGroup(rdfEngine.getEngineName(), newGroup);
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

        engineManager.deleteGroup(rdfEngine.getEngineName(), groupTitle);
        logger.info("Deleted group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response getGroupRoles(String groupTitle) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Group group = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));

        JSONArray result = JSONArray.fromObject(group.getHasGroupRole().stream()
                .map(role -> role.getModel().filter(role.getResource(), null, null))
                .map(roleModel -> modelToJsonld(roleModel, transformer))
                .map(RestUtils::getObjectFromJsonld)
                .collect(Collectors.toList()));
        return Response.ok(result).build();
    }

    @Override
    public Response addGroupRoles(String groupTitle, List<String> roles) {
        if (groupTitle == null || roles.isEmpty()) {
            throw ErrorUtils.sendError("Both group title and roles must be provided", Response.Status.BAD_REQUEST);
        }
        Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Set<Role> roleObjs = new HashSet<>();
        roles.forEach(s -> roleObjs.add(engineManager.getRole(rdfEngine.getEngineName(), s).orElseThrow(() ->
                ErrorUtils.sendError("Role " + s + " not found", Response.Status.BAD_REQUEST))));
        Set<Role> allRoles = savedGroup.getHasGroupRole();
        allRoles.addAll(roleObjs);
        savedGroup.setHasGroupRole(allRoles);
        engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
        logger.info("Role(s) " + String.join(", ", roles) + " to group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response removeGroupRole(String groupTitle, String role) {
        if (groupTitle == null || role == null) {
            throw ErrorUtils.sendError("Both group title and role must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Role roleObj = engineManager.getRole(rdfEngine.getEngineName(), role).orElseThrow(() ->
                ErrorUtils.sendError("Role " + role + " not found", Response.Status.BAD_REQUEST));
        savedGroup.removeProperty(roleObj.getResource(), vf.createIRI(Group.hasGroupRole_IRI));
        engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
        logger.info("Removed role " + role + " from group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response getGroupUsers(String groupTitle) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Set<User> members = savedGroup.getMember().stream()
                .map(agent -> userFactory.getExisting(agent.getResource(), agent.getModel()).orElseThrow(() ->
                        new IllegalStateException("Unable to get User: " + agent.getResource().stringValue())))
                .collect(Collectors.toSet());

        JSONArray result = JSONArray.fromObject(members.stream()
                .map(member -> member.getModel().filter(member.getResource(), null, null))
                .map(roleModel -> modelToJsonld(roleModel, transformer))
                .map(RestUtils::getObjectFromJsonld)
                .collect(Collectors.toList()));
        return Response.ok(result).build();
    }

    @Override
    public Response addGroupUser(String groupTitle, List<String> usernames) {
        if (groupTitle == null) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Set<User> users = new HashSet<>();
        for (String username : usernames) {
            users.add(engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST)));
        }
        Set<Agent> newMembers = savedGroup.getMember();
        newMembers.addAll(users);
        savedGroup.setMember(newMembers);
        engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
        logger.info("Added user(s) " + String.join(", ", usernames) + " to group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response removeGroupUser(String groupTitle, String username) {
        if (groupTitle == null || username == null) {
            throw ErrorUtils.sendError("Both group title and username must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        savedGroup.removeProperty(savedUser.getResource(), vf.createIRI(Group.member_IRI));
        engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
        logger.info("Removed user " + username + " from group " + groupTitle);
        return Response.ok().build();
    }
}

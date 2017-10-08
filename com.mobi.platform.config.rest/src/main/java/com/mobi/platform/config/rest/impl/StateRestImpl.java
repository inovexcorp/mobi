package com.mobi.platform.config.rest.impl;

/*-
 * #%L
 * com.mobi.platform.config.rest
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

import static com.mobi.rest.util.RestUtils.getActiveUsername;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.platform.config.rest.StateRest;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.platform.config.rest.StateRest;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class StateRestImpl implements StateRest {
    protected StateManager stateManager;
    protected ValueFactory factory;
    protected ModelFactory modelFactory;
    protected SesameTransformer transformer;

    @Reference
    protected void setStateManager(StateManager stateManager) {
        this.stateManager = stateManager;
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
    protected void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public Response getStates(ContainerRequestContext context, String applicationId, List<String> subjectIds) {
        String username = RestUtils.getActiveUsername(context);
        Set<Resource> subjects = subjectIds.stream()
                .map(factory::createIRI)
                .collect(Collectors.toSet());
        try {
            Map<Resource, Model> results = stateManager.getStates(username, applicationId, subjects);
            JSONArray array = new JSONArray();
            results.keySet().forEach(resource -> {
                JSONObject state = new JSONObject();
                state.put("id", resource.stringValue());
                state.put("model", convertModel(results.get(resource)));
                array.add(state);
            });
            return Response.ok(array).build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createState(ContainerRequestContext context, String applicationId, String stateJson) {
        String username = RestUtils.getActiveUsername(context);
        try {
            Model newState = transformer.matontoModel(Rio.parse(IOUtils.toInputStream(stateJson), "",
                    RDFFormat.JSONLD));
            if (newState.isEmpty()) {
                throw ErrorUtils.sendError("Empty state model", Response.Status.BAD_REQUEST);
            }
            Resource stateId = (applicationId == null) ? stateManager.storeState(newState, username)
                    : stateManager.storeState(newState, username, applicationId);
            return Response.status(201).entity(stateId.stringValue()).build();
        } catch (IOException ex) {
            throw ErrorUtils.sendError(ex, "Invalid JSON-LD", Response.Status.BAD_REQUEST);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.NOT_FOUND);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getState(ContainerRequestContext context, String stateId) {
        String username = RestUtils.getActiveUsername(context);
        try {
            if (!stateManager.stateExistsForUser(factory.createIRI(stateId), username)) {
                throw ErrorUtils.sendError("Not allowed", Response.Status.FORBIDDEN);
            }
            Model state = stateManager.getState(factory.createIRI(stateId));
            return Response.ok(convertModel(state)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.NOT_FOUND);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateState(ContainerRequestContext context, String stateId, String newStateJson) {
        String username = RestUtils.getActiveUsername(context);
        try {
            if (!stateManager.stateExistsForUser(factory.createIRI(stateId), username)) {
                throw ErrorUtils.sendError("Not allowed", Response.Status.FORBIDDEN);
            }
            Model newState = transformer.matontoModel(Rio.parse(IOUtils.toInputStream(newStateJson), "",
                    RDFFormat.JSONLD));
            if (newState.isEmpty()) {
                throw ErrorUtils.sendError("Empty state model", Response.Status.BAD_REQUEST);
            }
            stateManager.updateState(factory.createIRI(stateId), newState);
        } catch (IOException ex) {
            throw ErrorUtils.sendError(ex, "Invalid JSON-LD", Response.Status.BAD_REQUEST);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.NOT_FOUND);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    @Override
    public Response deleteState(ContainerRequestContext context, String stateId) {
        String username = RestUtils.getActiveUsername(context);
        try {
            if (!stateManager.stateExistsForUser(factory.createIRI(stateId), username)) {
                throw ErrorUtils.sendError("Not allowed", Response.Status.FORBIDDEN);
            }
            stateManager.deleteState(factory.createIRI(stateId));
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.NOT_FOUND);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    private String convertModel(Model model) {
        return RestUtils.modelToJsonld(model, transformer);
    }
}

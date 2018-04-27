package com.mobi.catalog.rest.impl;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.modelToJsonld;
import static com.mobi.rest.util.RestUtils.jsonldToModel;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.catalog.rest.MergeRequestRest;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import net.sf.json.JSONArray;
import org.apache.commons.lang3.StringUtils;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class MergeRequestRestImpl implements MergeRequestRest {

    private MergeRequestManager manager;
    private SesameTransformer transformer;
    private EngineManager engineManager;
    private MergeRequestFactory mergeRequestFactory;
    private ValueFactory vf;
    private ModelFactory mf;

    @Reference
    void setManager(MergeRequestManager manager) {
        this.manager = manager;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setMergeRequestFactory(MergeRequestFactory mergeRequestFactory) {
        this.mergeRequestFactory = mergeRequestFactory;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Override
    public Response getMergeRequests() {
        try {
            Set<MergeRequest> requests = manager.getMergeRequests();
            JSONArray result = JSONArray.fromObject(requests.stream()
                    .map(request -> removeContext(request.getModel()))
                    .map(model -> modelToJsonld(model, transformer))
                    .collect(Collectors.toSet()));
            return Response.ok(result).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createMergeRequests(ContainerRequestContext context, String title, String description,
                                        String recordId, String sourceBranchId, String targetBranchId,
                                        List<FormDataBodyPart> assignees) {

        checkStringParam(title, "Merge Request title is required");
        checkStringParam(recordId, "Merge Request record is required");
        checkStringParam(sourceBranchId, "Merge Request source branch is required");
        checkStringParam(targetBranchId, "Merge Request target branch is required");
        User activeUser = getActiveUser(context, engineManager);
        MergeRequestConfig.Builder builder = new MergeRequestConfig.Builder(title, vf.createIRI(recordId),
                vf.createIRI(sourceBranchId), vf.createIRI(targetBranchId), activeUser);
        if (!StringUtils.isBlank(description)) {
            builder.description(description);
        }
        if (assignees != null ) {
            assignees.forEach(part -> {
                String username = part.getValue();
                Optional<User> assignee = engineManager.retrieveUser(username);
                if (!assignee.isPresent()) {
                    throw ErrorUtils.sendError("User " + username + " does not exist", Response.Status.BAD_REQUEST);
                }
                builder.addAssignee(assignee.get());
            });
        }
        try {
            MergeRequest request = manager.createMergeRequest(builder.build());
            manager.addMergeRequest(request);
            return Response.status(201).entity(request.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getMergeRequest(String requestId) {
        try {
            MergeRequest request = manager.getMergeRequest(vf.createIRI(requestId)).orElseThrow(() ->
                    ErrorUtils.sendError("Merge Request " + requestId + " could not be found",
                            Response.Status.NOT_FOUND));
            Model cleanModel = removeContext(request.getModel());
            return Response.ok(groupedModelToString(cleanModel, getRDFFormat("jsonld"), transformer)).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateMergeRequest(String requestId, String newMergeRequest) {
        try {
            Resource requestIdResource = vf.createIRI(requestId);
            manager.updateMergeRequest(requestIdResource, jsonToMergeRequest(requestIdResource, newMergeRequest));
            return Response.ok().build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteMergeRequest(String requestId) {
        try {
            Resource requestIdResource = vf.createIRI(requestId);
            try {
                manager.deleteMergeRequest(requestIdResource);
            } catch (IllegalArgumentException ex) {
                throw ErrorUtils.sendError("Merge Request " + requestId + " could not be found",
                        Response.Status.NOT_FOUND);
            }
            return Response.ok().build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Model removeContext(Model model) {
        Model result = mf.createModel();
        model.forEach(statement -> result.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        return result;
    }

    private MergeRequest jsonToMergeRequest(Resource requestId, String jsonMergeRequest) {
        Model mergeReqModel = jsonldToModel(jsonMergeRequest, transformer);
        return mergeRequestFactory.getExisting(requestId, mergeReqModel).orElseThrow(() ->
                ErrorUtils.sendError("MergeRequest IDs must match", Response.Status.BAD_REQUEST));
    }
}

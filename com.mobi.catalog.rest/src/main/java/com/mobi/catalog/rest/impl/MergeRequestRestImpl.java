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
import static com.mobi.rest.util.RestUtils.createIRI;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.Comment;
import com.mobi.catalog.api.ontologies.mergerequests.CommentFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.catalog.rest.MergeRequestRest;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.Value;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class MergeRequestRestImpl implements MergeRequestRest {

    private MergeRequestManager manager;
    private CatalogConfigProvider configProvider;
    private SesameTransformer transformer;
    private EngineManager engineManager;
    private MergeRequestFactory mergeRequestFactory;
    private CommentFactory commentFactory;
    private ValueFactory vf;

    @Reference
    void setManager(MergeRequestManager manager) {
        this.manager = manager;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
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
    void setCommentFactory(CommentFactory commentFactory) {
        this.commentFactory = commentFactory;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public Response getMergeRequests(String sort, boolean asc, boolean accepted) {
        MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
        if (!StringUtils.isEmpty(sort)) {
            builder.setSortBy(createIRI(sort, vf));
        }
        builder.setAscending(asc).setAccepted(accepted);
        try {
            JSONArray result = JSONArray.fromObject(manager.getMergeRequests(builder.build()).stream()
                    .map(request -> modelToJsonld(request.getModel(), transformer))
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(Collectors.toList()));
            return Response.ok(result).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createMergeRequests(ContainerRequestContext context, String title, String description,
                                        String recordId, String sourceBranchId, String targetBranchId,
                                        List<FormDataBodyPart> assignees, boolean removeSource) {

        checkStringParam(title, "Merge Request title is required");
        checkStringParam(recordId, "Merge Request record is required");
        checkStringParam(sourceBranchId, "Merge Request source branch is required");
        checkStringParam(targetBranchId, "Merge Request target branch is required");
        User activeUser = getActiveUser(context, engineManager);
        MergeRequestConfig.Builder builder = new MergeRequestConfig.Builder(title, createIRI(recordId, vf),
                createIRI(sourceBranchId, vf), createIRI(targetBranchId, vf), activeUser, removeSource);
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
            MergeRequest request = manager.createMergeRequest(builder.build(), configProvider.getLocalCatalogIRI());
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
        Resource requestIdResource = createIRI(requestId, vf);
        try {
            MergeRequest request = manager.getMergeRequest(requestIdResource).orElseThrow(() ->
                    ErrorUtils.sendError("Merge Request " + requestId + " could not be found",
                            Response.Status.NOT_FOUND));
            String json = groupedModelToString(request.getModel(), getRDFFormat("jsonld"), transformer);
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateMergeRequest(String requestId, String newMergeRequest) {
        Resource requestIdResource = createIRI(requestId, vf);
        try {
            manager.updateMergeRequest(requestIdResource, jsonToMergeRequest(requestIdResource, newMergeRequest));
            return Response.ok().build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PROP_PATH, value = "<" + MergeRequest.onRecord_IRI + ">",
            start = @Value(type = ValueType.PATH, value = "requestId"))
    @ActionAttributes(@AttributeValue(type = ValueType.PROP_PATH, value = "<" + MergeRequest.targetBranch_IRI + ">",
            id = VersionedRDFRecord.branch_IRI, start = @Value(type = ValueType.PATH, value = "requestId")))
    @Override
    public Response acceptMergeRequest(ContainerRequestContext context, String requestId) {
        Resource requestIdResource = createIRI(requestId, vf);
        User activeUser = getActiveUser(context, engineManager);
        try {
            manager.acceptMergeRequest(requestIdResource, activeUser);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteMergeRequest(String requestId) {
        Resource requestIdResource = createIRI(requestId, vf);
        try {
            manager.deleteMergeRequest(requestIdResource);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex,"Merge Request " + requestId + " could not be found",
                    Response.Status.NOT_FOUND);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }


    @Override
    public Response getComments(String requestId) {
        Resource requestIdResource = createIRI(requestId, vf);
        try {
            List<List<JSONObject>> commentsJson = manager.getComments(requestIdResource).stream().map(
                    commentChain -> commentChain.stream()
                            .map(comment -> getObjectFromJsonld(groupedModelToString(comment.getModel(),
                                    getRDFFormat("jsonld"), transformer)))
                            .collect(Collectors.toList())).collect(Collectors.toList());
            return Response.ok(commentsJson).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getComment(String requestId, String commentId) {
        try {
            manager.getMergeRequest(createIRI(requestId, vf)).orElseThrow(() ->
                    ErrorUtils.sendError("Comment " + requestId + " could not be found",
                            Response.Status.NOT_FOUND));
            Comment comment = manager.getComment(createIRI(commentId, vf)).orElseThrow(() ->
                    ErrorUtils.sendError("Comment " + commentId + " could not be found",
                            Response.Status.NOT_FOUND));
            String json = groupedModelToString(comment.getModel(), getRDFFormat("jsonld"), transformer);
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createComment(ContainerRequestContext context, String requestId, String commentId,
                                  String commentStr) {
        checkStringParam(commentStr, "Comment string is required");
        User activeUser = getActiveUser(context, engineManager);

        try {
            Comment comment = null;
            if (StringUtils.isEmpty(commentId)) {
                comment = manager.createComment(createIRI(requestId, vf), activeUser, commentStr);
            } else {
                comment = manager.createComment(createIRI(requestId, vf), activeUser, commentStr,
                        createIRI(commentId, vf));
            }
            return Response.status(201).entity(comment.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateComment(String commentId, String newComment) {
        Resource commentIdResource = createIRI(commentId, vf);
        try {
            manager.updateComment(commentIdResource, jsonToComment(commentIdResource, newComment));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteComment(ContainerRequestContext context, String requestId, String commentId) {
        try {
            Resource commentIRI = createIRI(commentId, vf);
            manager.getMergeRequest(createIRI(requestId, vf)).orElseThrow(() ->
                    ErrorUtils.sendError("Comment " + requestId + " could not be found",
                            Response.Status.NOT_FOUND));
            Comment comment = manager.getComment(commentIRI).orElseThrow(() ->
                    ErrorUtils.sendError("Comment " + commentId + " could not be found",
                            Response.Status.NOT_FOUND));
            Optional<com.mobi.rdf.api.Value> commentUser = comment.getProperty(vf.createIRI(_Thing.creator_IRI));
            User user = getActiveUser(context, engineManager);
            if (commentUser.isPresent() && commentUser.get().stringValue().equals(user.getResource().stringValue())) {
                manager.deleteComment(commentIRI);
            } else {
                throw ErrorUtils.sendError("User not permitted to delete comment " + commentId,
                        Response.Status.FORBIDDEN);
            }
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private MergeRequest jsonToMergeRequest(Resource requestId, String jsonMergeRequest) {
        Model mergeReqModel = jsonldToModel(jsonMergeRequest, transformer);
        return mergeRequestFactory.getExisting(requestId, mergeReqModel).orElseThrow(() ->
                ErrorUtils.sendError("MergeRequest IDs must match", Response.Status.BAD_REQUEST));
    }

    private Comment jsonToComment(Resource commentId, String jsonComment) {
        Model commentModel = jsonldToModel(jsonComment, transformer);
        return commentFactory.getExisting(commentId, commentModel).orElseThrow(() ->
                ErrorUtils.sendError("Comment IDs must match", Response.Status.BAD_REQUEST));
    }
}

package com.mobi.prov.rest;

/*-
 * #%L
 * com.mobi.prov.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import static com.mobi.rest.util.LinksUtils.validateParams;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.exception.MobiException;
import com.mobi.ontologies.provo.Activity;
import com.mobi.persistence.utils.Bindings;
import com.mobi.prov.api.ProvActivityAction;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.jaxb.Links;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Nullable;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Component(service = ProvRest.class, immediate = true)
@JaxrsResource
@Path("/provenance-data")
public class ProvRest {

    private static final Logger LOG = LoggerFactory.getLogger(ProvRest.class);

    private ProvenanceService provService;
    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    private static final ObjectMapper mapper = new ObjectMapper();

    private RepositoryManager repositoryManager;

    private static final String GET_ACTIVITIES_QUERY;
    private static final String GET_ACTIVITIES_COUNT_QUERY;
    private static final String GET_ENTITIES_QUERY;
    private static final String ACTIVITY_COUNT_BINDING = "count";
    private static final String ACTIVITY_BINDING = "activity";
    private static final String ENTITY_FILTER = "%ENTITY_FILTER%";
    private static final String AGENT_BINDING = "agent";

    static {
        try {
            GET_ACTIVITIES_COUNT_QUERY = IOUtils.toString(
                    ProvRest.class.getResourceAsStream("/get-activities-count.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ACTIVITIES_QUERY = IOUtils.toString(
                    ProvRest.class.getResourceAsStream("/get-activities.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ENTITIES_QUERY = IOUtils.toString(
                    ProvRest.class.getResourceAsStream("/get-entities.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    void setProvService(ProvenanceService provService) {
        this.provService = provService;
    }

    @Reference
    void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    /**
     * Returns a JSON object with all the Activities sorted by date with latest first and all referenced Entities.
     * Parameters can be passed to control paging.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of Activities
     * @param offset The offset for the page.
     * @param limit The number of Activities to return in one page.
     * @return A JSON object with a key for activities and a key for entities
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "provenance-data",
            summary = "Retrieves a JSON object with a paginated list of provenance Activities and referenced Entities",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object with a key for activities and a key for entities"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getActivities(
            @Context UriInfo uriInfo,
            @Parameter(description = "An entity IRI to filter the results by", required = false)
            @QueryParam("entity") String entityIri,
            @Parameter(description = "An entity IRI to filter the results by", required = false)
            @QueryParam("agent") String agentIri,
            @Parameter(schema = @Schema(type = "integer", description = "The URI information of the request "
                    + "to be used in creating links to other pages of Activities", required = false))
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(schema = @Schema(type = "integer", description = "The offset for the page", required = false))
            @DefaultValue("50") @QueryParam("limit") int limit) {
        validateParams(limit, offset);
        Resource entity = null;
        if ( StringUtils.isNotEmpty(entityIri)) {
            entity = vf.createIRI(entityIri);
        }
        Resource agent = null;
        if ( StringUtils.isNotEmpty(agentIri)) {
            agent = vf.createIRI(agentIri);
        }
        List<Activity> activityList = new ArrayList<>();
        try (RepositoryConnection conn = provService.getConnection()) {
            StopWatch watch = new StopWatch();
            LOG.trace("Start collecting prov activities count");
            watch.start();
            TupleQuery countQuery = conn.prepareTupleQuery(replaceEntityFilter(GET_ACTIVITIES_COUNT_QUERY, entity));
            replaceAgentFilter(countQuery, agent);
            TupleQueryResult countResult = countQuery.evaluate();
            int totalCount;
            BindingSet bindingSet;
            if (!countResult.hasNext()
                    || !(bindingSet = countResult.next()).getBindingNames().contains(ACTIVITY_COUNT_BINDING)
                    || (totalCount = Bindings.requiredLiteral(bindingSet, ACTIVITY_COUNT_BINDING).intValue()) == 0) {
                watch.stop();
                countResult.close();
                LOG.trace("End collecting prov activities count: " + watch.getTime() + "ms");
                return Response.ok(createReturnObj(activityList)).header("X-Total-Count", 0).build();
            }
            watch.stop();
            LOG.trace("End collecting prov activities count: " + watch.getTime() + "ms");
            watch.reset();
            LOG.trace("Start collecting prov activities");
            watch.start();
            String queryStr = replaceEntityFilter(GET_ACTIVITIES_QUERY, entity)
                    + "\nLIMIT " + limit + "\nOFFSET " + offset;
            TupleQuery query = conn.prepareTupleQuery(queryStr);
            replaceAgentFilter(query, agent);
            TupleQueryResult result = query.evaluate();
            result.forEach(bindings -> {
                Resource resource = vf.createIRI(Bindings.requiredResource(bindings, ACTIVITY_BINDING).stringValue());
                Activity fullActivity = provService.getActivity(resource).orElseThrow(() ->
                        ErrorUtils.sendError("Activity could not be found", Response.Status.INTERNAL_SERVER_ERROR));
                activityList.add(fullActivity);
            });
            watch.stop();
            LOG.trace("End collecting prov activities: " + watch.getTime() + "ms");
            watch.reset();
            Links links = LinksUtils.buildLinks(uriInfo, activityList.size(), totalCount, limit, offset);
            Response.ResponseBuilder response = Response.ok(createReturnObj(activityList))
                    .header("X-Total-Count", totalCount);
            if (links.getNext() != null) {
                response = response.link(links.getBase() + links.getNext(), "next");
            }
            if (links.getPrev() != null) {
                response = response.link(links.getBase() + links.getPrev(), "prev");
            }
            countResult.close();
            return response.build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns a JSON object representing the triples with a subject of the passed in resource ID.
     *
     * @return A JSON object that is the complete representation of the provenance Activity
     */
    @GET
    @Path("{activityId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "provenance-data",
            summary = "Retrieves a JSON object representing the passed in provenance Activity",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object representing the passed in activity"),
                    @ApiResponse(responseCode = "404", description = "Activity Not Found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getActivity(
            @Parameter(description = "String representing the identifier of the activity", required = true)
            @PathParam("activityId") String provenanceId) {
        try {
            Activity provActivity = provService.getActivity(vf.createIRI(provenanceId)).orElseThrow(() ->
                    ErrorUtils.sendError("Provenance Activity not found", Response.Status.NOT_FOUND));
            String json = groupedModelToString(provActivity.getModel(), getRDFFormat("jsonld"));
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @return Returns a JSON object of the action words, predicate, and types.
     */
    @GET
    @Path("/actions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "provenance-data",
            summary = "Retrieves a JSON object of the action words for activities",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object containing the action words, predicate, and types."),
                    @ApiResponse(responseCode = "404", description = "Activity actions not found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getActionWords() {
        try {
            List<ProvActivityAction> activityToAction = provService.getActionWords();
            String json = mapper.writeValueAsString(activityToAction);
            return Response.ok(json).build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | JsonProcessingException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private JSONObject createReturnObj(List<Activity> activities) {
        JSONArray activityArr = new JSONArray();
        Model entitiesModel = mf.createEmptyModel();
        Map<String, List<String>> repoToEntities = new HashMap<>();
        activities.forEach(activity -> {
            Model entityModel = mf.createEmptyModel();
            entityModel.addAll(activity.getModel());
            entityModel.remove(activity.getResource(), null, null);
            entitiesModel.addAll(entityModel);
            entityModel.filter(null, vf.createIRI("http://www.w3.org/ns/prov#atLocation"), null).forEach(statement -> {
                Resource entityIRI = statement.getSubject();
                String repoId = statement.getObject().stringValue();
                if (repoToEntities.containsKey(repoId)) {
                    repoToEntities.get(repoId).add("<" + entityIRI + ">");
                } else {
                    repoToEntities.put(repoId, new ArrayList<>(Collections.singletonList("<" + entityIRI + ">")));
                }
            });
            Model tempModel = mf.createEmptyModel();
            tempModel.addAll(activity.getModel());
            Model activityModel = tempModel.filter(activity.getResource(), null, null);
            activityArr.add(RestUtils.getObjectFromJsonld(RestUtils.modelToJsonld(activityModel)));
        });
        StopWatch watch = new StopWatch();
        repoToEntities.keySet().forEach(repoId -> {
            LOG.trace("Start collecting entities for prov activities in " + repoId);
            watch.start();
            OsgiRepository repo = repositoryManager.getRepository(repoId).orElseThrow(() ->
                    new IllegalStateException("Repository " + repoId + " could not be found"));
            try (RepositoryConnection entityConn = repo.getConnection()) {
                String entityQueryStr = GET_ENTITIES_QUERY.replace("#ENTITIES#",
                        String.join(" ", repoToEntities.get(repoId)));
                GraphQuery entityQuery = entityConn.prepareGraphQuery(entityQueryStr);
                entitiesModel.addAll(QueryResults.asModel(entityQuery.evaluate(), mf));
                watch.stop();
                LOG.trace("End collecting entities for prov activities in " + repoId + ": " + watch.getTime() + "ms");
                watch.reset();
            }
        });
        JSONObject object = new JSONObject();
        object.element("activities", activityArr);
        object.element("entities", RestUtils.modelToJsonld(entitiesModel));
        return object;
    }

    private String replaceEntityFilter(String query, @Nullable Resource entity) {
        if (entity == null) {
            return query.replace(ENTITY_FILTER, "");
        } else {
            return query.replace(ENTITY_FILTER, "FILTER(?entity = <" + entity + ">)\n");
        }
    }

    private void replaceAgentFilter(TupleQuery query, @Nullable Resource agent) {
        if (agent != null) {
            query.setBinding(AGENT_BINDING, agent);
        }
    }
}

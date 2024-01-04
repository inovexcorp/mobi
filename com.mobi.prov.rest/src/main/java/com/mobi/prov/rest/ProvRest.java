package com.mobi.prov.rest;

/*-
 * #%L
 * com.mobi.prov.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
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
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.xacml.XACML;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
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
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.Nullable;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
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

    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    private static final ObjectMapper mapper = new ObjectMapper();

    @Reference
    protected ProvenanceService provService;

    @Reference
    protected RepositoryManager repositoryManager;

    @Reference
    protected RecordFactory recordFactory;

    @Reference
    protected PDP pdp;

    @Reference
    protected EngineManager engineManager;

    private static final String GET_DISTINCT_ACTIVITIES_QUERY;
    private static final String GET_ENTITIES_QUERY;
    private static final String ACTIVITY_BINDING = "activity";
    private static final String ENTITY_BINDING = "entity";
    private static final String REPO_ID_BINDING = "repoId";
    private static final String ENTITY_FILTER = "%ENTITY_FILTER%";
    private static final String AGENT_BINDING = "agent";

    static {
        try {
            GET_DISTINCT_ACTIVITIES_QUERY = IOUtils.toString(
                    Objects.requireNonNull(ProvRest.class.getResourceAsStream("/get-distinct-activities.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ENTITIES_QUERY = IOUtils.toString(
                    Objects.requireNonNull(ProvRest.class.getResourceAsStream("/get-entities.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
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
    public Response getActivities(@Context HttpServletRequest servletRequest,
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
        User user = getActiveUser(servletRequest, engineManager);
        validateParams(limit, offset);
        Resource entity = null;
        if (StringUtils.isNotEmpty(entityIri)) {
            entity = vf.createIRI(entityIri);
        }
        Resource agent = null;
        if (StringUtils.isNotEmpty(agentIri)) {
            agent = vf.createIRI(agentIri);
        }
        try (RepositoryConnection conn = provService.getConnection()) {
            StopWatch watch = new StopWatch();
            LOG.trace("Start collecting initial prov activities data");
            watch.start();
            TupleQuery distinctQuery = conn.prepareTupleQuery(replaceEntityFilter(GET_DISTINCT_ACTIVITIES_QUERY,
                    entity));
            replaceAgentFilter(distinctQuery, agent);
            Set<Resource> activities = new LinkedHashSet<>();
            Map<String, List<String>> repoToEntities = new HashMap<>();
            Map<Resource, List<Resource>> entityToActivities = new HashMap<>();
            try (TupleQueryResult distinctResult = distinctQuery.evaluate()) {
                if (!distinctResult.hasNext()) {
                    JSONObject object = new JSONObject();
                    object.element("activities", new JSONArray());
                    object.element("entities", new JSONArray());
                    return Response.ok(object).header("X-Total-Count", 0).build();
                }
                distinctResult.forEach(bindings -> {
                    Resource activityIRI = Bindings.requiredResource(bindings, ACTIVITY_BINDING);
                    Resource entityIRI = Bindings.requiredResource(bindings, ENTITY_BINDING);
                    String repoId = Bindings.requiredLiteral(bindings, REPO_ID_BINDING).stringValue();
                    activities.add(activityIRI);
                    repoToEntities.putIfAbsent(repoId, new ArrayList<>());
                    if (!repoToEntities.get(repoId).contains("<" + entityIRI + ">")) {
                        repoToEntities.get(repoId).add("<" + entityIRI + ">");
                    }
                    entityToActivities.putIfAbsent(entityIRI, new ArrayList<>());
                    entityToActivities.get(entityIRI).add(activityIRI);
                });
            } finally {
                watch.stop();
                LOG.trace("End collecting initial prov activities data: " + watch.getTime() + "ms");
                watch.reset();
            }

            Model entitiesModel = mf.createEmptyModel();
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
                    LOG.trace("End collecting entities for prov activities in " + repoId + ": "
                            + watch.getTime() + "ms");
                    watch.reset();
                }
            });

            // Filter list if any entities are Records
            Collection<Record> records = recordFactory.getAllExisting(entitiesModel);
            if (records.size() > 0) {
                LOG.trace("Entities contain records. Executing access control filtering.");
                watch.start();
                IRI subjectId = (IRI) user.getResource();
                IRI actionId = vf.createIRI(Read.TYPE);

                List<IRI> resourceIds = records.stream().map(Record::getResource).map(resource -> (IRI) resource)
                        .collect(Collectors.toList());
                Map<String, Literal> subjectAttrs = Collections.singletonMap(XACML.SUBJECT_ID,
                        vf.createLiteral(subjectId.stringValue()));
                Map<String, Literal> actionAttrs = Collections.singletonMap(XACML.ACTION_ID,
                        vf.createLiteral(actionId.stringValue()));

                Request request = pdp.createRequest(List.of(subjectId), subjectAttrs, resourceIds, new HashMap<>(),
                        List.of(actionId), actionAttrs);

                Set<String> viewableRecords = pdp.filter(request, vf.createIRI(POLICY_PERMIT_OVERRIDES));
                entityToActivities.keySet().forEach(entityIRI -> {
                    if (!viewableRecords.contains(entityIRI.stringValue())) {
                        LOG.trace("Removing record " + entityIRI + " from return set");
                        entitiesModel.remove(entityIRI, null, null);
                        List<Resource> activityIRIsToRemove = entityToActivities.get(entityIRI);
                        LOG.trace("Removing activities " + activityIRIsToRemove + " from return set");
                        activityIRIsToRemove.forEach(activities::remove);
                    }
                });
                watch.stop();
                LOG.trace("End access control filtering: " + watch.getTime() + "ms");
                watch.reset();
            }

            LOG.trace("Start collecting prov activities");
            watch.start();
            Model finalEntitiesModel = mf.createEmptyModel();
            List<Activity> activityList = new ArrayList<>();
            activities.stream().skip(offset).limit(limit).forEach(activityIRI -> {
                Activity fullActivity = provService.getActivity(activityIRI).orElseThrow(() ->
                        ErrorUtils.sendError("Activity could not be found", Response.Status.INTERNAL_SERVER_ERROR));
                activityList.add(fullActivity);
                Model entityModel = mf.createEmptyModel();
                entityModel.addAll(fullActivity.getModel());
                entityModel.remove(fullActivity.getResource(), null, null);
                finalEntitiesModel.addAll(entityModel);
                entityModel.subjects()
                        .forEach(entityIRI -> finalEntitiesModel.addAll(entitiesModel.filter(entityIRI, null, null)));
            });
            JSONArray activityArr = new JSONArray();
            activityList.forEach(activity -> {
                Model tempModel = mf.createEmptyModel();
                tempModel.addAll(activity.getModel());
                Model activityModel = tempModel.filter(activity.getResource(), null, null);
                activityArr.add(RestUtils.getObjectFromJsonld(RestUtils.modelToJsonld(activityModel)));
            });
            JSONObject object = new JSONObject();
            object.element("activities", activityArr);
            object.element("entities", RestUtils.modelToJsonld(finalEntitiesModel));
            watch.stop();
            LOG.trace("End collecting prov activities: " + watch.getTime() + "ms");

            Links links = LinksUtils.buildLinks(uriInfo, activityList.size(), activities.size(), limit, offset);
            Response.ResponseBuilder response = Response.ok(object).header("X-Total-Count", activities.size());
            if (links.getNext() != null) {
                response = response.link(links.getBase() + links.getNext(), "next");
            }
            if (links.getPrev() != null) {
                response = response.link(links.getBase() + links.getPrev(), "prev");
            }
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
     * Gets a list of the types of Activities within the system along with the associated "action word" to be used for
     * display and the expected predicate to follow to find associated entities.
     *
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

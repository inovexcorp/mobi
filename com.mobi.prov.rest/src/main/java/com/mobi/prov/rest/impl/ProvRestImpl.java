package com.mobi.prov.rest.impl;

/*-
 * #%L
 * com.mobi.prov.rest
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

import static com.mobi.rest.util.LinksUtils.validateParams;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.exception.MobiException;
import com.mobi.ontologies.provo.Activity;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.rest.ProvRest;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.jaxb.Links;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Component(immediate = true)
public class ProvRestImpl implements ProvRest {

    private static final Logger LOG = LoggerFactory.getLogger(ProvRestImpl.class);

    private ProvenanceService provService;
    private ValueFactory vf;
    private ModelFactory mf;
    private SesameTransformer transformer;
    private RepositoryManager repositoryManager;

    private static final String GET_ACTIVITIES_QUERY;
    private static final String GET_ACTIVITIES_COUNT_QUERY;
    private static final String GET_ENTITIES_QUERY;
    private static final String ACTIVITY_COUNT_BINDING = "count";
    private static final String ACTIVITY_BINDING = "activity";

    static {
        try {
            GET_ACTIVITIES_COUNT_QUERY = IOUtils.toString(
                    ProvRestImpl.class.getResourceAsStream("/get-activities-count.rq"),
                    "UTF-8"
            );
            GET_ACTIVITIES_QUERY = IOUtils.toString(
                    ProvRestImpl.class.getResourceAsStream("/get-activities.rq"),
                    "UTF-8"
            );
            GET_ENTITIES_QUERY = IOUtils.toString(
                    ProvRestImpl.class.getResourceAsStream("/get-entities.rq"),
                    "UTF-8"
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
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Override
    public Response getActivities(UriInfo uriInfo, int offset, int limit) {
        validateParams(limit, offset);
        List<Activity> activityList = new ArrayList<>();
        try (RepositoryConnection conn = provService.getConnection()) {
            StopWatch watch = new StopWatch();
            LOG.trace("Start collecting prov activities count");
            watch.start();
            TupleQuery countQuery = conn.prepareTupleQuery(GET_ACTIVITIES_COUNT_QUERY);
            TupleQueryResult countResult = countQuery.evaluateAndReturn();
            int totalCount;
            BindingSet bindingSet;
            if (!countResult.hasNext()
                    || !(bindingSet = countResult.next()).getBindingNames().contains(ACTIVITY_COUNT_BINDING)
                    || (totalCount = Bindings.requiredLiteral(bindingSet, ACTIVITY_COUNT_BINDING).intValue()) == 0) {
                watch.stop();
                LOG.trace("End collecting prov activities count: " + watch.getTime() + "ms");
                return Response.ok(createReturnObj(activityList)).header("X-Total-Count", 0).build();
            }
            watch.stop();
            LOG.trace("End collecting prov activities count: " + watch.getTime() + "ms");
            watch.reset();
            LOG.trace("Start collecting prov activities");
            watch.start();
            String queryStr = GET_ACTIVITIES_QUERY + "\nLIMIT " + limit + "\nOFFSET " + offset;
            TupleQuery query = conn.prepareTupleQuery(queryStr);
            TupleQueryResult result = query.evaluateAndReturn();
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
            return response.build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private JSONObject createReturnObj(List<Activity> activities) {
        JSONArray activityArr = new JSONArray();
        Model entitiesModel = mf.createModel();
        Map<String, List<String>> repoToEntities = new HashMap<>();
        activities.forEach(activity -> {
            Model entityModel = mf.createModel(activity.getModel());
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
            Model activityModel = mf.createModel(activity.getModel()).filter(activity.getResource(), null, null);
            activityArr.add(RestUtils.getObjectFromJsonld(RestUtils.modelToJsonld(activityModel, transformer)));
        });
        StopWatch watch = new StopWatch();
        repoToEntities.keySet().forEach(repoId -> {
            LOG.trace("Start collecting entities for prov activities in " + repoId);
            watch.start();
            Repository repo = repositoryManager.getRepository(repoId).orElseThrow(() ->
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
        object.element("entities", RestUtils.modelToJsonld(entitiesModel, transformer));
        return object;
    }
}

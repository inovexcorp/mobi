package org.matonto.dataset.rest.impl;

/*-
 * #%L
 * org.matonto.dataset.rest
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


import static org.matonto.rest.util.RestUtils.getActiveUser;
import static org.matonto.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.rest.DatasetRest;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

public class DatasetRestImpl implements DatasetRest {
    private DatasetManager manager;
    private EngineManager engineManager;
    private SesameTransformer transformer;
    private ValueFactory vf;

    @Reference
    public void setManager(DatasetManager manager) {
        this.manager = manager;
    }

    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    public void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    public void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public Response getDatasets() {
        JSONArray array = new JSONArray();
        try {
            manager.getDatasetRecords().stream()
                    .map(datasetRecord -> getObjectFromJsonld(
                            modelToJsonld(transformer.sesameModel(datasetRecord.getModel()))))
                    .forEach(array::add);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok(array).build();
    }

    @Override
    public Response createDataset(ContainerRequestContext context, String datasetIRI, String repositoryId, String title,
                                  String description, String keywords) {
        if (title == null || title.isEmpty()) {
            throw ErrorUtils.sendError("Title is required", Response.Status.BAD_REQUEST);
        }
        if (repositoryId == null || repositoryId.isEmpty()) {
            throw ErrorUtils.sendError("Repository id is required", Response.Status.BAD_REQUEST);
        }
        User activeUser = getActiveUser(context, engineManager);
        DatasetRecordConfig.DatasetRecordBuilder builder = new DatasetRecordConfig.DatasetRecordBuilder(title,
                Collections.singleton(activeUser), repositoryId);
        if (datasetIRI != null && !datasetIRI.isEmpty()) {
            builder.dataset(datasetIRI);
        }
        if (description != null && !description.isEmpty()) {
            builder.description(description);
        }
        if (keywords != null && !keywords.isEmpty()) {
            builder.keywords(Arrays.stream(StringUtils.split(keywords, ",")).collect(Collectors.toSet()));
        }
        DatasetRecord record;
        try {
            record = manager.createDataset(builder.build());
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }

        return Response.status(201).entity(record.getResource().stringValue()).build();
    }

    @Override
    public Response deleteDataset(String datasetRecordId, boolean force) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        try {
            if (force) {
                manager.deleteDataset(recordIRI);
            } else {
                manager.safeDeleteDataset(recordIRI);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    @Override
    public Response clearDataset(String datasetRecordId, boolean force) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        try {
            if (force) {
                manager.clearDataset(recordIRI);
            } else {
                manager.safeClearDataset(recordIRI);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    /**
     * Grabs a single Entity object from a JSON-LD string and returns it as a JSONObject. Looks within the first
     * context object if present.
     *
     * @param json A JSON-LD string.
     * @return The first object representing a single Entity present in the JSON-LD array.
     */
    private JSONObject getObjectFromJsonld(String json) {
        JSONArray array = JSONArray.fromObject(json);
        JSONObject firstObject = array.getJSONObject(0);
        if (firstObject.containsKey("@graph")) {
            firstObject = Optional.ofNullable(firstObject.getJSONArray("@graph").optJSONObject(0))
                    .orElse(new JSONObject());
        }
        return firstObject;
    }
}

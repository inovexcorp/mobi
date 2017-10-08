package com.mobi.analytic.rest.impl;

/*-
 * #%L
 * com.mobi.analytic.rest
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
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.analytic.api.builder.AnalyticRecordConfig;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import com.mobi.analytic.api.AnalyticManager;
import com.mobi.analytic.ontologies.analytic.AnalyticRecord;
import com.mobi.analytic.ontologies.analytic.Configuration;
import com.mobi.analytic.rest.AnalyticRest;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rest.util.ErrorUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component
public class AnalyticRestImpl implements AnalyticRest {

    private AnalyticManager analyticManager;
    private EngineManager engineManager;
    private CatalogProvUtils provUtils;
    private OrmFactoryRegistry factoryRegistry;
    private ValueFactory vf;
    private ModelFactory mf;
    private SesameTransformer transformer;

    @Reference
    void setAnalyticManager(AnalyticManager analyticManager) {
        this.analyticManager = analyticManager;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
    }

    @Reference
    void setFactoryRegistry(OrmFactoryRegistry factoryRegistry) {
        this.factoryRegistry = factoryRegistry;
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
    void setSesameTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public Response getConfigurationTypes() {
        try {
            return Response.ok(JSONArray.fromObject(getConfigurationFactories().keySet())).build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createAnalytic(ContainerRequestContext context, String typeIRI, String title, String description,
                                   String keywords, String json) {
        checkStringParam(title, "AnalyticRecord title is required");
        OrmFactory<? extends Configuration> factory = getConfigurationFactoryOfType(typeIRI);
        User activeUser = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(activeUser);
            Configuration configuration = analyticManager.createConfiguration(json, factory);
            AnalyticRecordConfig.AnalyticRecordBuilder builder = new AnalyticRecordConfig.AnalyticRecordBuilder(title,
                    Collections.singleton(activeUser), configuration);
            if (description != null) {
                builder.description(description);
            }
            if (keywords != null && !keywords.isEmpty()) {
                builder.keywords(Arrays.stream(StringUtils.split(keywords, ",")).collect(Collectors.toSet()));
            }
            AnalyticRecord newRecord = analyticManager.createAnalytic(builder.build());
            provUtils.endCreateActivity(createActivity, newRecord.getResource());
            JSONObject response = new JSONObject().element("analyticRecordId", newRecord.getResource().stringValue())
                    .element("configurationId", configuration.getResource().stringValue());
            return Response.status(201).entity(response).build();
        } catch (IllegalArgumentException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (Exception ex) {
            provUtils.removeActivity(createActivity);
            throw ex;
        }
    }

    @Override
    public Response getAnalytic(String analyticRecordId) {
        Resource recordIRI = vf.createIRI(analyticRecordId);
        try {
            AnalyticRecord analyticRecord = analyticManager.getAnalyticRecord(recordIRI).orElseThrow(() ->
                    ErrorUtils.sendError("AnalyticRecord " + analyticRecordId + " could not be found",
                            Response.Status.NOT_FOUND));
            Model copy = mf.createModel();
            analyticRecord.getModel().forEach(st -> copy.add(st.getSubject(), st.getPredicate(), st.getObject()));
            return Response.ok(modelToJsonld(copy, transformer)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateAnalytic(String analyticRecordId, String typeIRI, String json) {
        OrmFactory<? extends Configuration> factory = getConfigurationFactoryOfType(typeIRI);
        try {
            analyticManager.updateConfiguration(vf.createIRI(analyticRecordId),
                    analyticManager.createConfiguration(json, factory));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Map<String, OrmFactory<? extends Configuration>> getConfigurationFactories() {
        Map<String, OrmFactory<? extends Configuration>> factoryMap = new HashMap<>();
        factoryRegistry.getFactoriesOfType(Configuration.class).forEach(factory ->
                factoryMap.put(factory.getTypeIRI().stringValue(), factory));
        return factoryMap;
    }

    private OrmFactory<? extends Configuration> getConfigurationFactoryOfType(String typeIRI) {
        Map<String, OrmFactory<? extends Configuration>> factories = getConfigurationFactories();
        if (typeIRI == null || !factories.keySet().contains(typeIRI)) {
            throw ErrorUtils.sendError("Invalid Configuration type", Response.Status.BAD_REQUEST);
        }
        return factories.get(typeIRI);
    }
}

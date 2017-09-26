package org.matonto.analytic.rest.impl;

/*-
 * #%L
 * org.matonto.analytic.rest
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

import static org.matonto.rest.util.RestUtils.checkStringParam;
import static org.matonto.rest.util.RestUtils.getActiveUser;
import static org.matonto.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import org.apache.commons.lang3.StringUtils;
import org.matonto.analytic.api.AnalyticManager;
import org.matonto.analytic.api.builder.AnalyticRecordConfig;
import org.matonto.analytic.ontologies.analytic.AnalyticRecord;
import org.matonto.analytic.ontologies.analytic.Configuration;
import org.matonto.analytic.rest.AnalyticRest;
import org.matonto.catalog.api.CatalogProvUtils;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivity;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.OrmFactoryRegistry;
import org.matonto.rest.util.ErrorUtils;

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
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createAnalytic(ContainerRequestContext context, String typeIRI, String title, String description,
                                   String keywords, String json) {
        checkStringParam(title, "AnalyticRecord title is required");
        Map<String, OrmFactory<? extends Configuration>> factories = getConfigurationFactories();
        if (typeIRI == null || !factories.keySet().contains(typeIRI)) {
            throw ErrorUtils.sendError("Invalid Configuration type", Response.Status.BAD_REQUEST);
        }
        User activeUser = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(activeUser);
            Configuration configuration = analyticManager.createConfiguration(json, factories.get(typeIRI));
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
            return Response.status(201).entity(newRecord.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MatOntoException ex) {
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
        } catch (IllegalStateException | MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Map<String, OrmFactory<? extends Configuration>> getConfigurationFactories() {
        Map<String, OrmFactory<? extends Configuration>> factoryMap = new HashMap<>();
        factoryRegistry.getFactoriesOfType(Configuration.class).forEach(factory ->
                factoryMap.put(factory.getTypeIRI().stringValue(), factory));
        return factoryMap;
    }
}

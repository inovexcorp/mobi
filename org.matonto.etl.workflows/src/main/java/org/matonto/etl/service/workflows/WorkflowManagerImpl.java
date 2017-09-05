package org.matonto.etl.service.workflows;

/*-
 * #%L
 * org.matonto.etl.workflows
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import org.apache.camel.CamelContext;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.core.osgi.OsgiDefaultCamelContext;
import org.matonto.etl.api.ontologies.etl.SubRoute;
import org.matonto.etl.api.ontologies.etl.Workflow;
import org.matonto.etl.api.workflows.WorkflowConverter;
import org.matonto.etl.api.workflows.WorkflowManager;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Component(name = WorkflowManagerImpl.COMPONENT_NAME)
public class WorkflowManagerImpl implements WorkflowManager {
    static final String COMPONENT_NAME = "org.matonto.etl.api.workflows.WorkflowManager";
    private static final Logger LOG = LoggerFactory.getLogger(WorkflowManagerImpl.class);

    private CamelContext camelContext;
    private Map<Resource, Workflow> workflows = new HashMap<>();

    private WorkflowConverter converterService;
    private ValueFactory vf;

    @Reference
    void setConverterService(WorkflowConverter converterService) {
        this.converterService = converterService;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Activate
    protected void start(BundleContext bundleContext) {
        if (camelContext == null) {
            LOG.debug("Initializing Workflow CamelContext");
            camelContext = new OsgiDefaultCamelContext(bundleContext);
            try {
                camelContext.start();
            } catch (Exception e) {
                throw new MatOntoException("Error in starting CamelContext", e);
            }
        }
    }

    @Deactivate
    protected void stop() {
        try {
            LOG.debug("Shutting down Workflow CamelContext");
            camelContext.stop();
        } catch (Exception e) {
            throw new MatOntoException("Error in stopping CamelContext", e);
        }
    }

    @Override
    public String getContextName() {
        return camelContext.getName();
    }

    @Override
    public Set<Workflow> getWorkflows() {
        return new HashSet<>(workflows.values());
    }

    @Override
    public void deployWorkflow(Workflow workflow) {
        if (workflows.containsKey(workflow.getResource())) {
            throw new IllegalArgumentException("Workflow " + workflow.getResource() + " already exists");
        }
        LOG.info("Adding Workflow " + workflow.getResource());
        RouteBuilder routes = converterService.convert(workflow);
        try {
            camelContext.addRoutes(routes);
        } catch (Exception e) {
            throw new MatOntoException("Error in adding routes to CamelContext", e);
        }
        workflows.put(workflow.getResource(), workflow);
        Set<Resource> routeIds = getRouteIds(workflow);
        LOG.info("Added routes " + routeIds.toString() + " to CamelContext");
    }

    @Override
    public void startWorkflow(Resource workflowIRI) {
        validateWorkflow(workflowIRI);
        Set<Resource> routeIds = getRouteIds(workflows.get(workflowIRI));
        try {
            for (Resource iri : routeIds) {
                LOG.info("Starting Workflow " + workflowIRI + " routes");
                camelContext.startRoute(iri.stringValue());
            }
        } catch (Exception e) {
            throw new MatOntoException("Error in starting Workflow", e);
        }
    }

    @Override
    public void stopWorkflow(Resource workflowIRI) {
        validateWorkflow(workflowIRI);
        Set<Resource> routeIds = getRouteIds(workflows.get(workflowIRI));
        try {
            for (Resource iri : routeIds) {
                LOG.info("Stopping Workflow " + workflowIRI + " routes");
                camelContext.stopRoute(iri.stringValue());
            }
        } catch (Exception e) {
            throw new MatOntoException("Error in stopping Workflow", e);
        }
    }

    private void validateWorkflow(Resource workflowIRI) {
        if (!workflows.containsKey(workflowIRI)) {
            throw new IllegalArgumentException("Workflow " + workflowIRI + " does not exist");
        }
    }

    private Set<Resource> getRouteIds(Workflow workflow) {
        return workflow.getModel().filter(null, vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI),
                vf.createIRI(SubRoute.TYPE)).subjects();
    }
}

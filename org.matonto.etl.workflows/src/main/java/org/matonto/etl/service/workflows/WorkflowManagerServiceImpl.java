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
import org.apache.camel.model.OptionalIdentifiedDefinition;
import org.matonto.etl.api.ontologies.etl.Workflow;
import org.matonto.etl.api.workflows.WorkflowConverterService;
import org.matonto.etl.api.workflows.WorkflowManagerService;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Resource;
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class WorkflowManagerServiceImpl implements WorkflowManagerService {
    private static final Logger LOG = LoggerFactory.getLogger(WorkflowManagerServiceImpl.class);

    private CamelContext camelContext;
    private Map<Resource, Set<String>> workflows = new HashMap<>();

    private WorkflowConverterService converterService;

    @Reference
    protected void setConverterService(WorkflowConverterService converterService) {
        this.converterService = converterService;
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
    public Map<Resource, Set<String>> getWorkflows() {
        return workflows;
    }

    @Override
    public void deployWorkflow(Workflow workflow) {
        if (workflows.containsKey(workflow.getResource())) {
            throw new IllegalArgumentException("Workflow " + workflow.getResource() + " already exists");
        }
        RouteBuilder routes = converterService.convert(workflow);
        try {
            LOG.info("Adding Workflow routes to CamelContext");
            camelContext.addRoutes(routes);
        } catch (Exception e) {
            throw new MatOntoException("Error in adding routes to CamelContext", e);
        }
        Set<String> routeIds = routes.getRouteCollection().getRoutes().stream()
                .map(OptionalIdentifiedDefinition::getId)
                .collect(Collectors.toSet());
        workflows.put(workflow.getResource(), routeIds);
    }

    @Override
    public void startWorkflow(Resource workflowIRI) {
        validateWorkflow(workflowIRI);
        Set<String> routeIds = workflows.get(workflowIRI);
        try {
            for (String s : routeIds) {
                LOG.info("Starting Workflow routes");
                camelContext.startRoute(s);
            }
        } catch (Exception e) {
            throw new MatOntoException("Error in stopping Workflow", e);
        }
    }

    @Override
    public void stopWorkflow(Resource workflowIRI) {
        validateWorkflow(workflowIRI);
        Set<String> routeIds = workflows.get(workflowIRI);
        try {
            for (String s : routeIds) {
                LOG.info("Stopping Workflow routes");
                camelContext.stopRoute(s);
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
}

package org.matonto.etl.service.workflows;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import org.apache.camel.CamelContext;
import org.apache.camel.Route;
import org.apache.camel.ServiceStatus;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.OptionalIdentifiedDefinition;
import org.apache.camel.osgi.OsgiDefaultCamelContext;
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

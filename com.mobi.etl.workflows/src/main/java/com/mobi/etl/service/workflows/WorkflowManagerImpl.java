package com.mobi.etl.service.workflows;

/*-
 * #%L
 * com.mobi.etl.workflows
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
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Reference;
import com.mobi.etl.api.ontologies.etl.SubRoute;
import com.mobi.etl.api.ontologies.etl.Workflow;
import com.mobi.etl.api.ontologies.etl.WorkflowFactory;
import com.mobi.etl.api.workflows.WorkflowConverter;
import com.mobi.etl.api.workflows.WorkflowManager;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.config.RepositoryConsumerConfig;
import org.apache.camel.CamelContext;
import org.apache.camel.builder.RouteBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = RepositoryConsumerConfig.class,
        name = WorkflowManagerImpl.COMPONENT_NAME
    )
public class WorkflowManagerImpl implements WorkflowManager {
    static final String COMPONENT_NAME = "WorkflowManager";
    private static final Logger LOG = LoggerFactory.getLogger(WorkflowManagerImpl.class);

    Set<Resource> workflows = new HashSet<>();

    private CamelContext camelContext;
    private Repository repository;
    private WorkflowConverter converterService;
    private ValueFactory vf;
    private ModelFactory mf;
    private WorkflowFactory workflowFactory;

    @Reference
    void setCamelContext(CamelContext camelContext) {
        this.camelContext = camelContext;
    }

    @Reference(name = "repository")
    void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    void setConverterService(WorkflowConverter converterService) {
        this.converterService = converterService;
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
    void setWorkflowFactory(WorkflowFactory workflowFactory) {
        this.workflowFactory = workflowFactory;
    }

    @Activate
    protected void start() {
        try {
            workflows = new HashSet<>();
            Set<Workflow> workflowSet = getWorkflowsFromRepo();
            for (Workflow workflow: workflowSet) {
                Set<Resource> routeIds = getRouteIds(workflow);
                boolean deployed = routeIds.stream()
                        .allMatch(resource -> camelContext.getRoute(resource.stringValue()) != null);
                if (!deployed) {
                    for (Resource routeId: routeIds) {
                        camelContext.removeRoute(routeId.stringValue());
                    }
                    deployWorkflow(workflow);
                }
                workflows.add(workflow.getResource());
            }
        } catch (Exception e) {
            throw new MobiException("Error in starting WorkflowManager", e);
        }
    }

    @Override
    public Set<Workflow> getWorkflows() {
        try (RepositoryConnection conn = repository.getConnection()) {
            return workflows.stream()
                    .map(resource -> getExpectedWorkflow(resource, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public void addWorkflow(Workflow workflow) {
        if (workflows.contains(workflow.getResource())) {
            throw new IllegalArgumentException("Workflow " + workflow.getResource() + " already exists");
        }
        LOG.info("Adding Workflow " + workflow.getResource());
        deployWorkflow(workflow);
        workflows.add(workflow.getResource());
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(workflow.getModel(), workflow.getResource());
        }
    }

    @Override
    public Optional<Workflow> getWorkflow(Resource workflowIRI) {
        if (!workflows.contains(workflowIRI)) {
            return Optional.empty();
        }
        return Optional.of(getExpectedWorkflow(workflowIRI));
    }

    private Optional<Workflow> getWorkflow(Resource workflowIRI, RepositoryConnection conn) {
        Model workflowModel = RepositoryResults.asModel(conn.getStatements(null, null, null, workflowIRI), mf);
        return workflowFactory.getExisting(workflowIRI, workflowModel);
    }

    @Override
    public void startWorkflow(Resource workflowIRI) {
        validateWorkflow(workflowIRI);
        Set<Resource> routeIds = getRouteIds(getExpectedWorkflow(workflowIRI));
        try {
            for (Resource iri : routeIds) {
                LOG.info("Starting Workflow " + workflowIRI + " routes");
                camelContext.startRoute(iri.stringValue());
            }
        } catch (Exception e) {
            throw new MobiException("Error in starting Workflow", e);
        }
    }

    @Override
    public void stopWorkflow(Resource workflowIRI) {
        validateWorkflow(workflowIRI);
        Set<Resource> routeIds = getRouteIds(getExpectedWorkflow(workflowIRI));
        try {
            for (Resource iri : routeIds) {
                LOG.info("Stopping Workflow " + workflowIRI + " routes");
                camelContext.stopRoute(iri.stringValue());
            }
        } catch (Exception e) {
            throw new MobiException("Error in stopping Workflow", e);
        }
    }

    private void validateWorkflow(Resource workflowIRI) {
        if (!workflows.contains(workflowIRI)) {
            throw new IllegalArgumentException("Workflow " + workflowIRI + " does not exist");
        }
    }

    private Set<Resource> getRouteIds(Workflow workflow) {
        return workflow.getModel().filter(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                vf.createIRI(SubRoute.TYPE)).subjects();
    }

    private Set<Workflow> getWorkflowsFromRepo() {
        Set<Workflow> workflowSet = new HashSet<>();
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.getStatements(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                    vf.createIRI(Workflow.TYPE)).forEach(statement ->
                    workflowSet.add(getExpectedWorkflow(statement.getSubject(), conn)));
            return workflowSet;
        }
    }

    private Workflow getExpectedWorkflow(Resource workflowIRI) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return getExpectedWorkflow(workflowIRI, conn);
        }
    }

    private Workflow getExpectedWorkflow(Resource workflowIRI, RepositoryConnection conn) {
        return getWorkflow(workflowIRI, conn).orElseThrow(() ->
                new IllegalStateException("Workflow " + workflowIRI + " could not be retrieved"));
    }

    private void deployWorkflow(Workflow workflow) {
        RouteBuilder routes = converterService.convert(workflow);
        try {
            camelContext.addRoutes(routes);
        } catch (Exception e) {
            throw new MobiException("Error in adding routes to CamelContext", e);
        }
        Set<Resource> routeIds = getRouteIds(workflow);
        LOG.info("Added routes " + routeIds.toString() + " to CamelContext");
    }
}

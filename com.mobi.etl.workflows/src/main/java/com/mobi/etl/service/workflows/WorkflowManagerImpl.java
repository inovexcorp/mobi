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
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
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
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.Map;
import java.util.Optional;
import java.util.Queue;
import java.util.Set;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = RepositoryConsumerConfig.class,
        name = WorkflowManagerImpl.COMPONENT_NAME
    )
public class WorkflowManagerImpl implements WorkflowManager {
    protected static final String COMPONENT_NAME = "com.mobi.etl.api.workflows.WorkflowManager";
    private static final Logger LOG = LoggerFactory.getLogger(WorkflowManagerImpl.class);

    Map<Resource, MobiCamelContext> workflowMap = new HashMap<>();
    Set<Resource> failedWorkflows = new HashSet<>();

    private Repository repository;
    private WorkflowConverter converterService;
    private ValueFactory vf;
    private ModelFactory mf;
    private WorkflowFactory workflowFactory;
    private BundleContext bundleContext;

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
    protected void activate(BundleContext bundleContext) {
        this.bundleContext = bundleContext;
        try {
            Queue<Workflow> queue = new LinkedList<>(getWorkflowsFromRepo());

            if (!queue.isEmpty()) {
                failedWorkflows = new HashSet<>();
                Runnable task = () -> {
                    Map<Resource, Integer> attempts = new HashMap<>();
                    LOG.debug("Redeploying " + queue.size() + " workflows");
                    Workflow workflow = queue.poll();
                    while (workflow != null) {
                        try {
                            if (failedWorkflows.contains(workflow.getResource())) {
                                if (attempts.get(workflow.getResource()) > 1) {
                                    LOG.debug("Attempted to redeploy " + workflow.getResource() + " already. Skipping");
                                    workflow = queue.poll();
                                    continue;
                                }
                                Thread.sleep(3000);
                            }
                            deployWorkflow(workflow);

                            LOG.debug("Workflow " + workflow.getResource() + " successfully re-deployed.");
                            failedWorkflows.remove(workflow.getResource());
                            attempts.remove(workflow.getResource());
                            workflow = queue.poll();
                        } catch (Exception ex) {
                            LOG.debug("Workflow " + workflow.getResource() + " could not be re-deployed.");
                            failedWorkflows.add(workflow.getResource());
                            queue.add(workflow);
                            int tries = attempts.getOrDefault(workflow.getResource(), 0);
                            attempts.put(workflow.getResource(), tries + 1);
                            workflow = queue.poll();
                        }
                    }
                };
                Thread thread = new Thread(task);
                thread.start();
            }
        } catch (Exception e) {
            throw new MobiException("Error in starting WorkflowManager", e);
        }
        LOG.debug("WorkflowManager initialized and activated");
    }

    @Deactivate
    protected void deactivate() throws Exception {
        for (MobiCamelContext context : workflowMap.values()) {
            context.remove();
        }
    }

    @Override
    public Set<Workflow> getWorkflows() {
        try (RepositoryConnection conn = repository.getConnection()) {
            return workflowMap.keySet().stream()
                    .map(resource -> getExpectedWorkflow(resource, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Set<Workflow> getFailedWorkflows() {
        try (RepositoryConnection conn = repository.getConnection()) {
            return failedWorkflows.stream()
                    .map(resource -> getExpectedWorkflow(resource, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public void addWorkflow(Workflow workflow) {
        if (workflowMap.containsKey(workflow.getResource())) {
            throw new IllegalArgumentException("Workflow " + workflow.getResource() + " already exists");
        }
        LOG.info("Adding Workflow " + workflow.getResource());
        deployWorkflow(workflow);
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(workflow.getModel(), workflow.getResource());
        }
    }

    @Override
    public Optional<Workflow> getWorkflow(Resource workflowIRI) {
        if (!workflowMap.containsKey(workflowIRI)) {
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
        if (workflowMap.containsKey(workflowIRI)) {
            try {
                workflowMap.get(workflowIRI).start();
            } catch (Exception e) {
                throw new MobiException("Error in starting Workflow", e);
            }
        } else if (failedWorkflows.contains(workflowIRI)) {
            LOG.info("Redeploying failed Workflow " + workflowIRI);
            Workflow workflow = getExpectedWorkflow(workflowIRI);
            deployWorkflow(workflow);
            failedWorkflows.remove(workflowIRI);
        } else {
            throw new IllegalArgumentException("Workflow " + workflowIRI + " does not exist");
        }
    }

    @Override
    public void stopWorkflow(Resource workflowIRI) {
        validateWorkflow(workflowIRI);
        try {
            workflowMap.get(workflowIRI).stop();
        } catch (Exception e) {
            throw new MobiException("Error in stopping Workflow", e);
        }
    }

    private void validateWorkflow(Resource workflowIRI) {
        if (!workflowMap.containsKey(workflowIRI)) {
            throw new IllegalArgumentException("Workflow " + workflowIRI + " does not exist");
        }
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

    private void deployWorkflow(Workflow workflow, CamelContext context) {
        RouteBuilder routes = converterService.convert(workflow, context);
        try {
            context.addRoutes(routes);
        } catch (Exception e) {
            throw new MobiException("Error in adding routes to CamelContext " + context.getName(), e);
        }
        LOG.info("Added workflow " + workflow.getResource() + " to CamelContext " + context.getName());
    }

    private void deployWorkflow(Workflow workflow) {
        try {
            MobiCamelContext camelContext = new MobiCamelContext(bundleContext, workflow);
            deployWorkflow(workflow, camelContext);
            workflowMap.put(workflow.getResource(), camelContext);
        } catch (Exception e) {
            throw new IllegalArgumentException("Error starting Workflow CamelContext", e);
        }
    }
}

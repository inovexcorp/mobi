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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.core.osgi.OsgiDefaultCamelContext;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.etl.api.ontologies.etl.SubRouteFactory;
import org.matonto.etl.api.ontologies.etl.Workflow;
import org.matonto.etl.api.ontologies.etl.WorkflowFactory;
import org.matonto.etl.api.workflows.WorkflowConverter;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;
import org.osgi.framework.BundleContext;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest(WorkflowManagerImpl.class)
public class WorkflowManagerImplTest {
    private WorkflowManagerImpl service;

    private Repository repo;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private WorkflowFactory workflowFactory = new WorkflowFactory();
    private SubRouteFactory subRouteFactory= new SubRouteFactory();

    private final String CONTEXT_NAME = "context";
    private final Resource ROUTE1_ID = vf.createIRI("http://test.com/id1");
    private final Resource ROUTE2_ID = vf.createIRI("http://test.com/id2");
    private final Resource WORKFLOW1_ID = vf.createIRI("http://test.com/workflow1");
    private final Resource WORKFLOW2_ID = vf.createIRI("http://test.com/workflow2");
    private Workflow workflow1;
    private Workflow workflow2;

    @Mock
    private BundleContext bundleContext;

    @Mock
    private OsgiDefaultCamelContext context;

    @Mock
    private WorkflowConverter converterService;

    @Mock
    private RouteBuilder routeBuilder;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        workflowFactory.setModelFactory(mf);
        workflowFactory.setValueFactory(vf);
        workflowFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(workflowFactory);

        subRouteFactory.setModelFactory(mf);
        subRouteFactory.setValueFactory(vf);
        subRouteFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(subRouteFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        workflow1 = workflowFactory.createNew(WORKFLOW1_ID);
        subRouteFactory.createNew(ROUTE1_ID, workflow1.getModel());
        workflow2 = workflowFactory.createNew(WORKFLOW2_ID);
        subRouteFactory.createNew(ROUTE2_ID, workflow2.getModel());

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
            conn.add(workflow2.getModel(), WORKFLOW2_ID);
        }

        MockitoAnnotations.initMocks(this);

        when(context.getName()).thenReturn(CONTEXT_NAME);
        PowerMockito.whenNew(OsgiDefaultCamelContext.class).withAnyArguments().thenReturn(context);
        when(converterService.convert(any(Workflow.class))).thenReturn(routeBuilder);

        service = new WorkflowManagerImpl();
        service.setConverterService(converterService);
        service.setVf(vf);
        service.setMf(mf);
        service.setRepository(repo);
        service.setWorkflowFactory(workflowFactory);

        // Initialization of CamelContext
        service.start(bundleContext);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    @Test
    public void startTest() throws Exception {
        verify(context).start();
        assertTrue(service.workflows.contains(WORKFLOW2_ID));
        verify(context).addRoutes(routeBuilder);
    }

    @Test
    public void stopTest() throws Exception {
        service.stop();
        verify(context).stop();
    }

    @Test
    public void getContextNameTest() throws Exception {
        assertEquals(CONTEXT_NAME, service.getContextName());
        verify(context).getName();
    }

    @Test
    public void addWorkflowTest() throws Exception {
        service.addWorkflow(workflow1);
        assertTrue(service.workflows.contains(WORKFLOW1_ID));
        verify(context, atLeastOnce()).addRoutes(routeBuilder);
        try (RepositoryConnection conn = repo.getConnection()) {
            workflow1.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject(), WORKFLOW1_ID)));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void addWorkflowThatAlreadyExistsTest() throws Exception {
        service.addWorkflow(workflow2);
    }

    @Test(expected = IllegalArgumentException.class)
    public void startWorkflowThatDoesNotExistTest() throws Exception {
        service.startWorkflow(WORKFLOW1_ID);
    }

    @Test
    public void startWorkflowTest() throws Exception {
        service.startWorkflow(WORKFLOW2_ID);
        verify(context).startRoute(ROUTE2_ID.stringValue());
    }

    @Test(expected = IllegalArgumentException.class)
    public void stopWorkflowThatDoesNotExistTest() throws Exception {
        service.stopWorkflow(WORKFLOW1_ID);
    }

    @Test
    public void stopWorkflowTest() throws Exception {
        service.stopWorkflow(WORKFLOW2_ID);
        verify(context).stopRoute(ROUTE2_ID.stringValue());
    }
}

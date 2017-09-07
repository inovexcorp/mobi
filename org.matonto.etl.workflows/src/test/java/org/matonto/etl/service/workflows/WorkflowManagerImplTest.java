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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.core.osgi.OsgiDefaultCamelContext;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.etl.api.ontologies.etl.SubRoute;
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
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest(WorkflowManagerImpl.class)
public class WorkflowManagerImplTest {
    private WorkflowManagerImpl service;

    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private WorkflowFactory workflowFactory = new WorkflowFactory();

    private final String CONTEXT_NAME = "context";
    private final Resource ROUTE_ID = vf.createIRI("http://test.org/id");
    private Resource workflowIRI;
    private Workflow workflow;

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
        workflowFactory.setModelFactory(mf);
        workflowFactory.setValueFactory(vf);
        workflowFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(workflowFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        workflowIRI = vf.createIRI("http://test.com/workflow");
        workflow = workflowFactory.createNew(workflowIRI);
        workflow.getModel().add(ROUTE_ID, vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI), vf.createIRI(SubRoute.TYPE));

        MockitoAnnotations.initMocks(this);

        when(context.getName()).thenReturn(CONTEXT_NAME);
        PowerMockito.whenNew(OsgiDefaultCamelContext.class).withAnyArguments().thenReturn(context);
        when(converterService.convert(any(Workflow.class))).thenReturn(routeBuilder);

        service = new WorkflowManagerImpl();
        service.setConverterService(converterService);
        service.setVf(vf);
//        service.start(bundleContext);
    }

    /*@Test
    public void startTest() throws Exception {
        verify(context).start();
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
    public void deployWorkflowTest() throws Exception {
        service.addWorkflow(workflow);
        assertTrue(service.getWorkflows().contains(workflow));
        verify(context).addRoutes(routeBuilder);
    }

    @Test(expected = IllegalArgumentException.class)
    public void startWorkflowThatDoesNotExistTest() throws Exception {
        service.startWorkflow(workflowIRI);
    }

    @Test
    public void startWorkflowTest() throws Exception {
        // Setup:
        service.addWorkflow(workflow);

        service.startWorkflow(workflowIRI);
        verify(context).startRoute(ROUTE_ID.stringValue());
    }

    @Test(expected = IllegalArgumentException.class)
    public void stopWorkflowThatDoesNotExistTest() throws Exception {
        service.stopWorkflow(vf.createIRI("http://test.com/workflow"));
    }

    @Test
    public void stopWorkflowTest() throws Exception {
        // Setup:
        service.addWorkflow(workflow);

        service.stopWorkflow(workflowIRI);
        verify(context).stopRoute(ROUTE_ID.stringValue());
    }*/
}

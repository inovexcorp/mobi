package org.matonto.etl.service.workflows;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.core.osgi.OsgiDefaultCamelContext;
import org.apache.camel.model.RouteDefinition;
import org.apache.camel.model.RoutesDefinition;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.etl.api.ontologies.etl.Workflow;
import org.matonto.etl.api.ontologies.etl.WorkflowFactory;
import org.matonto.etl.api.workflows.WorkflowConverterService;
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

import java.util.Collections;

@RunWith(PowerMockRunner.class)
@PrepareForTest(WorkflowManagerServiceImpl.class)
public class WorkflowManagerServiceImplTest {
    private WorkflowManagerServiceImpl service;

    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private WorkflowFactory workflowFactory = new WorkflowFactory();

    private static final String CONTEXT_NAME = "context";
    private static final String ROUTE_ID = "id";
    private Resource workflowIRI;

    @Mock
    private BundleContext bundleContext;

    @Mock
    private OsgiDefaultCamelContext context;

    @Mock
    private WorkflowConverterService converterService;

    @Mock
    private RouteBuilder routeBuilder;

    @Mock
    private RoutesDefinition routesDefinition;

    @Mock
    private RouteDefinition definition;

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

        MockitoAnnotations.initMocks(this);

        when(context.getName()).thenReturn(CONTEXT_NAME);
        PowerMockito.whenNew(OsgiDefaultCamelContext.class).withAnyArguments().thenReturn(context);
        when(converterService.convert(any(Workflow.class))).thenReturn(routeBuilder);
        when(routeBuilder.getRouteCollection()).thenReturn(routesDefinition);
        when(routesDefinition.getRoutes()).thenReturn(Collections.singletonList(definition));
        when(definition.getId()).thenReturn(ROUTE_ID);

        service = new WorkflowManagerServiceImpl();
        service.setConverterService(converterService);
        service.start(bundleContext);
    }

    @Test
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
        // Setup:
        Workflow workflow = workflowFactory.createNew(workflowIRI);

        service.deployWorkflow(workflow);
        assertTrue(service.getWorkflows().containsKey(workflow.getResource()));
        assertTrue(service.getWorkflows().get(workflow.getResource()).contains(ROUTE_ID));
        verify(context).addRoutes(routeBuilder);
        verify(routeBuilder).getRouteCollection();
        verify(routesDefinition).getRoutes();
        verify(definition).getId();
    }

    @Test(expected = IllegalArgumentException.class)
    public void startWorkflowThatDoesNotExistTest() throws Exception {
        service.startWorkflow(workflowIRI);
    }

    @Test
    public void startWorkflow() throws Exception {
        // Setup:
        Workflow workflow = workflowFactory.createNew(workflowIRI);
        service.deployWorkflow(workflow);

        service.startWorkflow(workflowIRI);
        verify(context).startRoute(ROUTE_ID);
    }

    @Test(expected = IllegalArgumentException.class)
    public void stopWorkflowThatDoesNotExistTest() throws Exception {
        service.stopWorkflow(vf.createIRI("http://test.com/workflow"));
    }

    @Test
    public void stopWorkflow() throws Exception {
        // Setup:
        Workflow workflow = workflowFactory.createNew(workflowIRI);
        service.deployWorkflow(workflow);

        service.stopWorkflow(workflowIRI);
        verify(context).stopRoute(ROUTE_ID);
    }
}

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
import static org.mockito.Mockito.when;

import org.apache.camel.CamelContext;
import org.apache.camel.Endpoint;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.impl.DefaultCamelContext;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.matonto.etl.api.ontologies.etl.DataSource;
import org.matonto.etl.api.ontologies.etl.DataSourceFactory;
import org.matonto.etl.api.ontologies.etl.Destination;
import org.matonto.etl.api.ontologies.etl.DestinationFactory;
import org.matonto.etl.api.ontologies.etl.FileDataSource;
import org.matonto.etl.api.ontologies.etl.FileDataSourceFactory;
import org.matonto.etl.api.ontologies.etl.FileDestination;
import org.matonto.etl.api.ontologies.etl.FileDestinationFactory;
import org.matonto.etl.api.ontologies.etl.MappingProcessor;
import org.matonto.etl.api.ontologies.etl.MappingProcessorFactory;
import org.matonto.etl.api.ontologies.etl.Processor;
import org.matonto.etl.api.ontologies.etl.ProcessorFactory;
import org.matonto.etl.api.ontologies.etl.SubRoute;
import org.matonto.etl.api.ontologies.etl.SubRouteFactory;
import org.matonto.etl.api.ontologies.etl.Workflow;
import org.matonto.etl.api.ontologies.etl.WorkflowFactory;
import org.matonto.etl.api.workflows.DataSourceRouteFactory;
import org.matonto.etl.api.workflows.DestinationRouteFactory;
import org.matonto.etl.api.workflows.ProcessorRouteFactory;
import org.matonto.ontologies.rdfs.List;
import org.matonto.ontologies.rdfs.ListFactory;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.OrmFactoryRegistry;
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
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.InputStream;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class WorkflowConverterImplTest {
    private WorkflowConverterImpl converter = new WorkflowConverterImpl();

    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private WorkflowFactory workflowFactory = new WorkflowFactory();
    private DataSourceFactory dataSourceFactory = new DataSourceFactory();
    private FileDataSourceFactory fileDataSourceFactory = new FileDataSourceFactory();
    private ProcessorFactory processorFactory = new ProcessorFactory();
    private MappingProcessorFactory mappingProcessorFactory = new MappingProcessorFactory();
    private DestinationFactory destinationFactory = new DestinationFactory();
    private FileDestinationFactory fileDestinationFactory = new FileDestinationFactory();
    private SubRouteFactory subRouteFactory = new SubRouteFactory();
    private ListFactory listFactory = new ListFactory();

    private CamelContext context = new DefaultCamelContext();
    private Workflow workflow;
    private final Resource WORKFLOW_ID = vf.createIRI("http://test.org/workflow");
    private final Resource DATASOURCE_ID = vf.createIRI("http://test.org/dataSource");
    private final Resource PROCESSOR_ID = vf.createIRI("http://test.org/processor");
    private final Resource DESTINATION_ID = vf.createIRI("http://test.org/destination");

    private final IRI TYPE_IRI = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI);
    private final IRI FIRST_IRI = vf.createIRI(List.first_IRI);
    private final IRI REST_IRI = vf.createIRI(List.rest_IRI);
    private final IRI NIL = vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#nil");

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private OrmFactoryRegistry factoryRegistry;

    @Mock
    private DataSourceRouteFactory<DataSource> dataSourceRouteFactory;

    @Mock
    private ProcessorRouteFactory<Processor> processorRouteFactory;

    @Mock
    private DestinationRouteFactory<Destination> destinationRouteFactory;

    @Mock
    private Endpoint endpoint;

    @Mock
    private org.apache.camel.Processor camelProcessor;

    @Before
    public void setUp() throws Exception {

        workflowFactory.setModelFactory(mf);
        workflowFactory.setValueFactory(vf);
        workflowFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(workflowFactory);

        dataSourceFactory.setModelFactory(mf);
        dataSourceFactory.setValueFactory(vf);
        dataSourceFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(dataSourceFactory);

        fileDataSourceFactory.setModelFactory(mf);
        fileDataSourceFactory.setValueFactory(vf);
        fileDataSourceFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(fileDataSourceFactory);

        processorFactory.setModelFactory(mf);
        processorFactory.setValueFactory(vf);
        processorFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(processorFactory);

        mappingProcessorFactory.setModelFactory(mf);
        mappingProcessorFactory.setValueFactory(vf);
        mappingProcessorFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(mappingProcessorFactory);

        destinationFactory.setModelFactory(mf);
        destinationFactory.setValueFactory(vf);
        destinationFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(destinationFactory);

        fileDestinationFactory.setModelFactory(mf);
        fileDestinationFactory.setValueFactory(vf);
        fileDestinationFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(fileDestinationFactory);

        subRouteFactory.setModelFactory(mf);
        subRouteFactory.setValueFactory(vf);
        subRouteFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(subRouteFactory);

        listFactory.setModelFactory(mf);
        listFactory.setValueFactory(vf);
        listFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(listFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        MockitoAnnotations.initMocks(this);
        when(factoryRegistry.getSortedFactoriesOfType(DataSource.class)).thenReturn(Stream.of(fileDataSourceFactory, dataSourceFactory).collect(Collectors.toList()));
        when(factoryRegistry.getSortedFactoriesOfType(Processor.class)).thenReturn(Stream.of(mappingProcessorFactory, processorFactory).collect(Collectors.toList()));
        when(factoryRegistry.getSortedFactoriesOfType(Destination.class)).thenReturn(Stream.of(fileDestinationFactory, destinationFactory).collect(Collectors.toList()));
        when(dataSourceRouteFactory.getEndpoint(any(DataSource.class))).thenReturn(endpoint);
        when(dataSourceRouteFactory.getTypeIRI()).thenReturn(vf.createIRI(DataSource.TYPE));
        when(processorRouteFactory.getProcessor(any(Processor.class))).thenReturn(camelProcessor);
        when(processorRouteFactory.getTypeIRI()).thenReturn(vf.createIRI(Processor.TYPE));
        when(destinationRouteFactory.getEndpoint(any(Destination.class))).thenReturn(endpoint);
        when(destinationRouteFactory.getTypeIRI()).thenReturn(vf.createIRI(Destination.TYPE));

        converter.setVf(vf);
        converter.setFactoryRegistry(factoryRegistry);
        converter.setListFactory(listFactory);
        converter.setSubRouteFactory(subRouteFactory);
        converter.addDataSourceRouteFactory(dataSourceRouteFactory);
        converter.addProcessorRouteFactory(processorRouteFactory);
        converter.addDestinationRouteFactory(destinationRouteFactory);

        workflow = workflowFactory.createNew(WORKFLOW_ID);
    }

    @Test
    public void convertWithNonListRouteTest() {
        // Setup:
        workflow.addProperty(vf.createIRI("http://test.org/missing"), vf.createIRI(Workflow.route_IRI));
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Route is not defined as a rdf:List");

        converter.convert(workflow);
    }

    @Test
    public void convertWithNoRoutesTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Workflow must have at least one Route");

        converter.convert(workflow);
    }

    @Test
    public void convertWithUnsupportedDataSourceTest() {
        // Setup:
        FileDataSource dataSource = fileDataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        workflow.addDataSource(dataSource);
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        workflow.addRoute(route);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(DATASOURCE_ID + " type is not supported");

        converter.convert(workflow);
    }

    @Test
    public void convertWithUnsupportedProcessorTest() {
        // Setup:
        MappingProcessor processor = mappingProcessorFactory.createNew(PROCESSOR_ID, workflow.getModel());
        workflow.addProcessor(processor);
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        workflow.addRoute(route);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(PROCESSOR_ID + " type is not supported");

        converter.convert(workflow);
    }

    @Test
    public void convertWithUnsupportedDestinationTest() {
        // Setup:
        FileDestination destination = fileDestinationFactory.createNew(DESTINATION_ID, workflow.getModel());
        workflow.addDestination(destination);
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        workflow.addRoute(route);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(DESTINATION_ID + " type is not supported");

        converter.convert(workflow);
    }

    @Test
    public void convertWithMissingFirstTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        workflow.addRoute(route);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("List must have one first property value");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithTooManyFirstTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        route.addProperty(vf.createIRI("http://test.org/test/0"), FIRST_IRI);
        route.addProperty(vf.createIRI("http://test.org/test/1"), FIRST_IRI);
        workflow.addRoute(route);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("List must have one first property value");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithMissingRestTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        workflow.addRoute(route);
        route.addProperty(vf.createIRI("http://test.org/test"), FIRST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("List must have at least one rest property value");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithNonDataSourceFirstTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        workflow.addRoute(route);
        route.addProperty(vf.createIRI("http://test.org/test"), FIRST_IRI);
        route.addProperty(vf.createBNode(), REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Route must start with a DataSource");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithMissingDataSourceTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        dataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        workflow.addRoute(route);
        route.addProperty(DATASOURCE_ID, FIRST_IRI);
        route.addProperty(vf.createBNode(), REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("DataSource was not set on Workflow");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithImmediateNilRestTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        DataSource dataSource = dataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        workflow.addRoute(route);
        workflow.addDataSource(dataSource);
        route.addProperty(DATASOURCE_ID, FIRST_IRI);
        route.addProperty(NIL, REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Route must end with a Destination");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithInvalidRestAfterDataSourceTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        DataSource dataSource = dataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        workflow.addRoute(route);
        workflow.addDataSource(dataSource);
        route.addProperty(DATASOURCE_ID, FIRST_IRI);
        route.addProperty(vf.createBNode(), REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("List rest property value must be a rdf:List");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithInvalidRestAfterDataSourceMultiTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        List second = listFactory.createNew(vf.createBNode(), workflow.getModel());
        DataSource dataSource = dataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        workflow.addRoute(route);
        workflow.addDataSource(dataSource);
        route.addProperty(DATASOURCE_ID, FIRST_IRI);
        route.addProperty(second.getResource(), REST_IRI);
        route.addProperty(vf.createBNode(), REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("List rest property value must be a rdf:List");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithSecondStepNotProcessorOrDestinationTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        List second = listFactory.createNew(vf.createBNode(), workflow.getModel());
        DataSource dataSource = dataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        workflow.addRoute(route);
        workflow.addDataSource(dataSource);
        route.addProperty(DATASOURCE_ID, FIRST_IRI);
        route.addProperty(second.getResource(), REST_IRI);
        second.addProperty(vf.createIRI("http://test.org/test"), FIRST_IRI);
        second.addProperty(vf.createBNode(), REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Invalid route");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithMissingProcessorTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        List second = listFactory.createNew(vf.createBNode(), workflow.getModel());
        DataSource dataSource = dataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        processorFactory.createNew(PROCESSOR_ID, workflow.getModel());
        workflow.addRoute(route);
        workflow.addDataSource(dataSource);
        route.addProperty(DATASOURCE_ID, FIRST_IRI);
        route.addProperty(second.getResource(), REST_IRI);
        second.addProperty(PROCESSOR_ID, FIRST_IRI);
        second.addProperty(vf.createBNode(), REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Processor was not set on Workflow");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithMissingDestinationTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        List second = listFactory.createNew(vf.createBNode(), workflow.getModel());
        DataSource dataSource = dataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        destinationFactory.createNew(DESTINATION_ID, workflow.getModel());
        workflow.addRoute(route);
        workflow.addDataSource(dataSource);
        route.addProperty(DATASOURCE_ID, FIRST_IRI);
        route.addProperty(second.getResource(), REST_IRI);
        second.addProperty(DESTINATION_ID, FIRST_IRI);
        second.addProperty(vf.createBNode(), REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Destination was not set on Workflow");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertWithRestOnDestinationTest() throws Exception {
        // Setup:
        List route = listFactory.createNew(vf.createBNode(), workflow.getModel());
        List second = listFactory.createNew(vf.createBNode(), workflow.getModel());
        DataSource dataSource = dataSourceFactory.createNew(DATASOURCE_ID, workflow.getModel());
        Destination destination = destinationFactory.createNew(DESTINATION_ID, workflow.getModel());
        workflow.addRoute(route);
        workflow.addDataSource(dataSource);
        workflow.addDestination(destination);
        route.addProperty(DATASOURCE_ID, FIRST_IRI);
        route.addProperty(second.getResource(), REST_IRI);
        second.addProperty(destination.getResource(), FIRST_IRI);
        second.addProperty(vf.createBNode(), REST_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Route must end with a Destination");

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
    }

    @Test
    public void convertUseCase1Test() throws Exception {
        runUseCaseTest("/use-case-1.ttl", 1);
    }

    @Test
    public void convertUseCase2Test() throws Exception {
        runUseCaseTest("/use-case-2.ttl", 3);
    }

    @Test
    public void convertUseCase3Test() throws Exception {
        runUseCaseTest("/use-case-3.ttl", 3);
    }

    @Test
    public void convertUseCase4Test() throws Exception {
        runUseCaseTest("/use-case-4.ttl", 2);
    }

    @Test
    public void convertUseCase5Test() throws Exception {
        runUseCaseTest("/use-case-5.ttl", 2);
    }

    @Test
    public void convertUseCase6Test() throws Exception {
        runUseCaseTest("/use-case-6.ttl", 1);
    }

    @Test
    public void convertUseCase7Test() throws Exception {
        runUseCaseTest("/use-case-7.ttl", 3);
    }

    private void runUseCaseTest(String fileName, int expectedSubRoutes) throws Exception {
        // Setup:
        InputStream input = getClass().getResourceAsStream(fileName);
        Model model = Values.matontoModel(Rio.parse(input, "", RDFFormat.TURTLE));
        workflow = workflowFactory.getExisting(WORKFLOW_ID, model).get();

        RouteBuilder result = converter.convert(workflow);
        result.addRoutesToCamelContext(context);
        assertTrue(workflow.getModel().contains(null, TYPE_IRI, vf.createIRI(SubRoute.TYPE)));
        assertEquals(expectedSubRoutes, workflow.getModel().filter(null, TYPE_IRI, vf.createIRI(SubRoute.TYPE)).size());
        assertEquals(expectedSubRoutes, result.getRouteCollection().getRoutes().size());
    }
}

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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.apache.camel.Endpoint;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.RouteDefinition;
import org.apache.commons.lang3.tuple.Pair;
import org.matonto.etl.api.ontologies.etl.DataSource;
import org.matonto.etl.api.ontologies.etl.Destination;
import org.matonto.etl.api.ontologies.etl.Processor;
import org.matonto.etl.api.ontologies.etl.SubRoute;
import org.matonto.etl.api.ontologies.etl.SubRouteFactory;
import org.matonto.etl.api.ontologies.etl.Workflow;
import org.matonto.etl.api.workflows.DataSourceRouteFactory;
import org.matonto.etl.api.workflows.DestinationRouteFactory;
import org.matonto.etl.api.workflows.ProcessorRouteFactory;
import org.matonto.etl.api.workflows.WorkflowConverter;
import org.matonto.ontologies.rdfs.ListFactory;
import org.matonto.persistence.utils.Statements;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.OrmFactoryRegistry;
import org.matonto.rdf.orm.Thing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component(name = WorkflowConverterImpl.COMPONENT_NAME)
public class WorkflowConverterImpl implements WorkflowConverter {
    static final String COMPONENT_NAME = "org.matonto.etl.api.workflows.WorkflowConverter";
    private static final Logger LOG = LoggerFactory.getLogger(WorkflowConverterImpl.class);

    private OrmFactoryRegistry factoryRegistry;
    private ValueFactory vf;
    private ListFactory listFactory;
    private SubRouteFactory subRouteFactory;
    private Map<Resource, DataSourceRouteFactory<DataSource>> dataSourceFactories = new HashMap<>();
    private Map<Resource, ProcessorRouteFactory<Processor>> processorFactories = new HashMap<>();
    private Map<Resource, DestinationRouteFactory<Destination>> destinationFactories = new HashMap<>();

    private static final String NIL = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";
    private static final String SUB_ROUTE = "http://matonto.org/ontologies/etl#subRoute";

    private static final String SUB_ROUTE_NAMESPACE = "http://matonto.org/sub-routes#";

    @Reference
    void setFactoryRegistry(OrmFactoryRegistry factoryRegistry) {
        this.factoryRegistry = factoryRegistry;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setListFactory(ListFactory listFactory) {
        this.listFactory = listFactory;
    }

    @Reference
    void setSubRouteFactory(SubRouteFactory subRouteFactory) {
        this.subRouteFactory = subRouteFactory;
    }

    @Reference(type = '*', dynamic = true)
    void addDataSourceRouteFactory(DataSourceRouteFactory<DataSource> dataSourceRouteFactory) {
        dataSourceFactories.put(dataSourceRouteFactory.getTypeIRI(), dataSourceRouteFactory);
    }

    void removeDataSourceRouteFactory(DataSourceRouteFactory<DataSource> dataSourceRouteFactory) {
        dataSourceFactories.remove(dataSourceRouteFactory.getTypeIRI());
    }

    @Reference(type = '*', dynamic = true)
    void addProcessorRouteFactory(ProcessorRouteFactory<Processor> processorRouteFactory) {
        processorFactories.put(processorRouteFactory.getTypeIRI(), processorRouteFactory);
    }

    void removeProcessorRouteFactory(ProcessorRouteFactory<Processor> processorRouteFactory) {
        processorFactories.remove(processorRouteFactory.getTypeIRI());
    }

    @Reference(type = '*', dynamic = true)
    void addDestinationRouteFactory(DestinationRouteFactory<Destination> destinationRouteFactory) {
        destinationFactories.put(destinationRouteFactory.getTypeIRI(), destinationRouteFactory);
    }

    void removeDestinationRouteFactory(DestinationRouteFactory<Destination> destinationRouteFactory) {
        destinationFactories.remove(destinationRouteFactory.getTypeIRI());
    }

    @Override
    public RouteBuilder convert(Workflow workflow) {
        IRI typeIRI = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI);
        Set<org.matonto.ontologies.rdfs.List> routes = workflow.getRoute_resource().stream()
                .map(resource -> listFactory.getExisting(resource, workflow.getModel())
                        .orElseThrow(() -> new IllegalArgumentException("Route is not defined as a rdf:List")))
                .collect(Collectors.toSet());

        Map<Resource, Endpoint> dataSources = new HashMap<>();
        workflow.getDataSource().forEach(dataSource -> {
            OrmFactory<? extends DataSource> factory = getDataSourceFactory(dataSource);
            if (dataSourceFactories.containsKey(factory.getTypeIRI())) {
                DataSourceRouteFactory<DataSource> routeFactory = dataSourceFactories.get(factory.getTypeIRI());
                Endpoint endpoint = routeFactory.getEndpoint(factory.getExisting(dataSource.getResource(), dataSource.getModel()).get());
                dataSources.put(dataSource.getResource(), endpoint);
            } else {
                throw new IllegalArgumentException("DataSource " + dataSource.getResource() + " is not supported");
            }
        });
        Map<Resource, org.apache.camel.Processor> processors = new HashMap<>();
        workflow.getProcessor().forEach(processor -> {
            OrmFactory<? extends Processor> factory = getProcessorFactory(processor);
            if (processorFactories.containsKey(factory.getTypeIRI())) {
                ProcessorRouteFactory<Processor> routeFactory = processorFactories.get(factory.getTypeIRI());
                org.apache.camel.Processor process = routeFactory.getProcessor(factory.getExisting(processor.getResource(), processor.getModel()).get());
                processors.put(processor.getResource(), process);
            } else {
                throw new IllegalArgumentException("Processor " + processor.getResource() + " is not supported");
            }
        });
        Map<Resource, Endpoint> destinations = new HashMap<>();
        workflow.getDestination().forEach(destination -> {
            OrmFactory<? extends Destination> factory = getDestinationFactory(destination);
            if (destinationFactories.containsKey(factory.getTypeIRI())) {
                DestinationRouteFactory<Destination> routeFactory = destinationFactories.get(factory.getTypeIRI());
                Endpoint endpoint = routeFactory.getEndpoint(factory.getExisting(destination.getResource(), destination.getModel()).get());
                destinations.put(destination.getResource(), endpoint);
            }  else {
                throw new IllegalArgumentException("Destination " + destination.getResource() + " is not supported");
            }
        });

        return new RouteBuilder() {
            @Override
            public void configure() throws Exception {
                for (org.matonto.ontologies.rdfs.List route : routes) {
                    validateListFirst(route);
                    Resource dataSourceIRI = route.getFirst_resource().iterator().next();
                    if (!workflow.getModel().contains(dataSourceIRI, typeIRI, vf.createIRI(DataSource.TYPE))) {
                        throw new IllegalArgumentException("Route must start with a DataSource");
                    }
                    List<Pair<org.matonto.ontologies.rdfs.List, RouteDefinition>> toProcess = new ArrayList<>();

                    RouteDefinition start = from(dataSources.get(dataSourceIRI))
                            .routeId(getRouteId(workflow, route).stringValue());
                    processRest(workflow, route, toProcess, start, this);

                    while (toProcess.size() > 0) {
                        Pair<org.matonto.ontologies.rdfs.List, RouteDefinition> pair = toProcess.remove(toProcess.size() - 1);
                        org.matonto.ontologies.rdfs.List list = pair.getLeft();
                        RouteDefinition def = pair.getRight();
                        validateListFirst(list);
                        Resource first = list.getFirst_resource().iterator().next();

                        boolean isProcessor = workflow.getModel().contains(first, typeIRI, vf.createIRI(Processor.TYPE));
                        boolean isDestination = workflow.getModel().contains(first, typeIRI, vf.createIRI(Destination.TYPE));
                        if (!isProcessor && !isDestination) {
                            throw new IllegalArgumentException("Invalid route");
                        } else if (isProcessor) {
                            def.process(processors.get(first));
                            processRest(workflow, list, toProcess, def, this);
                        } else {
                            def.to(destinations.get(first));
                            if (!list.getRest_resource().contains(vf.createIRI(NIL))) {
                                throw new IllegalArgumentException("Invalid route");
                            }
                        }
                    }
                }
            }
        };
    }

    private void validateListFirst(org.matonto.ontologies.rdfs.List list) {
        if (list.getFirst_resource().size() != 1) {
            throw new IllegalArgumentException("Invalid route");
        }
        if (list.getRest().size() == 0) {
            throw new IllegalArgumentException("Invalid route");
        }
    }

    private void processRest(Workflow workflow, org.matonto.ontologies.rdfs.List list,
                             List<Pair<org.matonto.ontologies.rdfs.List, RouteDefinition>> toProcess,
                             RouteDefinition def, RouteBuilder builder) {
        if (list.getRest_resource().contains(vf.createIRI(NIL))) {
            throw new IllegalArgumentException("Invalid route");
        }
        if (list.getRest().size() == 1) {
            toProcess.add(Pair.of(list.getRest().iterator().next(), def));
        } else {
            Set<String> ids = new HashSet<>();
            for (org.matonto.ontologies.rdfs.List subList : list.getRest()) {
                IRI routeId = getRouteId(workflow, subList);
                String directId = "direct:" + routeId.getLocalName();
                RouteDefinition subDef = builder.from(directId).routeId(routeId.stringValue());
                toProcess.add(Pair.of(subList, subDef));
                ids.add(directId);
            }
            def.multicast().to(ids.toArray(new String[ids.size()]));
        }
    }

    private IRI getRouteId(Workflow workflow, org.matonto.ontologies.rdfs.List list) {
        Optional<Value> optSubRouteIRI = list.getProperty(vf.createIRI(SUB_ROUTE));
        if (optSubRouteIRI.isPresent()) {
            return vf.createIRI(optSubRouteIRI.get().stringValue());
        } else {
            IRI iri = vf.createIRI(SUB_ROUTE_NAMESPACE + UUID.randomUUID().toString());
            SubRoute subRoute = subRouteFactory.createNew(iri, workflow.getModel());
            subRoute.setWorkflow(workflow);
            list.addProperty(iri, vf.createIRI(SUB_ROUTE));
            return iri;
        }
    }

    private OrmFactory<? extends DataSource> getDataSourceFactory(DataSource dataSource) {
        return getFactory(dataSource, DataSource.class);
    }

    private OrmFactory<? extends Processor> getProcessorFactory(Processor processor) {
        return getFactory(processor, Processor.class);
    }

    private OrmFactory<? extends Destination> getDestinationFactory(Destination destination) {
        return getFactory(destination, Destination.class);
    }

    private <T extends Thing> OrmFactory<? extends T> getFactory(T thing, Class<T> clazz) {
        IRI typeIRI = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI);
        List<Resource> types = thing.getModel().filter(thing.getResource(), typeIRI, null)
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());

        List<OrmFactory<? extends T>> orderedFactories =
                factoryRegistry.getSortedFactoriesOfType(clazz)
                        .stream()
                        .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                        .collect(Collectors.toList());
        return orderedFactories.get(0);
    }
}

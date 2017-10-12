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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.etl.api.ontologies.etl.DataSource;
import com.mobi.etl.api.ontologies.etl.Destination;
import com.mobi.etl.api.ontologies.etl.Processor;
import com.mobi.etl.api.ontologies.etl.SubRoute;
import com.mobi.etl.api.ontologies.etl.SubRouteFactory;
import com.mobi.etl.api.ontologies.etl.Workflow;
import com.mobi.etl.api.workflows.DataSourceRouteFactory;
import com.mobi.etl.api.workflows.DestinationRouteFactory;
import com.mobi.etl.api.workflows.ProcessorRouteFactory;
import com.mobi.etl.api.workflows.WorkflowConverter;
import com.mobi.ontologies.rdfs.ListFactory;
import com.mobi.persistence.utils.Statements;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import org.apache.camel.Endpoint;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.RouteDefinition;
import org.apache.commons.lang3.tuple.Pair;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class WorkflowConverterImpl implements WorkflowConverter {

    private OrmFactoryRegistry factoryRegistry;
    private ValueFactory vf;
    private ListFactory listFactory;
    private SubRouteFactory subRouteFactory;
    private Map<Resource, DataSourceRouteFactory<DataSource>> dataSourceFactories = new HashMap<>();
    private Map<Resource, ProcessorRouteFactory<Processor>> processorFactories = new HashMap<>();
    private Map<Resource, DestinationRouteFactory<Destination>> destinationFactories = new HashMap<>();

    private static final String NIL = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";
    private static final String SUB_ROUTE = "http://mobi.com/ontologies/etl#subRoute";

    private static final String SUB_ROUTE_NAMESPACE = "http://mobi.com/sub-routes#";

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
        Set<com.mobi.ontologies.rdfs.List> routes = workflow.getRoute_resource().stream()
                .map(resource -> listFactory.getExisting(resource, workflow.getModel())
                        .orElseThrow(() -> new IllegalArgumentException("Route is not defined as a rdf:List")))
                .collect(Collectors.toSet());

        if (routes.size() == 0) {
            throw new IllegalArgumentException("Workflow must have at least one Route");
        }

        Map<Resource, Endpoint> dataSources = new HashMap<>();
        Map<Resource, org.apache.camel.Processor> processors = new HashMap<>();
        Map<Resource, Endpoint> destinations = new HashMap<>();

        collectStuff(DataSource.class, workflow.getDataSource(), dataSources, (dataSource, iri) ->
                getRouteFactory(iri, dataSourceFactories).getEndpoint(dataSource));
        collectStuff(Processor.class, workflow.getProcessor(), processors, (processor, iri) ->
                getRouteFactory(iri, processorFactories).getProcessor(processor));
        collectStuff(Destination.class, workflow.getDestination(), destinations, (destination, iri) ->
                getRouteFactory(iri, destinationFactories).getEndpoint(destination));

        return new RouteBuilder() {
            @Override
            public void configure() throws Exception {
                for (com.mobi.ontologies.rdfs.List route : routes) {
                    validateList(route);
                    Resource dataSourceIRI = route.getFirst_resource().iterator().next();
                    if (!isType(workflow, dataSourceIRI, DataSource.TYPE)) {
                        throw new IllegalArgumentException("Route must start with a DataSource");
                    }
                    List<Pair<com.mobi.ontologies.rdfs.List, RouteDefinition>> toProcess = new ArrayList<>();

                    RouteDefinition start = from(getDataSourceEndpoint(dataSources, dataSourceIRI))
                            .routeId(getRouteId(workflow, route).stringValue());
                    processRest(workflow, route, toProcess, start, this);

                    while (toProcess.size() > 0) {
                        Pair<com.mobi.ontologies.rdfs.List, RouteDefinition> pair =
                                toProcess.remove(toProcess.size() - 1);
                        com.mobi.ontologies.rdfs.List list = pair.getLeft();
                        RouteDefinition def = pair.getRight();
                        validateList(list);
                        Resource first = list.getFirst_resource().iterator().next();

                        boolean isProcessor = isType(workflow, first, Processor.TYPE);
                        boolean isDestination = isType(workflow, first, Destination.TYPE);
                        if (!isProcessor && !isDestination) {
                            throw new IllegalArgumentException("Route must use Processors and Destinations "
                                    + "after initial DataSource");
                        } else if (isProcessor) {
                            def.process(getProcessor(processors, first));
                            processRest(workflow, list, toProcess, def, this);
                        } else {
                            def.to(getDestinationEndpoint(destinations, first));
                            if (!list.getRest_resource().contains(vf.createIRI(NIL))) {
                                throw new IllegalArgumentException("Route must end with a Destination");
                            }
                        }
                    }
                }
            }
        };
    }

    private boolean isType(Workflow workflow, Resource resource, String type) {
        return workflow.getModel().contains(resource, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                vf.createIRI(type));
    }

    private Endpoint getDataSourceEndpoint(Map<Resource, Endpoint> endpointMap, Resource resource) {
        return getEndpoint(endpointMap, resource, "DataSource was not set on Workflow");
    }

    private org.apache.camel.Processor getProcessor(Map<Resource, org.apache.camel.Processor> processorMap,
                                                    Resource resource) {
        org.apache.camel.Processor processor = processorMap.get(resource);
        if (processor == null) {
            throw new IllegalArgumentException("Processor was not set on Workflow");
        }
        return processor;
    }

    private Endpoint getDestinationEndpoint(Map<Resource, Endpoint> endpointMap, Resource resource) {
        return getEndpoint(endpointMap, resource, "Destination was not set on Workflow");
    }

    private Endpoint getEndpoint(Map<Resource, Endpoint> endpointMap, Resource resource, String errorMessage) {
        Endpoint endpoint = endpointMap.get(resource);
        if (endpoint == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        return endpoint;
    }

    private void validateList(com.mobi.ontologies.rdfs.List list) {
        if (list.getFirst_resource().size() != 1) {
            throw new IllegalArgumentException("List must have one first property value");
        }
        if (list.getRest_resource().size() == 0) {
            throw new IllegalArgumentException("List must have at least one rest property value");
        }
    }

    private void processRest(Workflow workflow, com.mobi.ontologies.rdfs.List list,
                             List<Pair<com.mobi.ontologies.rdfs.List, RouteDefinition>> toProcess,
                             RouteDefinition def, RouteBuilder builder) {
        Set<Resource> restSet = list.getRest_resource();
        if (restSet.contains(vf.createIRI(NIL))) {
            throw new IllegalArgumentException("Route must end with a Destination");
        }
        if (restSet.size() == 1) {
            Resource restId = restSet.iterator().next();
            com.mobi.ontologies.rdfs.List rest = listFactory.getExisting(restId, workflow.getModel())
                    .orElseThrow(() -> new IllegalArgumentException("List rest property value must be a rdf:List"));
            toProcess.add(Pair.of(rest, def));
        } else {
            Set<String> ids = new HashSet<>();
            for (Resource restId : restSet) {
                com.mobi.ontologies.rdfs.List subList = listFactory.getExisting(restId, workflow.getModel())
                        .orElseThrow(() -> new IllegalArgumentException("List rest property value must be a rdf:List"));
                IRI routeId = getRouteId(workflow, subList);
                String directId = "direct:" + routeId.getLocalName();
                RouteDefinition subDef = builder.from(directId).routeId(routeId.stringValue());
                toProcess.add(Pair.of(subList, subDef));
                ids.add(directId);
            }
            def.multicast().to(ids.toArray(new String[ids.size()]));
        }
    }

    private IRI getRouteId(Workflow workflow, com.mobi.ontologies.rdfs.List list) {
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

    private <T extends Thing> OrmFactory<? extends T> getFactory(T thing, Class<T> clazz) {
        IRI typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
        List<Resource> types = thing.getModel().filter(thing.getResource(), typeIRI, null)
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());

        return factoryRegistry.getSortedFactoriesOfType(clazz)
                        .stream()
                        .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                        .findFirst()
                .orElseThrow(() -> new IllegalStateException("No factory found for " + thing.getResource()));
    }

    private <T extends Thing, R> void collectStuff(Class<T> clazz, Set<T> things, Map<Resource, R> map,
                                                   MyFunction<T, R> function) {
        things.forEach(thing -> {
            OrmFactory<? extends T> factory = getFactory(thing, clazz);
            T  correctThing = factory.getExisting(thing.getResource(), thing.getModel()).get();
            R camelThing = function.apply(correctThing, factory.getTypeIRI());
            map.put(thing.getResource(), camelThing);
        });
    }

    @FunctionalInterface
    interface MyFunction<T extends Thing, R> {
        R apply(T thing, IRI iri);
    }

    private <T, S extends Thing> T getRouteFactory(Resource iri, Map<Resource, T> map) {
        if (map.containsKey(iri)) {
            return map.get(iri);
        } else {
            throw new IllegalArgumentException(iri + " type is not supported");
        }
    }
}

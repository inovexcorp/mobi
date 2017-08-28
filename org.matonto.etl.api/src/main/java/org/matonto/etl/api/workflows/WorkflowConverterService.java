package org.matonto.etl.api.workflows;

import org.apache.camel.builder.RouteBuilder;
import org.matonto.etl.api.ontologies.etl.Workflow;

public interface WorkflowConverterService {
    /**
     * Converts the Workflow RDF confiugration into Routes within a RouteBuilder for the purpose of adding them to a
     * CamelContext. Should include all referenced DataSources, Processors, and Destinations along with rdf:Lists
     * describing the Routes to be created.
     *
     * @param workflow a Workflow containing route definitions of DataSources, Processors, and Destinations
     * @return A RouteBuilder containing Routes configured by the Workflow RDF
     */
    RouteBuilder convert(Workflow workflow);
}

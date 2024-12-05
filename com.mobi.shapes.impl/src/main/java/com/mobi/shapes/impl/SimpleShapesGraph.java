package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.ontology.core.api.Ontology;
import com.mobi.rest.util.RestUtils;
import com.mobi.shapes.api.ShapesGraph;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;

import java.util.Optional;
import javax.ws.rs.core.StreamingOutput;

public class SimpleShapesGraph implements ShapesGraph {

    private final Ontology ontology;

    private static final String GET_ENTITY_QUERY = """
            CONSTRUCT {
              <%IRI%> ?p ?o .
            }
            WHERE {
              <%IRI%> ?p ?o .
            }""";
    private static final String SHAPES_GRAPH_CONTENT_QUERY = """
            CONSTRUCT {
                ?s ?p ?o .
            }
            WHERE {
                ?s ?p ?o .
                FILTER (?s != <%IRI%>)
            }
            """;
    private static final String IRI_REPLACE = "%IRI%";

    /**
     * Creates a SimpleShapesGraph object that represents a Shapes Graph.
     *
     * @param ontology           The {@link Ontology} containing the data in this Shapes Graph
     */
    public SimpleShapesGraph(Ontology ontology) {
        this.ontology = ontology;
    }

    @Override
    public Model getModel() {
        return this.ontology.asModel();
    }

    @Override
    public Model getEntity(Resource subjectId) {
        return this.ontology.getGraphQueryResults(GET_ENTITY_QUERY.replace(IRI_REPLACE, subjectId.stringValue()),
                false);
    }

    @Override
    public Optional<IRI> getShapesGraphId() {
        return this.ontology.getOntologyId().getOntologyIRI();
    }

    @Override
    public Model getShapesGraphContent() {
        IRI shapesGraphId = this.getShapesGraphId().orElseThrow(() ->
                new IllegalStateException("Missing Shapes Graph OntologyIRI"));
        return this.ontology.getGraphQueryResults(
                SHAPES_GRAPH_CONTENT_QUERY.replace(IRI_REPLACE, shapesGraphId.stringValue()), false);
    }

    @Override
    public StreamingOutput serializeShapesGraph(String format) {
        return output -> {
            switch (format.toLowerCase()) {
                case "rdf/xml" -> this.ontology.asRdfXml(output);
                case "turtle" -> ontology.asTurtle(output);
                default -> ontology.asJsonLD(false, output);
            }
        };
    }

    @Override
    public StreamingOutput serializeShapesGraphContent(String format) {
        IRI shapesGraphId = this.getShapesGraphId().orElseThrow(() ->
                new IllegalStateException("Missing Shapes Graph OntologyIRI"));
        String query = SHAPES_GRAPH_CONTENT_QUERY.replace(IRI_REPLACE, shapesGraphId.stringValue());
        return outputStream ->
                this.ontology.getGraphQueryResultsStream(query, false, RestUtils.getRDFFormat(format), false, outputStream);
    }

    protected Ontology getOntology() {
        return this.ontology;
    }
}

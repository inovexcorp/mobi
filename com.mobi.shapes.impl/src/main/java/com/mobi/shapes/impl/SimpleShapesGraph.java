package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.utils.OntologyUtils;
import com.mobi.persistence.utils.Bindings;
import com.mobi.rest.util.RestUtils;
import com.mobi.shapes.api.NodeShapeSummary;
import com.mobi.shapes.api.ShapesGraph;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import javax.ws.rs.core.StreamingOutput;

public class SimpleShapesGraph implements ShapesGraph {
    private final Ontology ontology;
    private static final String OFFSET_EXCEEDS = "Offset exceeds total size";
    private static final String IRI_REPLACE = "%IRI%";
    private static final String GET_ENTITY_QUERY;
    private static final String GET_NODE_SHAPES_QUERY;
    private static final String SHAPES_GRAPH_CONTENT_QUERY;

    static {
        try {
            GET_ENTITY_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleShapesGraph.class.getResourceAsStream("/retrieve-entity.rq")),
                    StandardCharsets.UTF_8
            );
            GET_NODE_SHAPES_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleShapesGraph.class.getResourceAsStream("/node-shapes-query.rq")),
                    StandardCharsets.UTF_8
            );
            SHAPES_GRAPH_CONTENT_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleShapesGraph.class.getResourceAsStream("/graph-content.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException ex) {
            throw new MobiException(ex);
        }
    }

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
                true);
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
                this.ontology.getGraphQueryResultsStream(query, false, RestUtils.getRDFFormat(format), false,
                        outputStream);
    }

    @Override
    public Set<Ontology> getImportedOntologies() {
        return OntologyUtils.getImportedOntologies(ontology);
    }

    @Override
    public Set<IRI> getUnloadableImportIRIs() {
        return this.ontology.getUnloadableImportIRIs();
    }

    @Override
    public OutputStream asTurtle() {
        return this.ontology.asTurtle();
    }

    @Override
    public OutputStream asTurtle(OutputStream outputStream) {
        return this.ontology.asTurtle(outputStream);
    }

    @Override
    public OutputStream asRdfXml() {
        return this.ontology.asRdfXml();
    }

    @Override
    public OutputStream asRdfXml(OutputStream outputStream) {
        return this.ontology.asRdfXml(outputStream);
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize) {
        return this.ontology.asJsonLD(skolemize);
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize, OutputStream outputStream) {
        return this.ontology.asJsonLD(skolemize, outputStream);
    }

    @Override
    public TupleQueryResult getTupleQueryResults(String queryString, boolean includeImports) {
        return this.ontology.getTupleQueryResults(queryString, includeImports);
    }

    @Override
    public Model getGraphQueryResults(String queryString, boolean includeImports) {
        return this.ontology.getGraphQueryResults(queryString, includeImports);
    }

    @Override
    public OutputStream getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                                   boolean skolemize) {
        return this.ontology.getGraphQueryResultsStream(queryString, includeImports, format, skolemize);
    }

    @Override
    public OutputStream getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                                   boolean skolemize, OutputStream outputStream) {
        return this.ontology.getGraphQueryResultsStream(queryString, includeImports, format, skolemize, outputStream);
    }

    @Override
    public boolean getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                              boolean skolemize, Integer limit, OutputStream outputStream) {
        return this.ontology.getGraphQueryResultsStream(queryString, includeImports, format, skolemize, limit,
                outputStream);
    }

    @Override
    public Ontology getOntology() {
        return this.ontology;
    }

    @Override
    public PaginatedSearchResults<NodeShapeSummary> findNodeShapes(PaginatedSearchParams searchParams,
                                                                   RepositoryConnection conn) {
        String searchTextParam = searchParams.getSearchText().orElse("");

        List<NodeShapeSummary> nodeShapeSummaries = new ArrayList<>();

        Ontology ontology = this.getOntology();
        Set<Ontology> onlyImports = OntologyUtils.getImportedOntologies(ontology);

        getNodeShapesFromOntology(nodeShapeSummaries, ontology, false, searchTextParam);
        onlyImports.forEach(ont -> getNodeShapesFromOntology(nodeShapeSummaries, ont, true, searchTextParam));

        int totalCount = nodeShapeSummaries.size();
        int offset = searchParams.getOffset();
        int limit = searchParams.getLimit().orElse(totalCount);

        if (totalCount == 0) {
            return new SimpleSearchResults<>(nodeShapeSummaries, totalCount, limit, 1);
        }
        if (offset > totalCount) {
            throw new IllegalArgumentException(OFFSET_EXCEEDS);
        }

        int pageNumber = (limit > 0) ? (offset / limit) + 1 : 1;
        return new SimpleSearchResults<>(orderShapeNodes(nodeShapeSummaries, offset, limit), totalCount, limit,
                pageNumber);
    }

    /**
     * Retrieves node shapes from the given ontology using a predefined SPARQL query and adds them to the provided list.
     *
     * @param nodeShapeSummaries the list to which the resulting {@link NodeShapeSummary} objects will be added
     * @param ontology the ontology to query for node shapes
     * @param imported flag indicating whether these shapes come from an imported ontology
     * @param searchText search text used to filter shapes in the query (replaces "%search%" in the query template.
     */
    protected void getNodeShapesFromOntology(List<NodeShapeSummary> nodeShapeSummaries,
                                             Ontology ontology,
                                             boolean imported,
                                             String searchText) {
        String queryString = GET_NODE_SHAPES_QUERY.replace("%search%", searchText);
        TupleQueryResult results = ontology.getTupleQueryResults(queryString, false);

        results.forEach(queryResult -> {
            String nodeIri = Bindings.requiredResource(queryResult, "iri").stringValue();
            String nodeName = Bindings.requiredLiteral(queryResult, "name").stringValue();
            Optional<Binding> targetType = Optional.ofNullable(queryResult.getBinding("targetType"));
            Optional<Binding> targetValue = Optional.ofNullable(queryResult.getBinding("targetValue"));
            Optional<IRI> ontologyIRI = ontology.getOntologyId().getOntologyIRI();
            NodeShapeSummary nodeShapeSummary = new NodeShapeSummary(
                    nodeIri,
                    nodeName,
                    targetType.isPresent() ? targetType.get().getValue().stringValue() : "",
                    targetValue.isPresent() ? targetValue.get().getValue().stringValue() : "",
                    imported,
                    ontologyIRI.map(Value::stringValue).orElse(null)
            );
            nodeShapeSummaries.add(nodeShapeSummary);
        });
    }

    /**
     * Sorts the given list of NodeShapeSummary objects by name and applies pagination.
     *
     * @param nodeShapeSummaries the list to sort and modify in-place
     * @param offset the starting index for pagination (must be within bounds)
     * @param limit the maximum number of items to include (must be > 0)
     * @throws IllegalArgumentException if offset or limit is invalid
     */
    protected List<NodeShapeSummary> orderShapeNodes(List<NodeShapeSummary> nodeShapeSummaries, int offset, int limit) {
        if (limit <= 0) {
            throw new IllegalArgumentException("Limit must be greater than 0.");
        }
        nodeShapeSummaries.sort(Comparator.comparing(NodeShapeSummary::name));
        if (offset >= nodeShapeSummaries.size()) {
            throw new IllegalArgumentException("Offset is greater than or equal to the number of nodes.");
        }
        int toIndex = Math.min(offset + limit, nodeShapeSummaries.size());
        return nodeShapeSummaries.subList(offset, toIndex);
    }

    private record SimpleSearchResults<T>(List<T> page, int totalSize, int pageSize,
                                         int pageNumber) implements PaginatedSearchResults<T> {
    }
}
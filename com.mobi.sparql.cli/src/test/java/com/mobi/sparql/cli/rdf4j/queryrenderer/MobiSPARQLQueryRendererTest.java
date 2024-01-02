package com.mobi.sparql.cli.rdf4j.queryrenderer;

/*-
 * #%L
 * com.mobi.sparql.cli
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

import static org.junit.Assert.assertNotNull;

import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.query.parser.ParsedQuery;
import org.eclipse.rdf4j.query.parser.sparql.SPARQLParser;
import org.eclipse.rdf4j.queryrender.sparql.SPARQLQueryRenderer;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;

public class MobiSPARQLQueryRendererTest {

    private MemoryRepositoryWrapper repo;

    @Before
    public void setUp() {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
    }

    @Test(expected = MalformedQueryException.class)
    public void queryWithExistsFilterRDF4jTest() throws Exception {
        String queryStr = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "PREFIX catalog: <http://mobi.com/ontologies/catalog#>\n" +
                "PREFIX prov: <http://www.w3.org/ns/prov#>\n" +
                "PREFIX dct: <http://purl.org/dc/terms/>\n" +
                "PREFIX usrmgmt: <http://mobi.com/ontologies/user/management#>\n" +
                "\n" +
                " CONSTRUCT {  \n" +
                "    ?s3 ?p3 ?o3 .\n" +
                "}\n" +
                "WHERE {\n" +
                "  GRAPH ?diffGraph {\n" +
                "    ?s3 ?p3 ?o3 .\n" +
                "  }\n" +
                "\n" +
                "  FILTER(STRSTARTS(STR(?diffGraph), 'https://mobi.com/additions#') || STRSTARTS(STR(?diffGraph), 'https://mobi.com/deletions#'))\n" +
                "  FILTER NOT EXISTS {?revision (catalog:additions|catalog:deletions) ?diffGraph.}\n" +
                "}";
        ParsedQuery parseQuery = new SPARQLParser().parseQuery(queryStr, null);
        SPARQLQueryRenderer sparqlQueryRenderer = new SPARQLQueryRenderer();
        try (RepositoryConnection conn = repo.getConnection()){
            String parsedQueryString = sparqlQueryRenderer.render(parseQuery);
            conn.prepareGraphQuery(parsedQueryString); // Throws error due to EXISTS clause using a parentheses
        }
    }

    @Test
    public void queryWithExistsFilterMobiTest() throws Exception {
        String queryStr = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "PREFIX catalog: <http://mobi.com/ontologies/catalog#>\n" +
                "PREFIX prov: <http://www.w3.org/ns/prov#>\n" +
                "PREFIX dct: <http://purl.org/dc/terms/>\n" +
                "PREFIX usrmgmt: <http://mobi.com/ontologies/user/management#>\n" +
                "\n" +
                " CONSTRUCT {  \n" +
                "    ?s3 ?p3 ?o3 .\n" +
                "}\n" +
                "WHERE {\n" +
                "  GRAPH ?diffGraph {\n" +
                "    ?s3 ?p3 ?o3 .\n" +
                "  }\n" +
                "\n" +
                "  FILTER(STRSTARTS(STR(?diffGraph), 'https://mobi.com/additions#') || STRSTARTS(STR(?diffGraph), 'https://mobi.com/deletions#'))\n" +
                "  FILTER NOT EXISTS {?revision (catalog:additions|catalog:deletions) ?diffGraph.}\n" +
                "}";
        ParsedQuery parseQuery = new SPARQLParser().parseQuery(queryStr, null);
        MobiSPARQLQueryRenderer mobiSPARQLQueryRenderer = new MobiSPARQLQueryRenderer();
        try (RepositoryConnection conn = repo.getConnection()){
            String parsedQueryString = mobiSPARQLQueryRenderer.render(parseQuery);
            GraphQuery query = conn.prepareGraphQuery(parsedQueryString);
            assertNotNull(query);
        }
    }
}

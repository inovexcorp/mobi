package com.mobi.catalog.api.record.statistic;

/*-
 * #%L
 * com.mobi.catalog.api
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

import static com.mobi.persistence.utils.Models.vf;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.eclipse.rdf4j.query.QueryEvaluationException;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Test;

import java.util.List;
import java.util.ArrayList;

public class StatisticUtilsTest {

    @Test
    public void testStatisticsToJson() {
        // Create a list of statistics
        List<Statistic> statistics = new ArrayList<>();
        statistics.add(new Statistic(new StatisticDefinition("statistic1", "desc1"), 10));
        statistics.add(new Statistic(new StatisticDefinition("statistic2", "desc2"), 20));
        // Convert statistics to JSON
        ArrayNode jsonArray = StatisticUtils.statisticsToJson(statistics);
        // Assert that the JSON array has the correct number of elements
        assertEquals(2, jsonArray.size());
        // Assert that the first statistic is correctly represented in the JSON array
        ObjectNode jsonStatistic1 = (ObjectNode) jsonArray.get(0);
        assertEquals("statistic1", jsonStatistic1.get("name").asText());
        assertEquals("desc1", jsonStatistic1.get("description").asText());
        assertEquals(10, jsonStatistic1.get("value").asInt());
        // Assert that the second statistic is correctly represented in the JSON array
        ObjectNode jsonStatistic2 = (ObjectNode) jsonArray.get(1);
        assertEquals("statistic2", jsonStatistic2.get("name").asText());
        assertEquals("desc2", jsonStatistic2.get("description").asText());
        assertEquals(20, jsonStatistic2.get("value").asInt());
    }

    @Test
    public void testStatisticToJsonEmptyList() {
        // Convert an empty list of statistics to JSON
        ArrayNode jsonArray = StatisticUtils.statisticsToJson(new ArrayList<>());
        // Assert that the JSON array is empty
        assertTrue(jsonArray.isEmpty());
    }

    @Test
    public void testGetStatistics() throws QueryEvaluationException {
        Repository repo = new SailRepository(new MemoryStore());
        StatisticDefinition[] statisticDefinitions = new StatisticDefinition[] {
                new StatisticDefinition("statistic1", "desc1"),
                new StatisticDefinition("statistic2", "desc2"),
                new StatisticDefinition("statistic3", "desc3"),
                new StatisticDefinition("statistic4", "desc4")
        };
        try (RepositoryConnection conn = repo.getConnection()){
            String query = "SELECT ?statistic1 ?statistic2 ?statistic3 ?statistic4 WHERE { "
                    + "  BIND (1 as ?statistic1) "
                    + "  BIND (2 as ?statistic2)"
                    + "  BIND (\"string\" as ?statistic3)"
                    + "}";
            List<Statistic> statistics = StatisticUtils.getStatistics(query, vf.createIRI("urn:recordId"), statisticDefinitions, conn);
            assertEquals(2, statistics.size());
            assertEquals("statistic1", statistics.get(0).definition().name());
            assertEquals("desc1", statistics.get(0).definition().description());
            assertEquals(1, statistics.get(0).value());
            assertEquals("statistic2", statistics.get(1).definition().name());
            assertEquals("desc2", statistics.get(1).definition().description());
            assertEquals(2, statistics.get(1).value());
        }
        repo.shutDown();
    }

    @Test
    public void testGetStatisticQueryEvaluationException() throws QueryEvaluationException {
        // Create mock objects
        RepositoryConnection conn = mock(RepositoryConnection.class);
        TupleQuery tupleQuery = mock(TupleQuery.class);
        // Define test data
        String query = "SELECT ?statistic1 ?statistic2 WHERE { ?s ?p ?o }";
        StatisticDefinition[] statisticDefinitions = new StatisticDefinition[] {
                new StatisticDefinition("statistic1", "desc1"),
                new StatisticDefinition("statistic2", "desc2")
        };
        // Configure mock behavior
        when(conn.prepareTupleQuery(QueryLanguage.SPARQL, query)).thenReturn(tupleQuery);
        when(tupleQuery.evaluate()).thenThrow(QueryEvaluationException.class);
        // Call the method under test
        List<Statistic> statistics = StatisticUtils.getStatistics(query, vf.createIRI("urn:recordId"), statisticDefinitions, conn);
        assertTrue(statistics.isEmpty());
    }
}
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.query.QueryEvaluationException;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.explanation.Explanation;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

public class StatisticUtils {
    final static ObjectMapper mapper = new ObjectMapper();
    private static final Logger log = LoggerFactory.getLogger(StatisticUtils.class);

    /**
     * Converts a list of statistics to a JSON array, where each statistic is represented as a JSON object
     * with properties "name", "description", and "value".
     *
     * @param statistics the list of statistics to convert
     * @return JSON array of statistic objects
     */
    public static ArrayNode statisticsToJson(List<Statistic> statistics) {
        ArrayNode jsonArray = mapper.createArrayNode();
        for (Statistic statistic : statistics) {
            ObjectNode statisticsJson = mapper.createObjectNode();
            statisticsJson.put("name", statistic.definition().name());
            statisticsJson.put("description", statistic.definition().description());
            statisticsJson.put("value", statistic.value());
            jsonArray.add(statisticsJson);
        }
        return jsonArray;
    }

    /**
     * Executes a SPARQL query on the given repository connection and extracts statistics from the result set.
     * Assumption: The names of the statistics in the statisticDefinitions array must match
     * the binding names in the SPARQL query.
     *
     * @param query                SPARQL query to execute
     * @param recordId             the record ID to bind to the query if not null
     * @param statisticDefinitions Definitions of the statistics to extract from the query result
     * @param conn                 Repository connection to execute the query on
     * @return List of extracted statistics
     */
    public static List<Statistic> getStatistics(String query, Resource recordId,
                                                StatisticDefinition[] statisticDefinitions,
                                                RepositoryConnection conn) {
        List<Statistic> statistics = new ArrayList<>();
        try {
            TupleQuery tupleQuery = conn.prepareTupleQuery(QueryLanguage.SPARQL, query);
            if (recordId != null) {
                tupleQuery.setBinding("record", recordId);
            }
            try (TupleQueryResult result = tupleQuery.evaluate()) {
                result.forEach(bindings -> {
                    for (StatisticDefinition statisticDefinition : statisticDefinitions) {
                        Value value = bindings.getValue(statisticDefinition.name());
                        if (value != null) {
                            try {
                                Statistic statistic = new Statistic(statisticDefinition,
                                        Integer.parseInt(value.stringValue()));
                                statistics.add(statistic);
                            } catch (NumberFormatException e) {
                                log.trace("Error: Invalid integer value for statistic "
                                        + statisticDefinition.name());
                            }
                        } else {
                            log.trace("Error: Null value for statistic " + statisticDefinition.name());
                        }
                    }
                });
            }
            if (log.isTraceEnabled()) {
                log.trace(tupleQuery.explain(Explanation.Level.Timed).toString());
            }
        } catch (QueryEvaluationException e) {
            log.error(e.getMessage(), e);
        }
        return statistics;
    }
}

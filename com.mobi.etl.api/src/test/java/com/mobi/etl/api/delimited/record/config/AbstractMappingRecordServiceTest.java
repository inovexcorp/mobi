package com.mobi.etl.api.delimited.record.config;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static junit.framework.TestCase.assertEquals;

import com.mobi.etl.api.delimited.record.AbstractMappingRecordService;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public class AbstractMappingRecordServiceTest {
    private static final ValueFactory vf = new ValidatingValueFactory();

    private AbstractMappingRecordService<MappingRecord> recordService;

    @Before
    public void setUp() throws Exception {
        recordService = new AbstractMappingRecordService<>() {
            @Override
            public Class<MappingRecord> getType() {
                return MappingRecord.class;
            }

            @Override
            public String getTypeIRI() {
                return MappingRecord.TYPE;
            }
        };
    }

    @Test
    public void getStatisticsTest() {
        SailRepository repository = new SailRepository(new MemoryStore());
        try (RepositoryConnection conn = repository.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/statistics-test-data.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));

            List<String> statistics = recordService.getStatistics(vf.createIRI("http://example.com/record/1"), conn)
                    .stream()
                    .map((metric) -> String.format("%s:%s", metric.definition().name(), metric.value()))
                    .toList();
            String[] expected = new String[]{
                    "totalClassMappings:2",
            };
            assertEquals(List.of(expected), statistics);

            List<String> statisticsC = recordService.getStatistics(vf.createIRI("https://mobi.com/records#non-exists"), conn)
                    .stream()
                    .map((metric) -> String.format("%s:%s", metric.definition().name(), metric.value()))
                    .toList();
            String[] expectedC = new String[]{
                    "totalClassMappings:0"
            };
            assertEquals(List.of(expectedC), statisticsC);
        } catch (IOException | RuntimeException e) {
            Assert.fail(e.getMessage());
        }
    }
}

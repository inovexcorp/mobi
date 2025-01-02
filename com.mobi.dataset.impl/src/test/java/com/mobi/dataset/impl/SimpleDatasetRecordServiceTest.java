package com.mobi.dataset.impl;

/*-
 * #%L
 * com.mobi.dataset.impl
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

import static junit.framework.TestCase.assertEquals;

import com.mobi.dataset.impl.record.SimpleDatasetRecordService;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
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

public class SimpleDatasetRecordServiceTest {
    private final ValueFactory vf = new ValidatingValueFactory();
    private SimpleDatasetRecordService recordService;

    @Before
    public void setUp() throws Exception {
        recordService = new SimpleDatasetRecordService();
    }

    @Test
    public void getStatisticsTest() {
        MemoryRepositoryWrapper repository = new MemoryRepositoryWrapper();
        repository.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repository.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/dataset-data.ttl");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
            // Check ont1
            List<String> statistics = recordService.getStatistics(vf.createIRI("https://mobi.com/records#32500260-3d98-48aa-913d-1a6a69d5e089"), conn)
                    .stream()
                    .map((metric) -> String.format("%s:%s", metric.definition().name(), metric.value()))
                    .toList();
            String[] expected = new String[]{
                    "totalTypes:3",
                    "totalTriples:169"
            };
            assertEquals(List.of(expected), statistics);
        } catch (IOException | RuntimeException e) {
            Assert.fail(e.getMessage());
        }
    }
}

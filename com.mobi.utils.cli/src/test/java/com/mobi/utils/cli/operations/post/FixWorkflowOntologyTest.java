package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.utils.cli.CliTestUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.common.transaction.QueryEvaluationMode;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;

import java.util.List;
import java.util.stream.Stream;

public class FixWorkflowOntologyTest {

    private final ValueFactory vf = new ValidatingValueFactory();

    private final ModelFactory mf = new DynamicModelFactory();

    private MemoryRepositoryWrapper provRepo;

    private FixWorkflowOntology fixOperation;


    @Before
    public void setupMocks() throws Exception {
        provRepo = new MemoryRepositoryWrapper();
        MemoryStore store = new MemoryStore();
        store.setDefaultQueryEvaluationMode(QueryEvaluationMode.STANDARD);
        provRepo.setDelegate(new SailRepository(store));

        fixOperation = new FixWorkflowOntology();
        fixOperation.provRepo = provRepo;

    }

    @Test
    public void getVersionRangeTest() throws InvalidVersionSpecificationException {
        List<String> expectedVersions = Stream.of(
                "1.12;true",
                "1.13;true",
                "1.14;true",
                "1.15;true",
                "1.16;true",
                "1.17;true",
                "1.18;true",
                "1.19;true",
                "1.20;true",
                "1.21;true",
                "1.22;true",
                "2.0;true",
                "2.1;true",
                "2.2;true",
                "2.3;true",
                "2.4;true",
                "2.5;true",
                "2.6;true",
                "2.7;false"
        ).toList();
        List<String> actualVersionCheck = CliTestUtils.runVersionCheck(fixOperation, expectedVersions);
        assertEquals(expectedVersions, actualVersionCheck);
    }

    @Test
    public void fixDanglingActivitiesTest() {
        CliTestUtils.loadFiles(provRepo, "/workflowActivities.trig");
        fixOperation.execute();
        try(RepositoryConnection conn = provRepo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(
                    vf.createIRI("https://www.example.com/activites/A"), null, null), mf);

            Statement endedTriple = conn.getStatements(vf.createIRI("https://www.example.com/activites/A"),
                    vf.createIRI("http://www.w3.org/ns/prov#endedAtTime"), null).stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("No endedAt Triple available."));

            Statement succeededTriple = conn.getStatements(vf.createIRI("https://www.example.com/activites/A"),
                            vf.createIRI("http://mobi.solutions/ontologies/workflows#succeeded"), null).stream()
                    .findFirst().orElseThrow(() -> new IllegalStateException("No succeeded Triple available."));

            assertEquals(9, model.size());

            assertEquals("\"2024-04-03T16:36:47.023743-04:00\"^^<http://www.w3.org/2001/XMLSchema#dateTime>",
                    endedTriple.getObject().toString());

            assertEquals("\"false\"^^<http://www.w3.org/2001/XMLSchema#boolean>",
                    succeededTriple.getObject().toString());

        } catch (Exception e) {
            fail(e.getMessage());
        }
    }
}

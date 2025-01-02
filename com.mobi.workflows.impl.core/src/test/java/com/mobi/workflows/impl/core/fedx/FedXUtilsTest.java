package com.mobi.workflows.impl.core.fedx;

/*-
 * #%L
 * com.mobi.workflows.impl.core
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Test;

import java.util.List;

public class FedXUtilsTest {
    private static final ValueFactory vf = new ValidatingValueFactory();
    protected FedXUtils fedXUtils = new FedXUtils();

    @Test
    public void getFedXRepoWithModelTest() {
        Model modelTemp = new LinkedHashModel();
        modelTemp.add(vf.createIRI("urn:id1"), vf.createIRI("urn:property3"), vf.createLiteral(true));

        String[] id1Rows = new String[]{"urn:id1;urn:property1"};
        Repository memRepo1 = createMemRepo(id1Rows);
        String[] id2Rows = new String[]{"urn:id1;urn:property2"};
        Repository memRepo2 = createMemRepo(id2Rows);

        // Federated Repo

        Repository fedRepo = fedXUtils.getFedXRepoWithModel(modelTemp, memRepo1, memRepo2);
        assertCountStatements(fedRepo, vf.createIRI("urn:id1"), 3);
        String query1 = "SELECT * WHERE { <urn:id1> ?p ?o }";
        List<String> resultList1 = getQueryBindingValues(fedRepo, query1, "p");
        assertTrue(resultList1.contains("urn:property1"));
        assertTrue(resultList1.contains("urn:property2"));
        assertTrue(resultList1.contains("urn:property3"));

        String query2 = "SELECT * WHERE { ?s ?p ?o . FILTER(?s = iri('urn:id1'))} ORDER BY (?p) LIMIT 10";
        List<String> resultList2 = getQueryBindingValues(fedRepo, query2, "p");
        assertEquals("[urn:property1, urn:property2, urn:property3]", resultList2.toString());
    }

    @Test
    public void getFedXRepoTest() {
        String[] id1Rows = new String[]{"urn:id1;urn:property1"};
        Repository memRepo1 = createMemRepo(id1Rows);
        String[] id2Rows = new String[]{"urn:id1;urn:property2"};
        Repository memRepo2 = createMemRepo(id2Rows);
        String[] id3Rows = new String[]{"urn:id1;urn:property0"};
        Repository memRepo3 = createMemRepo(id3Rows);
        // Federated Repo
        Repository fedRepo = fedXUtils.getFedXRepo(memRepo1, memRepo2, memRepo3);
        assertCountStatements(fedRepo, vf.createIRI("urn:id1"), 3);

        String query1 = "SELECT * WHERE { <urn:id1> ?p ?o }";
        List<String> resultList1 = getQueryBindingValues(fedRepo, query1, "p");
        assertTrue(resultList1.contains("urn:property0"));
        assertTrue(resultList1.contains("urn:property1"));
        assertTrue(resultList1.contains("urn:property2"));

        String query2 = "SELECT * WHERE { ?s ?p ?o . FILTER(?s = iri('urn:id1'))} ORDER BY (?p) LIMIT 10";
        List<String> resultList2 = getQueryBindingValues(fedRepo, query2, "p");
        assertEquals("[urn:property0, urn:property1, urn:property2]", resultList2.toString());
    }

    private static Repository createMemRepo(String[] id1Iri) {
        Repository memRepo = new SailRepository(new MemoryStore());
        try (RepositoryConnection conn = memRepo.getConnection()) {
            for (String s : id1Iri) {
                String[] row = s.split(";");
                conn.add(vf.createStatement(vf.createIRI(row[0]), vf.createIRI(row[1]), vf.createLiteral(true)));
            }
        }
        return memRepo;
    }

    private static void assertCountStatements(Repository fedRepo, IRI id1Iri, int count) {
        try (RepositoryConnection conn = fedRepo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(id1Iri, null, null));
            assertEquals(count, model.size());
        }
    }

    private static List<String> getQueryBindingValues(Repository fedRepo, String query, String binding) {
        List<String> resultList;
        try (RepositoryConnection conn = fedRepo.getConnection()) {
            TupleQueryResult result = conn.prepareTupleQuery(query).evaluate();
            resultList = QueryResults.asList(result).stream()
                    .map(bs -> bs.getBinding(binding).getValue().stringValue())
                    .toList();
            result.close();
        }
        return resultList;
    }

}

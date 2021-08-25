package com.mobi.sparql.cli;

/*-
 * #%L
 * com.mobi.sparql.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.builder.Difference;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.vocabularies.xsd.XSD;
import org.eclipse.rdf4j.query.parser.ParsedUpdate;
import org.eclipse.rdf4j.query.parser.sparql.SPARQLParser;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

public class QueryTest extends OrmEnabledTestCase {

    private Repository repo;
    private Query service;

    @Mock
    RepositoryManager repositoryManager;

    @Mock
    SesameTransformer transformer;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);

        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        service = new Query();
        service.setRepoManager(repositoryManager);
        service.setTransformer(transformer);
        service.vf = VALUE_FACTORY;
        service.mf = MODEL_FACTORY;
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(repo));
    }

    @Test
    public void getUpdateStatementsInsertDataTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://example.org/ns#price"),
                    VALUE_FACTORY.createLiteral(42));
        }

        String queryStr = "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n" +
                "INSERT DATA\n" +
                "{ \n" +
                "  <http://example/book1> dc:title \"A new book\" ;\n" +
                "                         dc:creator \"A.N.Other\" .\n" +
                "}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();

        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("A new book"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/creator"),
                VALUE_FACTORY.createLiteral("A.N.Other"));
        Model expectedDeletes = MODEL_FACTORY.createModel();
        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsInsertDataOneStatementTest() throws Exception {
        String queryStr = "INSERT DATA {<urn:1> <urn:2> <urn:3>}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        expectedInserts.add(VALUE_FACTORY.createIRI("urn:1"),
                VALUE_FACTORY.createIRI("urn:2"),
                VALUE_FACTORY.createIRI("urn:3"));
        Model expectedDeletes = MODEL_FACTORY.createModel();
        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsInsertDataWithGraphTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                    VALUE_FACTORY.createIRI("http://example/bookstore"));
        }

        String queryStr = "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n" +
                "PREFIX ns: <http://example.org/ns#>\n" +
                "INSERT DATA\n" +
                "{ GRAPH <http://example/bookStore> { <http://example/book1>  ns:price  \"42\"^^<http://www.w3" +
                ".org/2001/XMLSchema#int> } }";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();

        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://example.org/ns#price"),
                VALUE_FACTORY.createLiteral(42),
                VALUE_FACTORY.createIRI("http://example/bookStore"));

        Model expectedDeletes = MODEL_FACTORY.createModel();
        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsInsertDataMultipleGraphsTest() throws Exception {
        String queryStr = "INSERT DATA {GRAPH <urn:test> {<urn:1> <urn:2> <urn:3>} GRAPH <urn:test2> " +
                "{<urn:1> <urn:2> <urn:3>}}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        expectedInserts.add(VALUE_FACTORY.createIRI("urn:1"),
                VALUE_FACTORY.createIRI("urn:2"),
                VALUE_FACTORY.createIRI("urn:3"),
                VALUE_FACTORY.createIRI("urn:test"));
        expectedInserts.add(VALUE_FACTORY.createIRI("urn:1"),
                VALUE_FACTORY.createIRI("urn:2"),
                VALUE_FACTORY.createIRI("urn:3"),
                VALUE_FACTORY.createIRI("urn:test2"));
        Model expectedDeletes = MODEL_FACTORY.createModel();
        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsDeleteDataTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://example.org/ns#price"),
                    VALUE_FACTORY.createLiteral(42));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("David Copperfield"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/creator"),
                    VALUE_FACTORY.createLiteral("Edmund Wells"));
        }

        String queryStr = "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n" +
                "\n" +
                "DELETE DATA\n" +
                "{\n" +
                "  <http://example/book2> dc:title \"David Copperfield\" ;\n" +
                "                         dc:creator \"Edmund Wells\" .\n" +
                "}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();

        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book2"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("David Copperfield"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book2"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/creator"),
                VALUE_FACTORY.createLiteral("Edmund Wells"));
        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsDeleteDataOneStatementTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("urn:1"),
                    VALUE_FACTORY.createIRI("urn:2"),
                    VALUE_FACTORY.createIRI("urn:3"));
        }

        String queryStr = "DELETE DATA {<urn:1> <urn:2> <urn:3>}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("urn:1"),
                VALUE_FACTORY.createIRI("urn:2"),
                VALUE_FACTORY.createIRI("urn:3"));
        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsInsertDataAndDeleteDataTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("Fundamentals of Compiler Desing"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
        }

        String queryStr = "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n" +
                "DELETE DATA\n" +
                "{ GRAPH <http://example/bookStore> { <http://example/book1>  dc:title  \"Fundamentals of Compiler " +
                "Desing\" } } ;\n" +
                "\n" +
                "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n" +
                "INSERT DATA\n" +
                "{ GRAPH <http://example/bookStore> { <http://example/book1>  dc:title  \"Fundamentals of Compiler " +
                "Design\" } }\n";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                VALUE_FACTORY.createIRI("http://example/bookStore"));

        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Desing"),
                VALUE_FACTORY.createIRI("http://example/bookStore"));

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsDeleteTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://example.org/ns#price"),
                    VALUE_FACTORY.createLiteral(42));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("David Copperfield"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/creator"),
                    VALUE_FACTORY.createLiteral("Edmund Wells"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1948-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)));
            conn.add(VALUE_FACTORY.createIRI("http://example/book3"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.1 Tutorial"));
        }

        String queryStr = "PREFIX dc:  <http://purl.org/dc/elements/1.1/>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                "\n" +
                "DELETE\n" +
                " { ?book ?p ?v }\n" +
                "WHERE\n" +
                " { ?book dc:date ?date .\n" +
                "   FILTER ( ?date > \"1970-01-01T00:00:00-02:00\"^^xsd:dateTime )\n" +
                "   ?book ?p ?v\n" +
                " }";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();

        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)));

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsInsertWithGraphTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://example.org/ns#price"),
                    VALUE_FACTORY.createLiteral(42),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("David Copperfield"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/creator"),
                    VALUE_FACTORY.createLiteral("Edmund Wells"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1948-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book3"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.1 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book4"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.0 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore2"));
        }

        String queryStr = "PREFIX dc:  <http://purl.org/dc/elements/1.1/>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                "\n" +
                "INSERT \n" +
                "  { GRAPH <http://example/bookStore2> { ?book ?p ?v } }\n" +
                "WHERE\n" +
                "  { GRAPH  <http://example/bookStore>\n" +
                "       { ?book dc:date ?date .\n" +
                "         FILTER ( ?date > \"1970-01-01T00:00:00-02:00\"^^xsd:dateTime )\n" +
                "         ?book ?p ?v\n" +
                "  } }";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));

        Model expectedDeletes = MODEL_FACTORY.createModel();

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsInsertWithGraphVariableTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://example.org/ns#price"),
                    VALUE_FACTORY.createLiteral(42),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("David Copperfield"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/creator"),
                    VALUE_FACTORY.createLiteral("Edmund Wells"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1948-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book3"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.1 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book4"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.0 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore2"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book4"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore2"));
        }

        String queryStr = "PREFIX dc:  <http://purl.org/dc/elements/1.1/>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                "\n" +
                "INSERT \n" +
                "  { GRAPH ?bookStore { ?book ?p ?v } }\n" +
                "WHERE\n" +
                "  { GRAPH  ?bookStore\n" +
                "       { ?book dc:date ?date .\n" +
                "         FILTER ( ?date > \"1970-01-01T00:00:00-02:00\"^^xsd:dateTime )\n" +
                "         ?book ?p ?v\n" +
                "  } }";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                VALUE_FACTORY.createIRI("http://example/bookStore"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book4"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("SPARQL 1.0 Tutorial"),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book4"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));

        Model expectedDeletes = MODEL_FACTORY.createModel();

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsDeleteWithGraphVariableTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://example.org/ns#price"),
                    VALUE_FACTORY.createLiteral(42),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("David Copperfield"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/creator"),
                    VALUE_FACTORY.createLiteral("Edmund Wells"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book2"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1948-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book3"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.1 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book4"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.0 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore2"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book4"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore2"));
        }

        String queryStr = "PREFIX dc:  <http://purl.org/dc/elements/1.1/>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                "\n" +
                "DELETE \n" +
                "  { GRAPH ?bookStore { ?book ?p ?v } }\n" +
                "WHERE\n" +
                "  { GRAPH  ?bookStore\n" +
                "       { ?book dc:date ?date .\n" +
                "         FILTER ( ?date > \"1970-01-01T00:00:00-02:00\"^^xsd:dateTime )\n" +
                "         ?book ?p ?v\n" +
                "  } }";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                VALUE_FACTORY.createIRI("http://example/bookStore"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book4"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("SPARQL 1.0 Tutorial"),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book4"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));

        Model expectedInserts = MODEL_FACTORY.createModel();

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsDeleteDataMultipleGraphsTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("urn:1"),
                    VALUE_FACTORY.createIRI("urn:2"),
                    VALUE_FACTORY.createIRI("urn:3"),
                    VALUE_FACTORY.createIRI("urn:test"));
            conn.add(VALUE_FACTORY.createIRI("urn:1"),
                    VALUE_FACTORY.createIRI("urn:2"),
                    VALUE_FACTORY.createIRI("urn:3"),
                    VALUE_FACTORY.createIRI("urn:test2"));
        }

        String queryStr = "DELETE DATA {GRAPH <urn:test> {<urn:1> <urn:2> <urn:3>} GRAPH <urn:test2> " +
                "{<urn:1> <urn:2> <urn:3>}}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("urn:1"),
                VALUE_FACTORY.createIRI("urn:2"),
                VALUE_FACTORY.createIRI("urn:3"),
                VALUE_FACTORY.createIRI("urn:test"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("urn:1"),
                VALUE_FACTORY.createIRI("urn:2"),
                VALUE_FACTORY.createIRI("urn:3"),
                VALUE_FACTORY.createIRI("urn:test2"));
        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsInsertAndDeleteWithGraphTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/dcmitype/PhysicalObject"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book3"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.1 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book4"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.0 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore2"));
        }

        String queryStr = "PREFIX dc:  <http://purl.org/dc/elements/1.1/>\n" +
                "PREFIX dcmitype: <http://purl.org/dc/dcmitype/>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                "INSERT\n" +
                "  { GRAPH <http://example/bookStore2> { ?book ?p ?v } }\n" +
                "WHERE\n" +
                "  { GRAPH  <http://example/bookStore>\n" +
                "     { ?book dc:date ?date . \n" +
                "       FILTER ( ?date < \"2000-01-01T00:00:00-02:00\"^^xsd:dateTime )\n" +
                "       ?book ?p ?v\n" +
                "     }\n" +
                "  };\n" +
                "DELETE\n" +
                " { GRAPH <http://example/bookStore> { ?book ?p ?v } }\n" +
                "WHERE { GRAPH <http://example/bookStore>\n" +
                " { ?book dc:date ?date ;\n" +
                "         a dcmitype:PhysicalObject .\n" +
                "   FILTER ( ?date < \"2000-01-01T00:00:00-02:00\"^^xsd:dateTime ) \n" +
                "   ?book ?p ?v \n" +
                " }}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/dcmitype/PhysicalObject"),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));

        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                VALUE_FACTORY.createIRI("http://example/bookStore"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/dcmitype/PhysicalObject"),
                VALUE_FACTORY.createIRI("http://example/bookStore"));

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsInsertAndDeleteReversedWithGraphTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                    VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book1"),
                    VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/dcmitype/PhysicalObject"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book3"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.1 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore"));
            conn.add(VALUE_FACTORY.createIRI("http://example/book4"),
                    VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                    VALUE_FACTORY.createLiteral("SPARQL 1.0 Tutorial"),
                    VALUE_FACTORY.createIRI("http://example/bookStore2"));
        }

        String queryStr = "PREFIX dc:  <http://purl.org/dc/elements/1.1/>\n" +
                "PREFIX dcmitype: <http://purl.org/dc/dcmitype/>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                "DELETE\n" +
                " { GRAPH <http://example/bookStore> { ?book ?p ?v } }\n" +
                "WHERE { GRAPH <http://example/bookStore>\n" +
                " { ?book dc:date ?date ;\n" +
                "         a dcmitype:PhysicalObject .\n" +
                "   FILTER ( ?date < \"2000-01-01T00:00:00-02:00\"^^xsd:dateTime ) \n" +
                "   ?book ?p ?v \n" +
                "     }\n" +
                "  };\n" +
                "INSERT\n" +
                "  { GRAPH <http://example/bookStore2> { ?book ?p ?v } }\n" +
                "WHERE\n" +
                "  { GRAPH  <http://example/bookStore>\n" +
                "     { ?book dc:date ?date . \n" +
                "       FILTER ( ?date < \"2000-01-01T00:00:00-02:00\"^^xsd:dateTime )\n" +
                "       ?book ?p ?v\n" +
                " }}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));
        expectedInserts.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/dcmitype/PhysicalObject"),
                VALUE_FACTORY.createIRI("http://example/bookStore2"));

        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/title"),
                VALUE_FACTORY.createLiteral("Fundamentals of Compiler Design"),
                VALUE_FACTORY.createIRI("http://example/bookStore"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/elements/1.1/date"),
                VALUE_FACTORY.createLiteral("1977-01-01T00:00:00-02:00", VALUE_FACTORY.createIRI(XSD.DATE_TIME)),
                VALUE_FACTORY.createIRI("http://example/bookStore"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/book1"),
                VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/dcmitype/PhysicalObject"),
                VALUE_FACTORY.createIRI("http://example/bookStore"));

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsDeleteWhereDoubleGraphTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/william"),
                    VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/Person"),
                    VALUE_FACTORY.createIRI("http://example.com/names"));
            conn.add(VALUE_FACTORY.createIRI("http://example/william"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/givenName"),
                    VALUE_FACTORY.createLiteral("William"),
                    VALUE_FACTORY.createIRI("http://example.com/names"));
            conn.add(VALUE_FACTORY.createIRI("http://example/fred"),
                    VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/Person"),
                    VALUE_FACTORY.createIRI("http://example.com/names"));
            conn.add(VALUE_FACTORY.createIRI("http://example/fred"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/givenName"),
                    VALUE_FACTORY.createLiteral("Fred"),
                    VALUE_FACTORY.createIRI("http://example.com/names"));
            conn.add(VALUE_FACTORY.createIRI("http://example/william"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/mbox"),
                    VALUE_FACTORY.createIRI("mailto:bill@example"),
                    VALUE_FACTORY.createIRI("http://example.com/addresses"));
            conn.add(VALUE_FACTORY.createIRI("http://example/fred"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/mbox"),
                    VALUE_FACTORY.createIRI("mailto:fred@example"),
                    VALUE_FACTORY.createIRI("http://example.com/addresses"));
        }

        String queryStr = "PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\n" +
                "\n" +
                "DELETE WHERE {\n" +
                "  GRAPH <http://example.com/names> {\n" +
                "    ?person foaf:givenName 'Fred' ;\n" +
                "            ?property1 ?value1\n" +
                "  }\n" +
                "  GRAPH <http://example.com/addresses> {\n" +
                "    ?person ?property2 ?value2\n" +
                "  }\n" +
                "}";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();

        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/fred"),
                VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/Person"),
                VALUE_FACTORY.createIRI("http://example.com/names"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/fred"),
                VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/givenName"),
                VALUE_FACTORY.createLiteral("Fred"),
                VALUE_FACTORY.createIRI("http://example.com/names"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/fred"),
                VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/mbox"),
                VALUE_FACTORY.createIRI("mailto:fred@example"),
                VALUE_FACTORY.createIRI("http://example.com/addresses"));

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    @Test
    public void getUpdateStatementsClearTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createIRI("http://example/william"),
                    VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/Person"),
                    VALUE_FACTORY.createIRI("http://example.com/names"));
            conn.add(VALUE_FACTORY.createIRI("http://example/william"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/givenName"),
                    VALUE_FACTORY.createLiteral("William"),
                    VALUE_FACTORY.createIRI("http://example.com/names"));
            conn.add(VALUE_FACTORY.createIRI("http://example/fred"),
                    VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/Person"),
                    VALUE_FACTORY.createIRI("http://example.com/names"));
            conn.add(VALUE_FACTORY.createIRI("http://example/fred"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/givenName"),
                    VALUE_FACTORY.createLiteral("Fred"),
                    VALUE_FACTORY.createIRI("http://example.com/names"));
            conn.add(VALUE_FACTORY.createIRI("http://example/william"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/mbox"),
                    VALUE_FACTORY.createIRI("mailto:bill@example"),
                    VALUE_FACTORY.createIRI("http://example.com/addresses"));
            conn.add(VALUE_FACTORY.createIRI("http://example/fred"),
                    VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/mbox"),
                    VALUE_FACTORY.createIRI("mailto:fred@example"),
                    VALUE_FACTORY.createIRI("http://example.com/addresses"));
        }

        String queryStr = "CLEAR GRAPH <http://example.com/names>";

        ParsedUpdate parsedUpdate = new SPARQLParser().parseUpdate(queryStr, null);
        Difference result = service.getUpdateStatements(parsedUpdate, repo);
        Model expectedInserts = MODEL_FACTORY.createModel();

        Model expectedDeletes = MODEL_FACTORY.createModel();
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/william"),
                VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/Person"),
                VALUE_FACTORY.createIRI("http://example.com/names"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/william"),
                VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/givenName"),
                VALUE_FACTORY.createLiteral("William"),
                VALUE_FACTORY.createIRI("http://example.com/names"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/fred"),
                VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/Person"),
                VALUE_FACTORY.createIRI("http://example.com/names"));
        expectedDeletes.add(VALUE_FACTORY.createIRI("http://example/fred"),
                VALUE_FACTORY.createIRI("http://xmlns.com/foaf/0.1/givenName"),
                VALUE_FACTORY.createLiteral("Fred"),
                VALUE_FACTORY.createIRI("http://example.com/names"));

        assertModelsEqual(expectedInserts, result.getAdditions());
        assertModelsEqual(expectedDeletes, result.getDeletions());
    }

    private void assertModelsEqual(Model expected, Model actual) {
        expected.forEach(expectedStatement -> {
            assertTrue(actual.contains(expectedStatement.getSubject(), expectedStatement.getPredicate(),
                    expectedStatement.getObject(), expectedStatement.getContext().isPresent()
                            ? expectedStatement.getContext().get() : null));
        });
        assertEquals(expected.size(), actual.size());
    }
}

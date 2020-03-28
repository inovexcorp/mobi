package com.mobi.ontology.rest;

/*-
 * #%L
 * com.mobi.ontology.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.when;

import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.api.GraphQuery;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ErrorCollector;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class OntologyRestImplQueryTest extends OrmEnabledTestCase {

    Repository repo;
    String queryString;

    @Mock
    private SesameTransformer transformer;

    @Rule
    public ErrorCollector collector = new ErrorCollector();

    @Before
    public void setUp() throws IOException {
        MockitoAnnotations.initMocks(this);

        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i ->
                Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));

        queryString = IOUtils.toString(getClass().getResourceAsStream("/retrieve-entity.rq"), StandardCharsets.UTF_8);
    }

    @After
    public void tearDown() {
        repo.shutDown();
    }

    @Test
    public void query01_NoBlankNodes() throws IOException {
        Model data = getModel("/queryData/01_NoBlankNodes-data.ttl");
        Model expectedResults = getModel("/queryData/01_NoBlankNodes-results.ttl");

        Model results;
        try(RepositoryConnection conn = repo.getConnection()) {
            results = getResults(conn, data, "http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#Fin");
        }

        try {
            assertEquals(expectedResults, results);
        } catch (Throwable t) {
            printModel("Expected Results", expectedResults);
            printModel("Actual Results", results);
            collector.addError(t);
        }
    }

    @Test
    public void query02_RestrictionOnRealClass() throws IOException {
        Model data = getModel("/queryData/02_RestrictionOnRealClass-data.ttl");
        Model expectedResults = getModel("/queryData/02_RestrictionOnRealClass-results.ttl");

        Model results;
        try(RepositoryConnection conn = repo.getConnection()) {
            results = getResults(conn, data, "http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#Fin");
        }

        try {
            assertEquals(expectedResults, results);
        } catch (Throwable t) {
            printModel("Expected Results", expectedResults);
            printModel("Actual Results", results);
            collector.addError(t);
        }
    }

    @Test
    public void query03_RestrictionOnList() throws IOException {
        Model data = getModel("/queryData/03_RestrictionOnList-data.ttl");
        Model expectedResults = getModel("/queryData/03_RestrictionOnList-results.ttl");

        Model results;
        try(RepositoryConnection conn = repo.getConnection()) {
            results = getResults(conn, data, "http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#Fin");
        }

        try {
            assertEquals(expectedResults, results);
        } catch (Throwable t) {
            printModel("Expected Results", expectedResults);
            printModel("Actual Results", results);
            collector.addError(t);
        }
    }

    @Test
    public void query04_RestrictionsInList() throws IOException {
        Model data = getModel("/queryData/04_RestrictionsInList-data.ttl");
        Model expectedResults = getModel("/queryData/04_RestrictionsInList-results.ttl");

        Model results;
        try(RepositoryConnection conn = repo.getConnection()) {
            results = getResults(conn, data, "http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#DualMountedMainLandingGear");
        }

        try {
            assertEquals(expectedResults, results);
        } catch (Throwable t) {
            printModel("Expected Results", expectedResults);
            printModel("Actual Results", results);
            collector.addError(t);
        }
    }

    private Model getModel(String path) throws IOException {
        return transformer.mobiModel(Rio.parse(this.getClass().getResourceAsStream(path), "", RDFFormat.TURTLE));
    }

    private Model getResults(RepositoryConnection conn, Model data, String resource) {
        conn.add(data);
        GraphQuery query = conn.prepareGraphQuery(queryString);
        query.setBinding("entity", VALUE_FACTORY.createIRI(resource));
        return QueryResults.asModel(query.evaluate(), MODEL_FACTORY);
    }

    private void printModel(String prefix, Model model) {
        List<Statement> list = new ArrayList<>(model);
        list.sort(Comparator.comparing(o -> o.getSubject().stringValue()));

        System.out.println();
        System.out.println(prefix);
        list.forEach(System.out::println);
        System.out.println();
    }
}

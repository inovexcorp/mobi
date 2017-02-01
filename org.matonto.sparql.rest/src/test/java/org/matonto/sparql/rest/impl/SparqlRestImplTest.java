package org.matonto.sparql.rest.impl;

/*-
 * #%L
 * org.matonto.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Test;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.matonto.rest.util.MatontoRestTestNg;
import org.matonto.rest.util.RestUtils;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;

public class SparqlRestImplTest extends MatontoRestTestNg {
    private SparqlRestImpl rest;
    private Repository repo;
    private ValueFactory vf;

    private String ALL_QUERY;

    @Mock
    private RepositoryManager repositoryManager;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        RepositoryConnection conn = repo.getConnection();
        conn.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyA"), vf.createLiteral("true"));
        conn.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyB"), vf.createLiteral("true"));
        conn.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyC"), vf.createLiteral("true"));
        conn.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyD"), vf.createLiteral("true"));
        conn.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyE"), vf.createLiteral("true"));

        MockitoAnnotations.initMocks(this);

        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(repo));

        rest = new SparqlRestImpl();
        rest.setRepository(repositoryManager);

        ALL_QUERY = RestUtils.encode(IOUtils.toString(getClass().getClassLoader().getResourceAsStream("all_query.rq")));

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @Test
    public void downloadQueryTest() {
        Map<String, String> tests = new HashMap<>();
        tests.put("csv", "text/csv");
        tests.put("tsv", "text/tab-separated-values");
        tests.put("xls", "application/vnd.ms-excel");
        tests.put("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        tests.forEach((type, mimeType) -> {
            Response response = target().path("sparql").queryParam("query", ALL_QUERY)
                    .queryParam("fileName", "test").queryParam("fileType", type).request().get();
            assertEquals(response.getStatus(), 200);
            MultivaluedMap<String, Object> headers = response.getHeaders();
            assertEquals(headers.get("Content-Type").get(0), mimeType);
            assertEquals(headers.get("Content-Disposition").get(0), "attachment;filename=test." + type);
        });
    }

    @Test
    public void downloadQueryWithNoFileNameTest() {
        Response response = target().path("sparql").queryParam("query", ALL_QUERY).queryParam("fileType", "csv")
                .request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("Content-Disposition").get(0), "attachment;filename=results.csv");
    }

    @Test
    public void downloadQueryWithInvalidQueryTest() {
        Response response = target().path("sparql").queryParam("query", RestUtils.encode("+"))
                .queryParam("fileType", "csv").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadQueryWithInvalidFileTypeTest() {
        Response response = target().path("sparql").queryParam("query", ALL_QUERY)
                .queryParam("fileType", "error").request().get();
        assertEquals(response.getStatus(), 400);
    }
}

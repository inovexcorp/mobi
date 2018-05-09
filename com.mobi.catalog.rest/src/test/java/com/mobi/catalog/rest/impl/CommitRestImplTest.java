package com.mobi.catalog.rest.impl;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static com.mobi.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class CommitRestImplTest extends MobiRestTestNg {
    private static final String USER_IRI = "http://mobi.com/users/tester";
    private static final String RECORD_IRI = "http://mobi.com/records/test";
    private static final String ERROR_IRI = "http://mobi.com/error";
    private static final String[] COMMIT_IRIS = new String[]{
        "http://mobi.com/commits/0",
        "http://mobi.com/commits/1",
        "http://mobi.com/commits/2"
    };

    private CommitRestImpl rest;
    private ValueFactory vf;
    private ModelFactory mf;
    private OrmFactory<Record> recordFactory;
    private Record testRecord;
    private List<Commit> testCommits;
    private User user;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private PaginatedSearchResults<Record> results;

    @Mock
    private Conflict conflict;

    @Mock
    private Difference difference;

    @Mock
    private BNodeService bNodeService;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();
        mf = getModelFactory();

        recordFactory = getRequiredOrmFactory(Record.class);
        OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

        testCommits = Arrays.stream(COMMIT_IRIS)
                .map(s -> commitFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toList());

        testRecord = recordFactory.createNew(vf.createIRI(RECORD_IRI));
        testRecord.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));

        user = userFactory.createNew(vf.createIRI(USER_IRI));

        MockitoAnnotations.initMocks(this);
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgumentAt(0, Model.class));

        rest = new CommitRestImpl();
        injectOrmFactoryReferencesIntoService(rest);
        rest.setVf(vf);
        rest.setEngineManager(engineManager);
        rest.setTransformer(transformer);
        rest.setCatalogManager(catalogManager);
        rest.setbNodeService(bNodeService);

        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));

        when(bNodeService.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgumentAt(0, Statement.class));
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgumentAt(0, Model.class));

        when(results.getPage()).thenReturn(Collections.singletonList(testRecord));
        when(results.getPageNumber()).thenReturn(0);
        when(results.getPageSize()).thenReturn(10);
        when(results.getTotalSize()).thenReturn(50);

        when(catalogManager.getCommit(vf.createIRI(COMMIT_IRIS[0]))).thenReturn(Optional.of(testCommits.get(0)));
        when(catalogManager.getCommit(vf.createIRI(COMMIT_IRIS[1]))).thenReturn(Optional.of(testCommits.get(1)));
        when(catalogManager.getCommit(vf.createIRI(COMMIT_IRIS[2]))).thenReturn(Optional.of(testCommits.get(2)));
        when(catalogManager.getCommitChain(any(Resource.class))).thenReturn(testCommits);
        when(catalogManager.getCommitDifference(any(Resource.class))).thenReturn(difference);

        when(difference.getAdditions()).thenReturn(mf.createModel());
        when(difference.getDeletions()).thenReturn(mf.createModel());

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engineManager.getUsername(any(Resource.class))).thenReturn(Optional.of(user.getResource().stringValue()));
    }

    @AfterMethod
    public void resetMocks() {
        reset(catalogManager, engineManager, transformer, conflict, difference, results, bNodeService);
    }

    // GET commits/{commitId}
    @Test
    public void getCommitTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCommit(vf.createIRI(COMMIT_IRIS[1]));
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("commit"));
            assertTrue(result.containsKey("additions"));
            assertTrue(result.containsKey("deletions"));
            JSONObject commit = result.getJSONObject("commit");
            assertTrue(commit.containsKey("@id"));
            assertEquals(commit.getString("@id"), COMMIT_IRIS[1]);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitWithErrorTest() {
        // Setup:
        when(catalogManager.getCommit(vf.createIRI(ERROR_IRI))).thenThrow(new IllegalArgumentException());

        Response response = target().path("commits/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(response.getStatus(), 500);
    }

    // GET commits/{commitId}/history
    @Test
    public void getCommitHistoryTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + COMMIT_IRIS.length);
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), COMMIT_IRIS.length);
            for (Object aResult : result) {
                JSONObject commitObj = JSONObject.fromObject(aResult);
                assertTrue(commitObj.containsKey("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(commitObj.getString("id")));
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithPaginationTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + COMMIT_IRIS.length);
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), COMMIT_IRIS.length);
            for (Object aResult : result) {
                JSONObject commitObj = JSONObject.fromObject(aResult);
                assertTrue(commitObj.containsKey("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(commitObj.getString("id")));
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithPaginationAndLinksTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .queryParam("offset", 1)
                .queryParam("limit", 1)
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + COMMIT_IRIS.length);
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("commits/" + encode(COMMIT_IRIS[1]) + "/history"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject commitObj = result.getJSONObject(0);
            assertTrue(commitObj.containsKey("id"));
            assertEquals(commitObj.getString("id"), COMMIT_IRIS[1]);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getCommitChain(vf.createIRI(ERROR_IRI));

        Response response = target().path("commits/" + encode(ERROR_IRI) + "/history")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCommitHistoryWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));

        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(response.getStatus(), 500);

        doThrow(new IllegalStateException()).when(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(response.getStatus(), 500);
    }
}

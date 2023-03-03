package com.mobi.platform.config.rest;

/*-
 * #%L
 * com.mobi.platform.config.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.Map;
import java.util.Optional;
import javax.ws.rs.core.Response;

public class RepositoryRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static RepositoryRest rest;
    private static RepositoryManager repositoryManager;

    private static OsgiRepository repository;
    private static final String REPO_ID = "test-repo";
    private static final String REPO_TITLE = "Test Repo";
    private static final ObjectMapper mapper = new ObjectMapper();

    @BeforeClass
    public static void startServer() {
        repositoryManager = Mockito.mock(RepositoryManager.class);
        repository = Mockito.mock(OsgiRepository.class);

        rest = new RepositoryRest();
        rest.repositoryManager = repositoryManager;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        when(repository.getRepositoryID()).thenReturn(REPO_ID);
        when(repository.getRepositoryTitle()).thenReturn("Test Repo");
        when(repository.getRepositoryType()).thenReturn("native");

        when(repositoryManager.getAllRepositories()).thenReturn(Map.of(REPO_ID, repository));
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());
        when(repositoryManager.getRepository(REPO_ID)).thenReturn(Optional.of(repository));
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(repositoryManager);
        reset(repository);
    }

    @Test
    public void getRepositoriesTest() {
        Response response = target().path("repositories").request().get();
        assertEquals(response.getStatus(), 200);
        verify(repositoryManager).getAllRepositories();
        try {
            String str = response.readEntity(String.class);
            JsonNode json = mapper.readTree(str);
            assertEquals(1, json.size());
            JsonNode repoObj = json.get(0);
            assertEquals(REPO_ID, repoObj.get("id").asText());
            assertEquals(REPO_TITLE, repoObj.get("title").asText());
            assertEquals("native", repoObj.get("type").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRepositorySuccessTest() {
        Response response = target().path("repositories/" + REPO_ID).request().get();
        assertEquals(response.getStatus(), 200);
        verify(repositoryManager).getRepository(REPO_ID);
        try {
            String str = response.readEntity(String.class);
            JsonNode json = mapper.readTree(str);
            assertEquals(REPO_ID, json.get("id").asText());
            assertEquals(REPO_TITLE, json.get("title").asText());
            assertEquals("native", json.get("type").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRepositoryFailureTest() {
        Response response = target().path("repositories/ERROR").request().get();
        assertEquals(response.getStatus(), 400);
    }
}

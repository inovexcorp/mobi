package com.mobi.catalog.impl.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

public class SimpleMergeRequestManagerTest extends OrmEnabledTestCase {
    private Repository repo;
    private SimpleMergeRequestManager manager;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private OrmFactory<MergeRequest> mergeRequestFactory = getRequiredOrmFactory(MergeRequest.class);
    private OrmFactory<AcceptedMergeRequest> acceptedMergeRequestFactory = getRequiredOrmFactory(AcceptedMergeRequest.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

    private MergeRequest request1;
    private MergeRequest request2;
    private MergeRequest request3;
    private AcceptedMergeRequest request4;
    private User user;

    private final IRI LOCAL_CATALOG_IRI = vf.createIRI("http://mobi.com/catalogs#local");
    private final IRI RECORD_IRI = vf.createIRI("http://mobi.com/test/records#versioned-rdf-record");
    private final IRI SOURCE_BRANCH_IRI = vf.createIRI("http://mobi.com/test/branches#source");
    private final IRI TARGET_BRANCH_IRI = vf.createIRI("http://mobi.com/test/branches#target");

    @Mock
    private CatalogUtilsService utilsService;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private RepositoryManager repositoryManager;

    @Before
    public void setUp() {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        request1 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/test/merge-requests#1"));
        request1.setProperty(vf.createLiteral("Request 1"), vf.createIRI(_Thing.title_IRI));
        request1.setProperty(vf.createLiteral(OffsetDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)), vf.createIRI(_Thing.issued_IRI));
        request2 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/test/merge-requests#2"));
        request2.setProperty(vf.createLiteral(OffsetDateTime.of(2018, 1, 2, 0, 0, 0, 0, ZoneOffset.UTC)), vf.createIRI(_Thing.issued_IRI));
        request2.setProperty(vf.createLiteral("Request 2"), vf.createIRI(_Thing.title_IRI));
        request3 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/test/merge-requests#3"));
        request3.setProperty(vf.createLiteral(OffsetDateTime.of(2018, 1, 3, 0, 0, 0, 0, ZoneOffset.UTC)), vf.createIRI(_Thing.issued_IRI));
        request3.setProperty(vf.createLiteral("Request 3"), vf.createIRI(_Thing.title_IRI));
        request4 = acceptedMergeRequestFactory.createNew(vf.createIRI("http://mobi.com/test/merge-requests#4"));
        request4.setProperty(vf.createLiteral(OffsetDateTime.of(2018, 1, 4, 0, 0, 0, 0, ZoneOffset.UTC)), vf.createIRI(_Thing.issued_IRI));
        request4.setProperty(vf.createLiteral("Request 4"), vf.createIRI(_Thing.title_IRI));
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users#user"));

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(request1.getModel(), request1.getResource());
            conn.add(request2.getModel(), request2.getResource());
            conn.add(request4.getModel(), request4.getResource());
        }

        MockitoAnnotations.initMocks(this);
        when(catalogManager.getRepositoryId()).thenReturn("system");
        when(catalogManager.getLocalCatalogIRI()).thenReturn(LOCAL_CATALOG_IRI);

        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());
        when(repositoryManager.getRepository("system")).thenReturn(Optional.of(repo));

        when(utilsService.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenAnswer(i -> {
            Resource iri = i.getArgumentAt(0, Resource.class);
            if (iri.equals(request1.getResource())) {
                return request1;
            } else if (iri.equals(request2.getResource())) {
                return request2;
            } else if (iri.equals(request3.getResource())) {
                return request3;
            } else if (iri.equals(request4.getResource())) {
                return request4;
            }
            return mergeRequestFactory.createNew(vf.createIRI("urn:test"));
        });
        when(utilsService.optObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(utilsService.optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request1));
        when(utilsService.throwAlreadyExists(any(Resource.class), any(OrmFactory.class))).thenReturn(new IllegalArgumentException());
        doThrow(new IllegalArgumentException()).when(utilsService).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));

        manager = new SimpleMergeRequestManager();
        injectOrmFactoryReferencesIntoService(manager);
        manager.setVf(vf);
        manager.setCatalogManager(catalogManager);
        manager.setCatalogUtils(utilsService);
        manager.setRepositoryManager(repositoryManager);
    }

    /* getMergeRequests */

    @Test
    public void getOpenMergeRequestsByTitleTest() {
        List<MergeRequest> result = manager.getMergeRequests(vf.createIRI(_Thing.title_IRI), false, false);
        assertEquals(2, result.size());
        Iterator<MergeRequest> it = result.iterator();
        assertEquals(request2.getResource(), it.next().getResource());
        assertEquals(request1.getResource(), it.next().getResource());
        verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

        result = manager.getMergeRequests(vf.createIRI(_Thing.title_IRI), true, false);
        assertEquals(2, result.size());
        it = result.iterator();
        assertEquals(request1.getResource(), it.next().getResource());
        assertEquals(request2.getResource(), it.next().getResource());
    }

    @Test
    public void getOpenMergeRequestsByIssuedTest() {
        List<MergeRequest> result = manager.getMergeRequests(vf.createIRI(_Thing.issued_IRI), false, false);
        assertEquals(2, result.size());
        Iterator<MergeRequest> it = result.iterator();
        assertEquals(request2.getResource(), it.next().getResource());
        assertEquals(request1.getResource(), it.next().getResource());
        verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

        result = manager.getMergeRequests(vf.createIRI(_Thing.title_IRI), true, false);
        assertEquals(2, result.size());
        it = result.iterator();
        assertEquals(request1.getResource(), it.next().getResource());
        assertEquals(request2.getResource(), it.next().getResource());
    }

    @Test
    public void getAcceptedMergeRequestsTest() {
        List<MergeRequest> result = manager.getMergeRequests(vf.createIRI(_Thing.title_IRI), false, true);
        assertEquals(1, result.size());
        assertEquals(request4.getResource(), result.iterator().next().getResource());
        verify(utilsService).getExpectedObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test(expected = IllegalStateException.class)
    public void getMergeRequestsWithNoRepoTest() {
        // Setup:
        when(catalogManager.getRepositoryId()).thenReturn("error");

        manager.getMergeRequests(vf.createIRI(_Thing.title_IRI), false, false);
    }

    /* createMergeRequest */

    @Test
    public void createMergeRequestTest() {
        // Setup:
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_IRI, SOURCE_BRANCH_IRI, TARGET_BRANCH_IRI, user)
                .description("description")
                .addAssignee(user)
                .build();

        MergeRequest result = manager.createMergeRequest(config);
        Optional<Value> title = result.getProperty(vf.createIRI(_Thing.title_IRI));
        assertTrue(title.isPresent());
        assertEquals("title", title.get().stringValue());
        Optional<Value> description = result.getProperty(vf.createIRI(_Thing.description_IRI));
        assertTrue(description.isPresent());
        assertEquals("description", description.get().stringValue());
        Optional<Resource> record = result.getOnRecord_resource();
        assertTrue(record.isPresent());
        assertEquals(RECORD_IRI, record.get());
        Optional<Resource> sourceBranch = result.getSourceBranch_resource();
        assertTrue(sourceBranch.isPresent());
        assertEquals(SOURCE_BRANCH_IRI, sourceBranch.get());
        Optional<Resource> targetBranch = result.getTargetBranch_resource();
        assertTrue(targetBranch.isPresent());
        assertEquals(TARGET_BRANCH_IRI, targetBranch.get());
        Optional<Value> creator = result.getProperty(vf.createIRI(_Thing.creator_IRI));
        assertTrue(creator.isPresent());
        assertEquals(user.getResource().stringValue(), creator.get().stringValue());
        assertEquals(1, result.getAssignee_resource().size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void createMergeRequestWithInvalidBranchTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(utilsService).validateBranch(eq(LOCAL_CATALOG_IRI), eq(RECORD_IRI), eq(SOURCE_BRANCH_IRI), any(RepositoryConnection.class));
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_IRI, SOURCE_BRANCH_IRI, TARGET_BRANCH_IRI, user).build();

        manager.createMergeRequest(config);
    }

    @Test(expected = IllegalStateException.class)
    public void createMergeRequestWithNoRepoTest() {
        // Setup:
        when(catalogManager.getRepositoryId()).thenReturn("error");
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_IRI, SOURCE_BRANCH_IRI, TARGET_BRANCH_IRI, user).build();

        manager.createMergeRequest(config);
    }

    /* addMergeRequest */

    @Test
    public void addMergeRequestTest() {
        manager.addMergeRequest(request3);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.containsContext(request3.getResource()));
            assertTrue(conn.contains(request3.getResource(), null, null, request3.getResource()));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void addMergeRequestThatAlreadyExistsTest() {
        manager.addMergeRequest(request1);
    }

    @Test(expected = IllegalStateException.class)
    public void addMergeRequestWithNoRepoTest() {
        // Setup:
        when(catalogManager.getRepositoryId()).thenReturn("error");

        manager.addMergeRequest(request3);
    }

    /* getMergeRequest */

    @Test
    public void getMergeRequestTest() {
        Optional<MergeRequest> result = manager.getMergeRequest(request1.getResource());
        assertTrue(result.isPresent());
        assertEquals(request1.getModel(), result.get().getModel());
    }

    @Test
    public void getMergeRequestThatDoesNotExistTest() {
        Optional<MergeRequest> result = manager.getMergeRequest(request3.getResource());
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void getMergeRequestWithNoRepoTest() {
        // Setup:
        when(catalogManager.getRepositoryId()).thenReturn("error");

        manager.getMergeRequest(request1.getResource());
    }

    /* updateMergeRequest */

    @Test
    public void updateMergeRequestTest() {
        MergeRequest request1Update = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/test/merge-requests#1"));
        manager.updateMergeRequest(request1Update.getResource(), request1Update);
        verify(utilsService).validateResource(eq(request1Update.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(request1Update), any(RepositoryConnection.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void updateMergeRequestDoesNotExistTest() {
        manager.updateMergeRequest(request3.getResource(), request3);
        verify(utilsService).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(request3), any(RepositoryConnection.class));
    }

    /* deleteMergeRequest */

    @Test
    public void deleteMergeRequestTest() throws Exception {
        manager.deleteMergeRequest(request1.getResource());
        verify(utilsService).validateResource(eq(request1.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(request1.getResource()), any(RepositoryConnection.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteMergeRequestDoesNotExistTest() throws Exception {
        manager.deleteMergeRequest(request3.getResource());
        verify(utilsService).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
    }
}

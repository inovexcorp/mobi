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
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DateValueConverter;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
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

import java.util.Optional;
import java.util.Set;

public class SimpleMergeRequestManagerTest {
    private Repository repo;
    private SimpleMergeRequestManager manager;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private MergeRequestFactory mergeRequestFactory = new MergeRequestFactory();
    private UserFactory userFactory = new UserFactory();
    private VersionedRDFRecordFactory versionedRDFRecordFactory = new VersionedRDFRecordFactory();
    private BranchFactory branchFactory = new BranchFactory();

    private MergeRequest request1;
    private MergeRequest request2;
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
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        mergeRequestFactory.setModelFactory(mf);
        mergeRequestFactory.setValueFactory(vf);
        mergeRequestFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(mergeRequestFactory);

        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(userFactory);

        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(versionedRDFRecordFactory);

        branchFactory.setModelFactory(mf);
        branchFactory.setValueFactory(vf);
        branchFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(branchFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());
        vcr.registerValueConverter(new DateValueConverter());

        request1 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/test/merge-requests#1"));
        request2 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/test/merge-requests#2"));
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users#user"));

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(request1.getModel(), request1.getResource());
        }

        MockitoAnnotations.initMocks(this);
        when(catalogManager.getRepositoryId()).thenReturn("system");
        when(catalogManager.getLocalCatalogIRI()).thenReturn(LOCAL_CATALOG_IRI);

        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());
        when(repositoryManager.getRepository("system")).thenReturn(Optional.of(repo));

        when(utilsService.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(request1);
        when(utilsService.optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request1));
        when(utilsService.optObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(utilsService.throwAlreadyExists(any(Resource.class), any(OrmFactory.class))).thenReturn(new IllegalArgumentException());
        doThrow(new IllegalArgumentException()).when(utilsService).validateResource(eq(request2.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));

        manager = new SimpleMergeRequestManager();
        manager.setVf(vf);
        manager.setCatalogManager(catalogManager);
        manager.setCatalogUtils(utilsService);
        manager.setMergeRequestFactory(mergeRequestFactory);
        manager.setRecordFactory(versionedRDFRecordFactory);
        manager.setBranchFactory(branchFactory);
        manager.setRepositoryManager(repositoryManager);
    }

    /* getMergeRequests */

    @Test
    public void getMergeRequestsTest() throws Exception {
        Set<MergeRequest> result = manager.getMergeRequests();
        assertEquals(1, result.size());
        assertEquals(request1.getResource(), result.iterator().next().getResource());
    }

    @Test(expected = IllegalStateException.class)
    public void getMergeRequestsWithNoRepoTest() throws Exception {
        // Setup:
        when(catalogManager.getRepositoryId()).thenReturn("error");

        manager.getMergeRequests();
    }

    /* createMergeRequest */

    @Test
    public void createMergeRequestTest() throws Exception {
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
    public void createMergeRequestWithInvalidBranchTest() throws Exception {
        // Setup:
        doThrow(new IllegalArgumentException()).when(utilsService).validateBranch(eq(LOCAL_CATALOG_IRI), eq(RECORD_IRI), eq(SOURCE_BRANCH_IRI), any(RepositoryConnection.class));
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_IRI, SOURCE_BRANCH_IRI, TARGET_BRANCH_IRI, user).build();

        manager.createMergeRequest(config);
    }

    @Test(expected = IllegalStateException.class)
    public void createMergeRequestWithNoRepoTest() throws Exception {
        // Setup:
        when(catalogManager.getRepositoryId()).thenReturn("error");
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_IRI, SOURCE_BRANCH_IRI, TARGET_BRANCH_IRI, user).build();

        manager.createMergeRequest(config);
    }

    /* addMergeRequest */

    @Test
    public void addMergeRequestTest() throws Exception {
        manager.addMergeRequest(request2);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.containsContext(request2.getResource()));
            assertTrue(conn.contains(request2.getResource(), null, null, request2.getResource()));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void addMergeRequestThatAlreadyExistsTest() throws Exception {
        manager.addMergeRequest(request1);
    }

    @Test(expected = IllegalStateException.class)
    public void addMergeRequestWithNoRepoTest() throws Exception {
        // Setup:
        when(catalogManager.getRepositoryId()).thenReturn("error");

        manager.addMergeRequest(request2);
    }

    /* getMergeRequest */

    @Test
    public void getMergeRequestTest() throws Exception {
        Optional<MergeRequest> result = manager.getMergeRequest(request1.getResource());
        assertTrue(result.isPresent());
        assertEquals(request1.getModel(), result.get().getModel());
    }

    @Test
    public void getMergeRequestThatDoesNotExistTest() throws Exception {
        Optional<MergeRequest> result = manager.getMergeRequest(request2.getResource());
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void getMergeRequestWithNoRepoTest() throws Exception {
        // Setup:
        when(catalogManager.getRepositoryId()).thenReturn("error");

        manager.getMergeRequest(request1.getResource());
    }

    /* updateMergeRequest */

    @Test
    public void updateMergeRequestTest() throws Exception {
        MergeRequest request1Update = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/test/merge-requests#1"));
        manager.updateMergeRequest(request1Update.getResource(), request1Update);
        verify(utilsService).validateResource(eq(request1Update.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(request1Update), any(RepositoryConnection.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void updateMergeRequestDoesNotExistTest() throws Exception {
        manager.updateMergeRequest(request2.getResource(), request2);
        verify(utilsService).validateResource(eq(request2.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(request2), any(RepositoryConnection.class));
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
        manager.deleteMergeRequest(request2.getResource());
        verify(utilsService).validateResource(eq(request2.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
    }
}

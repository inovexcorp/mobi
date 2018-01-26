package com.mobi.catalog.impl.versioning;

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

import static junit.framework.TestCase.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.RepositoryConnection;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class BaseVersioningServiceTest extends OrmEnabledTestCase {
    private SimpleVersioningService service;
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

    private User user;
    private VersionedRDFRecord record;
    private Branch branch;
    private Commit commit;
    private InProgressCommit inProgressCommit;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private CatalogUtilsService catalogUtils;

    @Mock
    private RepositoryConnection conn;

    @Before
    public void setUp() {
        OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#user"));
        record = versionedRDFRecordFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#record"));
        branch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#branch"));
        commit = commitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#commit"));
        branch.setHead(commit);
        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#in-progress-commit"));

        MockitoAnnotations.initMocks(this);

        when(catalogUtils.getBranch(any(VersionedRDFRecord.class), any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(branch);
        when(catalogUtils.getInProgressCommit(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        when(catalogUtils.getObject(any(Resource.class), eq(commitFactory), any(RepositoryConnection.class))).thenReturn(commit);
        when(catalogManager.createCommit(any(InProgressCommit.class), anyString(), any(Commit.class), any(Commit.class))).thenReturn(commit);
        when(catalogManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);

        service = new SimpleVersioningService();
        injectOrmFactoryReferencesIntoService(service);
        service.setCatalogManager(catalogManager);
        service.setCatalogUtils(catalogUtils);
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(VersionedRDFRecord.TYPE, service.getTypeIRI());
    }

    @Test
    public void getSourceBranchTest() throws Exception {
        assertEquals(branch, service.getSourceBranch(record, branch.getResource(), conn));
        verify(catalogUtils).getBranch(record, branch.getResource(), branchFactory, conn);
    }

    @Test
    public void getTargetBranchTest() throws Exception {
        assertEquals(branch, service.getTargetBranch(record, branch.getResource(), conn));
        verify(catalogUtils).getBranch(record, branch.getResource(), branchFactory, conn);
    }

    @Test
    public void getInProgressCommitTest() throws Exception {
        assertEquals(inProgressCommit, service.getInProgressCommit(record.getResource(), user, conn));
        verify(catalogUtils).getInProgressCommit(record.getResource(), user.getResource(), conn);
    }

    @Test
    public void getBranchHeadCommitTest() throws Exception {
        assertEquals(commit, service.getBranchHeadCommit(branch, conn));
        verify(catalogUtils).getObject(commit.getResource(), commitFactory, conn);
    }

    @Test
    public void getBranchHeadCommitNotSetTest() throws Exception {
        assertEquals(null, service.getBranchHeadCommit(branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/#new-branch")), conn));
        verify(catalogUtils, times(0)).getObject(commit.getResource(), commitFactory, conn);
    }

    @Test
    public void removeInProgressCommitTest() throws Exception {
        service.removeInProgressCommit(inProgressCommit, conn);
        verify(catalogUtils).removeInProgressCommit(inProgressCommit, conn);
    }

    @Test
    public void createCommitTest() throws Exception {
        assertEquals(commit, service.createCommit(inProgressCommit, "Message", commit, null));
        verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
    }

    @Test
    public void addCommitWithChangesTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        assertEquals(commit.getResource(), service.addCommit(branch, user, "Message", additions, deletions, commit, null, conn));
        verify(catalogManager).createInProgressCommit(user);
        verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
        verify(catalogUtils).updateCommit(commit, additions, deletions, conn);
        verify(catalogUtils).addCommit(branch, commit, conn);
    }

    @Test
    public void addCommitWithCommitTest() throws Exception {
        service.addCommit(branch, commit, conn);
        verify(catalogUtils).addCommit(branch, commit, conn);
    }
}

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
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommitFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.junit.Before;
import org.junit.Test;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
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
import com.mobi.repository.api.RepositoryConnection;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class BaseVersioningServiceTest {
    private SimpleVersioningService service;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private VersionedRDFRecordFactory versionedRDFRecordFactory = new VersionedRDFRecordFactory();
    private BranchFactory branchFactory = new BranchFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private InProgressCommitFactory inProgressCommitFactory = new InProgressCommitFactory();
    private UserFactory userFactory = new UserFactory();

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
        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(versionedRDFRecordFactory);

        branchFactory.setModelFactory(mf);
        branchFactory.setValueFactory(vf);
        branchFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(branchFactory);

        commitFactory.setModelFactory(mf);
        commitFactory.setValueFactory(vf);
        commitFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(commitFactory);

        inProgressCommitFactory.setModelFactory(mf);
        inProgressCommitFactory.setValueFactory(vf);
        inProgressCommitFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(inProgressCommitFactory);

        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(userFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        user = userFactory.createNew(vf.createIRI("http://test.com#user"));
        record = versionedRDFRecordFactory.createNew(vf.createIRI("http://test.com#record"));
        branch = branchFactory.createNew(vf.createIRI("http://test.com#branch"));
        commit = commitFactory.createNew(vf.createIRI("http://test.com#commit"));
        branch.setHead(commit);
        inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("http://test.com#in-progress-commit"));

        MockitoAnnotations.initMocks(this);

        when(catalogUtils.getBranch(any(VersionedRDFRecord.class), any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(branch);
        when(catalogUtils.getInProgressCommit(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        when(catalogUtils.getObject(any(Resource.class), eq(commitFactory), any(RepositoryConnection.class))).thenReturn(commit);
        when(catalogManager.createCommit(any(InProgressCommit.class), anyString(), any(Commit.class), any(Commit.class))).thenReturn(commit);
        when(catalogManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);

        service = new SimpleVersioningService();
        service.setBranchFactory(branchFactory);
        service.setCommitFactory(commitFactory);
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
        assertEquals(null, service.getBranchHeadCommit(branchFactory.createNew(vf.createIRI("http://test.com/#new-branch")), conn));
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
        Model additions = mf.createModel();
        Model deletions = mf.createModel();

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

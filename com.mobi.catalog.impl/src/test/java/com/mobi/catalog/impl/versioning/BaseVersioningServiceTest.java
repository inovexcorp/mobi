package com.mobi.catalog.impl.versioning;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Agent;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

import java.util.Collections;

public class BaseVersioningServiceTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleVersioningService service;
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<Agent> agentFactory = getRequiredOrmFactory(Agent.class);

    private User user;
    private VersionedRDFRecord record;
    private Branch branch;
    private Commit commit;
    private InProgressCommit inProgressCommit;

    @Mock
    private ThingManager thingManager;

    @Mock
    private BranchManager branchManager;

    @Mock
    private CommitManager commitManager;

    @Mock
    private RepositoryConnection conn;

    @Mock
    private EventAdmin eventAdmin;

    @Mock
    private BundleContext context;

    @Mock
    private ServiceReference<EventAdmin> serviceReference;

    @Before
    public void setUp() {
        OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#user"));
        record = versionedRDFRecordFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#record"));
        branch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#branch"));
        record.setMasterBranch(branch);
        commit = commitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#commit"));
        commit.setWasAssociatedWith(Collections.singleton(agentFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#user"))));
        branch.setHead(commit);
        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#in-progress-commit"));

        closeable = MockitoAnnotations.openMocks(this);

        when(branchManager.getBranch(any(VersionedRDFRecord.class), any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        when(thingManager.getObject(any(Resource.class), eq(commitFactory), any(RepositoryConnection.class))).thenReturn(commit);
        when(commitManager.createCommit(any(InProgressCommit.class), anyString(), any(), any())).thenReturn(commit);
        when(commitManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);

        when(context.getServiceReference(EventAdmin.class)).thenReturn(serviceReference);
        when(context.getService(serviceReference)).thenReturn(eventAdmin);

        service = new SimpleVersioningService();
        injectOrmFactoryReferencesIntoService(service);
        service.commitManager = commitManager;
        service.thingManager = thingManager;
        service.branchManager = branchManager;
        service.start(context);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(VersionedRDFRecord.TYPE, service.getTypeIRI());
    }

    @Test
    public void addCommitWithChangesTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        assertEquals(commit.getResource(), service.addCommit(record, branch, user, "Message", additions, deletions, commit, null, conn));
        verify(commitManager).createInProgressCommit(user);
        verify(commitManager).createCommit(inProgressCommit, "Message", commit, null);
        verify(commitManager).updateCommit(commit, additions, deletions, conn);
        verify(commitManager).addCommit(branch, commit, conn);
        verify(eventAdmin).postEvent(any(Event.class));
    }

    @Test
    public void addCommitWithCommitTest() throws Exception {
        service.addCommit(record, branch, commit, conn);
        verify(commitManager).addCommit(branch, commit, conn);
        verify(eventAdmin).postEvent(any(Event.class));
    }
}

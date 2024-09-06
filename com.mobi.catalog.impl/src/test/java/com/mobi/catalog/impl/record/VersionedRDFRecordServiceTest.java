package com.mobi.catalog.impl.record;

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
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RevisionManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.record.config.VersionedRDFRecordExportSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.catalog.impl.ManagerTestConstants;
import com.mobi.catalog.impl.SimpleBranchManager;
import com.mobi.catalog.impl.SimpleRecordManager;
import com.mobi.catalog.impl.SimpleRevisionManager;
import com.mobi.catalog.impl.SimpleThingManager;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import junit.framework.Assert;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class VersionedRDFRecordServiceTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private final IRI testIRI = VALUE_FACTORY.createIRI("urn:test");
    private final IRI catalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
    private final IRI commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");
    private final IRI additionsIRI = VALUE_FACTORY.createIRI("http://example.org/additions1");
    private final IRI deletionsIRI = VALUE_FACTORY.createIRI("http://example.org/deletions1");
    private final IRI inProgressCommitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/inProgressCommits#commit");
    private final IRI tagIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#tag");
    private final IRI distributionIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#distribution");
    private final IRI masterBranchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#master");
    private final IRI recordPolicyIRI = VALUE_FACTORY.createIRI("http://mobi.com/policies/record/encoded-record-policy");
    private static final IRI BRANCH_CATALOG_IRI = VALUE_FACTORY.createIRI(VersionedRDFRecord.branch_IRI);
    private static final IRI HEAD_CATALOG_IRI = VALUE_FACTORY.createIRI(Branch.head_IRI);
    private static final IRI COMMIT_CATALOG_IRI = VALUE_FACTORY.createIRI(Commit.TYPE);
    private static final IRI VERSION_CATALOG_IRI = VALUE_FACTORY.createIRI(VersionedRecord.version_IRI);
    private static final IRI ADDITIONS_CATALOG_IRI = VALUE_FACTORY.createIRI(Revision.additions_IRI);
    private static final IRI DELETIONS_CATALOG_IRI = VALUE_FACTORY.createIRI(Revision.deletions_IRI);
    private static final IRI LATEST_TAG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#latest-tag");

    private SimpleVersionedRDFRecordService recordService;
    private VersionedRDFRecord testRecord;
    private Branch branch;
    private Commit headCommit;
    private Difference difference;
    private User user;
    private DeleteActivity deleteActivity;
    private Tag tag;
    private MemoryRepositoryWrapper repository;

    private OrmFactory<VersionedRDFRecord> recordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<MasterBranch> masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<Tag> tagFactory = getRequiredOrmFactory(Tag.class);
    private OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private VersioningManager versioningManager;

    @Mock
    private ThingManager thingManager;

    @Mock
    private BranchManager branchManager;

    @Mock
    private CommitManager commitManager;

    @Mock
    private VersionManager versionManager;

    @Mock
    private DifferenceManager differenceManager;

    @Mock
    private InProgressCommit inProgressCommit;

    @Mock
    private CatalogProvUtils provUtils;

    @Mock
    private MergeRequestManager mergeRequestManager;

    @Mock
    private XACMLPolicyManager xacmlPolicyManager;

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    RevisionManager revisionManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private CreateActivity createActivity;

    @Before
    public void setUp() throws Exception {
        System.setProperty("karaf.etc", VersionedRDFRecordServiceTest.class.getResource("/").getPath());
        recordService = new SimpleVersionedRDFRecordService();
        repository = new MemoryRepositoryWrapper();
        repository.setDelegate(new SailRepository(new MemoryStore()));

        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));
        headCommit = commitFactory.createNew(commitIRI);
        branch = branchFactory.createNew(branchIRI);
        branch.setHead(headCommit);
        branch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));

        Model deletions = MODEL_FACTORY.createEmptyModel();
        deletions.add(VALUE_FACTORY.createIRI("http://test.com#sub"), VALUE_FACTORY.createIRI(_Thing.description_IRI),
                VALUE_FACTORY.createLiteral("Description"), deletionsIRI);

        difference = new Difference.Builder()
                .additions(MODEL_FACTORY.createEmptyModel())
                .deletions(deletions)
                .build();

        tag = tagFactory.createNew(tagIRI);
        tag.setVersionedDistribution(Collections.singleton(distributionFactory.createNew(distributionIRI)));

        testRecord = recordFactory.createNew(testIRI);
        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        testRecord.setCatalog(catalogFactory.createNew(catalogId));
        testRecord.setBranch(Collections.singleton(branch));
        testRecord.setVersion(Collections.singleton(tag));
        testRecord.setLatestVersion(tag);
        testRecord.setBranch(Collections.singleton(branch));
        testRecord.setMasterBranch(masterBranchFactory.createNew(masterBranchIRI));

        closeable = MockitoAnnotations.openMocks(this);
        when(versioningManager.commit(any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), anyString(), any(RepositoryConnection.class))).thenReturn(commitIRI);
        when(thingManager.optObject(any(IRI.class), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.of(testRecord));
        when(branchManager.getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommitIRI(eq(branch))).thenReturn(commitIRI);
        Revision rev = mock(Revision.class);
        when(revisionManager.getRevision(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(rev);
        when(rev.getAdditions()).thenReturn(Optional.of(additionsIRI));
        when(rev.getDeletions()).thenReturn(Optional.of(deletionsIRI));
        doReturn(Stream.of(commitIRI).collect(Collectors.toList()))
                .when(commitManager).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        when(thingManager.getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(headCommit);
        when(differenceManager.getCommitDifference(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(difference);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
        when(provUtils.startCreateActivity(any())).thenReturn(createActivity);
        doNothing().when(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        when(xacmlPolicyManager.addPolicy(any(XACMLPolicy.class))).thenReturn(recordPolicyIRI);
        when(configProvider.getRepository()).thenReturn(repository);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        // InProgressCommit deletion setup
        when(commitManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        doNothing().when(commitManager).removeInProgressCommit(any(InProgressCommit.class), any(RepositoryConnection.class));

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.versioningManager = versioningManager;
        recordService.provUtils = provUtils;
        recordService.mergeRequestManager = mergeRequestManager;
        recordService.xacmlPolicyManager = xacmlPolicyManager;
        recordService.engineManager = engineManager;
        recordService.configProvider = configProvider;
        recordService.recordFactory = recordService.versionedRDFRecordFactory;
        recordService.thingManager = thingManager;
        recordService.branchManager = branchManager;
        recordService.commitManager = commitManager;
        recordService.differenceManager = differenceManager;
        recordService.versionManager = versionManager;
        recordService.revisionManager = revisionManager;
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.clear();
        }
    }

    /* activate() */

    @Test
    public void activateUserPresentTest() throws Exception {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testRecord.getModel(), testRecord.getResource());
            connection.add(testRecord.getResource(), DCTERMS.PUBLISHER, VALUE_FACTORY.createIRI("urn:user"));
        }

        User user = userFactory.createNew(VALUE_FACTORY.createIRI("urn:user"));
        when(engineManager.getUsername(any(IRI.class))).thenReturn(Optional.of("user"));
        when(engineManager.retrieveUser(eq("user"))).thenReturn(Optional.of(user));

        recordService.activate();
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void activateUserNotPresentTest() throws Exception {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testRecord.getModel(), testRecord.getResource());
            connection.add(testRecord.getResource(), DCTERMS.PUBLISHER, VALUE_FACTORY.createIRI("urn:user"));
        }

        User user = userFactory.createNew(VALUE_FACTORY.createIRI("urn:admin"));
        when(engineManager.getUsername(any(IRI.class))).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(eq("admin"))).thenReturn(Optional.of(user));

        recordService.activate();
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
    }

    /* create() */

    @Test
    public void createRecordTest() throws Exception {
        Revision revision = mock(Revision.class);
        when(revision.getAdditions()).thenReturn(Optional.of(getValueFactory().createIRI("http://revision/add")));
        when(revision.getDeletions()).thenReturn(Optional.of(getValueFactory().createIRI("http://revision/del")));
        when(revision.getModel()).thenReturn(MODEL_FACTORY.createEmptyModel());
        when(revisionManager.createRevision(any())).thenReturn(revision);
        when(revisionManager.getGeneratedRevision(any(Commit.class))).thenReturn(revision);
        Commit initialCommit = commitFactory.createNew(commitIRI);
        IRI initialCommitIri = getValueFactory().createIRI("http://mobi.com/commit#initial");
        when(versioningManager.commit(eq(catalogId), any(Resource.class), any(Resource.class), eq(user), eq("The initial commit."), any(RepositoryConnection.class))).thenReturn(initialCommitIri);
        when(commitManager.getCommit(eq(initialCommitIri), any(RepositoryConnection.class))).thenReturn(Optional.of(initialCommit));

        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, new LinkedHashModel());

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }

        verify(thingManager, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user), eq("The initial commit."), any(RepositoryConnection.class));
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test
    public void createRecordWithoutCatalogID() throws Exception {
        thrown.expect(IllegalArgumentException.class);
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestDescription");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }
        verify(provUtils).removeActivity(any(CreateActivity.class));
    }

    @Test
    public void createRecordWithoutPublisher() throws Exception {
        thrown.expect(IllegalArgumentException.class);
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestDescription");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }
        verify(provUtils).removeActivity(any(CreateActivity.class));
    }

    @Test
    public void createRecordWithoutTitle() throws Exception {
        thrown.expect(IllegalArgumentException.class);
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }
        verify(provUtils).removeActivity(any(CreateActivity.class));
    }

    /* delete() */

    @Test
    public void deleteTest() throws Exception {
        VersionedRDFRecord deletedRecord;
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testRecord.getModel(), testRecord.getResource());
            connection.add(branch.getModel(), branch.getResource());
            connection.add(headCommit.getModel(), headCommit.getResource());
            connection.add(inProgressCommitIRI, VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI), testRecord.getResource());
            deletedRecord = recordService.delete(testIRI, user, connection);

            assertEquals(testRecord, deletedRecord);
            Assert.assertFalse(ConnectionUtils.containsContext(connection, branch.getResource()));
            Assert.assertFalse(ConnectionUtils.containsContext(connection, commitIRI));
        }
        assertEquals(testRecord, deletedRecord);
        verify(thingManager).optObject(eq(testIRI), eq(recordFactory), any(RepositoryConnection.class));
        verify(provUtils).startDeleteActivity(eq(user), eq(testIRI));
        verify(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        verify(versionManager).removeVersion(eq(testRecord.getResource()), any(Resource.class), any(RepositoryConnection.class));
        verify(provUtils).endDeleteActivity(any(DeleteActivity.class), any(Record.class));
        verify(commitManager).getInProgressCommit(eq(catalogId), eq(testIRI), eq(inProgressCommitIRI), any(RepositoryConnection.class));
        verify(commitManager).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() throws Exception {
        when(thingManager.optObject(eq(testIRI), eq(recordFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.delete(testIRI, user, connection);
        }
        verify(thingManager).optObject(eq(testIRI), eq(recordFactory), any(RepositoryConnection.class));
    }

    @Test
    public void deleteRecordRemoveFails() throws Exception {
        doThrow(RepositoryException.class).when(thingManager).removeObject(any(VersionedRDFRecord.class), any(RepositoryConnection.class));
        thrown.expect(RepositoryException.class);

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.delete(testIRI, user, connection);
        }
        verify(provUtils).removeActivity(any(DeleteActivity.class));
    }

    /* export() */

    @Test
    public void exportUsingBatchExporterTest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        BatchExporter exporter =  new BatchExporter(new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
        RecordOperationConfig config = new OperationConfig();

        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);

        assertFalse(exporter.isActive());
        exporter.startRDF();
        assertTrue(exporter.isActive());

        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(difference.getDeletions());
            recordService.export(testIRI, config, connection);
        }
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Rio.parse((IOUtils.toInputStream(os.toString(), StandardCharsets.UTF_8)), "", RDFFormat.JSONLD);
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertTrue(outputModel.containsAll(branch.getModel()));
        assertTrue(outputModel.containsAll(difference.getAdditions()));
        assertTrue(outputModel.containsAll(difference.getDeletions()));

        verify(thingManager).optObject(eq(testIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(commitManager).getHeadCommitIRI(eq(branch));
        verify(commitManager).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(thingManager).getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class));
    }

    @Test
    public void exportRecordOnlyTest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        BatchExporter exporter =  new BatchExporter(new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
        RecordOperationConfig config = new OperationConfig();

        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
        config.set(VersionedRDFRecordExportSettings.WRITE_VERSIONED_DATA, false);

        assertFalse(exporter.isActive());
        exporter.startRDF();
        assertTrue(exporter.isActive());
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(difference.getDeletions());
            recordService.export(testIRI, config, connection);
        }
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Rio.parse((IOUtils.toInputStream(os.toString(), StandardCharsets.UTF_8)), "", RDFFormat.JSONLD);
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertFalse(outputModel.containsAll(branch.getModel()));
        assertFalse(outputModel.containsAll(difference.getDeletions()));

        verify(thingManager).optObject(eq(testIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(branchManager, never()).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(commitManager, never()).getHeadCommitIRI(eq(branch));
        verify(commitManager, never()).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(thingManager, never()).getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(differenceManager, never()).getCommitDifference(eq(commitIRI), any(RepositoryConnection.class));
    }

    @Test
    public void exportSpecificBranch() throws Exception {
        Branch doNotWriteBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch2"));
        doNotWriteBranch.setHead(headCommit);
        doNotWriteBranch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        testRecord.addBranch(doNotWriteBranch);

        Set<Resource> branchesToExport = new HashSet<>();
        branchesToExport.add(branchIRI);

        ByteArrayOutputStream os = new ByteArrayOutputStream();
        BatchExporter exporter =  new BatchExporter(new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
        RecordOperationConfig config = new OperationConfig();

        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
        config.set(VersionedRDFRecordExportSettings.BRANCHES_TO_EXPORT, branchesToExport);

        assertFalse(exporter.isActive());
        exporter.startRDF();
        assertTrue(exporter.isActive());
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(difference.getDeletions());
            recordService.export(testIRI, config, connection);
        }
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Rio.parse((IOUtils.toInputStream(os.toString(), StandardCharsets.UTF_8)), "", RDFFormat.JSONLD);
        testRecord.removeBranch(doNotWriteBranch);
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertTrue(outputModel.containsAll(branch.getModel()));
        assertFalse(outputModel.containsAll(doNotWriteBranch.getModel()));
        assertTrue(outputModel.containsAll(difference.getDeletions()));

        verify(thingManager).optObject(eq(testIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(commitManager).getHeadCommitIRI(eq(branch));
        verify(commitManager).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(thingManager).getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void exportNullBatchExporterTest() throws Exception {
        BatchExporter exporter =  null;
        RecordOperationConfig config = new OperationConfig();

        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(difference.getDeletions());
            recordService.export(testIRI, config, connection);
        }
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(VersionedRDFRecord.TYPE, recordService.getTypeIRI());
    }

    @Test
    public void deleteBranchTest() throws Exception {
        // Setup:
        Resource commitIdToRemove = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "commitA1");
        IRI additionsToRemove = VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + "commitA1");
        IRI deletionsToRemove = VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + "commitA1");
        IRI revisionToRemove = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "commitA1");

        Resource commitIdToKeep = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "commitA0");
        IRI additionsToKeep = VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + "commitA0");
        IRI deletionsToKeep = VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + "commitA0");
        IRI revisionToKeep = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "commitA0");

        try (RepositoryConnection conn = repository.getConnection()) {
            setUpDeleteBranchTest(conn);

            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_TAG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, HEAD_CATALOG_IRI, commitIdToRemove, ManagerTestConstants.BRANCH_IRI));
            assertTrue(ConnectionUtils.contains(conn, commitIdToRemove, RDF.TYPE, COMMIT_CATALOG_IRI, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, commitIdToKeep, RDF.TYPE, COMMIT_CATALOG_IRI, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, ADDITIONS_CATALOG_IRI, additionsToKeep, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, DELETIONS_CATALOG_IRI, deletionsToKeep, commitIdToKeep));

            Optional<List<Resource>> deletedCommits = recordService.deleteBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, conn);

            assertTrue(deletedCommits.isPresent());
            assertEquals(1, deletedCommits.get().size());
            assertEquals(commitIdToRemove, deletedCommits.get().get(0));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_TAG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, HEAD_CATALOG_IRI, commitIdToRemove, ManagerTestConstants.BRANCH_IRI));
            assertFalse(ConnectionUtils.contains(conn, commitIdToRemove, RDF.TYPE, COMMIT_CATALOG_IRI, commitIdToRemove));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commitIdToRemove));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, commitIdToKeep, RDF.TYPE, COMMIT_CATALOG_IRI, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, ADDITIONS_CATALOG_IRI, additionsToKeep, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, DELETIONS_CATALOG_IRI, deletionsToKeep, commitIdToKeep));
        }
    }

    @Test
    public void deleteBranchWithDeletedCommitListTest() throws Exception {
        // Setup:
        Resource commitIdToRemove = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "commitA1");
        IRI additionsToRemove = VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + "commitA1");
        IRI deletionsToRemove = VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + "commitA1");
        IRI revisionToRemove = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "commitA1");

        Resource commitIdToKeep = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "commitA0");
        IRI additionsToKeep = VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + "commitA0");
        IRI deletionsToKeep = VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + "commitA0");
        IRI revisionToKeep = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "commitA0");

        try (RepositoryConnection conn = repository.getConnection()) {
            setUpDeleteBranchTest(conn);

            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_TAG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, HEAD_CATALOG_IRI, commitIdToRemove, ManagerTestConstants.BRANCH_IRI));
            assertTrue(ConnectionUtils.contains(conn, commitIdToRemove, RDF.TYPE, COMMIT_CATALOG_IRI, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, commitIdToKeep, RDF.TYPE, COMMIT_CATALOG_IRI, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, ADDITIONS_CATALOG_IRI, additionsToKeep, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, DELETIONS_CATALOG_IRI, deletionsToKeep, commitIdToKeep));

            Optional<List<Resource>> deletedCommits = recordService.deleteBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, conn);

            assertTrue(deletedCommits.isPresent());
            assertEquals(1, deletedCommits.get().size());
            assertEquals(commitIdToRemove, deletedCommits.get().get(0));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_TAG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, HEAD_CATALOG_IRI, commitIdToRemove, ManagerTestConstants.BRANCH_IRI));
            assertFalse(ConnectionUtils.contains(conn, commitIdToRemove, RDF.TYPE, COMMIT_CATALOG_IRI, commitIdToRemove));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commitIdToRemove));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, commitIdToKeep, RDF.TYPE, COMMIT_CATALOG_IRI, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, ADDITIONS_CATALOG_IRI, additionsToKeep, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, DELETIONS_CATALOG_IRI, deletionsToKeep, commitIdToKeep));
        }
    }

    @Test
    public void deleteBranchCompleteTest() throws Exception {
        // Setup:
        Resource complexRecordIRI = VALUE_FACTORY.createIRI(ManagerTestConstants.RECORDS + "complex-record");
        Resource complexBranchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#complex-branch");
        Resource commitA = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "complex-a");
        IRI commitARevision = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "complex-a");
        IRI commitAAdditions = VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + "complex-a");
        IRI commitADeletions = VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + "complex-a");
        Resource commitB = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "complex-b");
        Resource commitC = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "complex-c");
        IRI commitCRevision = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "complex-c");
        IRI commitCAdditions = VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + "complex-c");
        IRI commitCDeletions = VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + "complex-c");
        Resource commitD = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "complex-d");

        try (RepositoryConnection conn = repository.getConnection()) {
            setUpDeleteBranchTest(conn);

            assertTrue(ConnectionUtils.contains(conn, complexRecordIRI, BRANCH_CATALOG_IRI, complexBranchIRI, complexRecordIRI));
            assertTrue(ConnectionUtils.contains(conn, commitA, RDF.TYPE, COMMIT_CATALOG_IRI, commitA));
            assertTrue(ConnectionUtils.contains(conn, commitARevision, ADDITIONS_CATALOG_IRI, commitAAdditions, commitA));
            assertTrue(ConnectionUtils.contains(conn, commitARevision, DELETIONS_CATALOG_IRI, commitADeletions, commitA));

            assertTrue(ConnectionUtils.contains(conn, commitC, RDF.TYPE, COMMIT_CATALOG_IRI, commitC));
            assertTrue(ConnectionUtils.contains(conn, commitCRevision, ADDITIONS_CATALOG_IRI, commitCAdditions, commitC));
            assertTrue(ConnectionUtils.contains(conn, commitCRevision, DELETIONS_CATALOG_IRI, commitCDeletions, commitC));

            assertTrue(ConnectionUtils.contains(conn, commitB, RDF.TYPE, COMMIT_CATALOG_IRI, commitB));
            assertTrue(ConnectionUtils.contains(conn, commitD, RDF.TYPE, COMMIT_CATALOG_IRI, commitD));

            Optional<List<Resource>> deletedCommits = recordService.deleteBranch(ManagerTestConstants.CATALOG_IRI, complexRecordIRI, complexBranchIRI, conn);

            assertTrue(deletedCommits.isPresent());
            assertEquals(2, deletedCommits.get().size());
            assertTrue(deletedCommits.get().contains(commitA));
            assertTrue(deletedCommits.get().contains(commitC));
            assertFalse(ConnectionUtils.contains(conn, complexRecordIRI, BRANCH_CATALOG_IRI, complexBranchIRI, complexRecordIRI));
            assertFalse(ConnectionUtils.contains(conn, commitA, RDF.TYPE, COMMIT_CATALOG_IRI, commitA));
            assertFalse(ConnectionUtils.contains(conn, commitARevision, ADDITIONS_CATALOG_IRI, commitAAdditions, commitA));
            assertFalse(ConnectionUtils.contains(conn, commitARevision, DELETIONS_CATALOG_IRI, commitADeletions, commitA));

            assertFalse(ConnectionUtils.contains(conn, commitC, RDF.TYPE, COMMIT_CATALOG_IRI, commitC));
            assertFalse(ConnectionUtils.contains(conn, commitCRevision, ADDITIONS_CATALOG_IRI, commitCAdditions, commitC));
            assertFalse(ConnectionUtils.contains(conn, commitCRevision, DELETIONS_CATALOG_IRI, commitCDeletions, commitC));

            assertTrue(ConnectionUtils.contains(conn, commitB, RDF.TYPE, COMMIT_CATALOG_IRI, commitB));
            assertTrue(ConnectionUtils.contains(conn, commitD, RDF.TYPE, COMMIT_CATALOG_IRI, commitD));
        }
    }

    @Test
    public void deleteBranchWithNoHeadTest() throws Exception {
        // Setup:
        IRI noHeadBranchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#no-head-branch");
        try (RepositoryConnection conn = repository.getConnection()) {
            setUpDeleteBranchTest(conn);

            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, noHeadBranchIRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));

            Optional<List<Resource>> deletedCommits = recordService.deleteBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, noHeadBranchIRI, conn);
            assertTrue(deletedCommits.isPresent());
            assertEquals(0, deletedCommits.get().size());
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, noHeadBranchIRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
        }
    }

    @Test
    public void deleteBranchWhenUserBranchExists() throws Exception {
        // Setup:
        IRI createdFromIRI = VALUE_FACTORY.createIRI(UserBranch.createdFrom_IRI);

        try (RepositoryConnection conn = repository.getConnection()) {
            setUpDeleteBranchTest(conn);

            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, null, null));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.USER_BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.USER_BRANCH_IRI, createdFromIRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.USER_BRANCH_IRI));

            Optional<List<Resource>> deletedCommits = recordService.deleteBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, conn);

            assertTrue(deletedCommits.isPresent());
            assertEquals(1, deletedCommits.get().size());
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, null, null));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.USER_BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.USER_BRANCH_IRI, createdFromIRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.USER_BRANCH_IRI));
            RepositoryResult<Statement> results = conn.getStatements(ManagerTestConstants.USER_BRANCH_IRI, createdFromIRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.USER_BRANCH_IRI);
            assertEquals(results.next().getObject(), ManagerTestConstants.BRANCH_IRI);
            results.close();
        }
    }

    @Test
    public void deleteBranchUserBranch() throws Exception {
        // Setup:
        IRI createdFromIRI = VALUE_FACTORY.createIRI(UserBranch.createdFrom_IRI);

        try (RepositoryConnection conn = repository.getConnection()) {
            setUpDeleteBranchTest(conn);

            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, null, null));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.USER_BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.USER_BRANCH_IRI, createdFromIRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.USER_BRANCH_IRI));

            Optional<List<Resource>> deletedCommits = recordService.deleteBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.USER_BRANCH_IRI, conn);

            assertTrue(deletedCommits.isPresent());
            assertEquals(0, deletedCommits.get().size());
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, null, null));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, ManagerTestConstants.USER_BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.USER_BRANCH_IRI, createdFromIRI, ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.USER_BRANCH_IRI));
        }
    }

    private void setUpDeleteBranchTest(RepositoryConnection conn) throws Exception {
        conn.clear();
        InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
        conn.add(Rio.parse(testData, "", RDFFormat.TRIG));

        SimpleThingManager thingManager = new SimpleThingManager();
        SimpleRecordManager recordManager =  new SimpleRecordManager();
        Field recordThingManager = SimpleRecordManager.class.getDeclaredField("thingManager");
        recordThingManager.setAccessible(true);
        recordThingManager.set(recordManager, thingManager);

        SimpleRevisionManager revisionManager = new SimpleRevisionManager();
        Field revisionThingManager = SimpleRevisionManager.class.getDeclaredField("thingManager");
        revisionThingManager.setAccessible(true);
        revisionThingManager.set(revisionManager, thingManager);

        SimpleBranchManager branchManager = new SimpleBranchManager();
        Field branchThingManager = SimpleBranchManager.class.getDeclaredField("thingManager");
        branchThingManager.setAccessible(true);
        branchThingManager.set(branchManager, thingManager);

        injectOrmFactoryReferencesIntoService(thingManager);
        injectOrmFactoryReferencesIntoService(revisionManager);

        recordService.recordManager = recordManager;
        recordService.thingManager = thingManager;
        recordService.branchManager = branchManager;
        recordService.revisionManager = revisionManager;
    }
}

package com.mobi.catalog.impl.record;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordExportSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
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
    private final IRI inProgressCommitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/inProgressCommits#commit");
    private final IRI tagIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#tag");
    private final IRI distributionIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#distribution");
    private final IRI masterBranchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#master");
    private final IRI recordPolicyIRI = VALUE_FACTORY.createIRI("http://mobi.com/policies/record/encoded-record-policy");

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
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<Tag> tagFactory = getRequiredOrmFactory(Tag.class);
    private OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private VersioningManager versioningManager;

    @Mock
    private CatalogUtilsService utilsService;

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
                VALUE_FACTORY.createLiteral("Description"));

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
        testRecord.setMasterBranch(branchFactory.createNew(masterBranchIRI));

        closeable = MockitoAnnotations.openMocks(this);
        when(versioningManager.commit(any(IRI.class), any(IRI.class), any(IRI.class), eq(user), anyString(), any(Model.class), any(Model.class))).thenReturn(commitIRI);
        when(utilsService.optObject(any(IRI.class), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.of(testRecord));
        when(utilsService.getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(branch);
        when(utilsService.getHeadCommitIRI(eq(branch))).thenReturn(commitIRI);
        doReturn(Stream.of(commitIRI).collect(Collectors.toList()))
                .when(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        when(utilsService.getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(headCommit);
        when(utilsService.getRevisionChanges(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(difference);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
        when(provUtils.startCreateActivity(any())).thenReturn(createActivity);
        doNothing().when(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        when(xacmlPolicyManager.addPolicy(any(XACMLPolicy.class))).thenReturn(recordPolicyIRI);
        when(configProvider.getRepository()).thenReturn(repository);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        // InProgressCommit deletion setup
        when(utilsService.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        doNothing().when(utilsService).removeInProgressCommit(any(InProgressCommit.class), any(RepositoryConnection.class));


        injectOrmFactoryReferencesIntoService(recordService);
        recordService.versioningManager = versioningManager;
        recordService.utilsService = utilsService;
        recordService.provUtils = provUtils;
        recordService.mergeRequestManager = mergeRequestManager;
        recordService.xacmlPolicyManager = xacmlPolicyManager;
        recordService.engineManager = engineManager;
        recordService.configProvider = configProvider;
        recordService.recordFactory = recordService.versionedRDFRecordFactory;
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

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }

        verify(utilsService, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user),
                anyString(), any(), eq(null));
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
            connection.add(inProgressCommitIRI, VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI), testRecord.getResource());
            deletedRecord = recordService.delete(testIRI, user, connection);
        }
        assertEquals(testRecord, deletedRecord);
        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), any(RepositoryConnection.class));
        verify(provUtils).startDeleteActivity(eq(user), eq(testIRI));
        verify(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        verify(utilsService).removeVersion(eq(testRecord.getResource()), any(Resource.class), any(RepositoryConnection.class));
        verify(utilsService).removeBranch(eq(testRecord.getResource()), any(Resource.class), any(List.class), any(RepositoryConnection.class));
        verify(provUtils).endDeleteActivity(any(DeleteActivity.class), any(Record.class));
        verify(utilsService).getInProgressCommit(eq(catalogId), eq(testIRI), eq(inProgressCommitIRI), any(RepositoryConnection.class));
        verify(utilsService).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() throws Exception {
        when(utilsService.optObject(eq(testIRI), eq(recordFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.delete(testIRI, user, connection);
        }
        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), any(RepositoryConnection.class));
    }

    @Test
    public void deleteRecordRemoveFails() throws Exception {
        doThrow(RepositoryException.class).when(utilsService).removeObject(any(VersionedRDFRecord.class), any(RepositoryConnection.class));
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
            recordService.export(testIRI, config, connection);
        }
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Rio.parse((IOUtils.toInputStream(os.toString(), StandardCharsets.UTF_8)), "", RDFFormat.JSONLD);
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertTrue(outputModel.containsAll(branch.getModel()));
        assertTrue(outputModel.containsAll(difference.getAdditions()));
        assertTrue(outputModel.containsAll(difference.getDeletions()));

        verify(utilsService).optObject(eq(testIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService).getHeadCommitIRI(eq(branch));
        verify(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService).getRevisionChanges(eq(commitIRI), any(RepositoryConnection.class));
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
            recordService.export(testIRI, config, connection);
        }
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Rio.parse((IOUtils.toInputStream(os.toString(), StandardCharsets.UTF_8)), "", RDFFormat.JSONLD);
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertFalse(outputModel.containsAll(branch.getModel()));
        assertFalse(outputModel.containsAll(difference.getDeletions()));

        verify(utilsService).optObject(eq(testIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService, never()).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService, never()).getHeadCommitIRI(eq(branch));
        verify(utilsService, never()).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(utilsService, never()).getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService, never()).getRevisionChanges(eq(commitIRI), any(RepositoryConnection.class));
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

        verify(utilsService).optObject(eq(testIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService).getHeadCommitIRI(eq(branch));
        verify(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class));
        verify(utilsService).getRevisionChanges(eq(commitIRI), any(RepositoryConnection.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void exportNullBatchExporterTest() throws Exception {
        BatchExporter exporter =  null;
        RecordOperationConfig config = new OperationConfig();

        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.export(testIRI, config, connection);
        }
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(VersionedRDFRecord.TYPE, recordService.getTypeIRI());
    }
}

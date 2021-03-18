package com.mobi.catalog.impl.record;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.rdf.orm.test.OrmEnabledTestCase;

public class VersionedRDFRecordServiceTest extends OrmEnabledTestCase {
//
//    private final IRI testIRI = VALUE_FACTORY.createIRI("urn:test");
//    private final IRI catalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");
//    private final IRI branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
//    private final IRI commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");
//    private final IRI inProgressCommitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/inProgressCommits#commit");
//    private final IRI tagIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#tag");
//    private final IRI distributionIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#distribution");
//    private final IRI masterBranchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#master");
//    private final IRI recordPolicyIRI = VALUE_FACTORY.createIRI("http://mobi.com/policies/record/encoded-record-policy");
//
//    private SimpleVersionedRDFRecordService recordService;
//    private SimpleSesameTransformer transformer;
//    private VersionedRDFRecord testRecord;
//    private Branch branch;
//    private Commit headCommit;
//    private Difference difference;
//    private User user;
//    private DeleteActivity deleteActivity;
//    private Tag tag;
//
//    private OrmFactory<VersionedRDFRecord> recordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
//    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
//    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
//    private OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);
//    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
//    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
//    private OrmFactory<Tag> tagFactory = getRequiredOrmFactory(Tag.class);
//    private OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);
//
//    @Rule
//    public ExpectedException thrown = ExpectedException.none();
//
//    @Mock
//    private VersioningManager versioningManager;
//
//    @Mock
//    private CatalogUtilsService utilsService;
//
//    @Mock
//    private Repository repository;
//
//    @Mock
//    private RepositoryConnection connection;
//
//    @Mock
//    private RepositoryResult<Statement> results;
//
//    @Mock
//    private RepositoryResult<Statement> inProgressResults;
//
//    @Mock
//    private Statement statement;
//
//    @Mock
//    private InProgressCommit inProgressCommit;
//
//    @Mock
//    private TupleQuery tupleQuery;
//
//    @Mock
//    private TupleQueryResult tupleQueryResult;
//
//    @Mock
//    private BindingSet bindingSet;
//
//    @Mock
//    private Binding binding;
//
//    @Mock
//    private CatalogProvUtils provUtils;
//
//    @Mock
//    private MergeRequestManager mergeRequestManager;
//
//    @Mock
//    private XACMLPolicyManager xacmlPolicyManager;
//
//    @Mock
//    private CatalogConfigProvider configProvider;
//
//    @Mock
//    private EngineManager engineManager;
//
//    @Before
//    public void setUp() throws Exception {
//        recordService = new SimpleVersionedRDFRecordService();
//
//        transformer = new SimpleSesameTransformer();
//        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));
//
//        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));
//        headCommit = commitFactory.createNew(commitIRI);
//        branch = branchFactory.createNew(branchIRI);
//        branch.setHead(headCommit);
//        branch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
//
//        Model deletions = MODEL_FACTORY.createModel();
//        deletions.add(VALUE_FACTORY.createIRI("http://test.com#sub"), VALUE_FACTORY.createIRI(_Thing.description_IRI),
//                VALUE_FACTORY.createLiteral("Description"));
//
//        difference = new Difference.Builder()
//                .additions(MODEL_FACTORY.createModel())
//                .deletions(deletions)
//                .build();
//
//        tag = tagFactory.createNew(tagIRI);
//        tag.setVersionedDistribution(Collections.singleton(distributionFactory.createNew(distributionIRI)));
//
//        testRecord = recordFactory.createNew(testIRI);
//        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
//        testRecord.setCatalog(catalogFactory.createNew(catalogId));
//        testRecord.setBranch(Collections.singleton(branch));
//        testRecord.setVersion(Collections.singleton(tag));
//        testRecord.setLatestVersion(tag);
//        testRecord.setBranch(Collections.singleton(branch));
//        testRecord.setMasterBranch(branchFactory.createNew(masterBranchIRI));
//
//        MockitoAnnotations.initMocks(this);
//        when(versioningManager.commit(any(IRI.class), any(IRI.class), any(IRI.class), eq(user), anyString(), any(Model.class), any(Model.class))).thenReturn(commitIRI);
//        when(utilsService.optObject(any(IRI.class), any(OrmFactory.class), eq(connection))).thenReturn(Optional.of(testRecord));
//        when(utilsService.getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection))).thenReturn(branch);
//        when(utilsService.getHeadCommitIRI(eq(branch))).thenReturn(commitIRI);
//        doReturn(Stream.of(commitIRI).collect(Collectors.toList()))
//                .when(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
//        when(utilsService.getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection))).thenReturn(headCommit);
//        when(utilsService.getRevisionChanges(eq(commitIRI), eq(connection))).thenReturn(difference);
//        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
//        doNothing().when(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
//        when(xacmlPolicyManager.addPolicy(any(XACMLPolicy.class))).thenReturn(recordPolicyIRI);
//        when(connection.getStatements(eq(null), eq(VALUE_FACTORY.createIRI(Policy.relatedResource_IRI)), any(IRI.class))).thenReturn(results);
//        when(results.hasNext()).thenReturn(true);
//        when(results.next()).thenReturn(statement);
//        when(statement.getSubject()).thenReturn(recordPolicyIRI);
//        when(configProvider.getRepository()).thenReturn(repository);
//        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
//        when(repository.getConnection()).thenReturn(connection);
//        when(connection.prepareTupleQuery(anyString())).thenReturn(tupleQuery);
//        when(tupleQuery.evaluate()).thenReturn(tupleQueryResult);
//        when(tupleQueryResult.hasNext()).thenReturn(true, false);
//        when(tupleQueryResult.next()).thenReturn(bindingSet);
//        when(bindingSet.getBinding(anyString())).thenReturn(Optional.of(binding));
//        when(binding.getValue()).thenReturn(VALUE_FACTORY.createLiteral("urn:record"),
//                VALUE_FACTORY.createLiteral("urn:master"), VALUE_FACTORY.createLiteral("urn:user"));
//
//        // InProgressCommit deletion setup
//        when(connection.getStatements(eq(null), eq(VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI)), any(IRI.class))).thenReturn(inProgressResults);
//        Set<Statement> inProgressCommitIris = new HashSet<>();
//        inProgressCommitIris.add(VALUE_FACTORY.createStatement(inProgressCommitIRI, VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI), testIRI));
//        when(inProgressResults.iterator()).thenReturn(inProgressCommitIris.iterator());
//        doCallRealMethod().when(inProgressResults).forEach(any(Consumer.class));
//        when(utilsService.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), eq(connection))).thenReturn(inProgressCommit);
//        doNothing().when(utilsService).removeInProgressCommit(any(InProgressCommit.class), eq(connection));
//
//
//        injectOrmFactoryReferencesIntoService(recordService);
//        recordService.setVersioningManager(versioningManager);
//        recordService.setUtilsService(utilsService);
//        recordService.setVf(VALUE_FACTORY);
//        recordService.setProvUtils(provUtils);
//        recordService.setMergeRequestManager(mergeRequestManager);
//        recordService.setPolicyManager(xacmlPolicyManager);
//        recordService.setEngineManager(engineManager);
//        recordService.setCatalogConfigProvider(configProvider);
//    }
//
//    /* activate() */
//
//    @Test
//    public void activateUserPresentTest() throws Exception {
//        User user = userFactory.createNew(VALUE_FACTORY.createIRI("urn:user"));
//        when(engineManager.getUsername(any(IRI.class))).thenReturn(Optional.of("user"));
//        when(engineManager.retrieveUser(eq("user"))).thenReturn(Optional.of(user));
//
//        recordService.activate();
//        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
//    }
//
//    @Test
//    public void activateUserNotPresentTest() throws Exception {
//        User user = userFactory.createNew(VALUE_FACTORY.createIRI("urn:admin"));
//        when(engineManager.getUsername(any(IRI.class))).thenReturn(Optional.empty());
//        when(engineManager.retrieveUser(eq("admin"))).thenReturn(Optional.of(user));
//
//        recordService.activate();
//        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
//    }
//
//    /* create() */
//
//    @Test
//    public void createRecordTest() throws Exception {
//        RecordOperationConfig config = new OperationConfig();
//        Set<String> names = new LinkedHashSet<>();
//        names.add("Rick");
//        names.add("Morty");
//        Set<User> users = new LinkedHashSet<>();
//        users.add(user);
//        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
//        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
//        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
//        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
//        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
//
//        recordService.create(user, config, connection);
//
//        verify(utilsService, times(2)).addObject(any(Record.class),
//                any(RepositoryConnection.class));
//        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user),
//                anyString(), any(Model.class), eq(null));
//        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
//        verify(provUtils).startCreateActivity(eq(user));
//        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
//    }
//
//    @Test
//    public void createRecordWithoutCatalogID() throws Exception {
//        thrown.expect(IllegalArgumentException.class);
//        RecordOperationConfig config = new OperationConfig();
//        Set<String> names = new LinkedHashSet<>();
//        names.add("Rick");
//        names.add("Morty");
//        Set<User> users = new LinkedHashSet<>();
//        users.add(user);
//        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
//        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestDescription");
//        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
//        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
//
//        recordService.create(user, config, connection);
//        verify(provUtils).removeActivity(any(CreateActivity.class));
//    }
//
//    @Test
//    public void createRecordWithoutPublisher() throws Exception {
//        thrown.expect(IllegalArgumentException.class);
//        RecordOperationConfig config = new OperationConfig();
//        Set<String> names = new LinkedHashSet<>();
//        names.add("Rick");
//        names.add("Morty");
//        Set<User> users = new LinkedHashSet<>();
//        users.add(user);
//        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
//        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
//        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestDescription");
//        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
//
//        recordService.create(user, config, connection);
//        verify(provUtils).removeActivity(any(CreateActivity.class));
//    }
//
//    @Test
//    public void createRecordWithoutTitle() throws Exception {
//        thrown.expect(IllegalArgumentException.class);
//        RecordOperationConfig config = new OperationConfig();
//        Set<String> names = new LinkedHashSet<>();
//        names.add("Rick");
//        names.add("Morty");
//        Set<User> users = new LinkedHashSet<>();
//        users.add(user);
//        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
//        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
//        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
//        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
//
//        recordService.create(user, config, connection);
//        verify(provUtils).removeActivity(any(CreateActivity.class));
//    }
//
//    /* delete() */
//
//    @Test
//    public void deleteTest() throws Exception {
//        VersionedRDFRecord deletedRecord = recordService.delete(testIRI, user, connection);
//
//        assertEquals(testRecord, deletedRecord);
//        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
//        verify(provUtils).startDeleteActivity(eq(user), eq(testIRI));
//        verify(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
//        verify(utilsService).removeVersion(eq(testRecord.getResource()), any(Resource.class), any(RepositoryConnection.class));
//        verify(utilsService).removeBranch(eq(testRecord.getResource()), any(Resource.class), any(List.class), any(RepositoryConnection.class));
//        verify(provUtils).endDeleteActivity(any(DeleteActivity.class), any(Record.class));
//        verify(connection).getStatements(eq(null), eq(VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI)), eq(testIRI));
//        verify(utilsService).getInProgressCommit(eq(catalogId), eq(testIRI), eq(inProgressCommitIRI), eq(connection));
//        verify(utilsService).removeInProgressCommit(eq(inProgressCommit), eq(connection));
//    }
//
//    @Test (expected = IllegalArgumentException.class)
//    public void deleteRecordDoesNotExistTest() throws Exception {
//        when(utilsService.optObject(eq(testIRI), eq(recordFactory), eq(connection))).thenReturn(Optional.empty());
//
//        recordService.delete(testIRI, user, connection);
//        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
//    }
//
//    @Test
//    public void deleteRecordRemoveFails() throws Exception {
//        doThrow(RepositoryException.class).when(utilsService).removeObject(any(VersionedRDFRecord.class), any(RepositoryConnection.class));
//        thrown.expect(RepositoryException.class);
//
//        recordService.delete(testIRI, user, connection);
//        verify(provUtils).removeActivity(any(DeleteActivity.class));
//    }
//
//    /* export() */
//
//    @Test
//    public void exportUsingBatchExporterTest() throws Exception {
//        ByteArrayOutputStream os = new ByteArrayOutputStream();
//        BatchExporter exporter =  new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
//        RecordOperationConfig config = new OperationConfig();
//
//        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
//
//        assertFalse(exporter.isActive());
//        exporter.startRDF();
//        assertTrue(exporter.isActive());
//        recordService.export(testIRI, config, connection);
//        exporter.endRDF();
//        assertFalse(exporter.isActive());
//
//        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString(), StandardCharsets.UTF_8)), "", RDFFormat.JSONLD));
//        assertTrue(outputModel.containsAll(testRecord.getModel()));
//        assertTrue(outputModel.containsAll(branch.getModel()));
//        assertTrue(outputModel.containsAll(difference.getAdditions()));
//        assertTrue(outputModel.containsAll(difference.getDeletions()));
//
//        verify(utilsService).optObject(eq(testIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService).getHeadCommitIRI(eq(branch));
//        verify(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
//        verify(utilsService).getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService).getRevisionChanges(eq(commitIRI), eq(connection));
//    }
//
//    @Test
//    public void exportRecordOnlyTest() throws Exception {
//        ByteArrayOutputStream os = new ByteArrayOutputStream();
//        BatchExporter exporter =  new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
//        RecordOperationConfig config = new OperationConfig();
//
//        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
//        config.set(VersionedRDFRecordExportSettings.WRITE_VERSIONED_DATA, false);
//
//        assertFalse(exporter.isActive());
//        exporter.startRDF();
//        assertTrue(exporter.isActive());
//        recordService.export(testIRI, config, connection);
//        exporter.endRDF();
//        assertFalse(exporter.isActive());
//
//        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString(), StandardCharsets.UTF_8)), "", RDFFormat.JSONLD));
//        assertTrue(outputModel.containsAll(testRecord.getModel()));
//        assertFalse(outputModel.containsAll(branch.getModel()));
//        assertFalse(outputModel.containsAll(difference.getDeletions()));
//
//        verify(utilsService).optObject(eq(testIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService, never()).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService, never()).getHeadCommitIRI(eq(branch));
//        verify(utilsService, never()).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
//        verify(utilsService, never()).getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService, never()).getRevisionChanges(eq(commitIRI), eq(connection));
//    }
//
//    @Test
//    public void exportSpecificBranch() throws Exception {
//        Branch doNotWriteBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch2"));
//        doNotWriteBranch.setHead(headCommit);
//        doNotWriteBranch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
//        testRecord.addBranch(doNotWriteBranch);
//
//        Set<Resource> branchesToExport = new HashSet<>();
//        branchesToExport.add(branchIRI);
//
//        ByteArrayOutputStream os = new ByteArrayOutputStream();
//        BatchExporter exporter =  new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
//        RecordOperationConfig config = new OperationConfig();
//
//        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
//        config.set(VersionedRDFRecordExportSettings.BRANCHES_TO_EXPORT, branchesToExport);
//
//        assertFalse(exporter.isActive());
//        exporter.startRDF();
//        assertTrue(exporter.isActive());
//        recordService.export(testIRI, config, connection);
//        exporter.endRDF();
//        assertFalse(exporter.isActive());
//
//        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString(), StandardCharsets.UTF_8)), "", RDFFormat.JSONLD));
//        testRecord.removeBranch(doNotWriteBranch);
//        assertTrue(outputModel.containsAll(testRecord.getModel()));
//        assertTrue(outputModel.containsAll(branch.getModel()));
//        assertFalse(outputModel.containsAll(doNotWriteBranch.getModel()));
//        assertTrue(outputModel.containsAll(difference.getDeletions()));
//
//        verify(utilsService).optObject(eq(testIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService).getHeadCommitIRI(eq(branch));
//        verify(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
//        verify(utilsService).getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection));
//        verify(utilsService).getRevisionChanges(eq(commitIRI), eq(connection));
//    }
//
//    @Test (expected = IllegalArgumentException.class)
//    public void exportNullBatchExporterTest() throws Exception {
//        BatchExporter exporter =  null;
//        RecordOperationConfig config = new OperationConfig();
//
//        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
//        recordService.export(testIRI, config, connection);
//    }
//
//    @Test
//    public void getTypeIRITest() throws Exception {
//        assertEquals(VersionedRDFRecord.TYPE, recordService.getTypeIRI());
//    }
}

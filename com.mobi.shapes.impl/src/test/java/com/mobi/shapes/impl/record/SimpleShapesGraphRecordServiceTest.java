package com.mobi.shapes.impl.record;

/*-
 * #%L
 * com.mobi.shapes.impl
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
import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
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
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleShapesGraphRecordServiceTest extends OrmEnabledTestCase {

    private final IRI testIRI = VALUE_FACTORY.createIRI("urn:test");
    private final IRI catalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
    private final IRI commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");
    private final IRI inProgressCommitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/inProgressCommits#commit");
    private final IRI tagIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#tag");
    private final IRI distributionIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#distribution");
    private final IRI masterBranchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#master");
    private final IRI recordPolicyIRI = VALUE_FACTORY.createIRI("http://mobi.com/policies/record/encoded-record-policy");

    private AutoCloseable closeable;
    private SimpleShapesGraphRecordService recordService;
    private ShapesGraphRecord testRecord;
    private ShapesGraphRecord stateRecord01;
    private ShapesGraphRecord stateRecord02;
    private ShapesGraphRecord stateRecord03;
    private Model testStateModel;

    private Branch branch;
    private Commit headCommit;
    private Difference difference;
    private User user;
    private DeleteActivity deleteActivity;
    private Tag tag;
    private MemoryRepositoryWrapper repository;

    private OrmFactory<ShapesGraphRecord> recordFactory = getRequiredOrmFactory(ShapesGraphRecord.class);
    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<Tag> tagFactory = getRequiredOrmFactory(Tag.class);
    private OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);

    @Mock
    private CatalogUtilsService utilsService;

    @Mock
    private InProgressCommit inProgressCommit;

    @Mock
    private CatalogProvUtils provUtils;

    @Mock
    private MergeRequestManager mergeRequestManager;

    @Mock
    private VersioningManager versioningManager;

    @Mock
    private XACMLPolicyManager xacmlPolicyManager;

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private EngineManager engineManager;

    @Mock
    private ShapesGraphManager shapesGraphManager;

    @Mock
    private CreateActivity createActivity;

    @Before
    public void setUp() throws Exception {
        System.setProperty("karaf.etc", SimpleShapesGraphRecordServiceTest.class.getResource("/").getPath());
        repository = new MemoryRepositoryWrapper();
        repository.setDelegate(new SailRepository(new MemoryStore()));
        
        recordService = new SimpleShapesGraphRecordService();
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));
        headCommit = commitFactory.createNew(commitIRI);
        branch = branchFactory.createNew(branchIRI);
        branch.setHead(headCommit);
        branch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));

        InputStream testStateOntology = getClass().getResourceAsStream("/test-state.ttl");
        testStateModel = MODEL_FACTORY.createEmptyModel();
        testStateModel.addAll(Rio.parse(testStateOntology, "", RDFFormat.TURTLE));

        stateRecord01 = recordFactory.createNew(VALUE_FACTORY.createIRI("https://mobi.com/records#eb-record-id-0001"));
        stateRecord02 = recordFactory.createNew(VALUE_FACTORY.createIRI("https://mobi.com/records#eb-record-id-0002"));
        stateRecord03 = recordFactory.createNew(VALUE_FACTORY.createIRI("https://mobi.com/records#eb-record-id-not-exit"));

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
        testRecord.setShapesGraphIRI(testIRI);

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
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        // InProgressCommit deletion setup
        when(utilsService.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        doNothing().when(utilsService).removeInProgressCommit(any(InProgressCommit.class), any(RepositoryConnection.class));

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.utilsService = utilsService;
        recordService.provUtils = provUtils;
        recordService.versioningManager = versioningManager;
        recordService.mergeRequestManager = mergeRequestManager;
        recordService.xacmlPolicyManager = xacmlPolicyManager;
        recordService.engineManager = engineManager;
        recordService.configProvider = configProvider;
        recordService.recordFactory = recordService.shapesGraphRecordFactory;
        recordService.shapesGraphManager = shapesGraphManager;
    }

    @After
    public void reset() throws Exception {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.clear();
        }
        closeable.close();
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
        verify(xacmlPolicyManager, times(0)).addPolicy(any(XACMLPolicy.class));
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
        verify(xacmlPolicyManager, times(0)).addPolicy(any(XACMLPolicy.class));
    }

    /* create() */

    @Test
    public void createWithoutOntologyIRITest() throws Exception {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = Stream.of("keyword1", "keyword2").collect(Collectors.toSet());
        Set<User> users = Stream.of(user).collect(Collectors.toSet());
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-shape.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-record.ttl");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        ShapesGraphRecord shaclRecord;
        try (RepositoryConnection connection = repository.getConnection()) {
            shaclRecord = recordService.create(user, config, connection);
        }
        
        Optional<Value> optTitle = shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI));
        assertTrue(optTitle.isPresent());
        assertEquals("TestTitle", optTitle.get().stringValue());
        Optional<Value> optDescription = shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI));
        assertTrue(optDescription.isPresent());
        assertEquals("TestTitle", optDescription.get().stringValue());
        assertTrue(shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        Set<Value> publishers = shaclRecord.getProperties(VALUE_FACTORY.createIRI(_Thing.publisher_IRI));
        assertEquals(users.size(), publishers.size());
        Optional<Resource> optCatalogId = shaclRecord.getCatalog_resource();
        assertTrue(optCatalogId.isPresent());
        assertEquals(catalogId.stringValue(), optCatalogId.get().stringValue());
        Set<Literal> recordKeywords = shaclRecord.getKeyword();
        assertEquals(recordKeywords.size(), keywords.size());
        assertEquals(1, shaclRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = shaclRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optShapesGraphIri = shaclRecord.getShapesGraphIRI();
        assertTrue(optShapesGraphIri.isPresent());
        assertTrue(optShapesGraphIri.get().stringValue().startsWith(SimpleShapesGraphRecordService.DEFAULT_PREFIX));
        
        verify(utilsService, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test
    public void createWithOntologyIRITest() throws Exception {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-shape-ontology-iri.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-ontology.ttl");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        ShapesGraphRecord shaclRecord;
        try (RepositoryConnection connection = repository.getConnection()) {
            shaclRecord = recordService.create(user, config, connection);
        }
        
        Optional<Value> optTitle = shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI));
        assertTrue(optTitle.isPresent());
        assertEquals("TestTitle", optTitle.get().stringValue());
        Optional<Value> optDescription = shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI));
        assertTrue(optDescription.isPresent());
        assertEquals("TestTitle", optDescription.get().stringValue());
        assertTrue(shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        Set<Value> publishers = shaclRecord.getProperties(VALUE_FACTORY.createIRI(_Thing.publisher_IRI));
        assertEquals(users.size(), publishers.size());
        Optional<Resource> optCatalogId = shaclRecord.getCatalog_resource();
        assertTrue(optCatalogId.isPresent());
        assertEquals(catalogId.stringValue(), optCatalogId.get().stringValue());
        Set<Literal> recordKeywords = shaclRecord.getKeyword();
        assertEquals(recordKeywords.size(), keywords.size());
        assertEquals(1, shaclRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = shaclRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optShapesGraphIri = shaclRecord.getShapesGraphIRI();
        assertTrue(optShapesGraphIri.isPresent());
        assertEquals("urn:testOntology", optShapesGraphIri.get().stringValue());

        verify(utilsService, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test
    public void createWithoutInputFileTest() throws Exception {
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
        config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, MODEL_FACTORY.createEmptyModel());

        ShapesGraphRecord shaclRecord;
        try (RepositoryConnection connection = repository.getConnection()) {
            shaclRecord = recordService.create(user, config, connection);
        }
        
        Optional<Value> optTitle = shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI));
        assertTrue(optTitle.isPresent());
        assertEquals("TestTitle", optTitle.get().stringValue());
        Optional<Value> optDescription = shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI));
        assertTrue(optDescription.isPresent());
        assertEquals("TestTitle", optDescription.get().stringValue());
        assertTrue(shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(shaclRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        Set<Value> publishers = shaclRecord.getProperties(VALUE_FACTORY.createIRI(_Thing.publisher_IRI));
        assertEquals(users.size(), publishers.size());
        Optional<Resource> optCatalogId = shaclRecord.getCatalog_resource();
        assertTrue(optCatalogId.isPresent());
        assertEquals(catalogId.stringValue(), optCatalogId.get().stringValue());
        Set<Literal> recordKeywords = shaclRecord.getKeyword();
        assertEquals(recordKeywords.size(), keywords.size());
        assertEquals(1, shaclRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = shaclRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optShapesGraphIri = shaclRecord.getShapesGraphIRI();
        assertTrue(optShapesGraphIri.isPresent());
        assertTrue(optShapesGraphIri.get().stringValue().startsWith(SimpleShapesGraphRecordService.DEFAULT_PREFIX));

        verify(utilsService, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user),
                anyString(), any(Model.class), eq(null), any(RepositoryConnection.class));
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void createTrigWithTrigExtensionTest() throws Exception {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-shape.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "testData.trig");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch(IllegalArgumentException e) {
            assertEquals("TriG data is not supported for upload.", e.getMessage());
            throw e;
        }
        fail("IllegalArgumentException was not thrown");
    }

    @Test (expected = IllegalArgumentException.class)
    public void createTrigWithTxtExtensionTest() throws Exception {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-shape-record.trig"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "testData.txt");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch(IllegalArgumentException e) {
            assertEquals("TriG data is not supported for upload.", e.getMessage());
            throw e;
        }
        fail("IllegalArgumentException was not thrown");
    }

    @Test (expected = IllegalArgumentException.class)
    public void createTrigWithTxtZipExtensionTrigZipContentTest() throws Exception {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-shape-record.trig.zip"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "testData.txt.zip");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch(IllegalArgumentException e) {
            assertEquals("TriG data is not supported for upload.", e.getMessage());
            throw e;
        }
        fail("IllegalArgumentException was not thrown");
    }

    @Test
    public void createWithTrigInFileName() {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-shape.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-record-trig.ttl");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch(Exception e) {
            fail("Exception was thrown");
        }
    }

    @Test (expected = IllegalArgumentException.class)
    public void createTrigWithZipExtensionTTLContentTest() throws Exception {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-shape.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-record.trig.zip");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch(IllegalArgumentException e) {
            assertEquals("TriG data is not supported for upload.", e.getMessage());
            throw e;
        }
        fail("IllegalArgumentException was not thrown");
    }

    @Test (expected = IllegalArgumentException.class)
    public void createWithoutInputFileOrModelTest() throws Exception {
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
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutCatalogID() throws Exception {
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
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutPublisher() throws Exception {
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
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutTitle() throws Exception {
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
    }

    @Test
    public void deleteTest() throws Exception {
        ShapesGraphRecord deletedRecord;
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

    @Test(expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() throws Exception {
        when(utilsService.optObject(eq(testIRI), eq(recordFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.delete(testIRI, user, connection);
        }

        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), any(RepositoryConnection.class));
    }

    @Test(expected = RepositoryException.class)
    public void deleteRecordRemoveFails() throws Exception {
        doThrow(RepositoryException.class).when(utilsService).removeObject(any(ShapesGraphRecord.class), any(RepositoryConnection.class));
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.delete(testIRI, user, connection);
        }
    }

    @Test
    public void getPlatformStateIdsTest() throws Exception {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testStateModel);

            List<String> record01Ids = recordService.getPlatformStateIds(stateRecord01, connection)
                    .stream().map(resource -> resource.toString()).sorted().collect(Collectors.toList());
            List<String> record02Ids = recordService.getPlatformStateIds(stateRecord02, connection)
                    .stream().map(resource -> resource.toString()).sorted().collect(Collectors.toList());
            List<String> record03Ids = recordService.getPlatformStateIds(stateRecord03, connection)
                    .stream().map(resource -> resource.toString()).sorted().collect(Collectors.toList());

            assertEquals(record01Ids.toString(), "[http://mobi.com/states#platform-id-1, http://mobi.com/states#platform-id-2]");
            assertEquals(record02Ids.toString(), "[http://mobi.com/states#platform-id-3]");
            assertEquals(record03Ids.toString(), "[]");
        }
    }

    @Test
    public void getAllStateModelsForRecordTest() throws Exception {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testStateModel);

            String actual = "[http://mobi.com/ontologies/shapes-graph/state#state-record-1, http://mobi.com/ontologies/shapes-graph/state#state-record-2, http://mobi.com/states#platform-id-1, http://mobi.com/states#platform-id-2, http://mobi.com/states/shapes-graph-editor/branch-id/id-branch-1, http://mobi.com/states/shapes-graph-editor/branch-id/id-branch-2]";
            String actual1 = "[http://mobi.com/ontologies/shapes-graph/state#state-record-3, http://mobi.com/states#platform-id-3, http://mobi.com/states/shapes-graph-editor/branch-id/id-branch-3]";
            String actual2 = "[]";

            testIdsForStateModel(connection, actual, actual1, actual2);
        }
    }

    @Test
    public void deleteOntologyStateTest() throws Exception {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testStateModel);

            final String actual = "[http://mobi.com/ontologies/shapes-graph/state#state-record-1, http://mobi.com/ontologies/shapes-graph/state#state-record-2, http://mobi.com/states#platform-id-1, http://mobi.com/states#platform-id-2, http://mobi.com/states/shapes-graph-editor/branch-id/id-branch-1, http://mobi.com/states/shapes-graph-editor/branch-id/id-branch-2]";
            final String actual1 = "[http://mobi.com/ontologies/shapes-graph/state#state-record-3, http://mobi.com/states#platform-id-3, http://mobi.com/states/shapes-graph-editor/branch-id/id-branch-3]";
            final String actualEmpty = "[]";

            testIdsForStateModel(connection, actual, actual1, actualEmpty);
            recordService.deleteShapeGraphState(stateRecord01, connection);
            testIdsForStateModel(connection, actualEmpty, actual1, actualEmpty);
            recordService.deleteShapeGraphState(stateRecord02, connection);
            testIdsForStateModel(connection, actualEmpty, actualEmpty, actualEmpty);
        }
    }

    private void testIdsForStateModel(RepositoryConnection connection, String actual, String actual1, String actual2) {
        List<String> record01Ids = recordService.getAllStateModelsForRecord(stateRecord01, connection)
                .stream().map(model -> model.subjects().iterator().next().toString()).sorted().collect(Collectors.toList());
        List<String> record02Ids = recordService.getAllStateModelsForRecord(stateRecord02, connection)
                .stream().map(model -> model.subjects().iterator().next().toString()).sorted().collect(Collectors.toList());
        List<String> record03Ids = recordService.getAllStateModelsForRecord(stateRecord03, connection)
                .stream().map(model -> model.subjects().iterator().next().toString()).sorted().collect(Collectors.toList());

        assertEquals(record01Ids.toString(), actual);
        assertEquals(record02Ids.toString(), actual1);
        assertEquals(record03Ids.toString(), actual2);
    }



}

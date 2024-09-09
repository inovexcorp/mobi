package com.mobi.ontology.impl.core.record;

/*-
 * #%L
 * com.mobi.ontology.impl.core
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

import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;
import static org.junit.Assert.assertNotSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
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
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.WriterConfig;
import org.eclipse.rdf4j.rio.helpers.JSONLDMode;
import org.eclipse.rdf4j.rio.helpers.JSONLDSettings;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class OntologyRecordServiceTest extends OrmEnabledTestCase {
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

    private SimpleOntologyRecordService recordService;
    private MemoryRepositoryWrapper repository;
    private OntologyRecord testRecord;
    private OntologyRecord stateRecord01;
    private OntologyRecord stateRecord02;
    private OntologyRecord stateRecord03;
    private Branch branch;
    private Commit headCommit;
    private Difference difference;
    private User user;
    private DeleteActivity deleteActivity;
    private Tag tag;
    private IRI importedOntologyIRI;
    private Model ontologyModel;
    private OutputStream ontologyJsonLd;
    private Model testStateModel;
    private Revision revision;
    private IRI revisionIRI;

    private OrmFactory<Branch> branchFactory = spy(getRequiredOrmFactory(Branch.class));
    private OrmFactory<MasterBranch> masterBranchFactory = spy(getRequiredOrmFactory(MasterBranch.class));
    private OrmFactory<Catalog> catalogFactory = spy(getRequiredOrmFactory(Catalog.class));
    private OrmFactory<Commit> commitFactory = spy(getRequiredOrmFactory(Commit.class));
    private OrmFactory<DeleteActivity> deleteActivityFactory = spy(getRequiredOrmFactory(DeleteActivity.class));
    private OrmFactory<Distribution> distributionFactory = spy(getRequiredOrmFactory(Distribution.class));
    private OrmFactory<OntologyRecord> recordFactory = spy(getRequiredOrmFactory(OntologyRecord.class));
    private OrmFactory<Revision> revisionFactory = spy(getRequiredOrmFactory(Revision.class));
    private OrmFactory<Tag> tagFactory = spy(getRequiredOrmFactory(Tag.class));
    private OrmFactory<User> userFactory = spy(getRequiredOrmFactory(User.class));
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = spy(getRequiredOrmFactory(VersionedRDFRecord.class));

    private ValueFactory vf;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private ThingManager thingManager;

    @Mock
    private BranchManager branchManager;

    @Mock
    private RecordManager recordManager;

    @Mock
    private CommitManager commitManager;

    @Mock
    private VersionManager versionManager;

    @Mock
    private DifferenceManager differenceManager;

    @Mock
    private RevisionManager revisionManager;

    @Mock
    private InProgressCommit inProgressCommit;

    @Mock
    private CatalogProvUtils provUtils;

    @Mock
    private OntologyCache ontologyCache;

    @Mock
    private MergeRequestManager mergeRequestManager;

    @Mock
    private OntologyId ontologyId1;

    @Mock
    private OntologyId ontologyId2;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private VersioningManager versioningManager;

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
        vf = getValueFactory();
        System.setProperty("karaf.etc", OntologyRecordServiceTest.class.getResource("/").getPath());
        repository = new MemoryRepositoryWrapper();
        repository.setDelegate(new SailRepository(new MemoryStore()));

        recordService = spy(new SimpleOntologyRecordService());
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));
        WriterConfig config = new WriterConfig();
        config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
        importedOntologyIRI = VALUE_FACTORY.createIRI("http://test.org/ontology/IRI");
        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        ontologyModel = MODEL_FACTORY.createEmptyModel();
        ontologyModel.addAll(Rio.parse(testOntology, "", RDFFormat.TURTLE));
        ontologyJsonLd = new ByteArrayOutputStream();
        Rio.write(ontologyModel, ontologyJsonLd, RDFFormat.JSONLD, config);

        InputStream testStateOntology = getClass().getResourceAsStream("/test-state.ttl");
        testStateModel = MODEL_FACTORY.createEmptyModel();
        testStateModel.addAll(Rio.parse(testStateOntology, "", RDFFormat.TURTLE));

        stateRecord01 = recordFactory.createNew(VALUE_FACTORY.createIRI("https://mobi.com/records#eb-record-id-0001"));
        stateRecord02 = recordFactory.createNew(VALUE_FACTORY.createIRI("https://mobi.com/records#eb-record-id-0002"));
        stateRecord03 = recordFactory.createNew(VALUE_FACTORY.createIRI("https://mobi.com/records#eb-record-id-not-exit"));

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
        testRecord.setMasterBranch(masterBranchFactory.createNew(masterBranchIRI));
        testRecord.setOntologyIRI(testIRI);

        closeable = MockitoAnnotations.openMocks(this);
        when(ontologyId1.getOntologyIRI()).thenReturn(Optional.empty());
        when(ontologyId1.getOntologyIdentifier()).thenReturn(importedOntologyIRI);
        when(ontologyId2.getOntologyIRI()).thenReturn(Optional.of(importedOntologyIRI));
        when(ontologyManager.ontologyIriExists(any(IRI.class))).thenReturn(false);
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyId1);
        when(versioningManager.commit(any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), anyString(), any(RepositoryConnection.class))).thenReturn(commitIRI);

        when(branchManager.getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommitIRI(eq(branch))).thenReturn(commitIRI);
        doReturn(Stream.of(commitIRI).collect(Collectors.toList()))
                .when(commitManager).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        when(thingManager.getExpectedObject(eq(commitIRI), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(headCommit);
        when(differenceManager.getCommitDifference(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(difference);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
        when(provUtils.startCreateActivity(any())).thenReturn(createActivity);
        doNothing().when(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        doNothing().when(ontologyCache).clearCache(any(Resource.class));
        doNothing().when(ontologyCache).clearCacheImports(any(Resource.class));
        when(xacmlPolicyManager.addPolicy(any(XACMLPolicy.class))).thenReturn(recordPolicyIRI);
        when(configProvider.getRepository()).thenReturn(repository);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        // InProgressCommit deletion setup
        when(commitManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        doNothing().when(commitManager).removeInProgressCommit(any(InProgressCommit.class), any(RepositoryConnection.class));

        when(commitManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);
        revisionIRI = VALUE_FACTORY.createIRI("urn:revision");
        revision = revisionFactory.createNew(revisionIRI);
        IRI additionsIri = VALUE_FACTORY.createIRI("urn:additions");
        IRI deletionsIri = VALUE_FACTORY.createIRI("urn:deletions");
        revision.setAdditions(additionsIri);
        revision.setDeletions(deletionsIri);
        when(inProgressCommit.getGenerated_resource()).thenReturn(Set.of(revisionIRI));
        when(inProgressCommit.getModel()).thenReturn(revision.getModel());
        when(revisionManager.getRevisionFromCommitId(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(revision);

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.ontologyManager = ontologyManager;
        recordService.thingManager = thingManager;
        recordService.branchManager = branchManager;
        recordService.commitManager = commitManager;
        recordService.differenceManager = differenceManager;
        recordService.versionManager = versionManager;
        recordService.provUtils = provUtils;
        recordService.ontologyCache = ontologyCache;
        recordService.versioningManager = versioningManager;
        recordService.mergeRequestManager = mergeRequestManager;
        recordService.xacmlPolicyManager = xacmlPolicyManager;
        recordService.engineManager = engineManager;
        recordService.configProvider = configProvider;
        recordService.recordFactory = recordService.ontologyRecordFactory;
        recordService.recordManager = recordManager;
        recordService.revisionManager = revisionManager;
    }

    private void mockCreateRevision() {
        Revision revision = mock(Revision.class);
        when(revision.getAdditions()).thenReturn(Optional.of(getValueFactory().createIRI("http://revision/add")));
        when(revision.getDeletions()).thenReturn(Optional.of(getValueFactory().createIRI("http://revision/del")));
        when(revision.getModel()).thenReturn(MODEL_FACTORY.createEmptyModel());
        when(revisionManager.createRevision(any())).thenReturn(revision);
    }

    private void mockCreateCommit() {
        Commit initialCommit = commitFactory.createNew(commitIRI);
        IRI initialCommitIri = getValueFactory().createIRI("http://mobi.com/commit#initial");
        when(versioningManager.commit(eq(catalogId), any(Resource.class), any(Resource.class), eq(user), eq("The initial commit."), any(RepositoryConnection.class))).thenReturn(initialCommitIri);
        when(commitManager.getCommit(eq(initialCommitIri), any(RepositoryConnection.class))).thenReturn(Optional.of(initialCommit));
    }

    private static OntologyId getOntologyId() {
        String defaultPrefix = "http://mobi.com/ontologies/";
        IRI identifier = VALUE_FACTORY.createIRI(defaultPrefix + "test");
        OntologyId ontologyId = mock(OntologyId.class);
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.empty());
        when(ontologyId.getVersionIRI()).thenReturn(Optional.empty());
        when(ontologyId.getOntologyIdentifier()).thenReturn(identifier);
        return ontologyId;
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
    public void createWithoutOntologyIRITest() throws Exception {
        mockCreateRevision();
        mockCreateCommit();
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = Stream.of("keyword1", "keyword2").collect(Collectors.toSet());
        Set<User> users = Stream.of(user).collect(Collectors.toSet());
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-ontology.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-ontology.ttl");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        OntologyRecord ontologyRecord;
        try (RepositoryConnection connection = repository.getConnection()) {
            ontologyRecord = recordService.create(user, config, connection);
        }

        Optional<Value> optTitle = ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI));
        assertTrue(optTitle.isPresent());
        assertEquals("TestTitle", optTitle.get().stringValue());
        Optional<Value> optDescription = ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI));
        assertTrue(optDescription.isPresent());
        assertEquals("TestTitle", optDescription.get().stringValue());
        assertTrue(ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        Set<Value> publishers = ontologyRecord.getProperties(VALUE_FACTORY.createIRI(_Thing.publisher_IRI));
        assertEquals(users.size(), publishers.size());
        Optional<Resource> optCatalogId = ontologyRecord.getCatalog_resource();
        assertTrue(optCatalogId.isPresent());
        assertEquals(catalogId.stringValue(), optCatalogId.get().stringValue());
        Set<Literal> recordKeywords = ontologyRecord.getKeyword();
        assertEquals(recordKeywords.size(), keywords.size());
        assertEquals(1, ontologyRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = ontologyRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optOntologyIri = ontologyRecord.getOntologyIRI();
        assertTrue(optOntologyIri.isPresent());
        assertEquals(importedOntologyIRI.stringValue(), optOntologyIri.get().stringValue());

        verify(commitManager).createInProgressCommit(eq(user));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user), eq("The initial commit."), any(RepositoryConnection.class));
        verify(ontologyId1, times(2)).getOntologyIRI();
        verify(ontologyId1).getOntologyIdentifier();
        verify(ontologyManager).createOntologyId(any(Model.class));
        verify(thingManager, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test
    public void createWithOntologyIRITest() throws Exception {
        mockCreateRevision();
        mockCreateCommit();
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyId2);
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-ontology.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-ontology.ttl");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        OntologyRecord ontologyRecord;
        try (RepositoryConnection connection = repository.getConnection()) {
            ontologyRecord = recordService.create(user, config, connection);
        }

        Optional<Value> optTitle = ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI));
        assertTrue(optTitle.isPresent());
        assertEquals("TestTitle", optTitle.get().stringValue());
        Optional<Value> optDescription = ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI));
        assertTrue(optDescription.isPresent());
        assertEquals("TestTitle", optDescription.get().stringValue());
        assertTrue(ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        Set<Value> publishers = ontologyRecord.getProperties(VALUE_FACTORY.createIRI(_Thing.publisher_IRI));
        assertEquals(users.size(), publishers.size());
        Optional<Resource> optCatalogId = ontologyRecord.getCatalog_resource();
        assertTrue(optCatalogId.isPresent());
        assertEquals(catalogId.stringValue(), optCatalogId.get().stringValue());
        Set<Literal> recordKeywords = ontologyRecord.getKeyword();
        assertEquals(recordKeywords.size(), keywords.size());
        assertEquals(1, ontologyRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = ontologyRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optOntologyIri = ontologyRecord.getOntologyIRI();
        assertTrue(optOntologyIri.isPresent());
        assertEquals(importedOntologyIRI.stringValue(), optOntologyIri.get().stringValue());

        verify(commitManager).createInProgressCommit(eq(user));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user), eq("The initial commit."), any(RepositoryConnection.class));
        verify(ontologyId2, times(2)).getOntologyIRI();
        verify(ontologyId2).getOntologyIdentifier();
        verify(ontologyManager).createOntologyId(any(Model.class));
        verify(thingManager, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test
    public void createWithBlankNodeOntology() {
        mockCreateRevision();
        mockCreateCommit();
        OntologyId ontologyId = getOntologyId();
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyId);

        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-ontology-no-oiri.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-ontology-no-oiri.ttl");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }

        // Then:
        // AbstractRecordService.create
        verify(provUtils).startCreateActivity(eq(user));
        // AbstractOntologyRecordService.createRecord
        verify(ontologyId, times(2)).getOntologyIRI();
        verify(ontologyId).getOntologyIdentifier();
        verify(ontologyManager).createOntologyId(any(Model.class));
        verify(thingManager, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
        verify(commitManager).createInProgressCommit(eq(user));
        // AbstractRecordService.create
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(Resource.class));

        // Verify Repo data
        try (RepositoryConnection connection = repository.getConnection()) {
            Model ontologySubjects = QueryResults.asModel(connection.getStatements(null, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()),
                    VALUE_FACTORY.createIRI(OWL.ONTOLOGY.stringValue())));
            Resource subject = ontologySubjects.stream().findFirst().get().getSubject();
            assertEquals(ontologyId.getOntologyIdentifier(), subject);
            assertTrue(subject instanceof IRI);
        }
    }

    @Test
    public void createWithNoOntology() {
        mockCreateRevision();
        mockCreateCommit();
        OntologyId ontologyId = getOntologyId();
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyId);
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-ontology-no-ont.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-ontology-no-oiri.ttl");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        }

        // Then:
        verify(ontologyId, times(2)).getOntologyIRI();
        verify(ontologyId).getOntologyIdentifier();
        verify(ontologyManager).createOntologyId(any(Model.class));
        verify(thingManager, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));

        verify(commitManager).createInProgressCommit(eq(user));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user), eq("The initial commit."), any(RepositoryConnection.class));

        try (RepositoryConnection connection = repository.getConnection()) {
            Model ontologySubjects = QueryResults.asModel(connection.getStatements(null, VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()),
                    VALUE_FACTORY.createIRI(OWL.ONTOLOGY.stringValue())));
            Resource subject = ontologySubjects.stream().findFirst().get().getSubject();
            assertEquals(1, ontologySubjects.size());
            assertTrue(subject instanceof IRI);
            assertEquals(ontologyId.getOntologyIdentifier(), subject);
        }
    }

    @Test
    public void createWithoutInputFileTest() throws Exception {
        mockCreateRevision();
        mockCreateCommit();
        // Setup:
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

        OntologyRecord ontologyRecord;
        try (RepositoryConnection connection = repository.getConnection()) {
            ontologyRecord = recordService.create(user, config, connection);
        }

        Optional<Value> optTitle = ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI));
        assertTrue(optTitle.isPresent());
        assertEquals("TestTitle", optTitle.get().stringValue());
        Optional<Value> optDescription = ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI));
        assertTrue(optDescription.isPresent());
        assertEquals("TestTitle", optDescription.get().stringValue());
        assertTrue(ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(ontologyRecord.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        Set<Value> publishers = ontologyRecord.getProperties(VALUE_FACTORY.createIRI(_Thing.publisher_IRI));
        assertEquals(users.size(), publishers.size());
        Optional<Resource> optCatalogId = ontologyRecord.getCatalog_resource();
        assertTrue(optCatalogId.isPresent());
        assertEquals(catalogId.stringValue(), optCatalogId.get().stringValue());
        Set<Literal> recordKeywords = ontologyRecord.getKeyword();
        assertEquals(recordKeywords.size(), keywords.size());
        assertEquals(1, ontologyRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = ontologyRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optOntologyIri = ontologyRecord.getOntologyIRI();
        assertTrue(optOntologyIri.isPresent());
        assertEquals(importedOntologyIRI.stringValue(), optOntologyIri.get().stringValue());

        verify(ontologyId1).getOntologyIdentifier();
        verify(ontologyManager).createOntologyId(any(Model.class));
        verify(thingManager, times(2)).addObject(any(),
                any(RepositoryConnection.class));
        verify(commitManager).createInProgressCommit(eq(user));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user), eq("The initial commit."), any(RepositoryConnection.class));
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
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/testData.trig"));
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
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/testData.trig"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "testData.txt");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch (IllegalArgumentException e) {
            assertEquals("Could not retrieve RDFFormat for file name testData.txt", e.getMessage());
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
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/testData.trig.zip"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "testData.txt.zip");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch (IllegalArgumentException e) {
            assertEquals("Could not retrieve RDFFormat for file name testData.txt.zip", e.getMessage());
            throw e;
        }
        fail("IllegalArgumentException was not thrown");
    }

    @Test
    public void createWithTrigInFileName() {
        mockCreateRevision();
        mockCreateCommit();
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-ontology-no-oiri.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-ontology-no-oiri-trig.ttl");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch (Exception e) {
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
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-ontology-no-oiri.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "test-ontology-no-oiri.trig.zip");
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        // When:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.create(user, config, connection);
        } catch (IllegalArgumentException e) {
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
        when(thingManager.optObject(eq(testIRI), eq(recordService.recordFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(testRecord));
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testRecord.getModel(), testRecord.getResource());
            connection.add(branch.getModel(), branch.getResource());
            connection.add(headCommit.getModel(), headCommit.getResource());
            connection.add(inProgressCommitIRI, VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI), testRecord.getResource());

            assertTrue(ConnectionUtils.containsContext(connection, testRecord.getResource()));
            assertTrue(ConnectionUtils.containsContext(connection, branch.getResource()));
            assertTrue(ConnectionUtils.containsContext(connection, headCommit.getResource()));
            assertTrue(ConnectionUtils.containsContext(connection, commitIRI));
        }
        // Setup:
        OntologyRecord deletedRecord;
        try (RepositoryConnection connection = repository.getConnection()) {
            deletedRecord = recordService.delete(testIRI, user, connection);
            assertEquals(testRecord, deletedRecord);
            assertFalse(ConnectionUtils.containsContext(connection, branch.getResource()));
            assertFalse(ConnectionUtils.containsContext(connection, commitIRI));
        }

        assertEquals(testRecord, deletedRecord);

        // AbstractRecordService.delete getRecord
        verify(thingManager).optObject(eq(testIRI), eq(recordService.recordFactory), any(RepositoryConnection.class));
        // AbstractRecordService.delete
        verify(provUtils).startDeleteActivity(eq(user), eq(testIRI));
        // SimpleOntologyRecordService.deleteRecord deleteVersionedRDFData
        verify(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        verify(versionManager).removeVersion(eq(testRecord.getResource()), any(Resource.class), any(RepositoryConnection.class));
        verify(commitManager).getInProgressCommit(eq(catalogId), eq(testIRI), eq(inProgressCommitIRI), any(RepositoryConnection.class));
        verify(commitManager).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
        // SimpleOntologyRecordService.deleteRecord deleteRecordObject
        verify(thingManager).removeObject(any(OntologyRecord.class), any(RepositoryConnection.class));
        // SimpleOntologyRecordService.deleteRecord clearOntologyCache
        verify(ontologyCache).clearCache(any(Resource.class));
        verify(ontologyCache).clearCacheImports(any(Resource.class));
        // SimpleOntologyRecordService.deleteRecord deleteOntologyState
        verify(recordService).deleteOntologyState(any(OntologyRecord.class), any(RepositoryConnection.class));
        // AbstractRecordService.delete
        verify(provUtils).endDeleteActivity(any(DeleteActivity.class), any(Record.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() throws Exception {
        when(thingManager.optObject(eq(testIRI), eq(recordService.ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        // setup:
        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.delete(testIRI, user, connection);
        } finally {
            verify(thingManager).optObject(eq(testIRI), eq(recordService.ontologyRecordFactory), any(RepositoryConnection.class));
            verify(provUtils, never()).startDeleteActivity(eq(user), eq(testIRI));
            verify(thingManager, never()).removeObject(any(OntologyRecord.class), any(RepositoryConnection.class));
            verify(provUtils, never()).endDeleteActivity(any(DeleteActivity.class), any(OntologyRecord.class));
        }
    }

    @Test
    public void deleteRecordRemoveFails() throws Exception {
        when(thingManager.optObject(any(IRI.class), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.of(testRecord));
        doThrow(RepositoryException.class).when(thingManager).removeObject(any(OntologyRecord.class), any(RepositoryConnection.class));
        thrown.expect(RepositoryException.class);

        try (RepositoryConnection connection = repository.getConnection()) {
            recordService.delete(testIRI, user, connection);
        } finally {
            verify(provUtils).removeActivity(any(DeleteActivity.class));
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

            String actual = "[http://mobi.com/ontologies/state#state-record-1, http://mobi.com/ontologies/state#state-record-2, http://mobi.com/states#platform-id-1, http://mobi.com/states#platform-id-2, http://mobi.com/states/ontology-editor/branch-id/id-branch-1, http://mobi.com/states/ontology-editor/branch-id/id-branch-2]";
            String actual1 = "[http://mobi.com/ontologies/state#state-record-3, http://mobi.com/states#platform-id-3, http://mobi.com/states/ontology-editor/branch-id/id-branch-3]";
            String actual2 = "[]";

            testIdsForStateModel(connection, actual, actual1, actual2);
        }
    }

    @Test
    public void deleteOntologyStateTest() throws Exception {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.add(testStateModel);

            final String actual = "[http://mobi.com/ontologies/state#state-record-1, http://mobi.com/ontologies/state#state-record-2, http://mobi.com/states#platform-id-1, http://mobi.com/states#platform-id-2, http://mobi.com/states/ontology-editor/branch-id/id-branch-1, http://mobi.com/states/ontology-editor/branch-id/id-branch-2]";
            final String actual1 = "[http://mobi.com/ontologies/state#state-record-3, http://mobi.com/states#platform-id-3, http://mobi.com/states/ontology-editor/branch-id/id-branch-3]";
            final String actualEmpty = "[]";

            testIdsForStateModel(connection, actual, actual1, actualEmpty);
            recordService.deleteOntologyState(stateRecord01, connection);
            testIdsForStateModel(connection, actualEmpty, actual1, actualEmpty);
            recordService.deleteOntologyState(stateRecord02, connection);
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


    @Test
    public void deleteBranchTest() {
        try (RepositoryConnection connection = repository.getConnection()) {
            VersionedRDFRecord record = spy(versionedRDFRecordFactory.createNew(testIRI));
            Branch branch = branchFactory.createNew(branchIRI);
            Commit commit = commitFactory.createNew(commitIRI);
            branch.setHead(commit);
            branch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
            record.setProperty(vf.createLiteral(OffsetDateTime.now().minusDays(1)), vf.createIRI(_Thing.modified_IRI));
            String previousModifiedValue = getModifiedIriValue(record);
            when(recordManager.getRecord(eq(catalogId), eq(testIRI), any(), any(RepositoryConnection.class))).thenReturn(record);
            when(branchManager.getBranch(any(VersionedRDFRecord.class), any(), any(), any())).thenReturn(branch);

            Mockito.reset(record);
            recordService.deleteBranch(catalogId, testIRI, branchIRI, connection);

            // record service - abstract method
            verify(recordManager).getRecord(eq(catalogId), eq(testIRI), any(OntologyRecordFactory.class), any(RepositoryConnection.class));
            verify(branchManager).getBranch(eq(record), eq(branchIRI), eq(recordService.branchFactory), any(RepositoryConnection.class));
            verify(record).setProperty(any(), eq(vf.createIRI(_Thing.modified_IRI)));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            // record service - abstract method - removeBranch
            verify(thingManager).removeObjectWithRelationship(eq(branchIRI), eq(testIRI), eq(VersionedRDFRecord.branch_IRI), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(commitIRI), any(RepositoryConnection.class));
            // record service
            verify(ontologyCache).removeFromCache(testIRI.stringValue(), commitIRI.stringValue());
            verify(mergeRequestManager).cleanMergeRequests(eq(testIRI), eq(branchIRI), eq("Test Record"),
                    eq(Collections.singletonList(vf.createIRI("http://mobi.com/test/commits#commit"))), any(RepositoryConnection.class));
            assertNotSame(getModifiedIriValue(record), previousModifiedValue);
        }
    }

    @Test
    public void getStatisticsTest() {
        try (RepositoryConnection conn = repository.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-data-statistics.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
            // Check ont1
            List<String> statistics = recordService.getStatistics(vf.createIRI("https://mobi.com/records#ont1"), conn)
                    .stream()
                    .map((metric) -> String.format("%s:%s", metric.definition().name(), metric.value()))
                    .toList();
            String[] expected = new String[]{
                    "totalClasses:1",
                    "totalAnnotationProperties:1",
                    "totalDatatypeProperties:1",
                    "totalObjectProperties:1",
                    "totalIndividuals:1",
                    "ontologyImports:0",
                    "numberOfUsages:1"
            };
            assertEquals(List.of(expected), statistics);
            // Check ont2
            List<String> statisticsB = recordService.getStatistics(vf.createIRI("https://mobi.com/records#ont2"), conn)
                    .stream()
                    .map((metric) -> String.format("%s:%s", metric.definition().name(), metric.value()))
                    .toList();
            String[] expectedB = new String[]{
                    "totalClasses:0",
                    "totalAnnotationProperties:0",
                    "totalDatatypeProperties:0",
                    "totalObjectProperties:0",
                    "totalIndividuals:0",
                    "ontologyImports:1",
                    "numberOfUsages:0"
            };
            assertEquals(List.of(expectedB), statisticsB);
            // assert3
            List<String> statisticsC = recordService.getStatistics(vf.createIRI("https://mobi.com/records#NotExist"), conn)
                    .stream()
                    .map((metric) -> String.format("%s:%s", metric.definition().name(), metric.value()))
                    .toList();
            String[] expectedC = new String[]{
                    "totalClasses:0",
                    "totalAnnotationProperties:0",
                    "totalDatatypeProperties:0",
                    "totalObjectProperties:0",
                    "totalIndividuals:0",
                    "ontologyImports:0",
                    "numberOfUsages:0"
            };
            assertEquals(List.of(expectedC), statisticsC);
        } catch (IOException | RuntimeException e) {
            Assert.fail(e.getMessage());
        }
    }

    private String getModifiedIriValue(Thing property) {
        return property.getProperty(vf.createIRI(_Thing.modified_IRI)).get().toString();
    }
}

package com.mobi.shapes.impl.record;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doCallRealMethod;
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
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.exception.RepositoryException;
import com.mobi.security.policy.api.ontologies.policy.Policy;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
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

    private SimpleShapesGraphRecordService recordService;
    private ShapesGraphRecord testRecord;
    private Branch branch;
    private Commit headCommit;
    private Difference difference;
    private User user;
    private DeleteActivity deleteActivity;
    private Tag tag;

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
    private Repository repository;

    @Mock
    private RepositoryConnection connection;

    @Mock
    private RepositoryResult<Statement> results;

    @Mock
    private Statement statement;

    @Mock
    private RepositoryResult<Statement> inProgressResults;

    @Mock
    private InProgressCommit inProgressCommit;

    @Mock
    private TupleQuery tupleQuery;

    @Mock
    private TupleQueryResult tupleQueryResult;

    @Mock
    private BindingSet bindingSet;

    @Mock
    private Binding binding;

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
    private SesameTransformer sesameTransformer;

    @Mock
    private ShapesGraphManager shapesGraphManager;

    @Before
    public void setUp() throws Exception {
        recordService = new SimpleShapesGraphRecordService();
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));
        headCommit = commitFactory.createNew(commitIRI);
        branch = branchFactory.createNew(branchIRI);
        branch.setHead(headCommit);
        branch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));

        Model deletions = MODEL_FACTORY.createModel();
        deletions.add(VALUE_FACTORY.createIRI("http://test.com#sub"), VALUE_FACTORY.createIRI(_Thing.description_IRI),
                VALUE_FACTORY.createLiteral("Description"));
        difference = new Difference.Builder()
                .additions(MODEL_FACTORY.createModel())
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

        MockitoAnnotations.initMocks(this);
        when(versioningManager.commit(any(IRI.class), any(IRI.class), any(IRI.class), eq(user), anyString(), any(Model.class), any(Model.class))).thenReturn(commitIRI);
        when(utilsService.optObject(any(IRI.class), any(OrmFactory.class), eq(connection))).thenReturn(Optional.of(testRecord));
        when(utilsService.getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection))).thenReturn(branch);
        when(utilsService.getHeadCommitIRI(eq(branch))).thenReturn(commitIRI);
        doReturn(Stream.of(commitIRI).collect(Collectors.toList()))
                .when(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        when(utilsService.getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection))).thenReturn(headCommit);
        when(utilsService.getRevisionChanges(eq(commitIRI), eq(connection))).thenReturn(difference);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
        doNothing().when(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        when(xacmlPolicyManager.addPolicy(any(XACMLPolicy.class))).thenReturn(recordPolicyIRI);
        when(connection.getStatements(eq(null), eq(VALUE_FACTORY.createIRI(Policy.relatedResource_IRI)), any(IRI.class))).thenReturn(results);
        when(results.hasNext()).thenReturn(true);
        when(results.next()).thenReturn(statement);
        when(statement.getSubject()).thenReturn(recordPolicyIRI);
        when(configProvider.getRepository()).thenReturn(repository);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(repository.getConnection()).thenReturn(connection);
        when(connection.prepareTupleQuery(anyString())).thenReturn(tupleQuery);
        when(tupleQuery.evaluate()).thenReturn(tupleQueryResult);
        when(tupleQueryResult.hasNext()).thenReturn(true, false);
        when(tupleQueryResult.next()).thenReturn(bindingSet);
        when(bindingSet.getBinding(anyString())).thenReturn(Optional.of(binding));
        when(binding.getValue()).thenReturn(VALUE_FACTORY.createLiteral("urn:record"),
                VALUE_FACTORY.createLiteral("urn:master"), VALUE_FACTORY.createLiteral("urn:user"));
        when(sesameTransformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));

        // InProgressCommit deletion setup
        when(connection.getStatements(eq(null), eq(VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI)), any(IRI.class))).thenReturn(inProgressResults);
        Set<Statement> inProgressCommitIris = new HashSet<>();
        inProgressCommitIris.add(VALUE_FACTORY.createStatement(inProgressCommitIRI, VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI), testIRI));
        when(inProgressResults.iterator()).thenReturn(inProgressCommitIris.iterator());
        doCallRealMethod().when(inProgressResults).forEach(any(Consumer.class));
        when(utilsService.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), eq(connection))).thenReturn(inProgressCommit);
        doNothing().when(utilsService).removeInProgressCommit(any(InProgressCommit.class), eq(connection));

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.utilsService = utilsService;
        recordService.valueFactory = VALUE_FACTORY;
        recordService.provUtils = provUtils;
        recordService.versioningManager = versioningManager;
        recordService.mergeRequestManager = mergeRequestManager;
        recordService.xacmlPolicyManager = xacmlPolicyManager;
        recordService.engineManager = engineManager;
        recordService.configProvider = configProvider;
        recordService.sesameTransformer = sesameTransformer;
        recordService.recordFactory = recordService.shapesGraphRecordFactory;
        recordService.shapesGraphManager = shapesGraphManager;
    }

    /* activate() */

    @Test
    public void activateUserPresentTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("urn:user"));
        when(engineManager.getUsername(any(IRI.class))).thenReturn(Optional.of("user"));
        when(engineManager.retrieveUser(eq("user"))).thenReturn(Optional.of(user));

        recordService.activate();
        verify(xacmlPolicyManager, times(0)).addPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void activateUserNotPresentTest() throws Exception {
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

        ShapesGraphRecord shaclRecord = recordService.create(user, config, connection);
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
        
        verify(utilsService, times(2)).addObject(any(Record.class),
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

        ShapesGraphRecord shaclRecord = recordService.create(user, config, connection);
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

        verify(utilsService, times(2)).addObject(any(Record.class),
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
        config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, MODEL_FACTORY.createModel());

        ShapesGraphRecord shaclRecord = recordService.create(user, config, connection);
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

        verify(utilsService, times(2)).addObject(any(Record.class),
                any(RepositoryConnection.class));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user),
                anyString(), any(Model.class), eq(null), any(RepositoryConnection.class));
        verify(xacmlPolicyManager, times(0)).addPolicy(any(XACMLPolicy.class));
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
        try {
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
        try {
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
        try {
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
        try {
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
        try {
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

        recordService.create(user, config, connection);
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

        recordService.create(user, config, connection);
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

        recordService.create(user, config, connection);
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

        recordService.create(user, config, connection);
    }

    @Test
    public void deleteTest() throws Exception {
        ShapesGraphRecord deletedRecord = recordService.delete(testIRI, user, connection);

        assertEquals(testRecord, deletedRecord);
        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
        verify(provUtils).startDeleteActivity(eq(user), eq(testIRI));
        verify(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        verify(utilsService).removeVersion(eq(testRecord.getResource()), any(Resource.class), any(RepositoryConnection.class));
        verify(utilsService).removeBranch(eq(testRecord.getResource()), any(Resource.class), any(List.class), any(RepositoryConnection.class));
        verify(provUtils).endDeleteActivity(any(DeleteActivity.class), any(Record.class));
        verify(connection).getStatements(eq(null), eq(VALUE_FACTORY.createIRI(InProgressCommit.onVersionedRDFRecord_IRI)), eq(testIRI));
        verify(utilsService).getInProgressCommit(eq(catalogId), eq(testIRI), eq(inProgressCommitIRI), eq(connection));
        verify(utilsService).removeInProgressCommit(eq(inProgressCommit), eq(connection));
    }

    @Test(expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() throws Exception {
        when(utilsService.optObject(eq(testIRI), eq(recordFactory), eq(connection))).thenReturn(Optional.empty());

        recordService.delete(testIRI, user, connection);
        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
    }

    @Test(expected = RepositoryException.class)
    public void deleteRecordRemoveFails() throws Exception {
        doThrow(RepositoryException.class).when(utilsService).removeObject(any(ShapesGraphRecord.class), any(RepositoryConnection.class));
        recordService.delete(testIRI, user, connection);
    }
}

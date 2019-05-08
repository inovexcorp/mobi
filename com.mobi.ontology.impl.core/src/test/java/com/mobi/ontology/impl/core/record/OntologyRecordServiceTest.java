package com.mobi.ontology.impl.core.record;

/*-
 * #%L
 * com.mobi.ontology.impl.core
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
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
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.record.config.OntologyRecordCreateSettings;
import com.mobi.ontology.utils.cache.OntologyCache;
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
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.WriterConfig;
import org.eclipse.rdf4j.rio.helpers.JSONLDMode;
import org.eclipse.rdf4j.rio.helpers.JSONLDSettings;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class OntologyRecordServiceTest extends OrmEnabledTestCase {

    private final IRI testIRI = VALUE_FACTORY.createIRI("urn:test");
    private final IRI catalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
    private final IRI commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");
    private final IRI tagIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#tag");
    private final IRI distributionIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#distribution");
    private final IRI masterBranchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#master");
    private final IRI recordPolicyIRI = VALUE_FACTORY.createIRI("http://mobi.com/policies/record/encoded-record-policy");

    private SimpleOntologyRecordService recordService;
    private OntologyRecord testRecord;
    private Branch branch;
    private Commit headCommit;
    private Difference difference;
    private User user;
    private DeleteActivity deleteActivity;
    private Tag tag;
    private IRI importedOntologyIRI;
    private Model ontologyModel;
    private OutputStream ontologyJsonLd;

    private OrmFactory<OntologyRecord> recordFactory = getRequiredOrmFactory(OntologyRecord.class);
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
    private SesameTransformer sesameTransformer;

    @Before
    public void setUp() throws Exception {
        recordService = new SimpleOntologyRecordService();
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));
        WriterConfig config = new WriterConfig();
        config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
        importedOntologyIRI = VALUE_FACTORY.createIRI("http://test.org/ontology/IRI");
        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        ontologyModel = MODEL_FACTORY.createModel(Values.mobiModel(Rio.parse(testOntology, "", RDFFormat.TURTLE)));
        ontologyJsonLd = new ByteArrayOutputStream();
        Rio.write(Values.sesameModel(ontologyModel), ontologyJsonLd, RDFFormat.JSONLD, config);

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
        testRecord.setOntologyIRI(testIRI);

        MockitoAnnotations.initMocks(this);
        when(ontologyId1.getOntologyIRI()).thenReturn(Optional.empty());
        when(ontologyId1.getOntologyIdentifier()).thenReturn(importedOntologyIRI);
        when(ontologyId2.getOntologyIRI()).thenReturn(Optional.of(importedOntologyIRI));
        when(ontologyManager.ontologyIriExists(any(IRI.class))).thenReturn(false);
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyId1);
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
        doNothing().when(ontologyCache).clearCache(any(Resource.class));
        doNothing().when(ontologyCache).clearCacheImports(any(Resource.class));
        when(xacmlPolicyManager.addPolicy(any(XACMLPolicy.class))).thenReturn(recordPolicyIRI);
        when(connection.getStatements(eq(null), eq(VALUE_FACTORY.createIRI(Policy.relatedResource_IRI)), any(IRI.class))).thenReturn(results);
        when(results.hasNext()).thenReturn(true);
        when(results.next()).thenReturn(statement);
        when(statement.getSubject()).thenReturn(recordPolicyIRI);
        when(configProvider.getRepository()).thenReturn(repository);
        when(repository.getConnection()).thenReturn(connection);
        when(connection.prepareTupleQuery(anyString())).thenReturn(tupleQuery);
        when(tupleQuery.evaluate()).thenReturn(tupleQueryResult);
        when(tupleQueryResult.hasNext()).thenReturn(true, false);
        when(tupleQueryResult.next()).thenReturn(bindingSet);
        when(bindingSet.getBinding(anyString())).thenReturn(Optional.of(binding));
        when(binding.getValue()).thenReturn(VALUE_FACTORY.createLiteral("urn:record"),
                VALUE_FACTORY.createLiteral("urn:master"), VALUE_FACTORY.createLiteral("urn:user"));
        when(sesameTransformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.setOntologyManager(ontologyManager);
        recordService.setUtilsService(utilsService);
        recordService.setVf(VALUE_FACTORY);
        recordService.setModelFactory(MODEL_FACTORY);
        recordService.setProvUtils(provUtils);
        recordService.setOntologyCache(ontologyCache);
        recordService.setVersioningManager(versioningManager);
        recordService.setMergeRequestManager(mergeRequestManager);
        recordService.setPolicyManager(xacmlPolicyManager);
        recordService.setEngineManager(engineManager);
        recordService.setCatalogConfigProvider(configProvider);
        recordService.setSesameTransformer(sesameTransformer);
    }

    /* activate() */

    @Test
    public void activateUserPresentTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("urn:user"));
        when(engineManager.getUsername(any(IRI.class))).thenReturn(Optional.of("user"));
        when(engineManager.retrieveUser(eq("user"))).thenReturn(Optional.of(user));

        recordService.activate();
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void activateUserNotPresentTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("urn:admin"));
        when(engineManager.getUsername(any(IRI.class))).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(eq("admin"))).thenReturn(Optional.of(user));

        recordService.activate();
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
    }

    /* create() */

    @Test
    public void createWithoutOntologyIRITest() throws Exception {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(OntologyRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-ontology.ttl"));
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        OntologyRecord ontologyRecord = recordService.create(user, config, connection);
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
        Set<Literal> keywords = ontologyRecord.getKeyword();
        assertEquals(names.size(), keywords.size());
        assertEquals(1, ontologyRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = ontologyRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optOntologyIri = ontologyRecord.getOntologyIRI();
        assertTrue(optOntologyIri.isPresent());
        assertEquals(importedOntologyIRI.stringValue(), optOntologyIri.get().stringValue());

        verify(ontologyId1).getOntologyIRI();
        verify(ontologyId1).getOntologyIdentifier();
        verify(ontologyManager).createOntologyId(any(Model.class));
        verify(utilsService, times(2)).addObject(any(Record.class),
                any(RepositoryConnection.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test
    public void createWithOntologyIRITest() throws Exception {
        // Setup:
        RecordOperationConfig config = new OperationConfig();
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(OntologyRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/test-ontology.ttl"));
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyId2);

        OntologyRecord ontologyRecord = recordService.create(user, config, connection);
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
        Set<Literal> keywords = ontologyRecord.getKeyword();
        assertEquals(names.size(), keywords.size());
        assertEquals(1, ontologyRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = ontologyRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optOntologyIri = ontologyRecord.getOntologyIRI();
        assertTrue(optOntologyIri.isPresent());
        assertEquals(importedOntologyIRI.stringValue(), optOntologyIri.get().stringValue());

        verify(ontologyId2).getOntologyIRI();
        verify(ontologyId2).getOntologyIdentifier();
        verify(ontologyManager).createOntologyId(any(Model.class));
        verify(utilsService, times(2)).addObject(any(Record.class),
                any(RepositoryConnection.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test
    public void createWithoutInputFileTest() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, MODEL_FACTORY.createModel());

        OntologyRecord ontologyRecord = recordService.create(user, config, connection);
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
        Set<Literal> keywords = ontologyRecord.getKeyword();
        assertEquals(names.size(), keywords.size());
        assertEquals(1, ontologyRecord.getBranch_resource().size());
        Optional<Resource> optMasterBranch = ontologyRecord.getMasterBranch_resource();
        assertTrue(optMasterBranch.isPresent());
        Optional<Resource> optOntologyIri = ontologyRecord.getOntologyIRI();
        assertTrue(optOntologyIri.isPresent());
        assertEquals(importedOntologyIRI.stringValue(), optOntologyIri.get().stringValue());

        verify(ontologyId1).getOntologyIdentifier();
        verify(ontologyManager).createOntologyId(any(Model.class));
        verify(utilsService, times(2)).addObject(any(Record.class),
                any(RepositoryConnection.class));
        verify(versioningManager).commit(eq(catalogId), any(IRI.class), any(IRI.class), eq(user),
                anyString(), any(Model.class), eq(null), any(RepositoryConnection.class));
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void createWithoutInputFileOrModelTest() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        recordService.create(user, config, connection);
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutCatalogID() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestDescription");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        recordService.create(user, config, connection);
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutPublisher() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestDescription");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);

        recordService.create(user, config, connection);
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutTitle() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        recordService.create(user, config, connection);
    }

    @Test
    public void deleteTest() throws Exception {
        OntologyRecord deletedRecord = recordService.delete(testIRI, user, connection);

        assertEquals(testRecord, deletedRecord);
        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
        verify(provUtils).startDeleteActivity(eq(user), eq(testIRI));
        verify(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(testIRI), any(RepositoryConnection.class));
        verify(utilsService).removeVersion(eq(testRecord.getResource()), any(Resource.class), any(RepositoryConnection.class));
        verify(utilsService).removeBranch(eq(testRecord.getResource()), any(Resource.class), any(List.class), any(RepositoryConnection.class));
        verify(provUtils).endDeleteActivity(any(DeleteActivity.class), any(Record.class));
        verify(ontologyCache).clearCache(any(Resource.class));
        verify(ontologyCache).clearCacheImports(any(Resource.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() throws Exception {
        when(utilsService.optObject(eq(testIRI), eq(recordFactory), eq(connection))).thenReturn(Optional.empty());

        recordService.delete(testIRI, user, connection);
        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
    }

    @Test
    public void deleteRecordRemoveFails() throws Exception {
        doThrow(RepositoryException.class).when(utilsService).removeObject(any(OntologyRecord.class), any(RepositoryConnection.class));
        thrown.expect(RepositoryException.class);

        recordService.delete(testIRI, user, connection);
        verify(provUtils).removeActivity(any(DeleteActivity.class));
    }
}

package com.mobi.etl.service.delimited.record;

/*-
 * #%L
 * com.mobi.etl.delimited
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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.delimited.MappingId;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.delimited.record.config.MappingRecordCreateSettings;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Statement;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class MappingRecordServiceTest extends OrmEnabledTestCase {
    private SimpleMappingRecordService recordService;
    private MappingRecord testRecord;

    private final IRI catalogIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI recordIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#record");
    private final IRI branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
    private final IRI commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");
    private final IRI recordPolicyIRI = VALUE_FACTORY.createIRI("http://mobi.com/policies/record/encoded-record-policy");

    private DeleteActivity deleteActivity;
    private Model mappingModel;
    private OutputStream mappingJsonLd;
    private User user;
    private Branch branch;
    private Commit headCommit;

    private OrmFactory<MappingRecord> recordFactory = getRequiredOrmFactory(MappingRecord.class);
    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private MappingManager manager;

    @Mock
    private CatalogUtilsService utilsService;

    @Mock
    private MergeRequestManager mergeRequestManager;

    @Mock
    private CatalogProvUtils provUtils;

    @Mock
    private VersioningManager versioningManager;

    @Mock
    private XACMLPolicyManager xacmlPolicyManager;

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private EngineManager engineManager;

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
    private MappingWrapper mappingWrapper;

    @Mock
    private MappingId mappingId;

    @Before
    public void setUp() throws Exception {
        recordService = new SimpleMappingRecordService();
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));
        WriterConfig config = new WriterConfig();
        config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
        InputStream testMapping = getClass().getResourceAsStream("/newestMapping.ttl");
        mappingModel = MODEL_FACTORY.createModel(Values.mobiModel(Rio.parse(testMapping, "", RDFFormat.TURTLE)));
        mappingJsonLd = new ByteArrayOutputStream();
        Rio.write(Values.sesameModel(mappingModel), mappingJsonLd, RDFFormat.JSONLD, config);

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));
        headCommit = commitFactory.createNew(commitIRI);
        branch = branchFactory.createNew(branchIRI);
        branch.setHead(headCommit);
        branch.setProperty(VALUE_FACTORY.createLiteral("Test Branch"), VALUE_FACTORY.createIRI(_Thing.title_IRI));

        testRecord = recordFactory.createNew(recordIRI);
        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        testRecord.setCatalog(catalogFactory.createNew(catalogIRI));
        testRecord.setBranch(Collections.singleton(branch));
        testRecord.setMasterBranch(branch);

        MockitoAnnotations.initMocks(this);

        when(configProvider.getRepository()).thenReturn(repository);

        when(repository.getConnection()).thenReturn(connection);

        when(connection.prepareTupleQuery(anyString())).thenReturn(tupleQuery);
        when(connection.getStatements(eq(null), eq(VALUE_FACTORY.createIRI(Policy.relatedResource_IRI)), any(IRI.class))).thenReturn(results);

        when(tupleQuery.evaluate()).thenReturn(tupleQueryResult);

        when(tupleQueryResult.hasNext()).thenReturn(true, false);
        when(tupleQueryResult.next()).thenReturn(bindingSet);

        when(bindingSet.getBinding(anyString())).thenReturn(Optional.of(binding));

        when(binding.getValue()).thenReturn(VALUE_FACTORY.createLiteral("urn:record"),
                VALUE_FACTORY.createLiteral("urn:master"), VALUE_FACTORY.createLiteral("urn:user"));

        when(results.hasNext()).thenReturn(true);
        when(results.next()).thenReturn(statement);

        when(statement.getSubject()).thenReturn(recordPolicyIRI);

        when(xacmlPolicyManager.addPolicy(any(XACMLPolicy.class))).thenReturn(recordPolicyIRI);

        when(utilsService.optObject(any(IRI.class), any(OrmFactory.class), eq(connection))).thenReturn(Optional.of(testRecord));
        when(utilsService.getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection))).thenReturn(branch);
        when(utilsService.getHeadCommitIRI(eq(branch))).thenReturn(commitIRI);
        doReturn(Stream.of(commitIRI).collect(Collectors.toList()))
                .when(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        when(utilsService.getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection))).thenReturn(headCommit);

        when(mappingWrapper.getModel()).thenReturn(mappingModel);
        when(mappingWrapper.getId()).thenReturn(mappingId);

        when(manager.createMapping(any(Model.class))).thenReturn(mappingWrapper);
        when(manager.createMapping(any(InputStream.class), any(RDFFormat.class))).thenReturn(mappingWrapper);

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.setManager(manager);
        recordService.setUtilsService(utilsService);
        recordService.setVf(VALUE_FACTORY);
        recordService.setProvUtils(provUtils);
        recordService.setVersioningManager(versioningManager);
        recordService.setMergeRequestManager(mergeRequestManager);
        recordService.setPolicyManager(xacmlPolicyManager);
        recordService.setEngineManager(engineManager);
        recordService.setCatalogConfigProvider(configProvider);
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
    public void createTest() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = Stream.of("A", "B").collect(Collectors.toSet());
        Set<User> users = Collections.singleton(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogIRI.stringValue());
        config.set(MappingRecordCreateSettings.INPUT_STREAM, getClass().getResourceAsStream("/newestMapping.ttl"));
        config.set(MappingRecordCreateSettings.RDF_FORMAT, RDFFormat.TURTLE);
        config.set(RecordCreateSettings.RECORD_TITLE, "Title");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "Description");
        config.set(RecordCreateSettings.RECORD_MARKDOWN, "# Markdown");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        recordService.create(user, config, connection);

        verify(mappingWrapper).getModel();
        verify(manager).createMapping(any(InputStream.class), eq(RDFFormat.TURTLE));
        verify(utilsService, times(2)).addObject(any(Record.class), eq(connection));
        verify(versioningManager).commit(eq(catalogIRI), any(IRI.class), any(IRI.class), eq(user), eq("The initial commit."), eq(mappingModel), eq(null), eq(connection));
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
        verify(provUtils).startCreateActivity(user);
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test
    public void createWithoutInputFileTest() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = Stream.of("A", "B").collect(Collectors.toSet());
        Set<User> users = Collections.singleton(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogIRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "Title");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "Description");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, mappingModel);

        recordService.create(user, config, connection);

        verify(mappingWrapper).getModel();
        verify(manager).createMapping(mappingModel);
        verify(utilsService, times(2)).addObject(any(Record.class), any(RepositoryConnection.class));
        verify(xacmlPolicyManager, times(2)).addPolicy(any(XACMLPolicy.class));
        verify(provUtils).startCreateActivity(eq(user));
        verify(provUtils).endCreateActivity(any(CreateActivity.class), any(IRI.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void createWithoutInputFileOrModelTest() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = Stream.of("A", "B").collect(Collectors.toSet());
        Set<User> users = Collections.singleton(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogIRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "Title");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "Description");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        recordService.create(user, config, connection);
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutCatalogID() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = Stream.of("A", "B").collect(Collectors.toSet());
        Set<User> users = Collections.singleton(user);
        config.set(RecordCreateSettings.RECORD_TITLE, "Title");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "Description");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        recordService.create(user, config, connection);
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutPublisher() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = Stream.of("A", "B").collect(Collectors.toSet());
        config.set(RecordCreateSettings.CATALOG_ID, catalogIRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "Title");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "Description");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);

        recordService.create(user, config, connection);
    }

    @Test (expected = IllegalArgumentException.class)
    public void createRecordWithoutTitle() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        Set<String> keywords = Stream.of("A", "B").collect(Collectors.toSet());
        Set<User> users = Collections.singleton(user);
        config.set(RecordCreateSettings.CATALOG_ID, catalogIRI.stringValue());
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "Description");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        recordService.create(user, config, connection);
    }

    @Test
    public void deleteTest() throws Exception {
        MappingRecord deletedRecord = recordService.delete(recordIRI, user, connection);

        assertEquals(testRecord, deletedRecord);
        verify(utilsService).optObject(recordIRI, recordFactory, connection);
        verify(provUtils).startDeleteActivity(user, recordIRI);
        verify(mergeRequestManager).deleteMergeRequestsWithRecordId(recordIRI, connection);
        verify(utilsService).removeBranch(eq(recordIRI), eq(branchIRI), any(List.class), eq(connection));
        verify(provUtils).endDeleteActivity(any(DeleteActivity.class), any(Record.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() throws Exception {
        when(utilsService.optObject(recordIRI, recordFactory, connection)).thenReturn(Optional.empty());

        recordService.delete(recordIRI, user, connection);
    }

    @Test
    public void deleteRecordRemoveFails() throws Exception {
        doThrow(RepositoryException.class).when(utilsService).removeObject(any(MappingRecord.class), any(RepositoryConnection.class));
        thrown.expect(RepositoryException.class);

        recordService.delete(recordIRI, user, connection);
        verify(provUtils).removeActivity(any(DeleteActivity.class));
    }
}

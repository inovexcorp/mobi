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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.catalog.impl.CatalogProvUtilsImpl;
import com.mobi.catalog.impl.ManagerTestConstants;
import com.mobi.catalog.impl.SimpleBranchManager;
import com.mobi.catalog.impl.SimpleCommitManager;
import com.mobi.catalog.impl.SimpleDifferenceManager;
import com.mobi.catalog.impl.SimpleRecordManager;
import com.mobi.catalog.impl.SimpleRevisionManager;
import com.mobi.catalog.impl.SimpleThingManager;
import com.mobi.catalog.impl.record.SimpleVersionedRDFRecordService;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.event.EventAdmin;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

// TODO DELETE THIS FILE
@Ignore
public class GenerateDataTest extends OrmEnabledTestCase {
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);

    private AutoCloseable closeable;
    private SimpleVersioningService service;
    private User user;
    private Catalog catalog;
    private MemoryRepositoryWrapper repo;
    private SimpleThingManager thingManager;
    private SimpleRecordManager recordManager;
    private SimpleBranchManager branchManager;
    private SimpleCommitManager commitManager;
    private SimpleRevisionManager revisionManager;
    private SimpleDifferenceManager differenceManager;
    private SimpleVersioningManager versioningManager;
    private IRI baseIRI;
    private List<IRI> dcTermsIRIs;
    private int commitCount;

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private XACMLPolicyManager policyManager;

    @Mock
    private CatalogProvUtilsImpl provUtils;

    @Mock
    private EventAdmin eventAdmin;

    @Mock
    private BundleContext context;

    @Mock
    private ServiceReference<EventAdmin> serviceReference;

    @Before
    public void setUp() throws Exception {
        commitCount = 1;
        baseIRI = VALUE_FACTORY.createIRI("urn:test");
        Field[] declaredFields = DCTERMS.class.getDeclaredFields();
        dcTermsIRIs = new ArrayList<>();
        for (Field field : declaredFields) {
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers()) && field.getType() == IRI.class) {
                dcTermsIRIs.add((IRI) field.get(DCTERMS.class));
            }
        }
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);

        catalog = catalogFactory.createNew(ManagerTestConstants.CATALOG_IRI);
        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#user"));

        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(catalog, conn);
        }

        closeable = MockitoAnnotations.openMocks(this);
        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn((IRI) catalog.getResource());
        when(policyManager.addPolicy(any())).thenReturn(VALUE_FACTORY.createIRI("urn:test"));

        when(context.getServiceReference(EventAdmin.class)).thenReturn(serviceReference);
        when(context.getService(serviceReference)).thenReturn(eventAdmin);

        recordManager = new SimpleRecordManager();
        branchManager = new SimpleBranchManager();
        commitManager = new SimpleCommitManager();
        thingManager = new SimpleThingManager();
        revisionManager = new SimpleRevisionManager();
        differenceManager = new SimpleDifferenceManager();
        versioningManager = new SimpleVersioningManager();
        SimpleVersionedRDFRecordService recordService = new SimpleVersionedRDFRecordService();
        recordService.revisionManager = revisionManager;
        recordService.recordManager = recordManager;
        recordService.branchManager = branchManager;
        recordService.thingManager = thingManager;
        recordService.commitManager = commitManager;
        recordService.differenceManager = differenceManager;
        recordService.provUtils = provUtils;
        recordService.configProvider = configProvider;
        recordService.versioningManager = versioningManager;
        recordService.xacmlPolicyManager = policyManager;
        injectOrmFactoryReferencesIntoService(branchManager);
        injectOrmFactoryReferencesIntoService(commitManager);
        injectOrmFactoryReferencesIntoService(thingManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(recordManager);
        injectOrmFactoryReferencesIntoService(differenceManager);
        injectOrmFactoryReferencesIntoService(recordService);
        injectOrmFactoryReferencesIntoService(versioningManager);
        recordService.recordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);

        getField(SimpleBranchManager.class, "thingManager").set(branchManager, thingManager);
        getField(SimpleBranchManager.class, "recordManager").set(branchManager, recordManager);
        getField(SimpleCommitManager.class, "thingManager").set(commitManager, thingManager);
        getField(SimpleCommitManager.class, "recordManager").set(commitManager, recordManager);
        getField(SimpleRevisionManager.class, "thingManager").set(revisionManager, thingManager);
        getField(SimpleCommitManager.class, "revisionManager").set(commitManager, revisionManager);
        getField(SimpleRecordManager.class, "thingManager").set(recordManager, thingManager);
        getField(SimpleDifferenceManager.class, "revisionManager").set(differenceManager, revisionManager);
        getField(SimpleDifferenceManager.class, "thingManager").set(differenceManager, thingManager);
        getField(SimpleDifferenceManager.class, "commitManager").set(differenceManager, commitManager);
        getField(SimpleVersioningManager.class, "recordManager").set(versioningManager, recordManager);
        getField(SimpleVersioningManager.class, "branchManager").set(versioningManager, branchManager);

        Map<Class, RecordService> recordServiceMap = new HashMap<>();
        recordServiceMap.put(recordService.getType(), recordService);
        getField(SimpleRecordManager.class, "recordServices").set(recordManager, recordServiceMap);

        service = new SimpleVersioningService();
        versioningManager.addVersioningService(service);
        versioningManager.factoryRegistry = getOrmFactoryRegistry();
        injectOrmFactoryReferencesIntoService(service);
        service.commitManager = commitManager;
        service.thingManager = thingManager;
        service.branchManager = branchManager;
        service.revisionManager = revisionManager;
        service.start(context);
        System.setProperty("karaf.etc", "/Users/tomdalton/workspace/mobi/com.mobi.catalog.impl/src/test/resources"); // TODO: FIX
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void generateDataTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = createRecord(conn);
            MasterBranch masterBranch = branchManager.getMasterBranch(catalog.getResource(), record.getResource(), conn);
            System.out.println("Master initial: " + masterBranch.getHead_resource().get().stringValue());

            System.out.println("Master second: " + generateCommit(record, masterBranch, conn).stringValue());

            Commit masterHead = commitManager.getCommit(masterBranch.getHead_resource().get(), conn).get();
            Branch branch1 = generateBranch(record, masterHead, "Branch 1", conn);
            Resource branch2BranchingResource = generateCommit(record, branch1, conn);

            System.out.println("Branch1 initial: " + branch2BranchingResource.stringValue());

            commitManager.getCommit(branch1.getHead_resource().get(), conn).get();
            Commit branch2BranchingCommit = commitManager.getCommit(branch2BranchingResource, conn).get();
            Branch branch2 = generateBranch(record, branch2BranchingCommit, "Branch 2", conn);

            System.out.println("Branch2 initial: " + generateCommit(record, branch2, conn));
            System.out.println("Branch1 second: " + generateCommit(record, branch1, conn));
            Resource commitToTest = generateCommit(record, branch2, conn);
            System.out.println("Branch2 second: " + commitToTest);

//            service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
//            service.mergeIntoMaster(record, branch2, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
            System.out.println("Master HEAD: " + generateCommit(record, masterBranch, conn));

            List<Commit> result = commitManager.getCommitChain(commitToTest, conn);
            System.out.println("COMMITS");
            result.forEach(commit -> System.out.println(commit.getResource().stringValue()));

            dumpRepoToTargetDir("test.trig", conn);
        }
    }

    @Test
    public void generateDataTest2() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = createRecord(conn);
            MasterBranch masterBranch = branchManager.getMasterBranch(catalog.getResource(), record.getResource(), conn);
            System.out.println("Master initial: " + masterBranch.getHead_resource().get().stringValue());

            System.out.println("Master second: " + generateCommit(record, masterBranch, conn).stringValue());

            Commit masterHead = commitManager.getCommit(masterBranch.getHead_resource().get(), conn).get();
            Branch branch1 = generateBranch(record, masterHead, "Branch 1", conn);
            Resource branch2BranchingResource = generateCommit(record, branch1, conn);

            System.out.println("Branch1 initial: " + branch2BranchingResource.stringValue());

            commitManager.getCommit(branch1.getHead_resource().get(), conn).get();
            Commit branch2BranchingCommit = commitManager.getCommit(branch2BranchingResource, conn).get();
            Branch branch2 = generateBranch(record, branch2BranchingCommit, "Branch 2", conn);

            System.out.println("Branch2 initial: " + generateCommit(record, branch2, conn));
            System.out.println("Branch1 second: " + generateCommit(record, branch1, conn));
            Resource commitToTest = generateCommit(record, branch2, conn);
            System.out.println("Branch2 second: " + commitToTest);

            Resource branch1MergeCommit = service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), new HashMap<>(), conn);
            Resource branch2MergeCommit = service.mergeIntoMaster(record, branch2, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), new HashMap<>(), conn);
            System.out.println("Branch1 Merge into Master: " + branch1MergeCommit);
            System.out.println("Branch2 Merge into Master: " + branch2MergeCommit);

            System.out.println("Master HEAD: " + generateCommit(record, masterBranch, conn));

            List<Commit> result = commitManager.getCommitChain(commitToTest, conn);
            System.out.println("COMMITS");
            result.forEach(commit -> System.out.println(commit.getResource().stringValue()));

            dumpRepoToTargetDir("test.trig", conn);
        }
    }

    @Test
    public void generateData2UnmergedBranchesTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = createRecord(conn);
            MasterBranch masterBranch = branchManager.getMasterBranch(catalog.getResource(), record.getResource(), conn);
            System.out.println("Master initial: " + masterBranch.getHead_resource().get().stringValue());

            System.out.println("Master second: " + generateCommit(record, masterBranch, conn).stringValue());

            Commit masterHead = commitManager.getCommit(masterBranch.getHead_resource().get(), conn).get();
            Branch branch1 = generateBranch(record, masterHead, "Branch 1", conn);
            Resource branch2BranchingResource = generateCommit(record, branch1, conn);

            System.out.println("Branch1 initial: " + branch2BranchingResource.stringValue());

            commitManager.getCommit(branch1.getHead_resource().get(), conn).get();
            Commit branch2BranchingCommit = commitManager.getCommit(branch2BranchingResource, conn).get();
            Branch branch2 = generateBranch(record, branch2BranchingCommit, "Branch 2", conn);

            System.out.println("Branch2 initial: " + generateCommit(record, branch2, conn));
            System.out.println("Branch1 second: " + generateCommit(record, branch1, conn));
            Resource commitToTest = generateCommit(record, branch2, conn);
            System.out.println("Branch2 second: " + commitToTest);

//            service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
//            service.mergeIntoMaster(record, branch2, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
            System.out.println("Master HEAD: " + generateCommit(record, masterBranch, conn));

            List<Commit> result = commitManager.getCommitChain(commitToTest, conn);
            System.out.println("COMMITS");
            result.forEach(commit -> System.out.println(commit.getResource().stringValue()));

            System.out.println("COMMIT TO TEST");
            System.out.println(commitToTest);

            dumpRepoToTargetDir("test.trig", conn);
        }
    }

    @Test
    public void generateData2BranchesMergedNOTMASTERTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> expectedCommits = new ArrayList<>();
            VersionedRDFRecord record = createRecord(conn);
            MasterBranch masterBranch = branchManager.getMasterBranch(catalog.getResource(), record.getResource(), conn);
            System.out.println("Master initial: " + masterBranch.getHead_resource().get().stringValue());

            System.out.println("Master second: " + generateCommit(record, masterBranch, conn).stringValue());

            Commit masterHead = commitManager.getCommit(masterBranch.getHead_resource().get(), conn).get();
            Branch branch1 = generateBranch(record, masterHead, "Branch 1", conn);
            Resource branch2BranchingResource = generateCommit(record, branch1, conn);

            System.out.println("Branch1 initial: " + branch2BranchingResource.stringValue());

            commitManager.getCommit(branch1.getHead_resource().get(), conn).get();
            Commit branch2BranchingCommit = commitManager.getCommit(branch2BranchingResource, conn).get();
            Branch branch2 = generateBranch(record, branch2BranchingCommit, "Branch 2", conn);

            System.out.println("Branch2 initial: " + generateCommit(record, branch2, conn));
            System.out.println("Branch1 second: " + generateCommit(record, branch1, conn));
            System.out.println("Merge commit: " + service.mergeIntoBranch(record, branch2, branch1, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(),  new HashMap<>(), conn));

            Resource commitToTest = generateCommit(record, branch1, conn);
            System.out.println("Branch1 third: " + commitToTest);

//            service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
//            service.mergeIntoMaster(record, branch2, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
            System.out.println("Master HEAD: " + generateCommit(record, masterBranch, conn));

            List<Commit> result = commitManager.getCommitChain(commitToTest, conn);
            System.out.println("COMMITS");
            result.forEach(commit -> System.out.println(commit.getResource().stringValue()));

            System.out.println("REVISIONS");
            result.forEach(commit -> {
                System.out.println(commit.getProperty(PROV.GENERATED).get().stringValue());
                Set<Value> influenced = commit.getProperties(PROV.INFLUENCED);
                influenced.forEach(influencedVal -> System.out.println("\t" + influencedVal.stringValue()));
            });

            System.out.println("COMMIT TO TEST");
            System.out.println(commitToTest);
            System.out.println("\n");

            List<Revision> revisionList = revisionManager.getRevisionChain(commitToTest, conn);
            revisionList.forEach(revision -> {
                System.out.println(revision.getResource().stringValue());
            });

            dumpRepoToTargetDir("test.trig", conn);

            // https://mobi.com/commits#a2be4863-0096-4724-a0cc-89bddc78c80c
            // https://mobi.com/commits#0556e18e-5e33-42bc-8f3b-c1c9bce1cfcb
        }
    }

    @Test
    public void generateData2BranchesMergedNOTMASTER_IntoMasterTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> expectedCommits = new ArrayList<>();
            VersionedRDFRecord record = createRecord(conn);
            MasterBranch masterBranch = branchManager.getMasterBranch(catalog.getResource(), record.getResource(), conn);
            System.out.println("Master initial: " + masterBranch.getHead_resource().get().stringValue());

            System.out.println("Master second: " + generateCommit(record, masterBranch, conn).stringValue());

            Commit masterHead = commitManager.getCommit(masterBranch.getHead_resource().get(), conn).get();
            Branch branch1 = generateBranch(record, masterHead, "Branch 1", conn);
            Resource branch2BranchingResource = generateCommit(record, branch1, conn);

            System.out.println("Branch1 initial: " + branch2BranchingResource.stringValue());

            commitManager.getCommit(branch1.getHead_resource().get(), conn).get();
            Commit branch2BranchingCommit = commitManager.getCommit(branch2BranchingResource, conn).get();
            Branch branch2 = generateBranch(record, branch2BranchingCommit, "Branch 2", conn);

            System.out.println("Branch2 initial: " + generateCommit(record, branch2, conn));

            System.out.println("Branch1 second: " + generateCommit(record, branch1, conn));
            System.out.println("Branch2 second: " + generateCommit(record, branch2, conn));

            System.out.println("Merge commit: " + service.mergeIntoBranch(record, branch2, branch1, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(),  new HashMap<>(), conn));
            System.out.println("Master third: " + generateCommit(record, masterBranch, conn));

            Resource commitToTest = generateCommit(record, branch1, conn);
            System.out.println("Branch1 third: " + commitToTest);

            System.out.println("Merge commit: " + service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(),  new HashMap<>(), conn));


//            service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
//            service.mergeIntoMaster(record, branch2, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
            System.out.println("Master HEAD: " + generateCommit(record, masterBranch, conn));

            List<Commit> result = commitManager.getCommitChain(commitToTest, conn);
            System.out.println("COMMITS");
            result.forEach(commit -> System.out.println(commit.getResource().stringValue()));

            System.out.println("REVISIONS");
            result.forEach(commit -> {
                System.out.println(commit.getProperty(PROV.GENERATED).get().stringValue());
                Set<Value> influenced = commit.getProperties(PROV.INFLUENCED);
                influenced.forEach(influencedVal -> System.out.println("\t" + influencedVal.stringValue()));
            });

            System.out.println("COMMIT TO TEST");
            System.out.println(commitToTest);
            System.out.println("\n");

            List<Revision> revisionList = revisionManager.getRevisionChain(commitToTest, conn);
            revisionList.forEach(revision -> {
                System.out.println(revision.getResource().stringValue());
            });

            dumpRepoToTargetDir("test.trig", conn);

            // https://mobi.com/commits#a2be4863-0096-4724-a0cc-89bddc78c80c
            // https://mobi.com/commits#0556e18e-5e33-42bc-8f3b-c1c9bce1cfcb
        }
    }

    @Test
    public void generateData2BranchesMergedNOTMASTER_MasterMergedBackTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> expectedCommits = new ArrayList<>();
            VersionedRDFRecord record = createRecord(conn);
            MasterBranch masterBranch = branchManager.getMasterBranch(catalog.getResource(), record.getResource(), conn);
            System.out.println("Master initial: " + masterBranch.getHead_resource().get().stringValue());

            System.out.println("Master second: " + generateCommit(record, masterBranch, conn).stringValue());

            Commit masterHead = commitManager.getCommit(masterBranch.getHead_resource().get(), conn).get();
            Branch branch1 = generateBranch(record, masterHead, "Branch 1", conn);
            Resource branch2BranchingResource = generateCommit(record, branch1, conn);

            System.out.println("Branch1 initial: " + branch2BranchingResource.stringValue());

            commitManager.getCommit(branch1.getHead_resource().get(), conn).get();
            Commit branch2BranchingCommit = commitManager.getCommit(branch2BranchingResource, conn).get();
            Branch branch2 = generateBranch(record, branch2BranchingCommit, "Branch 2", conn);

            System.out.println("Branch2 initial: " + generateCommit(record, branch2, conn));
            System.out.println("Branch2 second: " + generateCommit(record, branch2, conn));

            System.out.println("Branch1 second: " + generateCommit(record, branch1, conn));
            System.out.println("Merge commit: " + service.mergeIntoBranch(record, branch2, branch1, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(),  new HashMap<>(), conn));

            System.out.println("Master third: " + generateCommit(record, masterBranch, conn));
            System.out.println("Merge commit master into branch: " + service.mergeIntoBranch(record, masterBranch, branch1, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(),  new HashMap<>(), conn));

            Resource commitToTest = generateCommit(record, branch1, conn);
            System.out.println("Branch1 third: " + commitToTest);

            System.out.println("Master HEAD: " + generateCommit(record, masterBranch, conn));

//            service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
//            service.mergeIntoMaster(record, branch2, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);


            List<Commit> result = commitManager.getCommitChain(commitToTest, conn);
            System.out.println("COMMITS");
            result.forEach(commit -> System.out.println(commit.getResource().stringValue()));

            System.out.println("COMMIT TO TEST");
            System.out.println(commitToTest);

            dumpRepoToTargetDir("test.trig", conn);

            // https://mobi.com/commits#a2be4863-0096-4724-a0cc-89bddc78c80c
            // https://mobi.com/commits#0556e18e-5e33-42bc-8f3b-c1c9bce1cfcb
        }
    }



    @Test
    public void mergeMasterBackIntoBranch() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> expectedCommits = new ArrayList<>();
            VersionedRDFRecord record = createRecord(conn);
            MasterBranch masterBranch = branchManager.getMasterBranch(catalog.getResource(), record.getResource(), conn);
            System.out.println("Master initial: " + masterBranch.getHead_resource().get().stringValue());

            System.out.println("Master second: " + generateCommit(record, masterBranch, conn).stringValue());

            Commit masterHead = commitManager.getCommit(masterBranch.getHead_resource().get(), conn).get();
            Branch branch1 = generateBranch(record, masterHead, "Branch 1", conn);
            Resource branch2BranchingResource = generateCommit(record, branch1, conn);

            System.out.println("Branch1 initial: " + branch2BranchingResource.stringValue());
            System.out.println("Branch1 second: " + generateCommit(record, branch1, conn));
            System.out.println("Master third: " + generateCommit(record, masterBranch, conn));

            System.out.println("Merge commit master into branch: " + service.mergeIntoBranch(record, masterBranch, branch1, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(),  new HashMap<>(), conn));

            System.out.println("Master HEAD: " + generateCommit(record, masterBranch, conn));

            Resource commitToTest = generateCommit(record, branch1, conn);
            System.out.println("Branch1 third: " + commitToTest);


//            service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
//            service.mergeIntoMaster(record, branch2, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);


            List<Commit> result = commitManager.getCommitChain(commitToTest, conn);
            System.out.println("COMMITS");
            result.forEach(commit -> System.out.println(commit.getResource().stringValue()));

            System.out.println("COMMIT TO TEST");
            System.out.println(commitToTest);

            dumpRepoToTargetDir("test.trig", conn);

            // https://mobi.com/commits#a2be4863-0096-4724-a0cc-89bddc78c80c
            // https://mobi.com/commits#0556e18e-5e33-42bc-8f3b-c1c9bce1cfcb
        }
    }

    private Resource generateCommit(VersionedRDFRecord record, Branch branch, RepositoryConnection conn) {
        InProgressCommit ipc = commitManager.createInProgressCommit(user);
        ipc.setOnVersionedRDFRecord(record);
        Revision ipcRevision = revisionManager.getGeneratedRevision(ipc);
        ipcRevision.getAdditions().ifPresent(addGraph -> {
            Random random = new Random();
            IRI el1 = dcTermsIRIs.get(random.nextInt(dcTermsIRIs.size()));
            IRI el2 = dcTermsIRIs.get(random.nextInt(dcTermsIRIs.size()));
            conn.add(baseIRI, el1, el2, addGraph);
        });
        commitManager.addInProgressCommit(catalog.getResource(), record.getResource(), ipc, conn);
        commitCount++;
        if (branchManager.isMasterBranch(record, branch)) {
            return service.addMasterCommit(record, (MasterBranch) branch, user, "Commit Number " + commitCount + " on " + branch.getProperty(DCTERMS.TITLE).get(), conn);
        } else {
            return service.addBranchCommit(record, branch, user, "Commit Number " + commitCount + " on " + branch.getProperty(DCTERMS.TITLE).get(), conn);
        }
    }

    private Branch generateBranch(VersionedRDFRecord record, Commit commit, String title, RepositoryConnection conn) {
        Branch branch = branchManager.createBranch(title, title + " Description", branchFactory);
        branch.setHead(commit);
        branchManager.addBranch(catalog.getResource(), record.getResource(), branch, conn);
        return branch;
    }

    private VersionedRDFRecord createRecord(RepositoryConnection conn) {
        RecordOperationConfig config = new OperationConfig();
        config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, this.getClass().getResourceAsStream("/dcterms.ttl"));
        config.set(VersionedRDFRecordCreateSettings.FILE_NAME, "dcterms.ttl");
        config.set(RecordCreateSettings.CATALOG_ID, catalog.getResource().stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "DC Terms");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "DC Terms Ontology");
        config.set(RecordCreateSettings.RECORD_MARKDOWN, "");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, Collections.emptySet());
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, Set.of(user));
        return recordManager.createRecord(user, config, VersionedRDFRecord.class, conn);
    }

    private static Field getField(Class<?> clazz, String name) throws Exception {
        Field f = clazz.getDeclaredField(name);
        f.setAccessible(true);
        return f;
    }

    private void addThing(Thing thing, RepositoryConnection conn) {
        conn.add(thing.getModel(), thing.getResource());
    }
}

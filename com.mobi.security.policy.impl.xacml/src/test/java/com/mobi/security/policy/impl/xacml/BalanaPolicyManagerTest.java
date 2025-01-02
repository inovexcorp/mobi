package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.impl.xacml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.Policy;
import com.mobi.security.policy.api.cache.PolicyCache;
import com.mobi.security.policy.api.ontologies.policy.PolicyFile;
import com.mobi.security.policy.api.xacml.PolicyQueryParams;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.config.PolicyManagerConfig;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystemConfig;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.stubbing.Answer;
import org.osgi.framework.Bundle;

import java.io.IOException;
import java.lang.reflect.Method;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.cache.Cache;
import javax.xml.bind.JAXB;

public class BalanaPolicyManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private BalanaPolicyManager manager;
    private MemoryRepositoryWrapper repo;
    private VirtualFilesystem vfs;
    private OrmFactory<PolicyFile> policyFileFactory = getRequiredOrmFactory(PolicyFile.class);

    @Mock
    private PolicyManagerConfig policyManagerConfig;

    @Mock
    private SimpleVirtualFilesystemConfig config;

    @Mock
    private PolicyCache policyCache;

    @Mock
    private Cache<String, Policy> cache;

    @Mock
    private Bundle bundle;

    private static String fileLocation;
    static {
        StringBuilder builder = new StringBuilder(System.getProperty("java.io.tmpdir"));
        if (!System.getProperty("java.io.tmpdir").endsWith("/")) {
            builder.append("/");
        }
        fileLocation = builder.append("com.mobi.security.policy.xacml.impl/").toString();
    }
    private Map<String, Policy> entries;
    private IRI missingPolicyId = VALUE_FACTORY.createIRI("urn:missing");
    private IRI policyId = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy1");
    private IRI defaultPolicyId = VALUE_FACTORY.createIRI("http://mobi.com/policies/ontology-creation");
    private IRI relatedResource = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");
    private IRI relatedAction = VALUE_FACTORY.createIRI("http://mobi.com/ontologies/policy#Create");
    private PolicyFile policyFile;
    private PolicyFile missingPolicyFile;
    private PolicyFile defaultPolicyFile;
    private PolicyType policyType;
    private PolicyType newPolicyType;
    private PolicyType missingPolicyType;
    private String filePath;
    private PolicyType defaultPolicyType;

    @Before
    public void setUp() throws Exception {
        System.setProperty("com.sun.xml.bind.v2.bytecode.ClassTailor.noOptimize", "true"); // JDK16+ fix
        System.setProperty("karaf.etc", BalanaPolicyManagerTest.class.getResource("/").getPath());
        closeable = MockitoAnnotations.openMocks(this);

        // Setup VirtualFileSystem
        vfs = new SimpleVirtualFilesystem();
        when(config.maxNumberOfTempFiles()).thenReturn(10000);
        when(config.secondsBetweenTempCleanup()).thenReturn((long) 60000);
        when(config.defaultRootDirectory()).thenReturn(fileLocation);
        Method m = vfs.getClass().getDeclaredMethod("activate", SimpleVirtualFilesystemConfig.class);
        m.setAccessible(true);
        m.invoke(vfs, config);
        VirtualFile directory = vfs.resolveVirtualFile(fileLocation);
        if (!directory.exists()) {
            directory.createFolder();
        }

        // Setup Repository
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        // Setup example policies
        policyType = JAXB.unmarshal(getClass().getResourceAsStream("/policy1.xml"), PolicyType.class);
        newPolicyType = JAXB.unmarshal(getClass().getResourceAsStream("/newPolicy.xml"), PolicyType.class);
        missingPolicyType = JAXB.unmarshal(getClass().getResourceAsStream("/missingPolicy.xml"), PolicyType.class);
        defaultPolicyType = JAXB.unmarshal(getClass().getResourceAsStream("/policies/systemPolicies/http%3A%2F%2Fmobi.com%2Fpolicies%2Fontology-creation.xml"), PolicyType.class);

        // Setup PolicyCache
        entries = new HashMap<>();
        when(policyCache.getPolicyCache()).thenReturn(Optional.of(cache));
        doAnswer((Answer<Void>) i -> {
            entries.put(i.getArgument(0, String.class), i.getArgument(1, Policy.class));
            return null;
        }).when(cache).put(anyString(), any(Policy.class));
        when(cache.spliterator()).thenAnswer(i -> entries.keySet().stream()
                .map(key -> {
                    Cache.Entry<String, Policy> entry = mock(Cache.Entry.class);
                    when(entry.getKey()).thenReturn(key);
                    when(entry.getValue()).thenReturn(entries.get(key));
                    return entry;
                }).collect(Collectors.toList()).spliterator());
        when(cache.get(anyString())).thenAnswer(i -> entries.get(i.getArgument(0, String.class)));
        when(cache.containsKey(anyString())).thenAnswer(i -> entries.containsKey(i.getArgument(0, String.class)));
        when(cache.remove(anyString())).thenAnswer(i -> {
            Policy policy = entries.remove(i.getArgument(0, String.class));
            return policy != null;
        });

        when(bundle.findEntries(anyString(), anyString(), anyBoolean())).thenReturn(Collections.enumeration(Collections.emptyList()));

        when(policyManagerConfig.policyFileLocation()).thenReturn(fileLocation);

        manager = new BalanaPolicyManager();
        injectOrmFactoryReferencesIntoService(manager);
        manager.policyCache = policyCache;
        manager.vfs = vfs;
        manager.repository = repo;
    }

    @After
    public void cleanup() throws Exception {
        VirtualFile directory = vfs.resolveVirtualFile(fileLocation);
        for (VirtualFile child : directory.getChildren()) {
            child.deleteAll();
        }
        closeable.close();
    }

    @Test
    public void startWithCacheTest() throws Exception {
        // Setup:
        initializeRepo();

        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache).clear();
        assertTrue(entries.containsKey(policyId.stringValue()));
        Policy policy = entries.get(policyId.stringValue());
        assertTrue(policy instanceof BalanaPolicy);
        assertEquals(policyId, policy.getId());
    }

    @Test
    public void startWithoutCacheTest() throws Exception {
        // Setup:
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        initializeRepo();

        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache, times(0)).clear();
        assertFalse(entries.containsKey(policyId.stringValue()));
    }

    @Test(expected = MobiException.class)
    public void startIncorrectConfigTest() {
        // Setup:
        when(policyManagerConfig.policyFileLocation()).thenReturn("");

        manager.start(policyManagerConfig);
    }

    @Test(expected = IllegalStateException.class)
    public void startWithMissingFileTest() {
        // Setup:
        setUpMissingFileTest();

        manager.start(policyManagerConfig);
    }

    @Test
    public void startWithBundleNoDefaultsTest() throws Exception {
        // Setup:
        setUpBundleTest();
        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());
        try (RepositoryConnection conn = repo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(null, null, null, defaultPolicyId), MODEL_FACTORY);
            assertFalse(model.isEmpty());
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(defaultPolicyId, model);
            assertTrue(optPolicyFile.isPresent());
            PolicyFile policyFile = optPolicyFile.get();
            Optional<IRI> retrievalURL = policyFile.getRetrievalURL();
            assertTrue(retrievalURL.isPresent());
            VirtualFile virtualFile = vfs.resolveVirtualFile(retrievalURL.get().stringValue());
            assertTrue(virtualFile.exists() && virtualFile.isFile());
            Optional<String> fileName = policyFile.getFileName();
            assertTrue(fileName.isPresent());
            Optional<Double> fileSize = policyFile.getSize();
            assertTrue(fileSize.isPresent());
            assertEquals((double) virtualFile.getSize(), fileSize.get(), 0.01);
            assertTrue(policyFile.getChecksum().isPresent());
            assertTrue(policyFile.getRelatedSubject().isEmpty());
            assertTrue(!policyFile.getRelatedResource().isEmpty() && policyFile.getRelatedResource().contains(relatedResource));
        }
    }

    @Test
    public void startWithBundleDefaultsTest() throws Exception {
        // Setup:
        setUpBundleTest();
        defaultPolicyFile = policyFileFactory.createNew(defaultPolicyId);
        VirtualFile file = vfs.resolveVirtualFile(getClass().getResourceAsStream("/policies/systemPolicies/http%3A%2F%2Fmobi.com%2Fpolicies%2Fontology-creation.xml"), fileLocation);
        defaultPolicyFile.setRetrievalURL(VALUE_FACTORY.createIRI(file.getIdentifier()));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(defaultPolicyFile.getModel(), defaultPolicyId);
        }
        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());
        try (RepositoryConnection conn = repo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(null, null, null, defaultPolicyId), MODEL_FACTORY);
            assertFalse(model.isEmpty());
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(defaultPolicyId, model);
            assertTrue(optPolicyFile.isPresent());
            PolicyFile policyFile = optPolicyFile.get();
            Optional<IRI> retrievalURL = policyFile.getRetrievalURL();
            assertTrue(retrievalURL.isPresent());
            VirtualFile virtualFile = vfs.resolveVirtualFile(retrievalURL.get().stringValue());
            assertTrue(virtualFile.exists() && virtualFile.isFile());
            Optional<String> fileName = policyFile.getFileName();
            assertTrue(fileName.isPresent());
            Optional<Double> fileSize = policyFile.getSize();
            assertTrue(fileSize.isPresent());
            assertEquals((double) virtualFile.getSize(), fileSize.get(), 0.01);
            assertTrue(policyFile.getChecksum().isPresent());
            assertTrue(policyFile.getRelatedSubject().isEmpty());
            assertTrue(!policyFile.getRelatedResource().isEmpty() && policyFile.getRelatedResource().contains(relatedResource));
        }
    }

    @Test
    public void startEmptyRepoCachePolicyDirTest() throws Exception {
        // Setup:
        StringBuilder builder = new StringBuilder(System.getProperty("java.io.tmpdir"));
        if (!System.getProperty("java.io.tmpdir").endsWith("/")) {
            builder.append("/");
        }
        builder.append("policiesTest");
        String policiesDir = builder.toString();
        Path path = Paths.get(policiesDir);
        if (Files.exists(path)) {
            FileUtils.deleteDirectory(path.toFile());
        }
        Files.createDirectory(path);
        when(policyManagerConfig.policyFileLocation()).thenReturn(policiesDir);
        setUpBundleTest();
        defaultPolicyFile = policyFileFactory.createNew(defaultPolicyId);
        VirtualFile file = vfs.resolveVirtualFile(getClass().getResourceAsStream("/policies/systemPolicies/http%3A%2F%2Fmobi.com%2Fpolicies%2Fontology-creation.xml"), fileLocation);
        defaultPolicyFile.setRetrievalURL(VALUE_FACTORY.createIRI(file.getIdentifier()));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
            cache.clear();
        }
        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());
        try (RepositoryConnection conn = repo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(null, null, null, defaultPolicyId), MODEL_FACTORY);
            assertFalse(model.isEmpty());
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(defaultPolicyId, model);
            assertTrue(optPolicyFile.isPresent());
            PolicyFile policyFile = optPolicyFile.get();
            Optional<IRI> retrievalURL = policyFile.getRetrievalURL();
            assertTrue(retrievalURL.isPresent());
            assertEquals("file://" + policiesDir + "/37/3a/4f9f766a2d8a", retrievalURL.get().stringValue());
            VirtualFile virtualFile = vfs.resolveVirtualFile(retrievalURL.get().stringValue());
            assertTrue(virtualFile.exists() && virtualFile.isFile());
            Optional<String> fileName = policyFile.getFileName();
            assertTrue(fileName.isPresent());
            Optional<Double> fileSize = policyFile.getSize();
            assertTrue(fileSize.isPresent());
            assertEquals((double) virtualFile.getSize(), fileSize.get(), 0.01);
            assertTrue(policyFile.getChecksum().isPresent());
            assertTrue(policyFile.getRelatedSubject().isEmpty());
            assertTrue(!policyFile.getRelatedResource().isEmpty() && policyFile.getRelatedResource().contains(relatedResource));
        }
    }

    @Test
    public void startEmptyRepoCacheWithExistingPolicyInPolicyDir() throws Exception {
        // Setup:
        StringBuilder builder = new StringBuilder(System.getProperty("java.io.tmpdir"));
        if (!System.getProperty("java.io.tmpdir").endsWith("/")) {
            builder.append("/");
        }
        builder.append("policiesTest");
        String policiesDir = builder.toString();
        Path path = Paths.get(policiesDir);
        if (Files.exists(path)) {
            FileUtils.deleteDirectory(path.toFile());
        }
        Files.createDirectory(path);

        // Create duplicates of ontology-creation in the policies dir
        Path ontCreationPol = Paths.get(getClass().getResource("/policies/systemPolicies/http%3A%2F%2Fmobi.com%2Fpolicies%2Fontology-creation.xml").toURI());
        Files.copy(ontCreationPol, Paths.get(policiesDir + "/one"));
        when(policyManagerConfig.policyFileLocation()).thenReturn(policiesDir);
        setUpBundleTest();
        defaultPolicyFile = policyFileFactory.createNew(defaultPolicyId);
        VirtualFile file = vfs.resolveVirtualFile(getClass().getResourceAsStream("/policies/systemPolicies/http%3A%2F%2Fmobi.com%2Fpolicies%2Fontology-creation.xml"), fileLocation);
        defaultPolicyFile.setRetrievalURL(VALUE_FACTORY.createIRI(file.getIdentifier()));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
            cache.clear();
        }
        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());
        try (RepositoryConnection conn = repo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(null, null, null, defaultPolicyId), MODEL_FACTORY);
            assertFalse(model.isEmpty());
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(defaultPolicyId, model);
            assertTrue(optPolicyFile.isPresent());
            PolicyFile policyFile = optPolicyFile.get();
            Optional<IRI> retrievalURL = policyFile.getRetrievalURL();
            assertTrue(retrievalURL.isPresent());
            assertEquals("file://" + policiesDir + "/one", retrievalURL.get().stringValue());
            VirtualFile virtualFile = vfs.resolveVirtualFile(retrievalURL.get().stringValue());
            assertTrue(virtualFile.exists() && virtualFile.isFile());
            Optional<String> fileName = policyFile.getFileName();
            assertTrue(fileName.isPresent());
            Optional<Double> fileSize = policyFile.getSize();
            assertTrue(fileSize.isPresent());
            assertEquals((double) virtualFile.getSize(), fileSize.get(), 0.01);
            assertTrue(policyFile.getChecksum().isPresent());
            assertTrue(policyFile.getRelatedSubject().isEmpty());
            assertTrue(!policyFile.getRelatedResource().isEmpty() && policyFile.getRelatedResource().contains(relatedResource));
        }
    }

    @Test
    public void startEmptyRepoCacheWithMultipleExistingPoliciesInPolicyDir() throws Exception {
        // Setup:
        StringBuilder builder = new StringBuilder(System.getProperty("java.io.tmpdir"));
        if (!System.getProperty("java.io.tmpdir").endsWith("/")) {
            builder.append("/");
        }
        builder.append("policiesTest");
        String policiesDir = builder.toString();
        Path path = Paths.get(policiesDir);
        if (Files.exists(path)) {
            FileUtils.deleteDirectory(path.toFile());
        }
        Files.createDirectory(path);

        // Create duplicates of ontology-creation in the policies dir
        Path ontCreationPol = Paths.get(getClass().getResource("/policies/systemPolicies/http%3A%2F%2Fmobi.com%2Fpolicies%2Fontology-creation.xml").toURI());
        Files.copy(ontCreationPol, Paths.get(policiesDir + "/one"));
        Files.copy(ontCreationPol, Paths.get(policiesDir + "/two"));
        when(policyManagerConfig.policyFileLocation()).thenReturn(policiesDir);
        setUpBundleTest();
        defaultPolicyFile = policyFileFactory.createNew(defaultPolicyId);
        VirtualFile file = vfs.resolveVirtualFile(getClass().getResourceAsStream("/policies/systemPolicies/http%3A%2F%2Fmobi.com%2Fpolicies%2Fontology-creation.xml"), fileLocation);
        defaultPolicyFile.setRetrievalURL(VALUE_FACTORY.createIRI(file.getIdentifier()));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
            cache.clear();
        }
        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());
        try (RepositoryConnection conn = repo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(null, null, null, defaultPolicyId), MODEL_FACTORY);
            assertFalse(model.isEmpty());
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(defaultPolicyId, model);
            assertTrue(optPolicyFile.isPresent());
            PolicyFile policyFile = optPolicyFile.get();
            Optional<IRI> retrievalURL = policyFile.getRetrievalURL();
            assertTrue(retrievalURL.isPresent());
            assertEquals("file://" + policiesDir + "/37/3a/4f9f766a2d8a", retrievalURL.get().stringValue());
            VirtualFile virtualFile = vfs.resolveVirtualFile(retrievalURL.get().stringValue());
            assertTrue(virtualFile.exists() && virtualFile.isFile());
            Optional<String> fileName = policyFile.getFileName();
            assertTrue(fileName.isPresent());
            Optional<Double> fileSize = policyFile.getSize();
            assertTrue(fileSize.isPresent());
            assertEquals((double) virtualFile.getSize(), fileSize.get(), 0.01);
            assertTrue(policyFile.getChecksum().isPresent());
            assertTrue(policyFile.getRelatedSubject().isEmpty());
            assertTrue(!policyFile.getRelatedResource().isEmpty() && policyFile.getRelatedResource().contains(relatedResource));
        }
    }

    @Test
    public void createPolicyTest() {
        XACMLPolicy policy = manager.createPolicy(policyType);
        assertTrue(policy instanceof BalanaPolicy);
        assertEquals(policyId, policy.getId());
        assertEquals(policyType, policy.getJaxbPolicy());
    }

    @Test
    public void addPolicyWithCacheTest() throws Exception {
        // Setup:
        manager.start(policyManagerConfig);

        Resource newPolicyId = manager.addPolicy(new BalanaPolicy(policyType, VALUE_FACTORY));
        verifyAddPolicyWithCache(newPolicyId);
    }

    @Test
    public void addPolicyWithoutCacheTest() throws Exception {
        // Setup:
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        manager.start(policyManagerConfig);

        Resource newPolicyId = manager.addPolicy(new BalanaPolicy(policyType, VALUE_FACTORY));
        verifyAddPolicyWithoutCache(newPolicyId);
    }

    @Test
    public void addSystemPolicyWithCacheTest() throws Exception {
        // Setup:
        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());

        Resource newPolicyId = manager.addSystemPolicy(new BalanaPolicy(policyType, VALUE_FACTORY));
        assertEquals(2, manager.getSystemPolicyIds().size());
        verifyAddPolicyWithCache(newPolicyId);
    }

    @Test
    public void addSystemPolicyWithoutCacheTest() throws Exception {
        // Setup:
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());

        Resource newPolicyId = manager.addSystemPolicy(new BalanaPolicy(policyType, VALUE_FACTORY));
        assertEquals(2, manager.getSystemPolicyIds().size());
        verifyAddPolicyWithoutCache(newPolicyId);
    }

    private void verifyAddPolicyWithCache(Resource newPolicyId) throws Exception {
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache).put(eq(newPolicyId.stringValue()), any(Policy.class));
        assertEquals(policyId, newPolicyId);
        assertTrue(entries.containsKey(newPolicyId.stringValue()));
        Policy policy = entries.get(newPolicyId.stringValue());
        assertTrue(policy instanceof BalanaPolicy);
        assertEquals(policyId, policy.getId());
        try (RepositoryConnection conn = repo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(null, null, null, newPolicyId), MODEL_FACTORY);
            assertFalse(model.isEmpty());
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(newPolicyId, model);
            assertTrue(optPolicyFile.isPresent());
            PolicyFile policyFile = optPolicyFile.get();
            Optional<IRI> retrievalURL = policyFile.getRetrievalURL();
            assertTrue(retrievalURL.isPresent());
            VirtualFile virtualFile = vfs.resolveVirtualFile(retrievalURL.get().stringValue());
            assertTrue(virtualFile.exists() && virtualFile.isFile());
            Optional<String> fileName = policyFile.getFileName();
            assertTrue(fileName.isPresent());
            Optional<Double> fileSize = policyFile.getSize();
            assertTrue(fileSize.isPresent());
            assertEquals((double) virtualFile.getSize(), fileSize.get(), 0.01);
            assertTrue(policyFile.getChecksum().isPresent());
            assertTrue(policyFile.getRelatedSubject().isEmpty());
            assertTrue(policyFile.getRelatedAction().isEmpty());
            assertTrue(!policyFile.getRelatedResource().isEmpty() && policyFile.getRelatedResource().contains(relatedResource));
        }
    }

    private void verifyAddPolicyWithoutCache(Resource newPolicyId) throws Exception {
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache, times(0)).put(anyString(), any(Policy.class));
        assertEquals(policyId, newPolicyId);
        assertFalse(entries.containsKey(newPolicyId.stringValue()));
        try (RepositoryConnection conn = repo.getConnection()) {
            Model model = QueryResults.asModel(conn.getStatements(null, null, null, newPolicyId), MODEL_FACTORY);
            assertFalse(model.isEmpty());
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(newPolicyId, model);
            assertTrue(optPolicyFile.isPresent());
            PolicyFile policyFile = optPolicyFile.get();
            Optional<IRI> retrievalURL = policyFile.getRetrievalURL();
            assertTrue(retrievalURL.isPresent());
            VirtualFile virtualFile = vfs.resolveVirtualFile(retrievalURL.get().stringValue());
            assertTrue(virtualFile.exists() && virtualFile.isFile());
            Optional<String> fileName = policyFile.getFileName();
            assertTrue(fileName.isPresent());
            Optional<Double> fileSize = policyFile.getSize();
            assertTrue(fileSize.isPresent());
            assertEquals((double) virtualFile.getSize(), fileSize.get(), 0.01);
            assertTrue(policyFile.getChecksum().isPresent());
            assertTrue(policyFile.getRelatedSubject().isEmpty());
            assertTrue(policyFile.getRelatedAction().isEmpty());
            assertTrue(!policyFile.getRelatedResource().isEmpty() && policyFile.getRelatedResource().contains(relatedResource));
        }
    }

    @Test
    public void getPoliciesWithCacheTest() throws Exception {
        // Setup:
        initializeRepo();
        manager.start(policyManagerConfig);

        List<XACMLPolicy> policies = manager.getPolicies(new PolicyQueryParams.Builder().build());
        verify(policyCache, atLeastOnce()).getPolicyCache();
        assertTrue(policies.size() > 0);
        Optional<XACMLPolicy> optPolicy = policies.stream()
                .filter(policy -> policy.getId().equals(policyId))
                .findFirst();
        assertTrue(optPolicy.isPresent());
    }

    @Test
    public void getPoliciesWithoutCacheTest() throws Exception {
        // Setup:
        initializeRepo();
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        manager.start(policyManagerConfig);

        List<XACMLPolicy> policies = manager.getPolicies(new PolicyQueryParams.Builder().build());
        verify(policyCache, atLeastOnce()).getPolicyCache();
        assertTrue(policies.size() > 0);
        Optional<XACMLPolicy> optPolicy = policies.stream()
                .filter(policy -> policy.getId().equals(policyId))
                .findFirst();
        assertTrue(optPolicy.isPresent());
    }

    @Test
    public void getPoliciesWithoutCacheOnlySystemTest() throws Exception {
        // Setup:
        initializeRepo();
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        manager.start(policyManagerConfig);

        List<XACMLPolicy> policies = manager.getPolicies(new PolicyQueryParams.Builder().setSystemOnly(true).build());
        verify(policyCache, atLeastOnce()).getPolicyCache();
        assertEquals(policies.size(), 1);
        assertEquals(policies.get(0).getId(), defaultPolicyId);
    }

    @Test
    public void getPolicyWithCacheTest() throws Exception {
        // Setup:
        initializeRepo();
        manager.start(policyManagerConfig);

        Optional<XACMLPolicy> result = manager.getPolicy(policyId);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache).containsKey(policyId.stringValue());
        verify(cache).get(policyId.stringValue());
        assertTrue(result.isPresent());
        XACMLPolicy policy = result.get();
        assertTrue(policy instanceof BalanaPolicy);
        assertEquals(policyId, policy.getId());
    }

    @Test
    public void getPolicyThatDoesNotExistWithCacheTest() {
        // Setup:
        manager.start(policyManagerConfig);

        Optional<XACMLPolicy> result = manager.getPolicy(missingPolicyId);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache).containsKey(missingPolicyId.stringValue());
        verify(cache, times(0)).get(anyString());
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void getMissingPolicyWithCacheTest() {
        // Setup:
        manager.start(policyManagerConfig);
        setUpMissingFileTest();

        manager.getPolicy(missingPolicyFile.getResource());
    }

    @Test
    public void getPolicyWithoutCacheTest() throws Exception {
        // Setup:
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        initializeRepo();
        manager.start(policyManagerConfig);

        Optional<XACMLPolicy> result = manager.getPolicy(policyId);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache, times(0)).containsKey(anyString());
        verify(cache, times(0)).get(anyString());
        assertTrue(result.isPresent());
        XACMLPolicy policy = result.get();
        assertTrue(policy instanceof BalanaPolicy);
        assertEquals(policyId, policy.getId());
    }

    @Test
    public void getPolicyThatDoesNotExistWithoutCacheTest() {
        // Setup:
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        manager.start(policyManagerConfig);

        Optional<XACMLPolicy> result = manager.getPolicy(missingPolicyId);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache, times(0)).containsKey(anyString());
        verify(cache, times(0)).get(anyString());
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void getMissingPolicyWithoutCacheTest() {
        // Setup:
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        manager.start(policyManagerConfig);
        setUpMissingFileTest();

        manager.getPolicy(missingPolicyFile.getResource());
    }

    @Test
    public void updatePolicyWithCacheTest() throws Exception {
        // Setup:
        BalanaPolicy policy = new BalanaPolicy(newPolicyType, VALUE_FACTORY);
        initializeRepo();
        manager.start(policyManagerConfig);

        manager.updatePolicy(policy);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        assertTrue(entries.containsKey(policyId.stringValue()));
        Policy cachedPolicy = entries.get(policyId.stringValue());
        assertTrue(cachedPolicy instanceof BalanaPolicy);
        assertEquals(policyId, cachedPolicy.getId());
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(policyId, QueryResults.asModel(conn.getStatements(null, null, null, policyId), MODEL_FACTORY));
            assertTrue(optPolicyFile.isPresent());
            PolicyFile newPolicyFile = optPolicyFile.get();
            Optional<IRI> filePathOld = policyFile.getRetrievalURL();
            Optional<IRI> filePathNew = newPolicyFile.getRetrievalURL();
            assertTrue(filePathNew.isPresent());
            assertTrue(newPolicyFile.getChecksum().isPresent());
            VirtualFile virtualFileOld = vfs.resolveVirtualFile(filePathOld.get().stringValue());
            assertFalse(virtualFileOld.exists());
            VirtualFile virtualFileNew = vfs.resolveVirtualFile(filePathNew.get().stringValue());
            assertTrue(virtualFileNew.exists() && virtualFileNew.isFile());
            assertTrue(!newPolicyFile.getRelatedResource().isEmpty() && newPolicyFile.getRelatedResource().contains(relatedResource));
            assertTrue(!newPolicyFile.getRelatedAction().isEmpty() && newPolicyFile.getRelatedAction().contains(relatedAction));
            assertTrue(newPolicyFile.getRelatedSubject().isEmpty());
        }
    }

    @Test
    public void updatePolicyWithoutCacheTest() throws Exception {
        // Setup:
        BalanaPolicy policy = new BalanaPolicy(newPolicyType, VALUE_FACTORY);
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        initializeRepo();
        manager.start(policyManagerConfig);

        manager.updatePolicy(policy);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache, times(0)).put(anyString(), any(Policy.class));
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<PolicyFile> optPolicyFile = policyFileFactory.getExisting(policyFile.getResource(),
                    QueryResults.asModel(conn.getStatements(null, null, null, policyFile.getResource()), MODEL_FACTORY));
            assertTrue(optPolicyFile.isPresent());
            PolicyFile newPolicyFile = optPolicyFile.get();
            Optional<IRI> filePathOld = policyFile.getRetrievalURL();
            Optional<IRI> filePathNew = newPolicyFile.getRetrievalURL();
            assertTrue(filePathNew.isPresent());
            assertTrue(newPolicyFile.getChecksum().isPresent());
            VirtualFile virtualFileOld = vfs.resolveVirtualFile(filePathOld.get().stringValue());
            assertFalse(virtualFileOld.exists());
            VirtualFile virtualFileNew = vfs.resolveVirtualFile(filePathNew.get().stringValue());
            assertTrue(virtualFileNew.exists() && virtualFileNew.isFile());
            assertTrue(!newPolicyFile.getRelatedResource().isEmpty() && newPolicyFile.getRelatedResource().contains(relatedResource));
            assertTrue(!newPolicyFile.getRelatedAction().isEmpty() && newPolicyFile.getRelatedAction().contains(relatedAction));
            assertTrue(newPolicyFile.getRelatedSubject().isEmpty());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void updatePolicyThatDoesNotExistTest() {
        // Setup:
        BalanaPolicy policy = new BalanaPolicy(missingPolicyType, VALUE_FACTORY);
        manager.start(policyManagerConfig);

        manager.updatePolicy(policy);
    }

    @Test(expected = IllegalStateException.class)
    public void updateMissingPolicyTest() {
        // Setup:
        BalanaPolicy policy = new BalanaPolicy(missingPolicyType, VALUE_FACTORY);
        manager.start(policyManagerConfig);
        setUpMissingFileTest();

        manager.updatePolicy(policy);
    }

    @Test
    public void deletePolicyWithCacheTest() throws Exception {
        // Setup:
        initializeRepo();
        manager.start(policyManagerConfig);

        manager.deletePolicy(policyId);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache).remove(policyId.stringValue());
        assertFalse(entries.containsKey(policyId.stringValue()));
        VirtualFile virtualFile = vfs.resolveVirtualFile(filePath);
        assertFalse(virtualFile.exists());
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.contains(conn, null, null, null, policyId));
        }
    }

    @Test
    public void deletePolicyWithoutCacheTest() throws Exception {
        // Setup:
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        initializeRepo();
        manager.start(policyManagerConfig);

        manager.deletePolicy(policyId);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache, times(0)).remove(anyString());
        VirtualFile virtualFile = vfs.resolveVirtualFile(filePath);
        assertFalse(virtualFile.exists());
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.contains(conn, null, null, null, policyId));
        }
    }

    @Test
    public void deleteSystemPolicyTest() throws Exception {
        // Setup:
        manager.start(policyManagerConfig);
        assertEquals(1, manager.getSystemPolicyIds().size());

        Resource newPolicyId = manager.addSystemPolicy(new BalanaPolicy(policyType, VALUE_FACTORY));
        assertEquals(2, manager.getSystemPolicyIds().size());
        verifyAddPolicyWithCache(newPolicyId);

        manager.deletePolicy(newPolicyId);
        verify(policyCache, atLeastOnce()).getPolicyCache();
        verify(cache).remove(newPolicyId.stringValue());
        assertFalse(entries.containsKey(newPolicyId.stringValue()));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.contains(conn, null, null, null, newPolicyId));
        }
        assertEquals(1, manager.getSystemPolicyIds().size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void deletePolicyThatDoesNotExistTest() {
        // Setup:
        when(policyCache.getPolicyCache()).thenReturn(Optional.empty());
        manager.start(policyManagerConfig);

        manager.deletePolicy(missingPolicyId);
    }

    @Test
    public void deleteMissingPolicyTest() {
        // Setup:
        manager.start(policyManagerConfig);
        setUpMissingFileTest();

        manager.deletePolicy(missingPolicyId);
    }

    @Test
    public void loadPolicyIfAbsentWhenPresentTest() throws Exception {
        initializeRepo();
        BalanaPolicyManager spyManager = spy(manager);
        Resource loadedId = spyManager.loadPolicyIfAbsent(IOUtils.toString(getClass().getResourceAsStream("/policy1.xml"), StandardCharsets.UTF_8));
        assertEquals(policyId.stringValue(), loadedId.stringValue());
        verify(spyManager).getPolicy(eq(policyId));
        verify(spyManager, never()).createPolicy(any(PolicyType.class));
        verify(spyManager, never()).addPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void loadPolicyIfAbsentWhenAbsentTest() throws Exception {
        BalanaPolicyManager spyManager = spy(manager);
        Resource loadedId = spyManager.loadPolicyIfAbsent(IOUtils.toString(getClass().getResourceAsStream("/policy1.xml"), StandardCharsets.UTF_8));
        assertEquals(policyId.stringValue(), loadedId.stringValue());
        verify(spyManager).getPolicy(eq(policyId));
        verify(spyManager).createPolicy(any(PolicyType.class));
        verify(spyManager).addPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void loadSystemPolicyIfAbsentWhenPresentTest() throws Exception {
        initializeRepo();
        BalanaPolicyManager spyManager = spy(manager);
        Resource loadedId = spyManager.loadSystemPolicyIfAbsent(IOUtils.toString(getClass().getResourceAsStream("/policy1.xml"), StandardCharsets.UTF_8));
        assertEquals(policyId.stringValue(), loadedId.stringValue());
        verify(spyManager).getPolicy(eq(policyId));
        verify(spyManager, never()).createPolicy(any(PolicyType.class));
        verify(spyManager, never()).addSystemPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void loadSystemPolicyIfAbsentWhenAbsentTest() throws Exception {
        BalanaPolicyManager spyManager = spy(manager);
        Resource loadedId = spyManager.loadSystemPolicyIfAbsent(IOUtils.toString(getClass().getResourceAsStream("/policy1.xml"), StandardCharsets.UTF_8));
        assertEquals(policyId.stringValue(), loadedId.stringValue());
        verify(spyManager).getPolicy(eq(policyId));
        verify(spyManager).createPolicy(any(PolicyType.class));
        verify(spyManager).addSystemPolicy(any(XACMLPolicy.class));
    }

    private String copyToTemp(String resourceName) throws IOException {
        String absolutePath = fileLocation + resourceName;
        Files.copy(getClass().getResourceAsStream("/" + resourceName), Paths.get(absolutePath), StandardCopyOption.REPLACE_EXISTING);
        return absolutePath;
    }

    private void setUpMissingFileTest() {
        missingPolicyFile = policyFileFactory.createNew(missingPolicyId);
        filePath = "file:" + fileLocation + "missing.xml";
        missingPolicyFile.setRetrievalURL(VALUE_FACTORY.createIRI(filePath));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(missingPolicyFile.getModel(), missingPolicyId);
        }
    }

    private void setUpBundleTest() {
        URL url = BalanaPolicyManagerTest.class.getResource("/policies/systemPolicies/http%3A%2F%2Fmobi.com%2Fpolicies%2Fontology-creation.xml");
        when(bundle.findEntries("/policies", "*.xml", true)).thenReturn(new Enumeration<URL>() {
            boolean grabbed = false;
            @Override
            public boolean hasMoreElements() {
                return !grabbed;
            }

            @Override
            public URL nextElement() {
                grabbed = true;
                try {
                    return url;
                } catch (Exception e) {
                    return null;
                }
            }
        });
    }

    private void initializeRepo() throws Exception {
        String path = copyToTemp("policy1.xml");
        filePath = "file:" + path;
        policyFile = policyFileFactory.createNew(policyId);
        policyFile.setRetrievalURL(VALUE_FACTORY.createIRI(filePath));
        policyFile.setFileName("policy1.xml");
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(policyFile.getModel(), policyId);
        }
    }
}

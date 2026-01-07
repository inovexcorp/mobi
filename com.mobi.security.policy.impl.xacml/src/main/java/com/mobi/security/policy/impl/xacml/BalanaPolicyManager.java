package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.impl.xacml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.security.policy.api.Policy;
import com.mobi.security.policy.api.cache.PolicyCache;
import com.mobi.security.policy.api.ontologies.policy.PolicyFile;
import com.mobi.security.policy.api.ontologies.policy.PolicyFileFactory;
import com.mobi.security.policy.api.xacml.PolicyQueryParams;
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.config.PolicyManagerConfig;
import com.mobi.security.policy.api.xacml.jaxb.AttributeDesignatorType;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import com.mobi.security.policy.api.xacml.jaxb.TargetType;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.cache.Cache;
import javax.xml.bind.JAXB;

@Component(
        configurationPolicy = ConfigurationPolicy.REQUIRE,
        name = BalanaPolicyManager.COMPONENT_NAME
)
@Designate(ocd = PolicyManagerConfig.class)
public class BalanaPolicyManager implements XACMLPolicyManager {
    static final String COMPONENT_NAME = "com.mobi.security.policy.api.xacml.XACMLPolicyManager";
    private static final Logger LOG = LoggerFactory.getLogger(BalanaPolicyManager.class);

    private String fileLocation;
    private IRI typeIRI;
    private IRI policyFileTypeIRI;
    private Set<Resource> systemPolicies = new HashSet<>();
    private Set<Resource> protectedPolicies;

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Reference
    PolicyCache policyCache;

    @Reference
    VirtualFilesystem vfs;

    @Reference(target = "(id=system)")
    OsgiRepository repository;

    @Reference
    PolicyFileFactory policyFileFactory;

    @Activate
    @Modified
    protected void start(final PolicyManagerConfig config) {
        typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
        policyFileTypeIRI = vf.createIRI(PolicyFile.TYPE);
        protectedPolicies = new HashSet<>(List.of(
                vf.createIRI("http://mobi.com/policies/admin-user-only-access-versioned-rdf-record")));

        try {
            LOG.debug("Setting up policy file directory");
            VirtualFile file = this.vfs.resolveVirtualFile(config.policyFileLocation());
            if (!file.exists()) {
                if (config.createLocationIfNotExists()) {
                    LOG.debug("Directory does not exist. Creating it now.");
                    file.createFolder();
                } else {
                    throw new MobiException("Policy File Location " + config.policyFileLocation() + " does not exist");
                }
            } else if (!file.isFolder()) {
                throw new MobiException("Policy File Location " + config.policyFileLocation() + " is not a directory");
            }
            fileLocation = config.policyFileLocation();
        } catch (VirtualFilesystemException e) {
            throw new MobiException(e);
        }

        loadPolicies();
    }

    @Override
    public XACMLPolicy createPolicy(PolicyType policyType) {
        return new BalanaPolicy(policyType, vf);
    }

    @Override
    public Resource addPolicy(XACMLPolicy policy) {
        validateUniqueId(policy);
        BalanaPolicy balanaPolicy = getBalanaPolicy(policy);
        LOG.debug("Creating new policy file");
        try {
            byte[] fileBytes = balanaPolicy.toString().getBytes();
            VirtualFile file = vfs.resolveVirtualFile(fileBytes, fileLocation);
            PolicyFile policyFile = addPolicyFile(file, file.getIdentifier() + ".xml", balanaPolicy);
            return policyFile.getResource();
        } catch (IOException e) {
            throw new IllegalStateException("Could not save XACML Policy to disk due to: ", e);
        }
    }

    @Override
    public List<XACMLPolicy> getPolicies(PolicyQueryParams params) {
        Stream<Resource> policyIdsStream = PolicyUtils.findPolicies(params, repository).stream();
        if (params.isSystemOnly()) {
            policyIdsStream = policyIdsStream.filter(iri -> systemPolicies.contains(iri));
        }
        if (params.isSecured()) {
            policyIdsStream = policyIdsStream.filter(iri -> !protectedPolicies.contains(iri));
        }
        Set<Resource> policyIds = policyIdsStream.collect(Collectors.toSet());
        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        // If there is a policy cache
        if (cache.isPresent()) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Cache<String, Policy> cacheMap = cache.get();
                return policyIds.stream()
                        .map(id -> {
                            if (cacheMap.containsKey(id.stringValue())) {
                                return cacheMap.get(id.stringValue());
                            } else {
                                return getPolicyFromFile(id, conn);
                            }
                        })
                        .filter(policy -> policy instanceof XACMLPolicy)
                        .map(policy -> getBalanaPolicy((XACMLPolicy) policy))
                        .collect(Collectors.toList());
            }
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            return policyIds.stream()
                    .map(id -> getPolicyFromFile(id, conn))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public Optional<XACMLPolicy> getPolicy(Resource policyId) {
        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        if (cache.isPresent()) {
            if (cache.get().containsKey(policyId.stringValue())) {
                Policy policy = cache.get().get(policyId.stringValue());
                if (policy instanceof XACMLPolicy) {
                    return Optional.of(getBalanaPolicy((XACMLPolicy) policy));
                }
            }
        }
        Optional<BalanaPolicy> opt = optPolicyFromFile(policyId);
        opt.ifPresent(policy -> cache.ifPresent(c -> c.put(policyId.stringValue(), policy)));
        return opt.map(policy -> policy);
    }

    @Override
    public void updatePolicy(XACMLPolicy newPolicy) {
        PolicyFile policyFile = validatePolicy(newPolicy.getId());
        try {
            BalanaPolicy balanaPolicy = getBalanaPolicy(newPolicy);
            IRI filePath = getRetrievalURL(policyFile);
            VirtualFile virtualFileOld = vfs.resolveVirtualFile(filePath.stringValue());
            if (!virtualFileOld.exists()) {
                throw new IllegalStateException("Policy file does not exist");
            }
            VirtualFile virtualFileNew = vfs.resolveVirtualFile(balanaPolicy.toString().getBytes(), fileLocation);
            LOG.debug("Updating policy file at " + filePath + " to file at " + virtualFileNew.getIdentifier());
            setRelatedProperties(policyFile, balanaPolicy);
            policyFile.setChecksum(getChecksum(balanaPolicy));
            policyFile.setRetrievalURL(vf.createIRI(virtualFileNew.getIdentifier()));
            policyFile.setFileName(virtualFileNew.getIdentifier() + ".xml");
            if (!virtualFileNew.getIdentifier().equals(virtualFileOld.getIdentifier())) {
                virtualFileOld.delete();
            }
            try (RepositoryConnection conn = repository.getConnection()) {
                conn.clear(newPolicy.getId());
                conn.add(policyFile.getModel(), newPolicy.getId());
            }
            policyCache.getPolicyCache()
                    .ifPresent(cache -> cache.replace(newPolicy.getId().stringValue(), balanaPolicy));
        } catch (IOException e) {
            throw new IllegalStateException("Could not save XACML Policy to disk due to: ", e);
        }
    }

    @Override
    public void deletePolicy(Resource policyId) {
        PolicyFile policyFile = validatePolicy(policyId);
        try {
            IRI filePath = getRetrievalURL(policyFile);
            LOG.debug("Removing policy file at " + filePath);
            VirtualFile file = vfs.resolveVirtualFile(filePath.stringValue());
            if (file.exists()) {
                file.delete();
            }
            try (RepositoryConnection conn = repository.getConnection()) {
                conn.clear(policyFile.getResource());
            }
            policyCache.getPolicyCache().ifPresent(cache -> cache.remove(policyId.stringValue()));
            systemPolicies.remove(policyId);
        } catch (VirtualFilesystemException e) {
            throw new IllegalStateException("Could not remove XACML Policy on disk due to: ", e);
        }
    }

    @Override
    public Set<Resource> getSystemPolicyIds() {
        return systemPolicies;
    }

    @Override
    public Resource addSystemPolicy(XACMLPolicy policy) {
        Resource id = addPolicy(policy);
        systemPolicies.add(id);
        return id;
    }

    @Override
    public Resource loadPolicyIfAbsent(String policy) {
        return loadPolicyIfAbsent(policy, false);
    }

    private Resource loadPolicyIfAbsent(String policy, boolean isSystemPolicy) {
        PolicyType publishPolicyType = JAXB.unmarshal(new StringReader(policy), PolicyType.class);
        Optional<XACMLPolicy> existingPublishPolicy = getPolicy(vf.createIRI(publishPolicyType.getPolicyId()));
        if (existingPublishPolicy.isPresent()) {
            return existingPublishPolicy.get().getId();
        } else {
            XACMLPolicy publishPolicy = createPolicy(publishPolicyType);
            return isSystemPolicy ? addSystemPolicy(publishPolicy) : addPolicy(publishPolicy);
        }
    }

    @Override
    public Resource loadSystemPolicyIfAbsent(String policy) {
        return loadPolicyIfAbsent(policy, true);
    }

    @Override
    public OsgiRepository getRepository() {
        return this.repository;
    }

    @Override
    public String getFileLocation() {
        return this.fileLocation;
    }

    private BalanaPolicy getBalanaPolicy(XACMLPolicy policy) {
        if (policy instanceof BalanaPolicy) {
            return (BalanaPolicy) policy;
        } else {
            return new BalanaPolicy(policy.toString(), vf);
        }
    }

    private void validateUniqueId(XACMLPolicy policy) {
        try (RepositoryConnection conn = repository.getConnection()) {
            if (ConnectionUtils.contains(conn, policy.getId(), null, null)) {
                throw new IllegalArgumentException(policy.getId() + " already exists in the repository");
            }
        }
    }

    private PolicyFile validatePolicy(Resource policyId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return validatePolicy(policyId, conn);
        }
    }

    private PolicyFile validatePolicy(Resource policyId, RepositoryConnection conn) {
        if (!ConnectionUtils.contains(conn, policyId, typeIRI, policyFileTypeIRI)) {
            throw new IllegalArgumentException("Policy " + policyId + " does not exist");
        }
        Model policyModel = QueryResults.asModel(conn.getStatements(null, null, null, policyId), mf);
        return policyFileFactory.getExisting(policyId, policyModel).orElseThrow(() ->
                new IllegalStateException("PolicyFile not present in named graph"));
    }

    private Optional<PolicyFile> optPolicy(Resource policyId, RepositoryConnection conn) {
        Model policyModel = QueryResults.asModel(conn.getStatements(null, null, null, policyId), mf);
        return policyFileFactory.getExisting(policyId, policyModel);
    }

    private IRI getRetrievalURL(PolicyFile policyFile) {
        return policyFile.getRetrievalURL().orElseThrow(() ->
                new IllegalStateException("PolicyFile must have retrievalURL set"));
    }

    private String getFileName(PolicyFile policyFile) {
        Optional<String> fileName = policyFile.getFileName();
        return fileName.orElseGet(() -> FilenameUtils.getName(getRetrievalURL(policyFile).stringValue()));
    }

    private Optional<BalanaPolicy> optPolicyFromFile(Resource policyId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return optPolicyFromFile(policyId, conn);
        }
    }

    private Optional<BalanaPolicy> optPolicyFromFile(Resource policyId, RepositoryConnection conn) {
        return optPolicy(policyId, conn).map(file -> getPolicyFromFile(getRetrievalURL(file).stringValue()));
    }

    private BalanaPolicy getPolicyFromFile(Resource policyId, RepositoryConnection conn) {
        return getPolicyFromFile(validatePolicy(policyId, conn));
    }

    private BalanaPolicy getPolicyFromFile(PolicyFile policyFile) {
        return getPolicyFromFile(getRetrievalURL(policyFile).stringValue());
    }

    private BalanaPolicy getPolicyFromFile(String filePath) {
        try {
            return getPolicyFromFile(vfs.resolveVirtualFile(filePath));
        } catch (IOException e) {
            throw new IllegalStateException("Could not retrieve XACML Policy on disk due to: ", e);
        }
    }

    private BalanaPolicy getPolicyFromFile(VirtualFile file) {
        try {
            if (file.isFile()) {
                try (InputStream inputStream = file.readContent()) {
                    String policyStr = IOUtils.toString(inputStream, StandardCharsets.UTF_8);
                    return new BalanaPolicy(policyStr, vf);
                }
            }
            throw new IllegalStateException("Policy could not be found on disk");
        } catch (IOException e) {
            throw new IllegalStateException("Could not retrieve XACML Policy on disk due to: ", e);
        }
    }

    /**
     * Loads policies into the repository, policies file directory, and policy cache.
     */
    private void loadPolicies() {
        LOG.debug("Loading policies");
        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        cache.ifPresent(Cache::clear);
        try (RepositoryConnection conn = repository.getConnection()) {
            VirtualFile directory = vfs.resolveVirtualFile(fileLocation);

            // Grab policyIds that are already in the repository
            // Track the policy IDs and the paths to files on disk with that ID
            // This will help us determine which system policies need to be reset due to duplicates in a malformed
            // backup.
            Map<Resource, Set<String>> policyIdPaths = new HashMap<>();
            conn.getStatements(null, typeIRI, policyFileTypeIRI).forEach(statement -> {
                Resource policyIRI = statement.getSubject();
                PolicyFile policyFile = validatePolicy(policyIRI);
                policyIdPaths.putIfAbsent(policyIRI, new HashSet<>());
                policyIdPaths.get(policyIRI).add(generatePath(FilenameUtils.removeExtension(getFileName(policyFile))));
            });

            // Walk the policy directory and add all policies into the repository
            // Updates the map of policy IDs to paths to the files on disk
            addMissingFilesToRepo(policyIdPaths, directory);

            // Initialize policies from the systemPolicies directory if they don't already exist
            // Should happen on fresh installations or if a system policy was removed from the system between startups
            Path policiesDirectory = Paths.get(System.getProperty("karaf.etc") + File.separator + "policies"
                    + File.separator + "systemPolicies");
            try (Stream<Path> files = Files.walk(policiesDirectory)) {
                files.forEach(path -> {
                    if (!Files.isDirectory(path)) {
                        try {
                            String fileName = URLDecoder.decode(
                                    FilenameUtils.getName(path.getFileName().toString()), StandardCharsets.UTF_8);
                            String fileId = FilenameUtils.removeExtension(
                                    URLDecoder.decode(fileName, StandardCharsets.UTF_8));
                            Resource systemPolicyId = vf.createIRI(fileId);

                            // Clear any system policies with duplicates. A policy can have duplicate copies in the
                            // policy directory on disk due to an older bug that caused the default system policy to be
                            // loaded when an existing modified system policy already existed. This logic should run
                            // after a Restore command of an older malformed backup
                            if (policyIdPaths.containsKey(systemPolicyId)
                                    && policyIdPaths.get(systemPolicyId).size() > 1) {
                                LOG.info("Duplicate systemPolicyId for " + systemPolicyId.stringValue());
                                // Remove systemPolicyId graph
                                conn.clear(systemPolicyId);
                                // Delete each existing file on disk for the given systemPolicyId
                                policyIdPaths.get(systemPolicyId).forEach(pathStr -> {
                                    try {
                                        LOG.info("Deleting file" + pathStr);
                                        boolean result = Files.deleteIfExists(Paths.get(pathStr));
                                        if (!result) {
                                            LOG.error("Could not find file " + pathStr);
                                        }
                                    } catch (IOException e) {
                                        LOG.error("Could not delete file " + pathStr);
                                    }
                                });
                            }

                            // Verify the policy for the given systemPolicyId exists in repository and in policy vfs
                            // If not, add the file
                            if (!ConnectionUtils.contains(conn, systemPolicyId, null, null)) {
                                VirtualFile file = vfs.resolveVirtualFile(Files.newInputStream(path), fileLocation);
                                addPolicyFile(file, file.getIdentifier() + ".xml", getPolicyFromFile(file));
                            } else {
                                PolicyFile policy = validatePolicy(systemPolicyId);
                                Optional<IRI> retrievalUrl = policy.getRetrievalURL();
                                if (retrievalUrl.isEmpty() ||
                                        !vfs.resolveVirtualFile(retrievalUrl.get().stringValue()).exists()) {
                                    VirtualFile file = vfs.resolveVirtualFile(Files.newInputStream(path), fileLocation);
                                    addPolicyFile(file, file.getIdentifier() + ".xml", getPolicyFromFile(file));
                                }
                            }

                            // Track system policies
                            systemPolicies.add(systemPolicyId);
                        } catch (IOException e) {
                            LOG.error("Could not load system policy for: {}", path);
                        }
                    }
                });
            }

            // Load policies into policy cache
            conn.getStatements(null, typeIRI, policyFileTypeIRI).forEach(statement -> {
                Resource policyIRI = statement.getSubject();
                PolicyFile policyFile = validatePolicy(policyIRI);
                BalanaPolicy policy = getPolicyFromFile(policyFile);
                cache.ifPresent(c -> c.put(policyIRI.stringValue(), policy));
            });
        } catch (IOException e) {
            throw new MobiException("Error initializing policy files due to: ", e);
        }
    }

    private void addMissingFilesToRepo(Map<Resource, Set<String>> policyIdPaths, VirtualFile baseFolder)
            throws VirtualFilesystemException {
        for (VirtualFile file : baseFolder.getChildren()) {
            if (file.isFolder()) {
                addMissingFilesToRepo(policyIdPaths, file);
            } else {
                BalanaPolicy balanaPolicy = getPolicyFromFile(file);
                if (!policyIdPaths.containsKey(balanaPolicy.getId())) {
                    addPolicyFile(file, file.getIdentifier() + ".xml", balanaPolicy);
                } else if (!policyIdPaths.get(balanaPolicy.getId()).contains(file.getIdentifier())){
                    LOG.info("Found duplicate policyId for " + balanaPolicy.getId().stringValue());
                }
                policyIdPaths.putIfAbsent(balanaPolicy.getId(), new HashSet<>());
                policyIdPaths.get(balanaPolicy.getId()).add(generatePath(file.getIdentifier()));
            }
        }
    }

    private String generatePath(String pathWithProtocol) {
        try {
            return new URI(pathWithProtocol).getPath();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
    }

    private void setRelatedProperties(PolicyFile policyFile, BalanaPolicy policy) {
        Set<IRI> relatedResources = new HashSet<>();
        Set<IRI> relatedSubjects = new HashSet<>();
        Set<IRI> relatedActions = new HashSet<>();
        PolicyType policyType = policy.getJaxbPolicy();
        TargetType targetType = policyType.getTarget();
        if (targetType != null) {
            targetType.getAnyOf().forEach(anyOfType ->
                    anyOfType.getAllOf().forEach(allOfType -> allOfType.getMatch().forEach(matchType -> {
                        AttributeDesignatorType attributeDesignator = matchType.getAttributeDesignator();
                        String value = matchType.getAttributeValue().getContent().get(0).toString();
                        switch (attributeDesignator.getAttributeId()) {
                            case XACML.RESOURCE_ID:
                                relatedResources.add(vf.createIRI(value));
                                break;
                            case XACML.SUBJECT_ID:
                                relatedSubjects.add(vf.createIRI(value));
                                break;
                            case XACML.ACTION_ID:
                                relatedActions.add(vf.createIRI(value));
                                break;
                            default:
                        }
                    })));
        }

        policyFile.setRelatedResource(relatedResources);
        policyFile.setRelatedSubject(relatedSubjects);
        policyFile.setRelatedAction(relatedActions);
    }

    private PolicyFile addPolicyFile(VirtualFile file, String fileName, BalanaPolicy balanaPolicy)
            throws VirtualFilesystemException {
        PolicyFile policyFile = policyFileFactory.createNew(balanaPolicy.getId());
        policyFile.setRetrievalURL(vf.createIRI(file.getIdentifier()));
        policyFile.setSize((double) file.getSize());
        policyFile.setFileName(fileName);
        policyFile.setChecksum(getChecksum(balanaPolicy));
        setRelatedProperties(policyFile, balanaPolicy);
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.clear(policyFile.getResource());
            conn.add(policyFile.getModel(), policyFile.getResource());
        }
        policyCache.getPolicyCache().ifPresent(cache ->
                cache.put(policyFile.getResource().stringValue(), balanaPolicy));
        return policyFile;
    }

    private String getChecksum(BalanaPolicy policy) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(policy.toString().getBytes());
            return new String(hash, StandardCharsets.UTF_8);
        } catch (NoSuchAlgorithmException e) {
            throw new MobiException(e);
        }
    }
}

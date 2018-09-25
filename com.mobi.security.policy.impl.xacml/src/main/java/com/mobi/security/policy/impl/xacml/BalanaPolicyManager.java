package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.impl.xacml
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
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
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.net.URLDecoder;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import javax.cache.Cache;

@Component(
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = PolicyManagerConfig.class,
        name = BalanaPolicyManager.COMPONENT_NAME
)
public class BalanaPolicyManager implements XACMLPolicyManager {
    static final String COMPONENT_NAME = "com.mobi.security.policy.api.xacml.XACMLPolicyManager";
    private static final Logger LOG = LoggerFactory.getLogger(BalanaPolicyManager.class);

    private ValueFactory vf;
    private ModelFactory mf;
    private PolicyCache policyCache;
    private VirtualFilesystem vfs;
    private Repository repository;
    private PolicyFileFactory policyFileFactory;

    private String fileLocation;
    private IRI typeIRI;
    private IRI policyFileTypeIRI;

    private static final String BINDING_VALUES = "%BINDINGVALUES";
    private static final String FILTERS = "%FILTERS";
    private static final String RESOURCES_BINDING = "resources";
    private static final String RESOURCES_PROP = "relatedResource";
    private static final String SUBJECTS_BINDING = "subjects";
    private static final String SUBJECTS_PROP = "relatedSubject";
    private static final String ACTIONS_BINDING = "actions";
    private static final String ACTIONS_PROP = "relatedAction";
    private static final String POLICY_ID_BINDING = "policyId";
    private static String policyQuery;

    static {
        try {
            policyQuery = IOUtils.toString(
                    BalanaPolicyManager.class.getResourceAsStream("/find-policies.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setPolicyCache(PolicyCache policyCache) {
        this.policyCache = policyCache;
    }

    @Reference
    void setVfs(VirtualFilesystem vfs) {
        this.vfs = vfs;
    }

    @Reference(name = "repository")
    void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    void setPolicyFileFactory(PolicyFileFactory policyFileFactory) {
        this.policyFileFactory = policyFileFactory;
    }

    @Activate
    protected void start(BundleContext context, Map<String, Object> props) {
        typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
        policyFileTypeIRI = vf.createIRI(PolicyFile.TYPE);
        PolicyManagerConfig config = Configurable.createConfigurable(PolicyManagerConfig.class, props);

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

        loadPolicies(context);
    }

    @Modified
    protected void modified(BundleContext context, Map<String, Object> props) {
        start(context, props);
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
        List<Resource> policyIds = findPolicies(params);
        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        // If there is a policy cache
        if (cache.isPresent()) {
            List<String> policyIdStrs = policyIds.stream().map(Resource::stringValue).collect(Collectors.toList());
            return StreamSupport.stream(cache.get().spliterator(), false)
                    .filter(entry -> policyIdStrs.contains(entry.getKey()))
                    .map(Cache.Entry::getValue)
                    .filter(policy -> policy instanceof XACMLPolicy)
                    .map(policy -> getBalanaPolicy((XACMLPolicy) policy))
                    .collect(Collectors.toList());
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
        } catch (VirtualFilesystemException e) {
            throw new IllegalStateException("Could not remove XACML Policy on disk due to: ", e);
        }
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
            if (conn.contains(policy.getId(), null, null)) {
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
        if (!conn.contains(policyId, typeIRI, policyFileTypeIRI)) {
            throw new IllegalArgumentException("Policy " + policyId + " does not exist");
        }
        Model policyModel = RepositoryResults.asModel(conn.getStatements(null, null, null, policyId), mf);
        return policyFileFactory.getExisting(policyId, policyModel).orElseThrow(() ->
                new IllegalStateException("PolicyFile not present in named graph"));
    }

    private Optional<PolicyFile> optPolicy(Resource policyId, RepositoryConnection conn) {
        Model policyModel = RepositoryResults.asModel(conn.getStatements(null, null, null, policyId), mf);
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
                    String policyStr = IOUtils.toString(inputStream);
                    return new BalanaPolicy(policyStr, vf);
                }
            }
            throw new IllegalStateException("Policy could not be found on disk");
        } catch (IOException e) {
            throw new IllegalStateException("Could not retrieve XACML Policy on disk due to: ", e);
        }
    }

    private void loadPolicies(BundleContext context) {
        LOG.debug("Loading policies");
        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        cache.ifPresent(Cache::clear);
        try (RepositoryConnection conn = repository.getConnection()) {
            VirtualFile directory = vfs.resolveVirtualFile(fileLocation);

            // Initialize policies from within the bundle if they don't already exist
            Bundle bundle = context.getBundle();
            Enumeration<URL> urls = bundle.findEntries("/policies", "*.xml", true);
            while (urls.hasMoreElements()) {
                URL url = urls.nextElement();
                String fileName = URLDecoder.decode(FilenameUtils.getName(url.getPath()), "UTF-8");
                String fileId = FilenameUtils.removeExtension(URLDecoder.decode(fileName, "UTF-8"));
                Resource fileIRI = vf.createIRI(fileId);
                if (!conn.contains(fileIRI, null, null)) {
                    VirtualFile file = vfs.resolveVirtualFile(url.openStream(), fileLocation);
                    addPolicyFile(file, file.getIdentifier() + ".xml", getPolicyFromFile(file));
                } else {
                    PolicyFile policy = validatePolicy(fileIRI);
                    VirtualFile file = vfs.resolveVirtualFile(policy.getRetrievalURL().toString());
                    if (!file.exists()) {
                        file = vfs.resolveVirtualFile(url.openStream(), fileLocation);
                        addPolicyFile(file, file.getIdentifier() + ".xml", getPolicyFromFile(file));
                    }
                }
            }

            // Grab fileNames that are already in the repository
            Set<String> fileNames = new HashSet<>();
            conn.getStatements(null, typeIRI, policyFileTypeIRI).forEach(statement -> {
                Resource policyIRI = statement.getSubject();
                PolicyFile policyFile = validatePolicy(policyIRI);
                fileNames.add(FilenameUtils.removeExtension(getFileName(policyFile)));
            });


            addMissingFilesToRepo(fileNames, directory);

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

    private void addMissingFilesToRepo(Set<String> filePaths, VirtualFile baseFolder) throws VirtualFilesystemException {
        for (VirtualFile file : baseFolder.getChildren()) {
            if (file.isFolder()) {
                addMissingFilesToRepo(filePaths, file);
            } else if (!filePaths.contains(file.getIdentifier())) {
                BalanaPolicy balanaPolicy = getPolicyFromFile(file);
                addPolicyFile(file, file.getIdentifier() + ".xml", balanaPolicy);
            }
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
            conn.add(policyFile.getModel(), policyFile.getResource());
        }
        policyCache.getPolicyCache().ifPresent(cache ->
                cache.put(policyFile.getResource().stringValue(), balanaPolicy));
        return policyFile;
    }

    private List<Resource> findPolicies(PolicyQueryParams params) {
        StringBuilder values = new StringBuilder(" ");
        StringBuilder filters = new StringBuilder(" ");
        setBindings(params.getResourceIRIs(), RESOURCES_BINDING, RESOURCES_PROP, values, filters);
        setBindings(params.getSubjectIRIs(), SUBJECTS_BINDING, SUBJECTS_PROP, values, filters);
        setBindings(params.getActionIRIs(), ACTIONS_BINDING, ACTIONS_PROP, values, filters);

        try (RepositoryConnection conn = repository.getConnection()) {
            String queryStr = policyQuery.replace(BINDING_VALUES, values.toString())
                    .replace(FILTERS, filters.toString());
            return QueryResults.asList(conn.prepareTupleQuery(queryStr).evaluate()).stream()
                    .map(bindings -> Bindings.requiredResource(bindings, POLICY_ID_BINDING))
                    .collect(Collectors.toList());
        }
    }

    private void setBindings(Set<IRI> iris, String variableName, String propertyName, StringBuilder values,
                             StringBuilder filters) {
        if (iris.size() > 0) {
            filters.append("?").append(POLICY_ID_BINDING).append(" :").append(propertyName).append(" ?")
                    .append(variableName).append(". ");
            if (iris.size() > 1) {
                String iriStr = String.join(" ", iris.stream().map(iri -> "<" + iri + ">")
                        .collect(Collectors.toList()));
                values.append("VALUES ?").append(variableName).append(" {").append(iriStr).append("} ");
            } else if (iris.size() == 1) {
                values.append("BIND (<").append(iris.iterator().next()).append("> as ?").append(variableName)
                        .append(") ");
            }
        }
    }

    private String getChecksum(BalanaPolicy policy) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(policy.toString().getBytes());
            return new String(hash, "UTF-8");
        } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
            throw new MobiException(e);
        }
    }
}

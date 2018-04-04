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
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
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
    protected void start(Map<String, Object> props) {
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

        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        if (cache.isPresent()) {
            cache.get().clear();
            loadPolicies(cache.get());
        }
    }

    @Modified
    protected void modified(Map<String, Object> props) {
        start(props);
    }

    @Override
    public XACMLPolicy createPolicy(PolicyType policyType) {
        return new BalanaPolicy(policyType, vf);
    }

    @Override
    public Resource addPolicy(XACMLPolicy policy) {
        BalanaPolicy balanaPolicy = getBalanaPolicy(policy);
        String fileName = UUID.randomUUID() + ".xml";
        String filePath = fileLocation + fileName;
        LOG.debug("Creating new policy file " + filePath);
        try {
            VirtualFile file = vfs.resolveVirtualFile(filePath);
            file.create();
            try (OutputStream out = file.writeContent()) {
                out.write(balanaPolicy.toString().getBytes());
            }
            PolicyFile policyFile = addPolicyFile(file, fileName, balanaPolicy);
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
        return policyIds.stream()
                .map(this::getPolicyFromFile)
                .collect(Collectors.toList());
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
        try (RepositoryConnection conn = repository.getConnection()) {
            if (conn.contains(policyId, typeIRI, policyFileTypeIRI)) {
                BalanaPolicy policy = getPolicyFromFile(policyId);
                cache.ifPresent(c -> c.put(policyId.stringValue(), policy));
                return Optional.of(policy);
            }
        }
        return Optional.empty();
    }

    @Override
    public void updatePolicy(Resource policyId, XACMLPolicy newPolicy) {
        PolicyFile policyFile = validatePolicy(policyId);
        try {
            BalanaPolicy balanaPolicy = getBalanaPolicy(newPolicy);
            VirtualFile virtualFile = vfs.resolveVirtualFile(policyId.stringValue());
            if (!virtualFile.exists()) {
                throw new IllegalStateException("Policy file does not exist");
            }
            LOG.debug("Updating policy file " + policyId);
            try (OutputStream out = virtualFile.writeContent()) {
                out.write(balanaPolicy.toString().getBytes());
            }
            setRelatedProperties(policyFile, balanaPolicy);
            // TODO: Overwrite SHA hash value on PolicyFile
            try (RepositoryConnection conn = repository.getConnection()) {
                conn.clear(policyId);
                conn.add(policyFile.getModel(), policyId);
            }
            policyCache.getPolicyCache().ifPresent(cache -> cache.replace(policyId.stringValue(), balanaPolicy));
        } catch (IOException e) {
            throw new IllegalStateException("Could not save XACML Policy to disk due to: ", e);
        }
    }

    @Override
    public void deletePolicy(Resource policyId) {
        PolicyFile policyFile = validatePolicy(policyId);
        try {
            LOG.debug("Removing policy file " + policyId);
            VirtualFile file = vfs.resolveVirtualFile(policyFile.getResource().stringValue());
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

    private PolicyFile validatePolicy(Resource policyId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            if (!conn.contains(policyId, typeIRI, policyFileTypeIRI)) {
                throw new IllegalArgumentException("Policy " + policyId + " does not exist");
            }
            Model policyModel = RepositoryResults.asModel(conn.getStatements(null, null, null, policyId), mf);
            return policyFileFactory.getExisting(policyId, policyModel).orElseThrow(() ->
                    new IllegalStateException("PolicyFile not present in named graph"));
        }
    }

    private BalanaPolicy getPolicyFromFile(Resource policyId) {
        try {
            return getPolicyFromFile(vfs.resolveVirtualFile(policyId.stringValue()));
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

    private void loadPolicies(Cache<String, Policy> cache) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Set<String> fileNames = new HashSet<>();
            conn.getStatements(null, typeIRI, policyFileTypeIRI).forEach(statement -> {
                Resource policyIRI = statement.getSubject();
                BalanaPolicy policy = getPolicyFromFile(policyIRI);
                cache.put(policyIRI.stringValue(), policy);
                fileNames.add(FilenameUtils.getName(policyIRI.stringValue()));
            });
            VirtualFile directory = vfs.resolveVirtualFile(fileLocation);
            for (VirtualFile file : directory.getChildren()) {
                String fileName = FilenameUtils.getName(file.getIdentifier());
                if (!fileNames.contains(fileName) && fileName.endsWith(".xml")) {
                    LOG.debug("Discovered policy file " + fileName + " in directory that is not in the repository");
                    BalanaPolicy balanaPolicy = getPolicyFromFile(file);
                    addPolicyFile(file, fileName, balanaPolicy);
                }
            }
        } catch (VirtualFilesystemException e) {
            throw new MobiException("Error initializing policy files due to: ", e);
        }
    }

    private void setRelatedProperties(PolicyFile policyFile, BalanaPolicy policy) {
        Set<IRI> relatedResources = new HashSet<>();
        Set<IRI> relatedSubjects = new HashSet<>();
        Set<IRI> relatedActions = new HashSet<>();
        PolicyType policyType = policy.getJaxbPolicy();
        policyType.getTarget().getAnyOf().forEach(anyOfType ->
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
        policyFile.setRelatedResource(relatedResources);
        policyFile.setRelatedSubject(relatedSubjects);
        policyFile.setRelatedAction(relatedActions);
    }

    private PolicyFile addPolicyFile(VirtualFile file, String fileName, BalanaPolicy balanaPolicy)
            throws VirtualFilesystemException {
        PolicyFile policyFile = policyFileFactory.createNew(vf.createIRI(file.getIdentifier()));
        policyFile.setSize((double) file.getSize());
        policyFile.setFileName(fileName);
        // TODO: Determine SHA hash
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
}

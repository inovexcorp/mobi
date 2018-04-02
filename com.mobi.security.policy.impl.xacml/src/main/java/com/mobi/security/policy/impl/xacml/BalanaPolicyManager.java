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
import aQute.configurable.Configurable;
import com.mobi.exception.MobiException;
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
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.config.PolicyManagerConfig;
import com.mobi.security.policy.api.xacml.jaxb.AttributeDesignatorType;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
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

    private ValueFactory vf;
    private ModelFactory mf;
    private PolicyCache policyCache;
    private VirtualFilesystem vfs;
    private Repository repository;
    private PolicyFileFactory policyFileFactory;

    private String fileLocation;
    private IRI typeIRI;
    private IRI policyFileTypeIRI;

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
            VirtualFile file = this.vfs.resolveVirtualFile(config.policyFileLocation());
            if (!file.exists() || !file.isFolder()) {
                throw new MobiException("Policy File Location is not a directory");
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
        try {
            VirtualFile file = vfs.resolveVirtualFile(filePath);
            file.create();
            try (OutputStream out = file.writeContent()) {
                out.write(balanaPolicy.toString().getBytes());
            }
            PolicyFile policyFile = policyFileFactory.createNew(vf.createIRI(file.getUrl().toString()));
            policyFile.setSize((double) file.getSize());
            policyFile.setFileName(fileName);
            // TODO: Determine SHA hash
            setRelatedProperties(policyFile, balanaPolicy);
            try (RepositoryConnection conn = repository.getConnection()) {
                conn.add(policyFile.getModel(), policyFile.getResource());
            }
            policyCache.getPolicyCache().ifPresent(cache ->
                    cache.put(policyFile.getResource().stringValue(), balanaPolicy));
            return policyFile.getResource();
        } catch (IOException e) {
            throw new IllegalStateException("Could not save XACML Policy to disk due to: ", e);
        }
    }

    @Override
    public List<XACMLPolicy> getPolicies() {
        List<XACMLPolicy> policies = new ArrayList<>();
        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        // If there is a policy cache
        if (cache.isPresent()) {
            return StreamSupport.stream(cache.get().spliterator(), false)
                    .map(Cache.Entry::getValue)
                    .filter(policy -> policy instanceof XACMLPolicy)
                    .map(policy -> getBalanaPolicy((XACMLPolicy) policy))
                    .collect(Collectors.toList());
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.getStatements(null, typeIRI, policyFileTypeIRI).forEach(statement -> {
                Resource policyIRI = statement.getSubject();
                BalanaPolicy policy = getPolicyFromFile(policyIRI);
                policies.add(policy);
            });
        }
        return policies;
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
            VirtualFile virtualFile = vfs.resolveVirtualFile(policyId.stringValue());
            if (virtualFile.isFile()) {
                try (InputStream inputStream = virtualFile.readContent()) {
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
            conn.getStatements(null, typeIRI, policyFileTypeIRI).forEach(statement -> {
                Resource policyIRI = statement.getSubject();
                BalanaPolicy policy = getPolicyFromFile(policyIRI);
                cache.put(policyIRI.stringValue(), policy);
            });
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
}

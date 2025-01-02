package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.utils.cli.api.PostRestoreOperation;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.ServiceReference;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(
        service = { ClearAdminSystemPolicies.class, PostRestoreOperation.class }
)
public class ClearAdminSystemPolicies implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(ClearAdminSystemPolicies.class);
    private static final ValueFactory vf = new ValidatingValueFactory();
    private static final List<Resource> POLICES_TO_REMOVE;
    private static final IRI retrievalURL;

    static {
        retrievalURL = vf.createIRI(BinaryFile.retrievalURL_IRI);
        POLICES_TO_REMOVE = Stream.of(vf.createIRI("http://mobi.com/policies/system-repo-access"),
                        vf.createIRI("http://mobi.com/policies/all-access-versioned-rdf-record"),
                        vf.createIRI("http://mobi.com/policies/dataset-creation"),
                        vf.createIRI("http://mobi.com/policies/ontology-creation"),
                        vf.createIRI("http://mobi.com/policies/shapes-graph-record-creation"))
                .collect(Collectors.toUnmodifiableList());
    }

    @Reference
    protected CatalogConfigProvider config;

    @Reference
    protected VirtualFilesystem vfs;

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 105;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Up to version 1.20 (excluded). Reference: MP-2505
        return VersionRange.createFromVersionSpec("(0,1.20)");
    }

    @Override
    public void execute() {
        LOGGER.debug(getClass().getSimpleName() + " execute");
        LOGGER.debug("Remove old versions of admin policy and system repo query policy");
        // 1.20 changed admin policy and system repo query policy.
        // Need to remove old versions so update policy takes effect.
        try (RepositoryConnection conn = config.getRepository().getConnection()) {
            BundleContext xacmlBundleContext = FrameworkUtil.getBundle(XACMLPolicyManager.class).getBundleContext();

            ServiceReference<XACMLPolicyManager> service =
                    xacmlBundleContext.getServiceReference(XACMLPolicyManager.class);
            String policyFileLocation = (String) service.getProperty("policyFileLocation");
            removePolicyFiles(conn, policyFileLocation, POLICES_TO_REMOVE);
        }
    }

    /**
     * Finds old policy file locations for the provided files in the repo (may point to a non-existent directory), grabs
     * the hash path, finds the File in the new location on this instance using the policyFileLocation and VFS, and
     * deletes the File if it exists.
     *
     * @param conn               the {@link RepositoryConnection} used to query the repo for retrievalUrls.
     * @param policyFileLocation the policyFileLocation for the current instance.
     * @param policies           the List of IRIs of policies whose files should be removed.
     */
    protected void removePolicyFiles(RepositoryConnection conn, String policyFileLocation,
                                     List<Resource> policies) {
        for (Resource policy : policies) {
            RepositoryResult<Statement> results = conn.getStatements(policy, retrievalURL, null);
            results.forEach(statement -> {
                String path = statement.getObject().stringValue();
                Pattern pathPattern = Pattern.compile("([\\/|\\\\]\\w+){3}$");
                Matcher matcher = pathPattern.matcher(path);
                if (matcher.find()) {
                    String vfsFilePath = policyFileLocation + matcher.group().substring(1);
                    try {
                        VirtualFile file = vfs.resolveVirtualFile(vfsFilePath);
                        if (file.exists()) {
                            LOGGER.trace("File Deleted: " + file);
                            file.delete();
                        }
                    } catch (VirtualFilesystemException e) {
                        LOGGER.error("Could not find vfs file: " + vfsFilePath);
                    }
                } else {
                    LOGGER.error("Could not find vfs file for statement: " + statement);
                }
            });
        }
    }

}

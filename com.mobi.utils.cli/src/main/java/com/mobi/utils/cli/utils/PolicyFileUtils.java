package com.mobi.utils.cli.utils;

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

import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.ontologies.documents.BinaryFile;
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
import org.slf4j.Logger;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PolicyFileUtils {
    private static final ValueFactory vf = new ValidatingValueFactory();
    private static final IRI retrievalURL = vf.createIRI(BinaryFile.retrievalURL_IRI);

    /**
     * Finds old policy file locations for the provided files in the repo (may point to a non-existent directory), grabs
     * the hash path, finds the File in the new location on this instance using the policyFileLocation and VFS, and
     * deletes the File if it exists.
     *
     * @param conn               the {@link RepositoryConnection} used to query the repo for retrievalUrls.
     * @param vfs                the {@link VirtualFilesystem} to resolve files
     * @param policies           the List of IRIs of policies whose files should be removed.
     * @param logger             the {@link Logger} to log
     */
    public static void removePolicyFiles(RepositoryConnection conn, VirtualFilesystem vfs, List<Resource> policies,
                                         Logger logger) {
        BundleContext xacmlBundleContext = FrameworkUtil.getBundle(XACMLPolicyManager.class).getBundleContext();

        ServiceReference<XACMLPolicyManager> service =
                xacmlBundleContext.getServiceReference(XACMLPolicyManager.class);
        String policyFileLocation = (String) service.getProperty("policyFileLocation");

        for (Resource policy : policies) {
            RepositoryResult<Statement> results = conn.getStatements(policy, retrievalURL, null);
            results.forEach(statement -> {
                String path = statement.getObject().stringValue();
                Pattern pathPattern = Pattern.compile("([\\/|\\\\]\\w+){3}$");
                Matcher matcher = pathPattern.matcher(path);
                if (matcher.find()) {
                    String vfsFilePath = policyFileLocation + matcher.group().substring(1);
                    try (VirtualFile file = vfs.resolveVirtualFile(vfsFilePath)) {
                        if (file.exists()) {
                            logger.trace("File Deleted: {}", file);
                            file.delete();
                        }
                    } catch (Exception e) {
                        logger.error("Could not find vfs file: {}", vfsFilePath);
                    }
                } else {
                    logger.error("Could not find vfs file for statement: {}", statement);
                }
            });
        }
    }
}

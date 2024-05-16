package com.mobi.utils.cli.operations.pre;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.utils.cli.api.PreRestoreOperation;
import org.apache.commons.io.FileUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.ServiceReference;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;

@Component(
        service = { CopyDataDirectory.class, PreRestoreOperation.class }
)
public class CopyDataDirectory implements PreRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(CopyDataDirectory.class);
    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir");
    private static final String DATA_DIR_PATH = System.getProperty("karaf.data") + File.separator + "virtualFiles";
    private static final String RESTORE_PATH = TEMP_DIR + File.separator + "restoreZip";
    private static final String RESTORE_POLICY_PATH = RESTORE_PATH + File.separator + "policies";
    private static final String RESTORE_DATA_PATH = RESTORE_PATH + File.separator + "data";

    @Override
    public Integer getPriority() {
        return 10;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Starting from Version 1.13 (included)
        return VersionRange.createFromVersionSpec("[1.13,]");
    }

    @Override
    public void execute() {
        LOGGER.debug(getClass().getSimpleName() + " execute");
        //  Copy policy files to proper destination. Directory contains all policies for runtime.
        BundleContext bundleContext = FrameworkUtil.getBundle(XACMLPolicyManager.class).getBundleContext();
        ServiceReference<XACMLPolicyManager> serviceRef = bundleContext.getServiceReference(XACMLPolicyManager.class);
        if (serviceRef == null) {
            throw new IllegalStateException("Policy Manager service is not available");
        }
        String policyFileLocation = (String) serviceRef.getProperty("policyFileLocation");
        LOGGER.debug("Identified policy directory as " + policyFileLocation);
        File policyDir = new File(policyFileLocation);
        if (policyDir.getParentFile().getAbsolutePath().equals(DATA_DIR_PATH)) {
            copyDataDir();
        } else {
            copyDataDir();
            copyPolicy(policyDir);
        }
    }

    private void copyPolicy(File policyDir) {
        if (policyDir.exists()) {
            File tmpPolicyDir = new File(RESTORE_POLICY_PATH);
            try {
                FileUtils.deleteDirectory(policyDir); // Delete old policies
                LOGGER.debug(String.format("Policy Directory Deleted: %s", policyDir));
                FileUtils.forceMkdir(policyDir); // Make Policy Directory
                FileUtils.copyDirectory(tmpPolicyDir, policyDir); // Copy Backup policies into policy directory
                LOGGER.debug(String.format("Copied Directory %s into: %s", tmpPolicyDir, policyDir));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        } else {
            throw new IllegalStateException("Could not find policy directory");
        }
    }

    private void copyDataDir() {
        File tmpDataDir = new File(RESTORE_DATA_PATH);
        if (tmpDataDir.exists()) {
            File currentDataDir = new File(DATA_DIR_PATH);
            try {
                FileUtils.deleteDirectory(currentDataDir); // Delete old policies
                LOGGER.debug(String.format("Data Directory Deleted: %s", currentDataDir));
                FileUtils.forceMkdir(currentDataDir); // Make Policy Directory
                FileUtils.copyDirectory(tmpDataDir, currentDataDir); // Copy Backup policies into policy directory
                LOGGER.debug(String.format("Copied Directory %s into: %s", tmpDataDir, currentDataDir));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }
}

package com.mobi.vfs;

/*-
 * #%L
 * itests-vfs
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertNotNull;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import com.mobi.itests.support.KarafTestSupport;
import com.mobi.vfs.api.TemporaryVirtualFile;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.temporal.ChronoUnit;
import java.util.UUID;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class BasicVfsIT extends KarafTestSupport {

    private static final Logger LOGGER = LoggerFactory.getLogger(BasicVfsIT.class);

    @Inject
    protected BundleContext thisBundleContext;

    @Before
    public synchronized void setup() throws Exception {
        setup(thisBundleContext);
    }

    /**
     * Tests that the required bundles are installed and active.
     */
    @Test
    public void requiredBundlesAreActive() throws Exception {
        LOGGER.info("Test requiredBundlesAreActive starting...");

        bundleList.forEach(bundleName -> {
            Bundle bundle = findBundleByName(bundleName);
            assertNotNull("Bundle is not installed: " + bundleName, bundle);
            assertEquals("Bundle is installed, but not active: " + bundleName, bundle.getState(), Bundle.ACTIVE);
        });

        LOGGER.info("Test requiredBundlesAreActive complete.");
    }

    /**
     * Tests that the required services are registered.
     */
    @Test
    public void requiredServicesAreRegistered() throws Exception {
        LOGGER.info("Test requiredServicesAreRegistered starting...");

        for (String filter : serviceFilters) {
            waitForService(filter, 6000);
            ServiceReference<?>[] refs = thisBundleContext.getAllServiceReferences(null, filter);
            assertNotNull("No services registered for filter: " + filter, refs);
            assertEquals("Wrong number of services registered for filter: " + filter, 1, refs.length);
        }

        LOGGER.info("Test requiredServicesAreRegistered complete.");
    }

    @Test
    public void testBasicFunctionality() throws Exception {
        final VirtualFilesystem service = getOsgiService(VirtualFilesystem.class);
        VirtualFile file = service.resolveVirtualFile("file:///tmp/testFile-" + UUID.randomUUID() + ".txt");
        file.create();
        Assert.assertTrue("Virtual file should exist", file.exists());
        file.delete();
        Assert.assertFalse("Deleted virtual file should not exist", file.exists());
    }

    @Test
    public void testTempFileCreation() throws Exception {
        LOGGER.debug("Testing temporary file creation.");
        final VirtualFilesystem service = getOsgiService(VirtualFilesystem.class);
        TemporaryVirtualFile tvf = service.createTemporaryVirtualFile(1L, ChronoUnit.SECONDS);
        LOGGER.debug("Going to create {}", tvf.getIdentifier());
        //Should not exist.
        Assert.assertFalse("Temp file shouldn't exist", tvf.exists());
        tvf.create();
        //Should exist
        Assert.assertTrue("Temp file should exist", tvf.exists());
        LOGGER.debug("Created tmp file exists, going to wait two seconds to ensure it is successfully deleted");
        Thread.sleep(2000L);
        // File should be gone
        Assert.assertFalse("Temp file should not exist anymore", tvf.exists());
        LOGGER.debug("Temporary file created and deleted as expected");
    }

    @Test
    public void testTmpUri() throws Exception {
        final String uri = "tmp://what/someFile" + UUID.randomUUID() + ".txt";
        LOGGER.debug("Testing tmp file creation for {}", uri);
        final VirtualFilesystem service = getOsgiService(VirtualFilesystem.class);
        VirtualFile file = service.resolveVirtualFile(uri);
        file.create();
        LOGGER.debug("Created file '{}' successfully");
    }
}

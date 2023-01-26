package com.mobi.vfs;

/*-
 * #%L
 * itests-vfs
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.vfs.api.TemporaryVirtualFile;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import org.apache.karaf.itests.KarafTestSupport;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.Configuration;
import org.ops4j.pax.exam.CoreOptions;
import org.ops4j.pax.exam.Option;
import org.ops4j.pax.exam.OptionUtils;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.karaf.options.KarafDistributionOption;
import org.ops4j.pax.exam.options.MavenArtifactUrlReference;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Paths;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class BasicVfsIT extends KarafTestSupport {

    private static final Logger LOGGER = LoggerFactory.getLogger(BasicVfsIT.class);

    private Set<String> bundleList;
    private Set<String> serviceFilters;

    @Inject
    protected BundleContext thisBundleContext;

    @Override
    public MavenArtifactUrlReference getKarafDistribution() {
        return CoreOptions.maven().groupId("com.mobi").artifactId("mobi-distribution").versionAsInProject().type("tar.gz");
    }

    @Configuration
    @Override
    public Option[] config() {
        try {
            List<Option> options = new ArrayList<>(Arrays.asList(
                    KarafDistributionOption.replaceConfigurationFile("etc/org.ops4j.pax.logging.cfg",
                            Paths.get(this.getClass().getResource("/etc/org.ops4j.pax.logging.cfg").toURI()).toFile()),
                    KarafDistributionOption.replaceConfigurationFile("etc/com.mobi.vfs.basic-system.cfg",
                            Paths.get(this.getClass().getResource("/etc/com.mobi.vfs.basic-system.cfg").toURI()).toFile()),
                    KarafDistributionOption.editConfigurationFilePut("etc/com.mobi.security.api.EncryptionService.cfg", "enabled", "false")
            ));

            return OptionUtils.combine(super.config(), options.toArray(new Option[0]));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Before
    public synchronized void setup() throws Exception {
        bundleList = new HashSet<>();
        serviceFilters = new HashSet<>();

        LOGGER.info("Setting up test suite...");

        String servicesFilename = "/registered-services.txt";
        try (Stream<String> stream = getReaderForEntry(thisBundleContext, servicesFilename).lines()) {
            stream.forEach(serviceFilters::add);
        }

        String bundlesFilename = "/active-bundles.txt";
        try (Stream<String> stream = getReaderForEntry(thisBundleContext, bundlesFilename).lines()) {
            stream.forEach(bundleList::add);
        }

        LOGGER.info("Setup complete.");
    }

    private BufferedReader getReaderForEntry(BundleContext context, String entry) throws IOException {
        return new BufferedReader(new InputStreamReader(context.getBundle().getEntry(entry).openStream()));
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
        VirtualFile file = service.resolveVirtualFile("file://" + System.getProperty("user.dir") + "testFile-"
                + UUID.randomUUID() + ".txt");
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

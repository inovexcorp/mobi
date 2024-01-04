package com.mobi.itests.platform;

/*-
 * #%L
 * itests-platform
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.apache.karaf.itests.KarafTestSupport;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class PlatformIT extends KarafTestSupport {

    private static final Logger LOGGER = LoggerFactory.getLogger(PlatformIT.class);

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
        bundleList.forEach(bundleName -> {
            Bundle bundle = findBundleByName(bundleName);
            assertNotNull("Bundle is not installed: " + bundleName, bundle);
            assertEquals("Bundle is installed, but not active: " + bundleName, bundle.getState(), Bundle.ACTIVE);
        });
    }

    /**
     * Tests that the required services are registered.
     */
    @Test
    public void requiredServicesAreRegistered() throws Exception {
        for (String filter : serviceFilters) {
            ServiceReference<?>[] refs = thisBundleContext.getAllServiceReferences(null, filter);
            assertNotNull("No services registered for filter: " + filter, refs);
            assertEquals("Wrong number of services registered for filter: " + filter, 1, refs.length);
        }
    }
}

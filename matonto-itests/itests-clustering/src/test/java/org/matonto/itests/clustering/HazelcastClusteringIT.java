package org.matonto.itests.clustering;

/*-
 * #%L
 * itests-clustering
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
import org.matonto.clustering.api.ClusteringService;
import org.matonto.itests.support.KarafTestSupport;
import org.matonto.platform.config.api.server.MatOnto;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.UUID;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class HazelcastClusteringIT extends KarafTestSupport {

    private static final Logger LOGGER = LoggerFactory.getLogger(HazelcastClusteringIT.class);

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
            waitForService(filter, 5000);
            ServiceReference<?>[] refs = thisBundleContext.getAllServiceReferences(null, filter);
            assertNotNull("No services registered for filter: " + filter, refs);
            assertEquals("Wrong number of services registered for filter: " + filter, 1, refs.length);
        }

        LOGGER.info("Test requiredServicesAreRegistered complete.");
    }

    /**
     * Tests that the Hazelcast service starts up correctly and has one registered node.
     */
    @Test
    public void hazelcastClusterStartsCorrectly() throws Exception {
        LOGGER.info("Test hazelcastClusterStartsCorrectly starting...");

        ClusteringService service = getOsgiService(ClusteringService.class, "(&(objectClass=org.matonto.clustering.api.ClusteringService)(component.name=org.matonto.clustering.hazelcast))", 5000);
        MatOnto matonto = getOsgiService(MatOnto.class, "(&(objectClass=org.matonto.platform.config.api.server.MatOnto)(component.name=org.matonto.platform.server))", 5000);
        assertEquals("Hazelcast Service did not startup correctly.", 1, service.getMemberCount());
        assertNotNull("MatOnto service had no server identifier!", matonto.getServerIdentifier());
        Optional<UUID> uuid = service.getClusteredNodeIds().stream().findFirst();
        if (uuid.isPresent()) {
            assertEquals("", matonto.getServerIdentifier(), uuid.get());
        } else {
            Assert.fail("No UUID found in set of clustered nodes in clustering service");
        }

        LOGGER.info("Test hazelcastClusterStartsCorrectly complete.");
    }
}

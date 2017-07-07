package org.matonto.itests.clustering;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.apache.commons.collections.EnumerationUtils;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.itests.support.KarafTestSupport;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.cm.Configuration;

import java.util.Dictionary;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Set;
import java.util.stream.Stream;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class HazelcastClusteringIT extends KarafTestSupport {

    private Set<String> bundleList = new HashSet<>();
    private Set<String> serviceFilters = new HashSet<>();
    private static boolean setupComplete = false;


    @Inject
    protected BundleContext thisBundleContext;

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        Configuration serviceConfig = this.configAdmin.listConfigurations("(org.matonto.clustering.hazelcast*)")[0];

        Dictionary<String, Object> updated = new Hashtable<>();
        updated.put("enabled", true);
        Dictionary<String, Object> old = serviceConfig.getProperties();
        EnumerationUtils.toList(old.keys()).forEach(key -> {
            if (!key.equals("enabled")) {
                updated.put((String) key, old.get(key));
            }
        });
        serviceConfig.update(updated);


        String servicesFilename = "/registered-services.txt";
        try (Stream<String> stream = getReaderForEntry(thisBundleContext, servicesFilename).lines()) {
            stream.forEach(serviceFilters::add);
        }

        String bundlesFilename = "/active-bundles.txt";
        try (Stream<String> stream = getReaderForEntry(thisBundleContext, bundlesFilename).lines()) {
            stream.forEach(bundleList::add);
        }

        setupComplete = true;
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

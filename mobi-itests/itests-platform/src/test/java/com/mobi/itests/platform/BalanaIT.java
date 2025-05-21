package com.mobi.itests.platform;

/*-
 * #%L
 * itests-platform
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.apache.karaf.itests.KarafTestSupport;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
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

import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class BalanaIT extends KarafTestSupport {
    Set<Resource> systemPolicyIds = new HashSet<>();

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
                            Paths.get(Objects.requireNonNull(this.getClass().getResource("/etc/org.ops4j.pax.logging.cfg")).toURI()).toFile()),
                    KarafDistributionOption.editConfigurationFilePut("etc/com.mobi.security.api.EncryptionService.cfg", "enabled", "false")
            ));
            return OptionUtils.combine(super.config(), options.toArray(new Option[0]));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Before
    public void setup() {
        ValueFactory vf = new ValidatingValueFactory();
        systemPolicyIds.add(vf.createIRI("http://mobi.com/policies/admin-user-only-access-versioned-rdf-record"));
        systemPolicyIds.add(vf.createIRI("http://mobi.com/policies/dataset-creation"));
        systemPolicyIds.add(vf.createIRI("http://mobi.com/policies/ontology-creation"));
        systemPolicyIds.add(vf.createIRI("http://mobi.com/policies/mapping-creation"));
        systemPolicyIds.add(vf.createIRI("http://mobi.com/policies/workflow-record-creation"));
        systemPolicyIds.add(vf.createIRI("http://mobi.com/policies/shapes-graph-record-creation"));
        systemPolicyIds.add(vf.createIRI("https://mobi.solutions/policies/system-repo-access"));
        systemPolicyIds.add(vf.createIRI("https://mobi.solutions/policies/prov-repo-access"));
        systemPolicyIds.add(vf.createIRI("https://mobi.solutions/policies/ontology-cache-repo-access"));
    }

    @Test
    public void validateSystemPoliciesLoaded() throws Exception {
        XACMLPolicyManager policyManager = getOsgiService(XACMLPolicyManager.class);
        Set<Resource> policyIds = policyManager.getSystemPolicyIds();
        assertEquals(9, policyIds.size());
        systemPolicyIds.forEach(systemPolicy -> assertTrue(policyIds.contains(systemPolicy)));
    }
}

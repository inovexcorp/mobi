package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class ReloadSystemPolicyTest {
    private AutoCloseable closeable;
    private ReloadSystemPolicy reloadCommand = new ReloadSystemPolicy();
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private Resource policyId = vf.createIRI("http://mobi.com/policies/admin-user-only-access-versioned-rdf-record");
    private Set<Resource> policyIds = Collections.singleton(policyId);
    private String fileContents;

    @Mock
    XACMLPolicyManager policyManager;

    @Mock
    XACMLPolicy policy;

    @Before
    public void setup() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        URL url = ReloadSystemPolicyTest.class.getResource("/http%3A%2F%2Fmobi.com%2Fpolicies%2Fadmin-user-only-access-versioned-rdf-record.xml");
        reloadCommand.filePath = URLDecoder.decode(url.getPath(), StandardCharsets.UTF_8);
        when(policyManager.getSystemPolicyIds()).thenReturn(policyIds);
        when(policyManager.getPolicy(policyId)).thenReturn(Optional.of(policy));
        fileContents = new String(Files.newInputStream(Paths.get(reloadCommand.filePath)).readAllBytes(), StandardCharsets.UTF_8);

        reloadCommand.policyManager = policyManager;
    }

    @After
    public void tearDown() throws Exception {
        closeable.close();
    }

    @Test
    public void validFileTest() throws Exception {
        reloadCommand.execute();
        verify(policyManager).getSystemPolicyIds();
        verify(policyManager).deletePolicy(policyId);
        verify(policyManager).loadSystemPolicyIfAbsent(fileContents);
        verify(policyManager, never()).addSystemPolicy(any());
    }

    @Test(expected = IllegalArgumentException.class)
    public void noFileTest() throws Exception {
        reloadCommand.filePath = "";
        reloadCommand.execute();
    }

    @Test
    public void policyManagerDoesNotContainFileTest() throws Exception {
        when(policyManager.getSystemPolicyIds()).thenReturn(Collections.emptySet());
        reloadCommand.execute();

        verify(policyManager).getSystemPolicyIds();
        verify(policyManager, never()).deletePolicy(policyId);
        verify(policyManager, never()).loadSystemPolicyIfAbsent(fileContents);
        verify(policyManager, never()).addSystemPolicy(any());
    }

    @Test
    public void errorLoadingPolicyTest() throws Exception {
        doThrow(new IllegalArgumentException()).when(policyManager).loadSystemPolicyIfAbsent(anyString());
        reloadCommand.execute();

        verify(policyManager).getSystemPolicyIds();
        verify(policyManager).deletePolicy(policyId);
        verify(policyManager).loadSystemPolicyIfAbsent(fileContents);
        verify(policyManager).addSystemPolicy(policy);
    }
}

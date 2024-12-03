package com.mobi.utils.cli.operations.post;

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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.utils.cli.CliTestUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.stream.Stream;

public class ClearOntologyEditorStateTest {
    private AutoCloseable closeable;
    private ValueFactory vf;
    private MemoryRepositoryWrapper repo;

    @Mock
    protected CatalogConfigProvider config;

    @Mock
    protected StateManager stateManager;

    private ClearOntologyEditorState operation;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        vf = new ValidatingValueFactory();

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        Mockito.when(config.getRepository()).thenReturn(repo);

        operation = new ClearOntologyEditorState();
        operation.config = config;
        operation.stateManager = stateManager;
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        Mockito.reset(config, stateManager);
    }

    @Test
    public void getVersionRangeTest() throws InvalidVersionSpecificationException {
        List<String> expectedVersions = Stream.of("1.12;true",
                "1.13;true",
                "1.14;true",
                "1.15;true",
                "1.16;true",
                "1.17;true",
                "1.18;true",
                "1.19;true",
                "1.20;true",
                "1.21;true",
                "1.22;true",
                "2.0;true",
                "2.1;true",
                "2.2;true",
                "2.3;false",
                "2.4;false",
                "2.5;false"
        ).toList();
        List<String> actualVersionCheck = CliTestUtils.runVersionCheck(operation, expectedVersions);
        Assert.assertEquals(expectedVersions, actualVersionCheck);
    }

    @Test
    public void executePolicyCheckTest() {
        CliTestUtils.loadFiles(repo,"/systemState.trig");

        List<String> policies = CliTestUtils.queryResource(repo, "/queries/searchPolicy.rq", "policyGraph", "policy");
        Assert.assertEquals( 28, policies.size());

        operation.execute();

        List<String> policiesAfter = CliTestUtils.queryResource(repo, "/queries/searchPolicy.rq", "policyGraph", "policy");
        Assert.assertEquals(28, policiesAfter.size());
    }

    @Test
    public void executeTest() {
        CliTestUtils.loadFiles(repo,"/systemState.trig");

        operation.execute();

        verify(stateManager, times(6)).deleteState(any(Resource.class));
        verify(stateManager).deleteState(eq(vf.createIRI("http://mobi.com/states#60a867c9-fe86-4912-a803-5a2ed2f527cb")));
        verify(stateManager).deleteState(eq(vf.createIRI("http://mobi.com/states#90067faf-37bb-49d9-87c3-03a7d169b531")));
        verify(stateManager).deleteState(eq(vf.createIRI("http://mobi.com/states#d04fe5a9-6bf0-45e4-ae17-b2ce96fd63b1")));
        verify(stateManager).deleteState(eq(vf.createIRI("http://mobi.com/states#bbe52322-c3d3-40ab-8730-2de7962550da")));
        verify(stateManager).deleteState(eq(vf.createIRI("http://mobi.com/states#0001")));
        verify(stateManager).deleteState(eq(vf.createIRI("http://mobi.com/states#0002")));
    }

}

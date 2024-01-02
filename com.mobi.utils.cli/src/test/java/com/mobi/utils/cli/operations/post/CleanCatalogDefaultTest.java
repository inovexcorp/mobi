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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.utils.cli.CliTestUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
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
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.mobi.utils.cli.CliTestUtils.loadFiles;
import static com.mobi.utils.cli.CliTestUtils.queryResource;
import static org.mockito.Mockito.times;

public class CleanCatalogDefaultTest {
    private AutoCloseable closeable;
    private ValueFactory vf;
    private MemoryRepositoryWrapper repo;

    @Mock
    private CatalogConfigProvider config;

    @Mock
    private StateManager stateManager;

    private CleanCatalogDefault operation;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        vf = new ValidatingValueFactory();
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        Mockito.when(config.getRepository()).thenReturn(repo);

        operation = new CleanCatalogDefault();
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
        List<String> expectedVersions = Stream.of(
                "1.12;true",
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
                "2.3;true",
                "2.4;true",
                "2.5;true"
        ).collect(Collectors.toUnmodifiableList());
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
    public void cleanGraphStateInProgressCommitsNoUserTest() {
        loadFiles(repo, "/systemCommitNoUser.trig");
        List<String> graphExpect = Stream.of("https://mobi.com/in-progress-commits#R3U28I3;https://mobi.com/additions#R3U28I3A2",
                "https://mobi.com/in-progress-commits#R5U29I1;https://mobi.com/additions#R5U29I1A1").collect(Collectors.toList());

        Assert.assertEquals(graphExpect, queryResource(repo, "/queries/searchInProgressCommits.rq", "inProgressCommit", "diffGraph"));

        operation.execute();

        graphExpect = Stream.of("https://mobi.com/in-progress-commits#R5U29I1;https://mobi.com/additions#R5U29I1A1").collect(Collectors.toList());

        Assert.assertEquals(graphExpect, queryResource(repo, "/queries/searchInProgressCommits.rq", "inProgressCommit", "diffGraph"));
    }

    @Test
    public void cleanGraphStateInProgressCommitsNoRecordTest() {
        loadFiles(repo, "/systemCommitNoRecord.trig");
        List<String> graphExpect = Stream.of("https://mobi.com/in-progress-commits#R3U28I3;https://mobi.com/additions#R3U28I3A2",
                "https://mobi.com/in-progress-commits#R5U29I1;https://mobi.com/additions#R5U29I1A1").collect(Collectors.toList());

        Assert.assertEquals(graphExpect, queryResource(repo, "/queries/searchInProgressCommits.rq", "inProgressCommit", "diffGraph"));

        operation.execute();

        graphExpect = Stream.of("https://mobi.com/in-progress-commits#R5U29I1;https://mobi.com/additions#R5U29I1A1").collect(Collectors.toList());
        Assert.assertEquals(graphExpect, queryResource(repo, "/queries/searchInProgressCommits.rq", "inProgressCommit", "diffGraph"));
    }

    @Test
    public void cleanGraphStateDanglingAdditionsDeletionsTest() {
        loadFiles(repo, "/systemState.trig");
        List<String> graphExpect = Stream.of("https://mobi.com/additions#hasNoRevision",
                "https://mobi.com/deletions#hasNoRevision").collect(Collectors.toList());
        Assert.assertEquals(graphExpect, queryResource(repo, "/queries/searchDanglingAdditionsDeletions.rq", "diffGraph"));

        operation.execute();

        Assert.assertEquals(0, queryResource(repo, "/queries/searchDanglingAdditionsDeletions.rq", "diffGraph").size());
        // ensure it did not delete good graphs
        graphExpect = Stream.of("https://mobi.com/additions#hasRevision001",
                "https://mobi.com/additions#hasRevision002").collect(Collectors.toList());
        Assert.assertEquals(graphExpect, queryResource(repo, "/queries/searchAdditionsDeletions.rq", "diffGraph"));
    }

    @Test
    public void cleanGraphStateInstanceNoUserTest() {
        CliTestUtils.loadFiles(repo,"/systemState.trig");
        List<String> graphExpect = Stream.of("http://mobi.com/states#0001",
                "http://mobi.com/states#0002").collect(Collectors.toList());
        Assert.assertEquals(graphExpect, queryResource(repo, "/queries/searchStateInstanceNoUser.rq", "state"));

        operation.execute();

        Mockito.verify(stateManager).deleteState(vf.createIRI("http://mobi.com/states#0002"));
        Mockito.verify(stateManager).deleteState(vf.createIRI("http://mobi.com/states#0001"));
        Assert.assertEquals(2, Mockito.mockingDetails(stateManager).getInvocations().size());
    }

    @Test
    public void cleanGraphStateInstanceTest() {
        CliTestUtils.loadFiles(repo,"/systemState.trig");
        List<String> graphExpect = Stream.of("http://mobi.com/states#0001",
                "http://mobi.com/states#0002").collect(Collectors.toList());
        Assert.assertEquals(graphExpect, queryResource(repo, "/queries/searchStateInstanceNoUser.rq", "state"));

        operation.execute();

        Mockito.verify(stateManager, times(1)).deleteState(vf.createIRI("http://mobi.com/states#0002"));
        Mockito.verify(stateManager, times(1)).deleteState(vf.createIRI("http://mobi.com/states#0001"));
        Assert.assertEquals(2, Mockito.mockingDetails(stateManager).getInvocations().size());
    }

}

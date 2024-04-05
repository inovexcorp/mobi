package com.mobi.workflows.rest;

/*-
 * #%L
 * com.mobi.workflows.rest
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

import com.mobi.prov.api.ProvenanceService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.IOException;
import java.io.StringReader;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.sse.SseEventSource;

public class WorkflowExecutionsRestTest extends MobiRestTestCXF {
    private static final ModelFactory mf = getModelFactory();
    private static MemoryRepositoryWrapper repo;
    private static ProvenanceService provService;
    private static OrmFactory<WorkflowExecutionActivity> activityFactory;

    private static WorkflowExecutionActivity runningActivity;
    private static WorkflowExecutionActivity finishedActivity;

    private static IRI runningActivityIRI;
    private static IRI finishedActivityIRI;

    @BeforeClass
    public static void startServer() throws Exception {
        ValueFactory vf = getValueFactory();
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        repo.init();

        provService = mock(ProvenanceService.class);

        runningActivityIRI = vf.createIRI("http://test.com/running-activity");
        finishedActivityIRI = vf.createIRI("http://test.com/finished-activity");
        activityFactory = getRequiredOrmFactory(WorkflowExecutionActivity.class);
        runningActivity = activityFactory.createNew(runningActivityIRI);
        runningActivity.setStartedAtTime(Set.of(OffsetDateTime.now()));
        finishedActivity = activityFactory.createNew(finishedActivityIRI);
        finishedActivity.setStartedAtTime(Set.of(OffsetDateTime.now()));
        finishedActivity.setEndedAtTime(Set.of(OffsetDateTime.now().plusSeconds(1000)));

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(runningActivity.getModel());
            conn.add(finishedActivity.getModel());
        }

        WorkflowExecutionsRest rest = new WorkflowExecutionsRest();
        rest.provService = provService;
        configureServer(rest, new com.mobi.rest.test.util.UsernameTestFilter());
    }

    @Before
    public void setupMocks() {
        when(provService.getConnection()).thenReturn(repo.getConnection());
    }

    @After
    public void resetMocks() {
        reset(provService);
    }

    @Test
    public void getActivities() {
        WebTarget target = target().path("workflow-executions");
        try (SseEventSource eventSource = SseEventSource.target(target).build()) {
            AtomicReference<String> data = new AtomicReference<>("");
            eventSource.register(event -> data.set(event.readData()));
            eventSource.open();
            Thread.sleep(500);
            Collection<WorkflowExecutionActivity> activities;
            try {
                activities = activityFactory.getAllExisting(Rio.parse(new StringReader(data.get()), RDFFormat.JSONLD));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            assertEquals(1, activities.size());
            WorkflowExecutionActivity activity = activities.iterator().next();
            assertEquals(runningActivityIRI, activity.getResource());
            assertTrue(runningActivity.getModel().containsAll(activity.getModel()));
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}

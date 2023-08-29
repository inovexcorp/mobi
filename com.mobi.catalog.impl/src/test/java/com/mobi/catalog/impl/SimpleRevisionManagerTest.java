package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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
import static org.mockito.Mockito.spy;

import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class SimpleRevisionManagerTest extends OrmEnabledTestCase {

    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleRevisionManager manager;

    @Before
    public void setup() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        closeable = MockitoAnnotations.openMocks(this);

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        ThingManager thingManager = spy(new SimpleThingManager());
        manager = new SimpleRevisionManager();
        manager.thingManager = thingManager;
        injectOrmFactoryReferencesIntoService(manager);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
    }

    /* getRevision() */

    @Test
    public void testGetRevisionWithQuads() throws Exception {
        IRI commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "quad-test1");

        RepositoryConnection conn = repo.getConnection();
        Revision actual = manager.getRevision(commitId, conn);
        conn.close();

        assertEquals(VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + "quad-test1"), actual.getAdditions().get());
        assertEquals(VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + "quad-test1"), actual.getDeletions().get());
        assertEquals(1, actual.getGraphRevision().size());
        assertEquals(VALUE_FACTORY.createIRI(ManagerTestConstants.GRAPHS + "quad-graph1"), actual.getGraphRevision().stream().findFirst().get().getRevisionedGraph().get());
        assertEquals(getQuadAdditionsResource(commitId, ManagerTestConstants.GRAPHS + "quad-graph1"), actual.getGraphRevision().stream().findFirst().get().getAdditions().get());
        assertEquals(getQuadDeletionsResource(commitId, ManagerTestConstants.GRAPHS + "quad-graph1"), actual.getGraphRevision().stream().findFirst().get().getDeletions().get());
    }

    private IRI getQuadAdditionsResource(IRI commitId, String graph) throws Exception {
        return VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + commitId.getLocalName() + "%00" + URLEncoder.encode(graph, StandardCharsets.UTF_8));
    }

    private IRI getQuadDeletionsResource(IRI commitId, String graph) throws Exception {
        return VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + commitId.getLocalName() + "%00" + URLEncoder.encode(graph, StandardCharsets.UTF_8));
    }
}

package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.util.Set;

public class SimpleDifferenceManagerTest2 extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleDifferenceManager manager;
    private MemoryRepositoryWrapper repo;
    private ValueFactory vf;
    private final OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
    private final SimpleThingManager thingManager = spy(new SimpleThingManager());
    private final SimpleRecordManager recordManager = spy(new SimpleRecordManager());
    private final SimpleVersionManager versionManager = spy(new SimpleVersionManager());
    private final SimpleCommitManager commitManager = spy(new SimpleCommitManager());
    private final SimpleBranchManager branchManager = spy(new SimpleBranchManager());
    private final SimpleRevisionManager revisionManager = spy(new SimpleRevisionManager());
    private final SimpleCompiledResourceManager compiledResourceManager = spy(new SimpleCompiledResourceManager());

    @Mock
    private CatalogConfigProvider configProvider;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Before
    public void setUp() throws Exception {
        vf = getValueFactory();
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        branchManager.recordManager = recordManager;
        branchManager.thingManager = thingManager;
        recordManager.thingManager = thingManager;
        revisionManager.thingManager = thingManager;
        versionManager.recordManager = recordManager;
        compiledResourceManager.thingManager = thingManager;
        compiledResourceManager.revisionManager = revisionManager;
        compiledResourceManager.configProvider = configProvider;
        manager = spy(new SimpleDifferenceManager());
        manager.thingManager = thingManager;
        manager.commitManager = commitManager;
        manager.revisionManager = revisionManager;
        manager.compiledResourceManager = compiledResourceManager;
        manager.configProvider = configProvider;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(versionManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(recordManager);
        injectOrmFactoryReferencesIntoService(branchManager);
        injectOrmFactoryReferencesIntoService(compiledResourceManager);

        when(configProvider.getRepository()).thenReturn(repo);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        repo.shutDown();
    }

    @Test
    public void getConflictsTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/fullDeleteEntity.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
            Set<Conflict> conflicts = manager.getConflicts(vf.createIRI("https://mobi.com/commits#95f2c41a-0c74-4da1-b7c1-108553d2f690"),
                    vf.createIRI("https://mobi.com/commits#a5d2f077-4774-40a2-a085-e0ba64764e36"), conn);
            conflicts.size();
        }
    }
}

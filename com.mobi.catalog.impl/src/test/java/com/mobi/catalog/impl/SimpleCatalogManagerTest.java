package com.mobi.catalog.impl;
/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static junit.framework.TestCase.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class SimpleCatalogManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleCatalogManager manager;
    private final OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);

    private final SimpleThingManager thingManager = spy(new SimpleThingManager());

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    CatalogConfigProvider configProvider;

    private final IRI CATALOG_LOCAL = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");
    private final IRI CATALOG_DISTRIBUTED = VALUE_FACTORY.createIRI("http://mobi.com/catalog-distributed");

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        closeable = MockitoAnnotations.openMocks(this);
        addData(repo, "/testCatalogData/catalog.trig", RDFFormat.TRIG);

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(CATALOG_LOCAL);
        when(configProvider.getDistributedCatalogIRI()).thenReturn(CATALOG_DISTRIBUTED);

        manager = new SimpleCatalogManager();
        manager.thingManager = thingManager;
        manager.configProvider = configProvider;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(thingManager);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
    }

    /* getDistributedCatalog */

    @Test
    public void testGetDistributedCatalog() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Catalog result = manager.getDistributedCatalog(conn);
            verify(thingManager).getExpectedObject(eq(CATALOG_DISTRIBUTED), eq(catalogFactory), any(RepositoryConnection.class));
            assertEquals(CATALOG_DISTRIBUTED, result.getResource());
        }
    }

    /* getLocalCatalog */

    @Test
    public void testGetLocalCatalog() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Catalog result = manager.getLocalCatalog(conn);
            verify(thingManager).getExpectedObject(eq(CATALOG_LOCAL), eq(catalogFactory), any(RepositoryConnection.class));
            assertEquals(CATALOG_LOCAL, result.getResource());
        }
    }
}

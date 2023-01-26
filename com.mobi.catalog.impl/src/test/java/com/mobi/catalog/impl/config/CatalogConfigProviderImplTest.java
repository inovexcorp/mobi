package com.mobi.catalog.impl.config;

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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfig;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.lang.annotation.Annotation;

public class CatalogConfigProviderImplTest extends OrmEnabledTestCase {

    @Mock
    private CatalogConfig catalogConfig;

    private AutoCloseable closeable;
    private CatalogConfigProviderImpl provider;
    private MemoryRepositoryWrapper repo;
    private IRI localCatalogId;
    private IRI distributedCatalogId;

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.start(new MemoryRepositoryConfig() {

            @Override
            public Class<? extends Annotation> annotationType() {
                return null;
            }

            @Override
            public String id() {
                return "system";
            }

            @Override
            public String title() {
                return "System Repo";
            }

            @Override
            public String dataDir() {
                return null;
            }

            @Override
            public String tripleIndexes() {
                return "spoc,posc,cspo";
            }

            @Override
            public long syncDelay() {
                return 0;
            }
        });
        closeable = MockitoAnnotations.openMocks(this);

        provider = new CatalogConfigProviderImpl();
        injectOrmFactoryReferencesIntoService(provider);
        provider.repository = repo;


        when(catalogConfig.title()).thenReturn("Mobi Test Catalog");
        when(catalogConfig.description()).thenReturn("This is a test catalog");
        when(catalogConfig.iri()).thenReturn("http://mobi.com/test/catalogs#catalog");
        provider.start(catalogConfig);

        localCatalogId = VALUE_FACTORY.createIRI(catalogConfig.iri() + "-local");
        distributedCatalogId = VALUE_FACTORY.createIRI(catalogConfig.iri() + "-distributed");
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
    }

    @Test
    public void startTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, null, null, null, localCatalogId));
            assertTrue(ConnectionUtils.contains(conn, null, null, null, distributedCatalogId));
        }
    }

    @Test
    public void getRepositoryIdTest() throws Exception {
        assertEquals("system", provider.getRepositoryId());
    }

    @Test
    public void getRepositoryTest() throws Exception {
        assertEquals(repo, provider.getRepository());
    }

    @Test
    public void getDistributedCatalogIRITest() throws Exception {
        assertEquals(distributedCatalogId, provider.getDistributedCatalogIRI());
    }

    @Test
    public void getLocalCatalogIRITest() throws Exception {
        assertEquals(localCatalogId, provider.getLocalCatalogIRI());
    }
}

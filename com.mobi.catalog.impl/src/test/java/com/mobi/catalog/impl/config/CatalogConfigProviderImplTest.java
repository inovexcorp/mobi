package com.mobi.catalog.impl.config;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

public class CatalogConfigProviderImplTest extends OrmEnabledTestCase {
    private CatalogConfigProviderImpl provider;
    private Repository repo;

    private Map<String, Object> props;
    private IRI localCatalogId;
    private IRI distributedCatalogId;

    @Before
    public void setUp() throws Exception {
        SesameRepositoryWrapper repositoryWrapper = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        Map<String, Object> repoProps = new HashMap<>();
        repoProps.put("id", "system");
        RepositoryConfig config = Configurable.createConfigurable(RepositoryConfig.class, repoProps);
        repositoryWrapper.setConfig(config);
        repo = repositoryWrapper;
        repo.initialize();

        provider = new CatalogConfigProviderImpl();
        injectOrmFactoryReferencesIntoService(provider);
        provider.setValueFactory(VALUE_FACTORY);
        provider.setRepository(repo);

        props = new HashMap<>();
        props.put("title", "Mobi Test Catalog");
        props.put("description", "This is a test catalog");
        props.put("iri", "http://mobi.com/test/catalogs#catalog");
        provider.start(props);

        localCatalogId = VALUE_FACTORY.createIRI(props.get("iri") + "-local");
        distributedCatalogId = VALUE_FACTORY.createIRI(props.get("iri") + "-distributed");
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    @Test
    public void startTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(null, null, null, localCatalogId).hasNext());
            assertTrue(conn.getStatements(null, null, null, distributedCatalogId).hasNext());
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

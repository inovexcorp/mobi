package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
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

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;

public class SimpleShapesGraphManagerTest extends OrmEnabledTestCase {
    SimpleShapesGraphManager manager = new SimpleShapesGraphManager();
    Repository repo;
    IRI catalogIri;
    IRI testShapeIri;
    ValueFactory vf;

    @Mock
    CatalogConfigProvider configProvider;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);
        vf = VALUE_FACTORY;
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        catalogIri = vf.createIRI("http://mobi.com/catalog-local");
        testShapeIri = vf.createIRI("http://mobi.com/ontologies/shapes-graph/test-shape-record");

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-shape-record.trig");
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIri);
        when(configProvider.getRepository()).thenReturn(repo);
        manager.configProvider = configProvider;
    }

    @Test
    public void checkShapesGraphIriExistsTest() throws Exception {
        boolean exists = manager.shapesGraphIriExists(testShapeIri);
        assertTrue(exists);
        verify(configProvider).getRepository();
        verify(configProvider).getLocalCatalogIRI();
    }

    @Test
    public void checkShapesGraphIriExistsNewTest() throws Exception {
        Resource newShapeIri = vf.createIRI("urn:testShapeIriThatDoesNotExistInRepo");
        boolean exists = manager.shapesGraphIriExists(newShapeIri);
        assertFalse(exists);
        verify(configProvider).getRepository();
        verify(configProvider).getLocalCatalogIRI();
    }
}

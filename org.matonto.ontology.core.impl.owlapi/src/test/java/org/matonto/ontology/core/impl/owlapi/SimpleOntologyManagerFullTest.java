package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;
import org.mockito.Mock;

public class SimpleOntologyManagerFullTest {

    @Mock
    SesameTransformer transformer;

    private String ontologyIRI = "http://matonto.org/mock/ontology";
    private String entityIRI = "http://matonto.org/mock/ontology/List";

    private Repository repo;
    private SimpleOntologyManager manager;
    private org.matonto.rdf.api.ValueFactory vf = org.matonto.rdf.core.impl.sesame.SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        manager = new SimpleOntologyManager();
        manager.setRepository(repo);
        manager.setValueFactory(vf);
        manager.setModelFactory(mf);
        manager.setTransformer(transformer);

        InputStream testData = getClass().getResourceAsStream("/mock-ontology.jsonld");

        RepositoryConnection conn = repo.getConnection();
        conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.JSONLD)));
        conn.close();
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    @Test
    public void testDeleteEntityFromOntology() throws Exception {
        Resource ontologyResource = vf.createIRI(ontologyIRI);
        Resource entityResource = vf.createIRI(entityIRI);
        Map<String, Set> response = manager.deleteEntityFromOntology(ontologyResource, entityResource);
        assertEquals(response.get("iris").size(), 1);
        assertEquals(response.get("models").size(), 1);
    }
}


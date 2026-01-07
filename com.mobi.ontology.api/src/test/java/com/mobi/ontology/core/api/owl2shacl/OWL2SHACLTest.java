package com.mobi.ontology.core.api.owl2shacl;

/*-
 * #%L
 * com.mobi.ontology.api
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Objects;

public class OWL2SHACLTest {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;

    private Model expectedData;

    @Mock
    RepositoryManager repoManager;

    @Before
    public void setup() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        repo.init();

        when(repoManager.createMemoryRepository()).thenReturn(repo);

        expectedData = Rio.parse(Objects.requireNonNull(getClass().getResourceAsStream("/expectedOWL2SHACL.ttl")), RDFFormat.TURTLE);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void testClass() {
        Model result = OWL2SHACL.convertOWLToSHACL(getClass().getResourceAsStream("/testOntology.ttl"), RDFFormat.TURTLE, repoManager);
        assertEquals(expectedData.size(), result.size());
        assertTrue(Models.isomorphic(result, expectedData));
//        Uncomment to check the contents (blank node lines will show as missing...unsure best way to fix that
//        result.forEach(statement -> {
//            if (!expectedData.contains(statement)) {
//                System.out.println("Missing Statement: " + statement);
//            }
//        });
//        Uncomment to view the output
//        Rio.write(result, System.out, RDFFormat.TURTLE);
    }
}

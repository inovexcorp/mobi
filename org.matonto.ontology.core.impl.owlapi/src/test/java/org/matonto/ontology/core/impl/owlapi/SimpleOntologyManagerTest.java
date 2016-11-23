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

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.ontology.utils.impl.SimpleSesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.matonto.repository.api.Repository;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.io.File;
import java.nio.file.Paths;
import java.util.Optional;

import static org.easymock.EasyMock.anyObject;
import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.mock;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.mockito.Matchers.any;

public class SimpleOntologyManagerTest {

    private SimpleOntologyManager manager;
    private Repository repository;
    private ValueFactory valueFactory = SimpleValueFactory.getInstance();
    private ModelFactory modelFactory = LinkedHashModelFactory.getInstance();
    private SesameTransformer sesameTransformer;
    private CatalogManager catalogManager;
    private OntologyRecordFactory ontologyRecordFactory = new OntologyRecordFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private IRI missingIRI;
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();

    @Before
    public void setUp() throws Exception {
        missingIRI = valueFactory.createIRI("http://matonto.org/missing");

        repository = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repository.initialize();

        ontologyRecordFactory.setModelFactory(modelFactory);
        ontologyRecordFactory.setValueFactory(valueFactory);
        ontologyRecordFactory.setValueConverterRegistry(vcr);

        commitFactory.setModelFactory(modelFactory);
        commitFactory.setValueFactory(valueFactory);
        commitFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(ontologyRecordFactory);
        vcr.registerValueConverter(commitFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        catalogManager = mock(CatalogManager.class);
        sesameTransformer = mock(SesameTransformer.class);

        manager = new SimpleOntologyManager();
        manager.setRepository(repository);
        manager.setValueFactory(valueFactory);
        manager.setModelFactory(modelFactory);
        manager.setSesameTransformer(sesameTransformer);
        manager.setCatalogManager(catalogManager);
        manager.setOntologyRecordFactory(ontologyRecordFactory);
        manager.setCommitFactory(commitFactory);
    }

    @After
    public void tearDown() throws Exception {
        repository.shutDown();
    }

    @Test
    public void testCreateOntologyWithOntologyId() throws Exception {
        OntologyId ontologyId = new SimpleOntologyId.Builder(valueFactory).build();
        Ontology ontology = manager.createOntology(ontologyId);
        assertEquals(ontologyId, ontology.getOntologyId());
    }

    /*@Test
    public void testCreateOntologyWithFile() throws Exception {
        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();
        Ontology ontology = manager.createOntology(file);
        IRI expectedIRI = valueFactory.createIRI("http://test.com/ontology1");
        assertEquals(expectedIRI, ontology.getOntologyId().getOntologyIRI().get());
    }*/

    @Test
    public void testRetrieveOntologyWithNoIdentifier() {
        Optional<Ontology> result = manager.retrieveOntology(missingIRI);
        assertFalse(result.isPresent());
    }

    /*@Test(expected = )
    public void testRetrieveOntologyWithNoRecord() {

    }*/
}

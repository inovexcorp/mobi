package org.matonto.rdf.orm.impl;

/*-
 * #%L
 * org.matonto.rdf.orm
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.junit.Before;
import org.junit.Test;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.when;

public class OrmFactoryRegistryImplTest {
    private OrmFactoryRegistryImpl registry;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ThingFactory thingFactory = new ThingFactory();

    private IRI thingIRI;
    private IRI aIRI;
    private IRI bIRI;
    private IRI cIRI;
    private IRI errorIRI;
    private interface A extends Thing {
        String TYPE = "http://example.com/A";
    }
    private interface B extends Thing, A {
        String TYPE = "http://example.com/B";
    }
    private interface C extends Thing, B {
        String TYPE = "http://example.com/C";
    }
    private interface Error extends Thing {
        String TYPE = "http://example.com/error";
    }

    @Mock
    private OrmFactory<A> aFactory;

    @Mock
    private OrmFactory<B> bFactory;

    @Mock
    private OrmFactory<C> cFactory;

    @Before
    public void setUp() throws Exception {
        thingFactory.setValueFactory(vf);
        thingIRI = vf.createIRI(Thing.TYPE);
        aIRI = vf.createIRI(A.TYPE);
        bIRI = vf.createIRI(B.TYPE);
        cIRI = vf.createIRI(C.TYPE);
        errorIRI = vf.createIRI(Error.TYPE);

        MockitoAnnotations.initMocks(this);
        registry = new OrmFactoryRegistryImpl();
        registry.setValueFactory(vf);
        registry.addFactory(thingFactory);
        registry.addFactory(aFactory);
        registry.addFactory(bFactory);
        registry.addFactory(cFactory);

        when(aFactory.getTypeIRI()).thenReturn(vf.createIRI(A.TYPE));
        when(aFactory.getType()).thenReturn(A.class);
        when(aFactory.getParentTypeIRIs()).thenReturn(Collections.emptySet());
        when(bFactory.getTypeIRI()).thenReturn(vf.createIRI(B.TYPE));
        when(bFactory.getType()).thenReturn(B.class);
        when(bFactory.getParentTypeIRIs()).thenReturn(Collections.singleton(aIRI));
        when(cFactory.getTypeIRI()).thenReturn(vf.createIRI(C.TYPE));
        when(cFactory.getType()).thenReturn(C.class);
        when(cFactory.getParentTypeIRIs()).thenReturn(Stream.of(aIRI, bIRI).collect(Collectors.toSet()));
    }

    @Test
    public void getFactoryByTypeClassTest() throws Exception {
        Optional<OrmFactory> result = registry.getFactoryOfType(Thing.class);
        assertTrue(result.isPresent());
        assertEquals(thingFactory, result.get());
        result = registry.getFactoryOfType(A.class);
        assertTrue(result.isPresent());
        assertEquals(aFactory, result.get());
        result = registry.getFactoryOfType(B.class);
        assertTrue(result.isPresent());
        assertEquals(bFactory, result.get());
        result = registry.getFactoryOfType(C.class);
        assertTrue(result.isPresent());
        assertEquals(cFactory, result.get());
    }

    @Test
    public void getFactoryByTypeClassThatDoesNotExistTest() {
        assertFalse(registry.getFactoryOfType(Error.class).isPresent());
    }

    @Test
    public void getFactoryByTypeStringTest() throws Exception {
        Optional<OrmFactory> result = registry.getFactoryOfType(Thing.TYPE);
        assertTrue(result.isPresent());
        assertEquals(thingFactory, result.get());
        result = registry.getFactoryOfType(A.TYPE);
        assertTrue(result.isPresent());
        assertEquals(aFactory, result.get());
        result = registry.getFactoryOfType(B.TYPE);
        assertTrue(result.isPresent());
        assertEquals(bFactory, result.get());
        result = registry.getFactoryOfType(C.TYPE);
        assertTrue(result.isPresent());
        assertEquals(cFactory, result.get());
    }

    @Test
    public void getFactoryByTypeStringThatDoesNotExistTest() {
        assertFalse(registry.getFactoryOfType(Error.TYPE).isPresent());
    }

    @Test
    public void getFactoryByTypeIriTest() throws Exception {
        Optional<OrmFactory> result = registry.getFactoryOfType(thingIRI);
        assertTrue(result.isPresent());
        assertEquals(thingFactory, result.get());
        result = registry.getFactoryOfType(aIRI);
        assertTrue(result.isPresent());
        assertEquals(aFactory, result.get());
        result = registry.getFactoryOfType(bIRI);
        assertTrue(result.isPresent());
        assertEquals(bFactory, result.get());
        result = registry.getFactoryOfType(cIRI);
        assertTrue(result.isPresent());
        assertEquals(cFactory, result.get());
    }

    @Test
    public void getFactoryByTypeIriThatDoesNotExistTest() {
        assertFalse(registry.getFactoryOfType(errorIRI).isPresent());
    }

    @Test
    public void getFactoriesByTypeClassTest() {
        List<OrmFactory> result = registry.getFactoriesOfType(Thing.class);
        assertEquals(1, result.size());
        result = registry.getFactoriesOfType(A.class);
        assertEquals(3, result.size());
        result = registry.getFactoriesOfType(B.class);
        assertEquals(2, result.size());
        result = registry.getFactoriesOfType(C.class);
        assertEquals(1, result.size());
    }

    @Test
    public void getFactoriesByTypeClassThatDoesNotExistTest() throws Exception {
        List<OrmFactory> result = registry.getFactoriesOfType(Error.class);
        assertEquals(0, result.size());
    }

    @Test
    public void getFactoriesByTypeStringTest() throws Exception {
        List<OrmFactory> result = registry.getFactoriesOfType(Thing.TYPE);
        assertEquals(1, result.size());
        result = registry.getFactoriesOfType(A.TYPE);
        assertEquals(3, result.size());
        result = registry.getFactoriesOfType(B.TYPE);
        assertEquals(2, result.size());
        result = registry.getFactoriesOfType(C.TYPE);
        assertEquals(1, result.size());
    }

    @Test
    public void getFactoriesByTypeStringThatDoesNotExistTest() throws Exception {
        List<OrmFactory> result = registry.getFactoriesOfType(Error.TYPE);
        assertEquals(0, result.size());
    }

    @Test
    public void getFactoriesByTypeIriTest() throws Exception {
        List<OrmFactory> result = registry.getFactoriesOfType(thingIRI);
        assertEquals(1, result.size());
        result = registry.getFactoriesOfType(aIRI);
        assertEquals(3, result.size());
        result = registry.getFactoriesOfType(bIRI);
        assertEquals(2, result.size());
        result = registry.getFactoriesOfType(cIRI);
        assertEquals(1, result.size());
    }

    @Test
    public void getFactoriesByTypeIriThatDoesNotExistTest() throws Exception {
        List<OrmFactory> result = registry.getFactoriesOfType(errorIRI);
        assertEquals(0, result.size());
    }
}

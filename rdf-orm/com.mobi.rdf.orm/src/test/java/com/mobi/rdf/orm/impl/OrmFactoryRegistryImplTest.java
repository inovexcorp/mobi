package com.mobi.rdf.orm.impl;

/*-
 * #%L
 * com.mobi.rdf.orm
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import org.junit.Before;
import org.junit.Test;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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

    static abstract class AImpl implements A, Thing {}
    static abstract class BImpl implements B, A, Thing {}
    static abstract class CImpl implements C, B, A, Thing {}

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
        registry.addFactory(cFactory);
        registry.addFactory(bFactory);

        when(aFactory.getTypeIRI()).thenReturn(vf.createIRI(A.TYPE));
        when(aFactory.getType()).thenReturn(A.class);
        doReturn(AImpl.class).when(aFactory).getImpl();
        when(aFactory.getParentTypeIRIs()).thenReturn(Collections.emptySet());
        when(bFactory.getTypeIRI()).thenReturn(vf.createIRI(B.TYPE));
        doReturn(BImpl.class).when(bFactory).getImpl();
        when(bFactory.getType()).thenReturn(B.class);
        when(bFactory.getParentTypeIRIs()).thenReturn(Collections.singleton(aIRI));
        when(cFactory.getTypeIRI()).thenReturn(vf.createIRI(C.TYPE));
        doReturn(CImpl.class).when(cFactory).getImpl();
        when(cFactory.getType()).thenReturn(C.class);
        when(cFactory.getParentTypeIRIs()).thenReturn(Stream.of(aIRI, bIRI).collect(Collectors.toSet()));
    }

    @Test
    public void getFactoryByTypeClassTest() throws Exception {
        Optional<OrmFactory<Thing>> result = registry.getFactoryOfType(Thing.class);
        assertTrue(result.isPresent());
        assertEquals(thingFactory, result.get());
        Optional<OrmFactory<A>> result2 = registry.getFactoryOfType(A.class);
        assertTrue(result2.isPresent());
        assertEquals(aFactory, result2.get());
        Optional<OrmFactory<B>> result3 = registry.getFactoryOfType(B.class);
        assertTrue(result3.isPresent());
        assertEquals(bFactory, result3.get());
        Optional<OrmFactory<C>> result4 = registry.getFactoryOfType(C.class);
        assertTrue(result4.isPresent());
        assertEquals(cFactory, result4.get());
    }

    @Test
    public void getFactoryByTypeClassThatDoesNotExistTest() {
        assertFalse(registry.getFactoryOfType(Error.class).isPresent());
    }

    @Test
    public void getFactoryByTypeStringTest() throws Exception {
        Optional<OrmFactory<? extends Thing>> result = registry.getFactoryOfType(Thing.TYPE);
        assertTrue(result.isPresent());
        assertEquals(thingFactory, result.get());
        Optional<OrmFactory<? extends Thing>> result2 = registry.getFactoryOfType(A.TYPE);
        assertTrue(result2.isPresent());
        assertEquals(aFactory, result2.get());
        Optional<OrmFactory<? extends Thing>> result3 = registry.getFactoryOfType(B.TYPE);
        assertTrue(result3.isPresent());
        assertEquals(bFactory, result3.get());
        Optional<OrmFactory<? extends Thing>> result4 = registry.getFactoryOfType(C.TYPE);
        assertTrue(result4.isPresent());
        assertEquals(cFactory, result4.get());
    }

    @Test
    public void getFactoryByTypeStringThatDoesNotExistTest() {
        assertFalse(registry.getFactoryOfType(Error.TYPE).isPresent());
    }

    @Test
    public void getFactoryByTypeIriTest() throws Exception {
        Optional<OrmFactory<? extends Thing>> result = registry.getFactoryOfType(thingIRI);
        assertTrue(result.isPresent());
        assertEquals(thingFactory, result.get());
        Optional<OrmFactory<? extends Thing>> result2 = registry.getFactoryOfType(aIRI);
        assertTrue(result2.isPresent());
        assertEquals(aFactory, result2.get());
        Optional<OrmFactory<? extends Thing>> result3 = registry.getFactoryOfType(bIRI);
        assertTrue(result3.isPresent());
        assertEquals(bFactory, result3.get());
        Optional<OrmFactory<? extends Thing>> result4 = registry.getFactoryOfType(cIRI);
        assertTrue(result4.isPresent());
        assertEquals(cFactory, result4.get());
    }

    @Test
    public void getFactoryByTypeIriThatDoesNotExistTest() {
        assertFalse(registry.getFactoryOfType(errorIRI).isPresent());
    }

    @Test
    public void getFactoriesByTypeClassTest() {
        List<OrmFactory<? extends Thing>> result = registry.getFactoriesOfType(Thing.class);
        assertEquals(1, result.size());
        List<OrmFactory<? extends A>> result2 = registry.getFactoriesOfType(A.class);
        assertEquals(3, result2.size());
        List<OrmFactory<? extends B>> result3 = registry.getFactoriesOfType(B.class);
        assertEquals(2, result3.size());
        List<OrmFactory<? extends C>> result4 = registry.getFactoriesOfType(C.class);
        assertEquals(1, result4.size());
    }

    @Test
    public void getFactoriesByTypeClassThatDoesNotExistTest() throws Exception {
        List<OrmFactory<? extends Error>> result = registry.getFactoriesOfType(Error.class);
        assertEquals(0, result.size());
    }

    @Test
    public void getFactoriesByTypeStringTest() throws Exception {
        List<OrmFactory<? extends Thing>> result = registry.getFactoriesOfType(Thing.TYPE);
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
        List<OrmFactory<? extends Thing>> result = registry.getFactoriesOfType(Error.TYPE);
        assertEquals(0, result.size());
    }

    @Test
    public void getFactoriesByTypeIriTest() throws Exception {
        List<OrmFactory<? extends Thing>> result = registry.getFactoriesOfType(thingIRI);
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
        List<OrmFactory<? extends Thing>> result = registry.getFactoriesOfType(errorIRI);
        assertEquals(0, result.size());
    }

    @Test
    public void getSortedFactoriesByTypeClassTest() throws Exception {
        List<OrmFactory<? extends A>> result = registry.getSortedFactoriesOfType(A.class);
        assertEquals(cFactory, result.get(0));
        assertEquals(bFactory, result.get(1));
        assertEquals(aFactory, result.get(2));
    }

    @Test
    public void getSortedFactoriesByTypeStringTest() throws Exception {
        List<OrmFactory<? extends Thing>> result = registry.getSortedFactoriesOfType(A.TYPE);
        assertEquals(cFactory, result.get(0));
        assertEquals(bFactory, result.get(1));
        assertEquals(aFactory, result.get(2));
    }

    @Test
    public void getSortedFactoriesByTypeIRITest() throws Exception {
        List<OrmFactory<? extends Thing>> result = registry.getSortedFactoriesOfType(aIRI);
        assertEquals(cFactory, result.get(0));
        assertEquals(bFactory, result.get(1));
        assertEquals(aFactory, result.get(2));
    }
}

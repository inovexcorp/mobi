package com.mobi.rdf.orm.test;

/*-
 * #%L
 * rdf-orm-test
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.ValueFactory;
import com.mobi.rdf.orm.AbstractOrmFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

import java.lang.reflect.Field;

@RunWith(BlockJUnit4ClassRunner.class)
public class OrmEnabledTestCaseTest extends OrmEnabledTestCase {

    @Test
    public void testAccessors() {
        assertNotNull(OrmEnabledTestCase.getModelFactory());
        assertNotNull(OrmEnabledTestCase.getValueConverterRegistry());
        assertNotNull(OrmEnabledTestCase.getValueFactory());
        assertNotNull(OrmEnabledTestCase.getOrmFactoryRegistry());
    }

    @Test
    public void exampleSubTest() throws Exception {
        OrmFactory<Thing> thingOrmFactory = getOrmFactoryRegistry().getFactoryOfType(Thing.class)
                .orElseThrow(() -> new Exception("No Thing Factory Configured"));
        Thing t = thingOrmFactory.createNew(getValueFactory().createIRI("urn://test.thing"));
        assertNotNull(t);
        assertFalse(t.getModel().isEmpty());
    }

    @Test
    public void ensureOrmEnabledTestCaseInitializesProperly() throws Exception {
        assertFalse(OrmEnabledTestCaseTest.VALUE_CONVERTERS.isEmpty());
        assertFalse(OrmEnabledTestCaseTest.ORM_FACTORIES.isEmpty());
        assertTrue(ORM_FACTORY_REGISTRY.getFactoryOfType(Thing.class)
                .orElseThrow(() -> new RuntimeException("Thing factory not registered")) instanceof ThingFactory);
        assertTrue(ORM_FACTORIES.get(0).getType().equals(Thing.class));

        ThingFactory test = ThingFactory.class.cast(
                ORM_FACTORY_REGISTRY.getFactoryOfType(Thing.class).orElse(null));
        ValueFactory valueFactory = getReference(AbstractOrmFactory.class.getDeclaredField("valueFactory"),
                test, ValueFactory.class);
        ModelFactory modelFactory = getReference(AbstractOrmFactory.class.getDeclaredField("modelFactory"),
                test, ModelFactory.class);
        ValueConverterRegistry valueConverterRegistry = getReference(AbstractOrmFactory.class
                .getDeclaredField("valueConverterRegistry"), test, ValueConverterRegistry.class);
        assertNotNull(valueFactory);
        assertTrue(VALUE_FACTORY instanceof ValidatingValueFactory);
        assertNotNull(modelFactory);
        assertTrue(MODEL_FACTORY instanceof DynamicModelFactory);
        assertNotNull(valueConverterRegistry);
        assertEquals(OrmEnabledTestCase.VALUE_CONVERTER_REGISTRY, valueConverterRegistry);
        assertEquals(14, OrmEnabledTestCaseTest.VALUE_CONVERTERS.size());
        assertEquals(1, OrmEnabledTestCaseTest.ORM_FACTORIES.size());
    }

    @Test
    public void testGetRequiredFactory() {
        OrmFactory<Thing> thingOrmFactory = OrmEnabledTestCase.getRequiredOrmFactory(Thing.class);
        assertNotNull(thingOrmFactory);
    }

    @Test(expected = RuntimeException.class)
    public void testMissingGetRequiredFactory() {
        OrmEnabledTestCase.getRequiredOrmFactory(FakeThing.class);
        fail("Should have thrown an exception since FakeThing isn't in our configured factories");
    }

    @Test
    public void testGetRequiredFactoryAs() {
        ThingFactory factory = OrmEnabledTestCase.getRequiredOrmFactoryAs(Thing.class, ThingFactory.class);
        assertNotNull(factory);
    }

    @Test(expected = RuntimeException.class)
    public void testMissingGetRequiredFactoryAs() {
        OrmEnabledTestCase.getRequiredOrmFactoryAs(FakeThing.class, FakeThing.class);
        fail("FakeThing factory isn't in the configured stack... Should have thrown an exception");
    }

    @Test
    public void testInjectIntoService() {
        FakeService service = new FakeService();
        OrmEnabledTestCase.injectOrmFactoryReferencesIntoService(service);
        assertTrue(service.getThingOrmFactory() != null);
        assertEquals(OrmEnabledTestCase.getRequiredOrmFactory(Thing.class), service.getThingOrmFactory());
    }

    @Test(expected = RuntimeException.class)
    public void testMissingInjectIntoService() {
        BadService service = new BadService();
        OrmEnabledTestCase.injectOrmFactoryReferencesIntoService(service);
        fail("Expecting an error injecting a missing factory into the bad service");
    }

    @SuppressWarnings("unchecked")
    private <T> T getReference(Field f, AbstractOrmFactory factory, Class<T> type) throws Exception {
        f.setAccessible(true);
        return (T) f.get(factory);
    }

}

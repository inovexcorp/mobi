package com.mobi.rdf.orm.test;

/*-
 * #%L
 * rdf-orm-test
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

import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.AbstractOrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingFactory;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

import java.lang.reflect.Field;

@RunWith(BlockJUnit4ClassRunner.class)
public class OrmEnabledTestCaseTest extends OrmEnabledTestCase {

    @Test
    public void test() throws Exception {
        Assert.assertFalse(OrmEnabledTestCaseTest.valueConverters.isEmpty());
        Assert.assertFalse(OrmEnabledTestCaseTest.ormFactories.isEmpty());
        Assert.assertTrue(OFR.getFactoryOfType(Thing.class)
                .orElseThrow(()->new RuntimeException("Thing factory not registered")) instanceof ThingFactory);
        Assert.assertTrue(ormFactories.get(0).getType().equals(Thing.class));

        ThingFactory test = ThingFactory.class.cast(OFR.getFactoryOfType(Thing.class).orElse(null));
        ValueFactory valueFactory = getReference(AbstractOrmFactory.class.getDeclaredField("valueFactory"), test, ValueFactory.class);
        ModelFactory modelFactory = getReference(AbstractOrmFactory.class.getDeclaredField("modelFactory"), test, ModelFactory.class);
        ValueConverterRegistry valueConverterRegistry = getReference(AbstractOrmFactory.class.getDeclaredField("valueConverterRegistry"), test, ValueConverterRegistry.class);
        Assert.assertNotNull(valueFactory);
        Assert.assertEquals(VF, valueFactory);
        Assert.assertNotNull(modelFactory);
        Assert.assertEquals(MF, modelFactory);
        Assert.assertNotNull(valueConverterRegistry);
        Assert.assertEquals(OrmEnabledTestCase.valueConverterRegistry, valueConverterRegistry);
        Assert.assertEquals(14, OrmEnabledTestCaseTest.valueConverters.size());
        Assert.assertEquals(1, OrmEnabledTestCaseTest.ormFactories.size());
    }

    @SuppressWarnings("unchecked")
    private <T> T getReference(Field f, AbstractOrmFactory factory, Class<T> type) throws Exception {
        f.setAccessible(true);
        return (T) f.get(factory);
    }

}

package com.mobi.rdf.orm.test;

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
        Assert.assertFalse(this.valueConverters.isEmpty());
        Assert.assertFalse(this.ormFactories.isEmpty());
        Assert.assertTrue(OFR.getFactoryOfType(Thing.class).get() instanceof ThingFactory);
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
        Assert.assertEquals(this.valueConverterRegistry, valueConverterRegistry);
    }

    private <T> T getReference(Field f, AbstractOrmFactory factory, Class<T> type) throws Exception {
        f.setAccessible(true);
        return (T) f.get(factory);
    }

}

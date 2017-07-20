package org.matonto.rdf.orm.conversion.impl;

import junit.framework.TestCase;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;
import org.matonto.rdf.orm.conversion.ValueConversionException;

@RunWith(BlockJUnit4ClassRunner.class)
public class LongValueConverterTest extends ValueConverterTestCase<Long> {

    public LongValueConverterTest() {
        super(new LongValueConverter(), Long.class);
    }

    @Test
    public void simpleTest() {
        TestCase.assertEquals(10L,
                (long) valueConverter.convertValue(valueConverter.convertType(10L, null), null, Long.class));
    }

    @Test(expected = ValueConversionException.class)
    public void badTest() {
        valueConverter.convertValue(valueFactory.createLiteral("3.141592"), null, Long.class);
    }


}

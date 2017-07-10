package org.matonto.rdf.orm.conversion.impl;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.conversion.ValueConversionException;

@RunWith(BlockJUnit4ClassRunner.class)
public class BooleanValueConverterTest extends ValueConverterTestCase<Boolean> {

    public BooleanValueConverterTest() {
        super(new BooleanValueConverter(), Boolean.class);
    }

    @Test
    public void basicTest() {
        Value boolValueTrue = valueFactory.createLiteral(true);
        Assert.assertEquals("Boolean literal value not converted correctly", true, this.valueConverter.convertValue(boolValueTrue, null, null));
        Value strValue = valueFactory.createLiteral("true");
        Assert.assertEquals("Boolean literal value not converted correctly", true, this.valueConverter.convertValue(strValue, null, null));

        Value out = this.valueConverter.convertType(true, null);
        Assert.assertEquals("Boolean 'true' didnt' create a correct Value output", boolValueTrue, out);
        Value boolValueFalse = valueFactory.createLiteral(false);
        out = this.valueConverter.convertType(false, null);
        Assert.assertEquals("Boolean 'true' didnt' create a correct Value output", boolValueFalse, out);

    }

    @Test
    public void testBad() {
        try {
            Value badVal = valueFactory.createLiteral(100L);
            this.valueConverter.convertValue(badVal, null, null);
            Assert.fail("Value converter needs to throw exception on failure");
        } catch (ValueConversionException e) {
            //Success
        } catch (Exception e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

}

package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.conversion.ValueConversionException;

import junit.framework.TestCase;

public class TestFloatValueConverter extends ValueConverterTestCase<Float> {

	public TestFloatValueConverter() {
		super(new FloatValueConverter(), Float.class);
	}

	@Test
	public void basicTest() {
		float test = 3.141592F;
		Value v = valueConverter.convertType(test, null);
		TestCase.assertEquals(test, valueConverter.convertValue(v, null, Float.class));
	}

	@Test
	public void testEmpty() {
		try {
			valueConverter.convertValue(valueFactory.createLiteral(""), null, type);
			TestCase.fail("Empty string should cause ValueConversionException");
		} catch (ValueConversionException e) {
			TestCase.assertTrue("Cause of error should have been NumberFormatException",
					e.getCause() instanceof NumberFormatException);
		}
	}

}

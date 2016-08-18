package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.conversion.ValueConversionException;

import junit.framework.TestCase;

public class TestDoubleValueConverter extends ValueConverterTestCase<Double> {

	public TestDoubleValueConverter() {
		super(new DoubleValueConverter(), Double.class);
	}

	@Test
	public void testSimple() {
		double test = 3.14159;
		Value l = valueConverter.convertType(test, null);
		TestCase.assertEquals(test, valueConverter.convertValue(l, null, Double.class));
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

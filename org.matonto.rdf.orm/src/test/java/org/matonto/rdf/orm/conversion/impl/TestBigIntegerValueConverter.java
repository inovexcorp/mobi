package org.matonto.rdf.orm.conversion.impl;

import java.math.BigInteger;

import org.junit.Test;

import junit.framework.TestCase;

public class TestBigIntegerValueConverter extends ValueConverterTestCase<BigInteger> {

	public TestBigIntegerValueConverter() {
		super(new BigIntegerValueConverter(), BigInteger.class);
	}

	@Test
	public void simpleTest() {
		BigInteger test = new BigInteger("12345678987654321");
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, BigInteger.class));
	}

}

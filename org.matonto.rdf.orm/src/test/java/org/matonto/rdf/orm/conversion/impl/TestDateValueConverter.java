package org.matonto.rdf.orm.conversion.impl;

import java.util.Date;

import org.junit.Test;

import junit.framework.TestCase;

public class TestDateValueConverter extends ValueConverterTestCase<Date> {

	public TestDateValueConverter() {
		super(new DateValueConverter(), Date.class);
	}

	@Test
	public void simpleTest() {
		Date test = new Date();
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, Date.class));
	}

}

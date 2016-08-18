package org.matonto.rdf.orm.conversion.impl;

import java.util.Calendar;
import java.util.GregorianCalendar;

import org.junit.Test;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;

import junit.framework.TestCase;

public class TestCalendarValueConverter extends ValueConverterTestCase<Calendar> {

	public TestCalendarValueConverter() {
		super(new CalendarValueConverter(), Calendar.class);
	}

	@Test
	public void test() {
		Calendar c = new GregorianCalendar();
		Value v = valueConverter.convertType(c, (Thing) null);
		Calendar c1 = valueConverter.convertValue(v, null, Calendar.class);
		// TODO - evalutate why equality doesn't work...
		TestCase.assertEquals(c.getTimeInMillis(), c1.getTimeInMillis());

	}

}

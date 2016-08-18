package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConverter;

import junit.framework.TestCase;

public abstract class ValueConverterTestCase<X> {

	protected ValueConverter<X> valueConverter;

	protected Class<X> type;

	protected static final ValueFactory valueFactory = SimpleValueFactory.getInstance();

	public ValueConverterTestCase(ValueConverter<X> converter, Class<X> type) {
		this(converter, type, valueFactory);
	}

	public ValueConverterTestCase(ValueConverter<X> converter, Class<X> type, ValueFactory valueFactory) {
		if (converter instanceof AbstractValueConverter<?>) {
			((AbstractValueConverter<?>) converter).setValueFactory(valueFactory);
		}
		this.valueConverter = converter;
		this.type = type;
	}

	@Test
	public void testGetType() {
		TestCase.assertEquals(type, valueConverter.getType());
	}

}

package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for {@link String}s.
 * 
 * @author bdgould
 *
 */
@Component
public class StringValueConverter extends AbstractValueConverter<String> {

	/**
	 * Construct a new {@link StringValueConverter}.
	 */
	public StringValueConverter() {
		super(String.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String convertValue(Value value, Thing thing, Class<? extends String> desiredType)
			throws ValueConversionException {
		return value.stringValue();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(String type, Thing thing) throws ValueConversionException {
		return getValueFactory(thing).createLiteral(type);
	}

}

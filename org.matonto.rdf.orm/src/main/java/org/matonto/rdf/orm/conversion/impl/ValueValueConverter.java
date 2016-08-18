package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for {@link Value}s...
 * 
 * @author bdgould
 *
 */
@Component
public class ValueValueConverter extends AbstractValueConverter<Value> {

	/**
	 * Construct a new {@link ValueValueConverter}.
	 */
	public ValueValueConverter() {
		super(Value.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertValue(Value value, Thing thing, Class<? extends Value> desiredType)
			throws ValueConversionException {
		return value;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(Value type, Thing thing) throws ValueConversionException {
		return type;
	}

}

package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for {@link Float}s.
 * 
 * @author bdgould
 *
 */
@Component
public class FloatValueConverter extends AbstractValueConverter<Float> {

	/**
	 * Construct a new {@link FloatValueConverter}.
	 */
	public FloatValueConverter() {
		super(Float.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Float convertValue(Value value, Thing thing, Class<? extends Float> desiredType)
			throws ValueConversionException {
		try {
			return Float.parseFloat(value.stringValue());
		} catch (NumberFormatException e) {
			throw new ValueConversionException("Issue getting float value from statement", e);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(Float type, Thing thing) throws ValueConversionException {
		return getValueFactory(thing).createLiteral(type);
	}

}

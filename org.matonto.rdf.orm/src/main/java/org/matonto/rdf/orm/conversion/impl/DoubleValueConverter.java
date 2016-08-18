package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for {@link Double} types.
 * 
 * @author bdgould
 *
 */
@Component
public class DoubleValueConverter extends AbstractValueConverter<Double> {

	/**
	 * Construct a new {@link DoubleValueConverter}.
	 */
	public DoubleValueConverter() {
		super(Double.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Double convertValue(Value value, Thing thing, Class<? extends Double> desiredType)
			throws ValueConversionException {
		try {
			return Double.parseDouble(value.stringValue());
		} catch (NumberFormatException e) {
			throw new ValueConversionException("Issue getting double value from statement", e);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(Double type, Thing thing) throws ValueConversionException {
		return getValueFactory(thing).createLiteral(type);
	}

}

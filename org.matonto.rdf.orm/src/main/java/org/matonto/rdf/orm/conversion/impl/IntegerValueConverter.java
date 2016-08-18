package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for {@link Integer}s.
 * 
 * @author bdgould
 *
 */
@Component
public class IntegerValueConverter extends AbstractValueConverter<Integer> {

	/**
	 * Construct a new {@link IntegerValueConverter}.
	 */
	public IntegerValueConverter() {
		super(Integer.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Integer convertValue(final Value value, final Thing thing, final Class<? extends Integer> desiredType)
			throws ValueConversionException {
		try {
			return Integer.parseInt(value.stringValue());
		} catch (NumberFormatException e) {
			throw new ValueConversionException("Issue getting int value from statement", e);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(Integer type, Thing thing) throws ValueConversionException {
		return getValueFactory(thing).createLiteral(type);
	}

}

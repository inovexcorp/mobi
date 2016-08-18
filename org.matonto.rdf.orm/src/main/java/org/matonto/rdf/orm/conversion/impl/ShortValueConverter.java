package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for {@link Short}s.
 * 
 * @author bdgould
 *
 */
@Component
public class ShortValueConverter extends AbstractValueConverter<Short> {

	/**
	 * Construct a new {@link ShortValueConverter}.
	 */
	public ShortValueConverter() {
		super(Short.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Short convertValue(Value value, Thing thing, Class<? extends Short> desiredType)
			throws ValueConversionException {
		try {
			return Short.parseShort(value.stringValue());
		} catch (NumberFormatException e) {
			throw new ValueConversionException("Issue getting short value from statement", e);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(Short type, Thing thing) throws ValueConversionException {
		return getValueFactory(thing).createLiteral(type);
	}

}

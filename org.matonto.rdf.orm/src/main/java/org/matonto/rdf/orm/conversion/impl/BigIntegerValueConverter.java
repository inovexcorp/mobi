package org.matonto.rdf.orm.conversion.impl;

import java.math.BigInteger;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for {@link BigInteger} objects.
 * 
 * @author bdgould
 *
 */
@Component
public class BigIntegerValueConverter extends AbstractValueConverter<BigInteger> {

	/**
	 * The type of literal this {@link ValueConverter} works with.
	 */
	private static final String XSD_INTEGER = XSD_PREFIX + "integer";

	/**
	 * Default constructor.
	 */
	public BigIntegerValueConverter() {
		super(BigInteger.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public BigInteger convertValue(Value value, Thing thing, Class<? extends BigInteger> desiredType)
			throws ValueConversionException {
		try {
			return new BigInteger(value.stringValue());
		} catch (NumberFormatException e) {
			throw new ValueConversionException("Issue getting big integer value from statement.", e);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(BigInteger type, Thing thing) throws ValueConversionException {
		return getValueFactory(thing).createLiteral(type.toString(), XSD_INTEGER);
	}

}

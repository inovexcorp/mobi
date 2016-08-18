package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for {@link Literal}s.
 * 
 * @author bdgould
 *
 */
@Component
public class LiteralValueConverter extends AbstractValueConverter<Literal> {

	/**
	 * Construct a new {@link LiteralValueConverter}.
	 */
	public LiteralValueConverter() {
		super(Literal.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Literal convertValue(Value value, Thing thing, Class<? extends Literal> desiredType)
			throws ValueConversionException {
		try {
			return Literal.class.cast(value);
		} catch (ClassCastException e) {
			throw new ValueConversionException("Issue creating literal from value specified: " + value, e);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(Literal type, Thing thing) throws ValueConversionException {
		return type;
	}

}

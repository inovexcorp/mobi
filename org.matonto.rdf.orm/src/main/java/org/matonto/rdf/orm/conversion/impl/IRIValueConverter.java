package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for creating {@link IRI}s from statements.
 * 
 * @author bdgould
 *
 */
@Component
public class IRIValueConverter extends AbstractValueConverter<IRI> {

	/**
	 * Default constructor.
	 */
	public IRIValueConverter() {
		super(IRI.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public IRI convertValue(Value value, Thing thing, Class<? extends IRI> desiredType)
			throws ValueConversionException {
		if (value instanceof IRI) {
			try {
				return (IRI) value;
			} catch (ClassCastException e) {
				throw new ValueConversionException("Issue casting value '" + value + "' to an IRI.", e);
			}
		} else {
			try {
				return getValueFactory(thing).createIRI(value.stringValue());
			} catch (Exception e) {
				throw new ValueConversionException("Issue creating IRI from statement.", e);
			}
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(IRI type, Thing thing) throws ValueConversionException {
		return type;
	}

}

package org.matonto.rdf.orm.conversion.impl;

import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

/**
 * {@link ValueConverter} for {@link Resource}.
 * 
 * @author bdgould
 *
 */
public class ResourceValueConverter extends AbstractValueConverter<Resource> {

	/**
	 * Default constructor.
	 */
	public ResourceValueConverter() {
		super(Resource.class);
	}

	/**
	 * {@inheritDoc}<br>
	 * <br>
	 * Try and cast the value to a {@link Resource}, and if this doesn't work,
	 * then try and create an from the {@link String} value.
	 */
	@Override
	public Resource convertValue(final Value value, final Thing thing, final Class<? extends Resource> desiredType)
			throws ValueConversionException {
		if (value instanceof Resource) {
			try {
				return Resource.class.cast(value);
			} catch (ClassCastException e) {
				throw new ValueConversionException("Issue casting value '" + value + "' into a Resource", e);
			}
		} else {
			try {
				return getValueFactory(thing).createIRI(value.stringValue());
			} catch (Exception e) {
				throw new ValueConversionException("Issue converting '" + value + "' into a IRI object", e);
			}
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(Resource type, Thing thing) throws ValueConversionException {
		return type;
	}

}

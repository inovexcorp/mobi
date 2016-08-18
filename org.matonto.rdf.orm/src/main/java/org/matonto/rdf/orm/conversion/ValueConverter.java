package org.matonto.rdf.orm.conversion;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;

/**
 * This is a service that converts the value of given statements to the desired
 * type.
 * 
 * @author bdgould
 *
 * @param <TYPE>
 *            The type of output object that this converter will produce
 */
public interface ValueConverter<TYPE> {

	/**
	 * Convert a value to the specified type.
	 * 
	 * @param value
	 *            The {@link Value} to convert
	 * @param thing
	 *            The {@link Thing} asking for the conversion (context can help)
	 * @param desiredType
	 *            The desired output type
	 * @return The converted instance
	 * @throws ValueConversionException
	 *             If there is an issue converting the value
	 */
	TYPE convertValue(Value value, Thing thing, Class<? extends TYPE> desiredType) throws ValueConversionException;

	/**
	 * Convert an instance of the TYPE of object this {@link ValueConverter}
	 * works with back into a {@link Value}.
	 * 
	 * @param type
	 *            The object to convert into a {@link Value}
	 * @param thing
	 *            The {@link Thing} we're converting for
	 * @return The {@link Value} form of the object passed in
	 * @throws ValueConversionException
	 *             If there is an issue performing the conversion
	 */
	Value convertType(TYPE type, Thing thing) throws ValueConversionException;

	/**
	 *
	 * @return The type of data this {@link ValueConverter} will produce
	 */
	Class<TYPE> getType();

}

package org.matonto.rdf.orm.conversion;

import java.util.Set;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.OrmException;
import org.matonto.rdf.orm.Thing;

/**
 * This service references all the {@link ValueConverter}s registered and
 * exposes them in a single place.
 * 
 * @author bdgould
 *
 */
public interface ValueConverterRegistry {

	/**
	 * Convert a given {@link Value} to the desired type.
	 * 
	 * @param value
	 *            The {@link Value} to translate
	 * @param thing
	 *            The {@link Thing} you're translating for
	 * @param desiredType
	 *            The desired output type
	 * @return An instance of the desired type, derived from the provided
	 *         {@link Value}
	 * @throws OrmException
	 *             If there is an issue performing the conversion
	 */
	<T> T convertValue(Value value, Thing thing, Class<T> desiredType) throws OrmException;

	/**
	 * Convert a given type into a {@link Value}.
	 * 
	 * @param type
	 *            The Type to convert
	 * @param thing
	 *            The {@link Thing} requesting the conversion
	 * @return The {@link Value} representation of the type
	 * @throws OrmException
	 *             If there is an issue performing the conversion
	 */
	<T> Value convertType(T type, Thing thing) throws OrmException;

	/**
	 * Convert a given set of Values into their corresponding type.
	 * 
	 * @param value
	 *            The {@link Value}s to translate
	 * @param thing
	 *            The {@link Thing} you're translating for
	 * @param desiredType
	 *            The output type
	 * @return The {@link Set} of desired types
	 * @throws OrmException
	 *             If there is an issue performing the conversion
	 */
	<T> Set<T> convertValues(Set<Value> value, Thing thing, Class<T> desiredType) throws OrmException;

	/**
	 * Convert a given set of types into their corresponding {@link Value}s.
	 * 
	 * @param types
	 *            The incoming set of objects
	 * @param thing
	 *            The {@link Thing} you're translating for
	 * @return The set of {@link Value}s representing the incoming set data
	 * @throws OrmException
	 */
	<T> Set<Value> convertTypes(Set<T> types, Thing thing) throws OrmException;

	/**
	 * Get a registered {@link ValueConverter} instance.
	 * 
	 * @param type
	 *            The type of {@link ValueConverter} you want
	 * @return The {@link ValueConverter} of the specified type
	 * 
	 */
	<T> ValueConverter<T> getValueConverter(Class<T> type) throws OrmException;

	/**
	 * Register a given type converter.
	 * 
	 * @param converter
	 *            The {@link ValueConverter} we're registering
	 */
	<T> void registerValueConverter(final ValueConverter<T> converter);

}

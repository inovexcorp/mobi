package org.matonto.rdf.orm.conversion;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.Thing;

import aQute.bnd.annotation.component.Reference;

/**
 * This is an {@link AbstractValueConverter} for implementations to extend.
 * Basically just provides the type-methods for implementations.
 * 
 * @author bdgould
 *
 * @param <TYPE>
 *            The type of {@link ValueConverter} your extension is
 */
public abstract class AbstractValueConverter<TYPE> implements ValueConverter<TYPE> {

	public static final String XSD_PREFIX = "http://www.w3.org/2001/XMLSchema#";

	/**
	 * A {@link ValueFactory} instance to use by default for doing conversion.
	 */
	protected ValueFactory valueFactory;

	/**
	 * The type this {@link ValueConverter} will produce.
	 */
	protected final Class<TYPE> type;

	/**
	 * Construct a new {@link AbstractValueConverter}.
	 * 
	 * @param type
	 *            The type of object this {@link ValueConverter} will produce
	 */
	public AbstractValueConverter(final Class<TYPE> type) {
		this.type = type;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Class<TYPE> getType() {
		return type;
	}

	/**
	 * Get a {@link ValueFactory} object, using first the {@link Thing}s
	 * instance, then the default.
	 * 
	 * @param thing
	 *            The {@link Thing} to look in for a {@link ValueFactory} first
	 * @return The {@link ValueFactory} from the {@link Thing} or the default
	 *         one in the service
	 */
	public ValueFactory getValueFactory(final Thing thing) {
		return (thing != null && thing.getValueFactory() != null) ? thing.getValueFactory() : valueFactory;
	}

	/**
	 * Inject the {@link ValueFactory} to use for the IRI creation into this
	 * service.
	 * 
	 * @param valueFactory
	 *            The {@link ValueFactory} to use to create {@link IRI}s
	 */
	@Reference
	public void setValueFactory(final ValueFactory valueFactory) {
		this.valueFactory = valueFactory;
	}

}

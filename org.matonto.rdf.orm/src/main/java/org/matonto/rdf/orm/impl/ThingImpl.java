package org.matonto.rdf.orm.impl;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;

/**
 * This is the core {@link Thing} implementation that will provide the API hooks
 * that generated {@link Thing} extensions will take advantage of.
 * 
 * @author bdgould
 *
 */
public class ThingImpl implements Thing {

	/**
	 * The {@link Resource} identifier for this {@link Thing}.
	 */
	protected final Resource resource;

	/**
	 * The backing {@link Model} for this Thing entity.
	 */
	protected final Model model;

	/**
	 * The {@link ValueFactory} to use.
	 */
	protected final ValueFactory valueFactory;

	/**
	 * The {@link ValueConverterRegistry} to convert
	 */
	protected final ValueConverterRegistry valueConverterRegistry;

	/**
	 * Construct a new {@link ThingImpl}.
	 * 
	 * @param resource
	 *            The {@link Resource} identifying this {@link Thing}
	 * @param model
	 *            The {@link Model} containing the backing statements about this
	 *            {@link Thing}
	 * @param valueFactory
	 *            The {@link ValueFactory} to construct RDF data with
	 * @param valueConverterRegistry
	 *            The {@link ValueConverterRegistry} to use for converting
	 *            {@link Value} data to objects
	 */
	public ThingImpl(final Resource resource, final Model model, final ValueFactory valueFactory,
			final ValueConverterRegistry valueConverterRegistry) {
		this.resource = resource;
		this.model = model;
		this.valueFactory = valueFactory;
		this.valueConverterRegistry = valueConverterRegistry;
	}

	/**
	 * Construct a new {@link ThingImpl}.
	 * 
	 * @param resourceString
	 *            The String IRI identifying this {@link Thing}
	 * @param model
	 *            The {@link Model} containing the backing statements about this
	 *            {@link Thing}
	 * @param valueFactory
	 *            The {@link ValueFactory} to construct RDF data with
	 * @param valueConverterRegistry
	 *            The {@link ValueConverterRegistry} to use to convert
	 *            {@link Value} data to objects
	 */
	public ThingImpl(final String resourceString, final Model model, final ValueFactory valueFactory,
			final ValueConverterRegistry valueConverterRegistry) {
		this(valueFactory.createIRI(resourceString), model, valueFactory, valueConverterRegistry);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Resource getResource() {
		return resource;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Model getModel() {
		return model;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value getProperty(IRI predicate, IRI... context) {
		final Collection<Value> values = getProperties(predicate, context);
		return values.isEmpty() ? null : values.iterator().next();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Set<Value> getProperties(final IRI predicate, final IRI... context) {
		return model.filter(resource, predicate, null, context).stream().map(stmt -> {
			return stmt.getObject();
		}).collect(Collectors.toSet());
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean setProperty(Value value, IRI predicate, IRI... context) {
		// Remove other properties with same prediciate...
		model.filter(getResource(), predicate, null, context).forEach(stmt -> {
			model.remove(stmt);
		});
		return model.add(getResource(), predicate, value, context);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void setProperties(Set<Value> values, IRI predicate, IRI... context) {
		// Remove other properties with same prediciate...
		model.filter(getResource(), predicate, null, context).forEach(stmt -> {
			model.remove(stmt);
		});
		values.forEach(value -> {
			model.add(getResource(), predicate, value, context);
		});
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean addProperty(Value value, IRI predicate, IRI... context) {
		return model.add(getResource(), predicate, value, context);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean removeProperty(Value value, IRI predicate, IRI... context) {
		return model.remove(resource, predicate, value, context);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public ValueFactory getValueFactory() {
		return valueFactory;
	}

}
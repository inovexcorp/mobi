package org.matonto.rdf.orm.impl;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.AbstractOrmFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;

import aQute.bnd.annotation.component.Component;

/**
 * This is the core {@link OrmFactory} for {@link Thing} instances. It provides
 * a useful pattern for working with the {@link Thing} class. It is a OSGi
 * service for {@link OrmFactory} instances that return {@link Thing} typed ORM
 * objects.
 * 
 * @author bdgould
 *
 */
@Component
public class ThingFactory extends AbstractOrmFactory<Thing> {

	/**
	 * Construct a new {@link ThingFactory}.
	 */
	public ThingFactory() {
		super(Thing.class, ThingImpl.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Thing getExisting(Resource resource, Model model, ValueFactory valueFactory,
			ValueConverterRegistry valueConverterRegistry) {
		return new ThingImpl(resource, model, valueFactory, valueConverterRegistry);
	}

}

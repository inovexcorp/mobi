package org.matonto.rdf.orm;

import java.util.Collection;

import org.matonto.rdf.api.IRI;

/*-
 * #%L
 * RDF ORM
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverter;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;

/**
 * This interface describes a factory OSGi service that will provide other
 * services the ability to work with ontologies in MatOnto. Each
 * {@link OrmFactory} will also be a {@link ValueConverter} for the given type.
 * This will allow a reduced amount of generated code.
 * 
 * @author bdgould
 *
 * @param <T>
 *            The type of {@link Thing} this factory will produce
 */
public interface OrmFactory<T extends Thing> extends ValueConverter<T> {

    /**
     * The IRI string representing the rdf:type value.
     */
    static final String RDF_TYPE_IRI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

    /**
     * Create a new instance of the specified type with the provided params.
     * 
     * @param resource
     *            The {@link Resource} identifying this type
     * @param model
     *            The {@link Model} containing the statements backing this type
     * @param valueFactory
     *            The {@link ValueFactory} to use constructing RDF data
     * @param valueConverterRegistry
     *            The {@link ValueConverterRegistry} for converting
     *            {@link Value} data to objects
     * @return The new instance of the {@link Thing} type
     */
    T createNew(final Resource resource, final Model model, final ValueFactory valueFactory,
            final ValueConverterRegistry valueConverterRegistry);

    /**
     * Create a new instance of the specified type with the provided params.
     * 
     * @param resource
     *            The {@link Resource} identifying this type
     * @param model
     *            The {@link Model} containing the statements backing this type
     * @param valueFactory
     *            The {@link ValueFactory} to use constructing RDF data
     * @return The new instance of the {@link Thing} type
     */
    T createNew(final Resource resource, final Model model, final ValueFactory valueFactory);

    /**
     * Create a new instance of the specified type with the provided params.
     * 
     * @param resource
     *            The {@link Resource} identifying this type
     * @param model
     *            The {@link Model} containing the statements backing this type
     * @return The new instance of the {@link Thing} type
     */
    T createNew(final Resource resource, final Model model);

    /**
     * Create a new instance of the specified type with the provided params.
     * 
     * @param resource
     *            The {@link Resource} identifying this type
     * @return The new instance of the {@link Thing} type
     */
    T createNew(final Resource resource);

    /**
     * Get an existing instance of the specified type with the provided params.
     * 
     * @param resource
     *            The {@link Resource} identifying this type
     * @param model
     *            The {@link Model} containing the statements backing this type
     * @param valueFactory
     *            The {@link ValueFactory} to use constructing RDF data
     * @param valueConverterRegistry
     *            The {@link ValueConverterRegistry} for converting
     *            {@link Value} data to objects
     * @return The targeted instance of the {@link Thing} type
     */
    T getExisting(final Resource resource, final Model model, final ValueFactory valueFactory,
            final ValueConverterRegistry valueConverterRegistry);

    /**
     * Get an existing instance of the specified type with the provided params.
     * 
     * @param resource
     *            The {@link Resource} identifying this type
     * @param model
     *            The {@link Model} containing the statements backing this type
     * @param valueFactory
     *            The {@link ValueFactory} to use constructing RDF data
     * @return The targeted instance of the {@link Thing} type
     */
    T getExisting(final Resource resource, final Model model, final ValueFactory valueFactory);

    /**
     * Get an existing instance of the specified type with the provided params.
     * 
     * @param resource
     *            The {@link Resource} identifying this type
     * @param model
     *            The {@link Model} containing the statements backing this type
     * @return The targeted instance of the {@link Thing} type
     */
    T getExisting(final Resource resource, final Model model);

    /**
     * Get all existing instances of this type in a specified {@link Model}.
     * 
     * @param model
     *            The {@link Model} to look in
     * @return The {@link Collection} of instances of this type
     */
    Collection<T> getAllExisting(final Model model);

    /**
     * @return The type of {@link Thing} extension interface that this
     *         factory/converter works with
     */
    Class<T> getType();

    /**
     * 
     * @return The IRI string for the type this {@link OrmFactory} works with
     */
    IRI getTypeIRI();

    /**
     * 
     * @return The type of {@link Thing} extension implementation that this
     *         factory/converter will build
     */
    Class<? extends T> getImpl();

}

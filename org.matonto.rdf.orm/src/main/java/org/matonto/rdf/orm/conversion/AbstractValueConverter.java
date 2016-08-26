package org.matonto.rdf.orm.conversion;

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

import aQute.bnd.annotation.component.Reference;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.Thing;

/**
 * This is an {@link AbstractValueConverter} for implementations to extend.
 * Basically just provides the type-methods for implementations.
 *
 * @param <TYPE> The type of {@link ValueConverter} your extension is
 * @author bdgould
 */
public abstract class AbstractValueConverter<TYPE> implements ValueConverter<TYPE> {

    public static final String XSD_PREFIX = "http://www.w3.org/2001/XMLSchema#";
    /**
     * The type this {@link ValueConverter} will produce.
     */
    protected final Class<TYPE> type;
    /**
     * A {@link ValueFactory} instance to use by default for doing conversion.
     */
    protected ValueFactory valueFactory;

    /**
     * Construct a new {@link AbstractValueConverter}.
     *
     * @param type The type of object this {@link ValueConverter} will produce
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
     * @param thing The {@link Thing} to look in for a {@link ValueFactory} first
     * @return The {@link ValueFactory} from the {@link Thing} or the default
     * one in the service
     */
    public ValueFactory getValueFactory(final Thing thing) {
        return (thing != null && thing.getValueFactory() != null) ? thing.getValueFactory() : valueFactory;
    }

    /**
     * Inject the {@link ValueFactory} to use for the IRI creation into this
     * service.
     *
     * @param valueFactory The {@link ValueFactory} to use to create {@link IRI}s
     */
    @Reference
    public void setValueFactory(final ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

}

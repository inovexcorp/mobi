package com.mobi.rdf.orm.conversion.impl;

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

import aQute.bnd.annotation.component.Component;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.conversion.AbstractValueConverter;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.AbstractValueConverter;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.orm.conversion.ValueConverter;

/**
 * {@link ValueConverter} for {@link Resource}.
 *
 * @author bdgould
 */
@Component(provide = ValueConverter.class)
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
     * then try and create an IRI from the {@link String} value.
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

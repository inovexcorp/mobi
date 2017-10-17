package com.mobi.rdf.orm.conversion;

import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.Thing;

import javax.annotation.Nonnull;

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

/**
 * This is a service that converts the value of given statements to the desired
 * type.
 *
 * @param <TYPE> The type of output object that this converter will produce
 * @author bdgould
 */
public interface ValueConverter<TYPE> {

    /**
     * Convert a value to the specified type.
     *
     * @param value       The {@link Value} to convert
     * @param thing       The {@link Thing} asking for the conversion (context can help)
     * @param desiredType The desired output type
     * @return The converted instance
     * @throws ValueConversionException If there is an issue converting the value
     */
    TYPE convertValue(@Nonnull Value value, Thing thing, @Nonnull Class<? extends TYPE> desiredType)
            throws ValueConversionException;

    /**
     * Convert an instance of the TYPE of object this {@link ValueConverter}
     * works with back into a {@link Value}.
     *
     * @param type  The object to convert into a {@link Value}
     * @param thing The {@link Thing} we're converting for
     * @return The {@link Value} form of the object passed in
     * @throws ValueConversionException If there is an issue performing the conversion
     */
    Value convertType(@Nonnull TYPE type, Thing thing) throws ValueConversionException;

    /**
     * @return The type of data this {@link ValueConverter} will produce
     */
    Class<TYPE> getType();

}

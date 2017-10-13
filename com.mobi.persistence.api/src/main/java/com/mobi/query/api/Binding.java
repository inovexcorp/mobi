package com.mobi.query.api;

/*-
 * #%L
 * com.mobi.persistence.api
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

import com.mobi.rdf.api.Value;

import javax.annotation.Nonnull;

public interface Binding {

    /**
     * Gets the name of the binding (e.g. the variable name).
     *
     * @return The name of the binding.
     */
    String getName();

    /**
     * Gets the value of the binding. The returned value is never equal to
     * <tt>null</tt>, such a "binding" is considered to be unbound.
     *
     * @return The value of the binding, never <tt>null</tt>.
     */
    @Nonnull
    Value getValue();

    /**
     * Compares a binding object to another object.
     *
     * @param object
     *        The object to compare this binding to.
     * @return <tt>true</tt> if the other object is an instance of
     *         {@link Binding} and both their names and values are equal,
     *         <tt>false</tt> otherwise.
     */
    boolean equals(Object object);


}

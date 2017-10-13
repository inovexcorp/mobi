package com.mobi.rdf.orm;

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

import com.mobi.exception.MobiException;

/**
 * This {@link MobiException} indicates something went wrong with the ORM
 * action.
 *
 * @author bdgould
 */
public class OrmException extends MobiException {

    /**
     * Serial version UID.
     */
    private static final long serialVersionUID = -411409811095531213L;

    /**
     * Construct a new {@link OrmException}.
     *
     * @param msg The message to attach
     */
    public OrmException(final String msg) {
        super(msg);
    }

    /**
     * Construct a new {@link OrmException}.
     *
     * @param msg   The message to attach
     * @param cause The underlying cause to attach
     */
    public OrmException(final String msg, final Throwable cause) {
        super(msg, cause);
    }
}

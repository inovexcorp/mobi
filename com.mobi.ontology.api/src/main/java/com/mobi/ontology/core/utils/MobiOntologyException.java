package com.mobi.ontology.core.utils;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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


public class MobiOntologyException extends MobiException {

    private static final long serialVersionUID = -5863496450275604264L;

    public MobiOntologyException() {}

    public MobiOntologyException(String message)
    {
        super(message);
    }

    public MobiOntologyException(String message, Throwable cause)
    {
        super(message, cause);
    }

    public MobiOntologyException(Throwable cause)
    {
        super(cause);
    }
}

package com.mobi.repository.exception;

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

import com.mobi.exception.MobiException;

public class RepositoryException extends MobiException {

    private static final long serialVersionUID = -6163996571635121845L;

    public RepositoryException() {
        super();
    }

    public RepositoryException(String message) {
        super(message);
    }

    public RepositoryException(Throwable t) {
        super(t);
    }

    public RepositoryException(String message, Throwable t) {
        super(message, t);
    }
}

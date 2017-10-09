package com.mobi.exception;

/*-
 * #%L
 * com.mobi.api
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
 * General superclass of all unchecked exceptions that parts of Mobi can throw.
 */
public class MobiException extends RuntimeException {

    private static final long serialVersionUID = -1446928426692064348L;

    public MobiException() {
        super();
    }

    public MobiException(String msg) {
        super(msg);
    }

    public MobiException(Throwable t) {
        super(t);
    }

    public MobiException(String msg, Throwable t) {
        super(msg, t);
    }
}

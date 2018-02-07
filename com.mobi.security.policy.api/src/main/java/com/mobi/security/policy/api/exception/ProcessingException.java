package com.mobi.security.policy.api.exception;

/*-
 * #%L
 * com.mobi.security.policy.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

public class ProcessingException extends MobiException {
    private static final long serialVersionUID = -2444060419452600467L;

    public ProcessingException() {}

    public ProcessingException(String message) {
        super(message);
    }

    public ProcessingException(String message, Throwable throwable) {
        super(message, throwable);
    }

    public ProcessingException(Throwable throwable) {
        super(throwable);
    }
}

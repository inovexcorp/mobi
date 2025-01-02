package com.mobi.utils.cli.api;

/*-
 * #%L
 * com.mobi.utils.cli
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

import java.io.Serial;

/**
 * This Exception is used to end the restore process if thrown anywhere during the extensible operations.
 * BE WARNED: this will promptly end the restore process with no real rollbacks except for wiping the temporary unpacked
 * backup directory. Use with caution!
 */
public class EndRestoreException extends MobiException {

    @Serial
    private static final long serialVersionUID = -7925738911015198271L;

    public EndRestoreException() {
        super();
    }

    public EndRestoreException(String msg) {
        super(msg);
    }

    public EndRestoreException(Throwable t) {
        super(t);
    }

    public EndRestoreException(String msg, Throwable t) {
        super(msg, t);
    }
}

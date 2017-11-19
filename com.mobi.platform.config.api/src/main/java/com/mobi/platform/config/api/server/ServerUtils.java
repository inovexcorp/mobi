package com.mobi.platform.config.api.server;

/*-
 * #%L
 * com.mobi.platform.config.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import java.net.InetAddress;
import java.net.SocketException;

public interface ServerUtils {
    /**
     * Gets the MAC id of the current server
     *
     * @return The MAC id of the current server
     * @throws MobiException If there is an issue fetching the MAC id
     */
    byte[] getMacId();

    /**
     * Tries to identify the local network interface
     *
     * @return The local network address
     * @throws MobiException If there is an issue getting the local host address
     */
    InetAddress getLocalhost();
}

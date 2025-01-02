package com.mobi.server.api;

/*-
 * #%L
 * com.mobi.server.api
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

import java.util.UUID;

/**
 * Service interface that describes a core platform service for working with the server.
 */
public interface Mobi {

    /**
     *
     * @return A unique, deterministic ID for this Mobi server.
     */
    UUID getServerIdentifier();

    /**
     *
     * @return The configured host name for the server if present. If no host name is configured or if the host name is
     * not a valid URL with protocol, returns an empty string.
     */
    String getHostName();

}

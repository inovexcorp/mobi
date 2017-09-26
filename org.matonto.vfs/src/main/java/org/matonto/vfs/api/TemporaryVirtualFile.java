package org.matonto.vfs.api;

/*-
 * #%L
 * org.matonto.vfs
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

/**
 * Simple interface extending {@link VirtualFile} that will allow us to create temporary files that live for a certain
 * period of time before automatically being cleaned up.  <br><br> These files should be treated as transient and be
 * cleaned out upon server start/stop.
 */
public interface TemporaryVirtualFile extends VirtualFile {

    /**
     *
     * @return Whether or not this {@link TemporaryVirtualFile} should be cleaned up (or is expired from the system)
     */
    boolean isExpired();
}

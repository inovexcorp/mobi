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

import java.net.URI;
import java.time.temporal.TemporalUnit;
import java.util.concurrent.TimeUnit;

/**
 * This service provides a hook to abstract the file system away from service implementations.
 */
public interface VirtualFilesystem {

    VirtualFile resolveVirtualFile(URI uri) throws VirtualFilesystemException;

    VirtualFile resolveVirtualFile(String uri) throws VirtualFilesystemException;

    TemporaryVirtualFile createTemporaryVirtualFile(long timeToLive, TemporalUnit timeToLiveUnit)
            throws VirtualFilesystemException;

    TemporaryVirtualFile createTemporaryVirtualFile(VirtualFile directory, long timeToLive, TemporalUnit timeToLiveUnit)
            throws VirtualFilesystemException;

    TemporaryVirtualFile createTemporaryVirtualFile(long timeToLive, TemporalUnit timeToLiveUnit,
                                                    long createDuration, TimeUnit createTimeUnit)
            throws VirtualFilesystemException;

    TemporaryVirtualFile createTemporaryVirtualFile(VirtualFile directory, long timeToLive,
                                                    TemporalUnit timeToLiveUnit,
                                                    long createDuration, TimeUnit createTimeUnit) throws VirtualFilesystemException;

}

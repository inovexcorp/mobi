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

import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.Collection;
import java.util.stream.Stream;

/**
 * This interface describes a file in our Virtual Filesystem Abstraction.
 */
public interface VirtualFile extends AutoCloseable {

    boolean exists() throws VirtualFilesystemException;

    boolean isFile() throws VirtualFilesystemException;

    String getIdentifier();

    URL getUrl() throws VirtualFilesystemException;

    InputStream readContent() throws VirtualFilesystemException;

    OutputStream writeContent() throws VirtualFilesystemException;

    OutputStream writeContent(boolean append) throws VirtualFilesystemException;

    boolean isFolder() throws VirtualFilesystemException;

    Stream<VirtualFile> streamChildren() throws VirtualFilesystemException;

    Collection<VirtualFile> getChildren() throws VirtualFilesystemException;

    boolean delete() throws VirtualFilesystemException;

    int deleteAll() throws VirtualFilesystemException;

    void create() throws VirtualFilesystemException;

    void createFolder() throws VirtualFilesystemException;

    /**
     * Determines the size of the file, in bytes.
     *
     * @return The size of the file, in bytes.
     * @throws VirtualFilesystemException If the file does not exist, or is being written to, or on error
     *                                    determining the size.
     */
    long getSize() throws VirtualFilesystemException;

    /**
     * Determines the last-modified timestamp of the file.
     *
     * @return The last-modified timestamp.
     * @throws VirtualFilesystemException If the file does not exist, or is being written to, or on error
     *                                    determining the last-modified timestamp.
     */
    long getLastModifiedTime() throws VirtualFilesystemException;
}

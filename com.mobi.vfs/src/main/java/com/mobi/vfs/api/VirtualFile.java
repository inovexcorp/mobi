package com.mobi.vfs.api;

/*-
 * #%L
 * com.mobi.vfs
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

    /**
     * @return Whether or not this {@link VirtualFile} exists as a folder or file on a file system
     * @throws VirtualFilesystemException If there is an issue making this determination
     */
    boolean exists() throws VirtualFilesystemException;

    /**
     * @return Whether or not this {@link VirtualFile} represents an existing file on a file system
     * @throws VirtualFilesystemException If there is an issue making this determination
     */
    boolean isFile() throws VirtualFilesystemException;

    /**
     * @return The identifier for this {@link VirtualFile}
     */
    String getIdentifier();

    /**
     * @return The {@link URL} representing this {@link VirtualFile}
     * @throws VirtualFilesystemException If there is an issue getting the {@link URL}
     */
    URL getUrl() throws VirtualFilesystemException;

    /**
     * Get the {@link InputStream} containing the data from the existing {@link VirtualFile}
     *
     * @return The {@link InputStream} containing data from the {@link VirtualFile}
     * @throws VirtualFilesystemException If there is an issue reading from the {@link VirtualFile}
     */
    InputStream readContent() throws VirtualFilesystemException;

    /**
     * Get the {@link OutputStream} to write content to this {@link VirtualFile}.  Default is <b>NOT</b> to append,
     * but to overwrite existing content.
     *
     * @return The {@link OutputStream} to write to in order to get content into the {@link VirtualFile}
     * @throws VirtualFilesystemException If there is an issue writing to the {@link VirtualFile}
     */
    OutputStream writeContent() throws VirtualFilesystemException;

    /**
     * Get the output stream for this {@link VirtualFile} to write to.
     *
     * @param append Whether or not to append versus overwrite
     * @return The {@link OutputStream} to write content to this file
     * @throws VirtualFilesystemException If there is an issue writing content to this {@link VirtualFile}
     */
    OutputStream writeContent(boolean append) throws VirtualFilesystemException;

    /**
     * Writes the provided byte array to the output stream for this {@link VirtualFile}.
     *
     * @param fileBytes The byte array to write
     * @throws VirtualFilesystemException
     */
    void writeToContent(byte[] fileBytes) throws VirtualFilesystemException;

    /**
     * Writes the provided input stream to the output stream for this {@link VirtualFile}.
     *
     * @param inputStream The {@link InputStream} to write
     * @throws VirtualFilesystemException
     */
    void writeToContent(InputStream inputStream) throws VirtualFilesystemException;

    /**
     * @return Whether or not this {@link VirtualFile} is a folder
     * @throws VirtualFilesystemException If there is an issue determining
     */
    boolean isFolder() throws VirtualFilesystemException;

    /**
     * Stream through all the children files in this {@link VirtualFile} folder.
     *
     * @return The {@link Stream} of {@link VirtualFile} children of this {@link VirtualFile}
     * @throws VirtualFilesystemException If there is an issue grabbing the children {@link VirtualFile}s
     */
    Stream<VirtualFile> streamChildren() throws VirtualFilesystemException;

    /**
     * Get all the children of this {@link VirtualFile} if it is a folder.
     *
     * @return The {@link Collection} of {@link VirtualFile} children of this folder
     * @throws VirtualFilesystemException If there is an issue listing the children, or it isn't a folder
     */
    Collection<VirtualFile> getChildren() throws VirtualFilesystemException;

    /**
     * Delete this file if it exists, or do nothing if it doesn't or is a folder.
     *
     * @return Whether or not the file was deleted
     * @throws VirtualFilesystemException If there is an issue deleting the file
     */
    boolean delete() throws VirtualFilesystemException;

    /**
     * Delete this file and all of its children recursively.
     *
     * @return The number of deleted files
     * @throws VirtualFilesystemException If there is an issue deleting
     */
    int deleteAll() throws VirtualFilesystemException;

    /**
     * Create this {@link VirtualFile} as a file implementation if it doesn't already exist.
     *
     * @throws VirtualFilesystemException If there is an issue creating the file
     */
    void create() throws VirtualFilesystemException;

    /**
     * Create this {@link VirtualFile} as a folder implementation if it doesn't already exist.
     *
     * @throws VirtualFilesystemException If it failed to create the folder
     */
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

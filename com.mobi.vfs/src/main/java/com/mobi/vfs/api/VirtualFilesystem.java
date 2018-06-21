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
import java.net.URI;
import java.time.temporal.TemporalUnit;
import java.util.concurrent.TimeUnit;

/**
 * This service provides a hook to abstract the file system away from service implementations.
 */
public interface VirtualFilesystem {

    /**
     * Takes an {@link InputStream}, hashes using xxHash 64-bit implementation, and returns a string value of the hash.
     *
     * @param inputStream The {@link InputStream} to hash
     * @return A string representation of the hash
     */
    String contentHashFilePath(InputStream inputStream) throws VirtualFilesystemException;

    /**
     * Takes a byte array, hashes using xxHash 64-bit implementation, and returns a string value of the hash.
     *
     * @param fileBytes The byte array to hash
     * @return A string representation of the hash
     */
    String contentHashFilePath(byte[] fileBytes) throws VirtualFilesystemException;

    /**
     * Resolve a virtual file representation based upon the provided URI.
     *
     * @param uri The {@link URI} to resolve to a file
     * @return The {@link VirtualFile} representation of the file
     * @throws VirtualFilesystemException If there is an issue resolving the virtual file abstraction
     */
    VirtualFile resolveVirtualFile(URI uri) throws VirtualFilesystemException;

    /**
     * Resolve a virtual file representation based upon the provided URI.
     *
     * @param uri The {@link URI} (in string format) to resolve to a file
     * @return The {@link VirtualFile} representation of the file
     * @throws VirtualFilesystemException If there is an issue resolving the virtual file abstraction
     */
    VirtualFile resolveVirtualFile(String uri) throws VirtualFilesystemException;

    /**
     * Resolves a virtual file representation based on a hash generated from the contents of a file. Uses the provided
     * directory as a prefix for the file. If a file with the provided contents does not exist, method will create the
     * file and write the provided bytes to it.
     *
     * @param inputStream The content of a file to hash and resolve to a file
     * @param directory The directory to prefix the filename with
     * @return The {@link VirtualFile} representation of the file
     * @throws VirtualFilesystemException If there is an issue resolving the virtual file abstraction
     */
    VirtualFile resolveVirtualFile(InputStream inputStream, String directory) throws VirtualFilesystemException;

    /**
     * Resolves a virtual file representation based on a hash generated from the contents of a file. Uses the provided
     * directory as a prefix for the file. If a file with the provided contents does not exist, method will create the
     * file and write the provided bytes to it.
     *
     * @param fileBytes The content of a file to hash and resolve to a file
     * @param directory The directory to prefix the filename with
     * @return The {@link VirtualFile} representation of the file
     * @throws VirtualFilesystemException If there is an issue resolving the virtual file abstraction
     */
    VirtualFile resolveVirtualFile(byte[] fileBytes, String directory) throws VirtualFilesystemException;

    /**
     * Create a temporary virtual file.  This file will be transient, meaning it will be removed upon system shutdown,
     * and this service will only allow it to live for a specified amount of time.
     *
     * @param timeToLive     The duration of the time to live for this temporary file
     * @param timeToLiveUnit The time unit defining how long this temporary file should live
     * @return The {@link TemporaryVirtualFile} instance you created
     * @throws VirtualFilesystemException If there is an issue creating the {@link TemporaryVirtualFile}
     */
    TemporaryVirtualFile createTemporaryVirtualFile(long timeToLive, TemporalUnit timeToLiveUnit)
            throws VirtualFilesystemException;

    /**
     * Create a temporary virtual file.  This file will be transient, meaning it will be removed upon system shutdown,
     * and this service will only allow it to live for a specified amount of time.
     *
     * @param directory      The base directory where this {@link TemporaryVirtualFile} will be created
     * @param timeToLive     The duration of the time to live for this temporary file
     * @param timeToLiveUnit The time unit defining how long this temporary file should live
     * @return The {@link TemporaryVirtualFile} representation of this file
     * @throws VirtualFilesystemException If there is an issue creating this {@link TemporaryVirtualFile}
     */
    TemporaryVirtualFile createTemporaryVirtualFile(VirtualFile directory, long timeToLive, TemporalUnit timeToLiveUnit)
            throws VirtualFilesystemException;

    /**
     * Create a temporary virtual file.  This file will be transient, meaning it will be removed upon system shutdown,
     * and this service will only allow it to live for a specified amount of time.  <br>
     * <br>
     * The service will limit the number of temporary files that it will create.  This method will allow the requesting
     * process to await the release of used handles if the number is too high for the service.
     *
     * @param timeToLive     The duration of the time to live for this temporary file
     * @param timeToLiveUnit The time unit defining how long this temporary file should live
     * @param createDuration The duration for the amount of time we'll wait for a temporary file to be created
     * @param createTimeUnit The unit for the amount of time we'll wait for a temporary file to be created
     * @return The {@link TemporaryVirtualFile} representation of the temp file
     * @throws VirtualFilesystemException If there is an issue creating the temporary file
     */
    TemporaryVirtualFile createTemporaryVirtualFile(long timeToLive, TemporalUnit timeToLiveUnit,
                                                    long createDuration, TimeUnit createTimeUnit)
            throws VirtualFilesystemException;

    /**
     * Create a temporary virtual file.  This file will be transient, meaning it will be removed upon system shutdown,
     * and this service will only allow it to live for a specified amount of time.  <br>
     * <br>
     * The service will limit the number of temporary files that it will create.  This method will allow the requesting
     * process to await the release of used handles if the number is too high for the service.
     *
     * @param directory      The directory to create the {@link TemporaryVirtualFile} within
     * @param timeToLive     The duration of the time to live for this temporary file
     * @param timeToLiveUnit The time unit defining how long this temporary file should live
     * @param createDuration The duration for the amount of time we'll wait for a temporary file to be created
     * @param createTimeUnit The unit for the amount of time we'll wait for a temporary file to be created
     * @return The {@link TemporaryVirtualFile} representation of the temp file
     * @throws VirtualFilesystemException VirtualFilesystemException If there is an issue creating the temporary file
     */
    TemporaryVirtualFile createTemporaryVirtualFile(VirtualFile directory, long timeToLive,
                                                    TemporalUnit timeToLiveUnit,
                                                    long createDuration, TimeUnit createTimeUnit) throws VirtualFilesystemException;

    /**
     * Gets the {@link VirtualFile} used as the baseFile to resolve relative file paths.
     *
     * @return The {@link VirtualFile} baseFile
     * @throws VirtualFilesystemException If there is an issue resolving the baseFile
     */
    VirtualFile getBaseFile() throws VirtualFilesystemException;

    /**
     * Gets the String representation of the baseFile path used to resolve relative file paths.
     *
     * @return The String baseFile path
     * @throws VirtualFilesystemException If there is an issue resolving the baseFile
     */
    String getBaseFilePath() throws VirtualFilesystemException;
}

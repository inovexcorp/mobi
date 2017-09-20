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


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.concurrent.ForkJoinPool;
import java.util.function.Consumer;

/**
 * Abstract class providing some shared features on the {@link VirtualFilesystem} API.
 */
public abstract class VirtualFileUtilities {

    /**
     * Logging utility object for this implementation.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(VirtualFileUtilities.class);

    /**
     * Process all of the files in a virtual directory asynchronously.
     *
     * @param pool         The {@link ForkJoinPool} to use
     * @param consumer     The {@link Consumer} to use against each file
     * @param targetFolder The {@link VirtualFile} root directory
     * @param issues       Any issues that occur
     * @param recursive    Whether or not to recursively dig down through subfolders
     */
    public static void asynchronouslyProcessAllFiles(final ForkJoinPool pool, final Consumer<VirtualFile> consumer,
                                                     final VirtualFile targetFolder, final Collection<Throwable> issues, final boolean recursive) {
        pool.submit(() -> {
            try {
                // Iterate over every child.
                targetFolder.getChildren().parallelStream().forEach(virtualFile -> {
                    try {
                        // If the file is a folder, then dig down.
                        if (virtualFile.isFolder()) {
                            if (recursive) {
                                LOGGER.trace("Digging down into " + virtualFile.getIdentifier());
                                asynchronouslyProcessAllFiles(pool, consumer, virtualFile, issues, recursive);
                            } else {
                                LOGGER.debug("Skipping folder, as we are not recursive: " + virtualFile.getIdentifier());
                            }
                        }
                        // Else it's a file we should process.
                        else {
                            LOGGER.trace("Working on " + virtualFile.getIdentifier());
                            // Execute our consumer against the file.
                            consumer.accept(virtualFile);
                        }
                    } catch (VirtualFilesystemException e) {
                        LOGGER.error("Issue processing files recursively on " + targetFolder.getIdentifier(), e);
                        issues.add(new AsynchronousProcessingException(e.getMessage(), targetFolder.getIdentifier()));
                    }
                });
            } catch (VirtualFilesystemException e) {
                LOGGER.error("Issue processing files recursively on " + targetFolder.getIdentifier(), e);
                issues.add(new AsynchronousProcessingException(e.getMessage(), targetFolder.getIdentifier()));
            }
        });
    }

}

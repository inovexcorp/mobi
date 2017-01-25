package org.matonto.vfs.api;

import org.apache.log4j.Logger;

import java.util.Collection;
import java.util.concurrent.ForkJoinPool;
import java.util.function.Consumer;

/**
 * Abstract class providing some shared features on the {@link VirtualFilesystem} API.
 */
public abstract class AbstractVirtualFile implements VirtualFile {

    /**
     * Logging utility object for this implementation.
     */
    private static final Logger LOGGER = Logger.getLogger(AbstractVirtualFile.class);


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

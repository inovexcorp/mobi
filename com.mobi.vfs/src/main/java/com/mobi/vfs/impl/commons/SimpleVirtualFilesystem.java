package com.mobi.vfs.impl.commons;

/*-
 * #%L
 * com.mobi.vfs
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

import com.mobi.vfs.api.TemporaryVirtualFile;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import net.jpountz.xxhash.StreamingXXHash64;
import net.jpountz.xxhash.XXHashFactory;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.vfs2.FileObject;
import org.apache.commons.vfs2.FileSystemException;
import org.apache.commons.vfs2.FileSystemManager;
import org.apache.commons.vfs2.VFS;
import org.apache.commons.vfs2.impl.DefaultFileSystemManager;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.time.temporal.TemporalUnit;
import java.util.UUID;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * This is a basic implementation of the {@link VirtualFilesystem} backed by the commons-vfs api.
 */
@Component(
        name = SimpleVirtualFilesystem.SERVICE_NAME,
        immediate = true,
        configurationPolicy = ConfigurationPolicy.REQUIRE
)
@Designate(ocd = SimpleVirtualFilesystemConfig.class)
public class SimpleVirtualFilesystem implements VirtualFilesystem {

    static final String SERVICE_NAME = "com.mobi.vfs.basic";

    private static final Logger LOGGER = LoggerFactory.getLogger(SimpleVirtualFilesystem.class);

    private FileSystemManager fsManager;

    private ScheduledExecutorService scheduledExecutorService;

    private BlockingQueue<TemporaryVirtualFile> tempFiles;

    private String baseTempUrlTemplate;

    private XXHashFactory hashFactory;

    @Override
    public String contentHashFilePath(InputStream inputStream) throws VirtualFilesystemException {
        try(StreamingXXHash64 hash64 = hashFactory.newStreamingHash64(0)) {
            byte[] buffer = new byte[8192];
            int bytesRead = 0;

            try {
                while ((bytesRead = inputStream.read(buffer)) >= 0) {
                    hash64.update(buffer, 0, bytesRead);
                }
            } catch (IOException e) {
                throw new VirtualFilesystemException("Issue reading file from InputStream.", e);
            }

            return filePathFromHash(hash64);
        }
    }

    @Override
    public String contentHashFilePath(byte[] fileBytes) {
        StreamingXXHash64 hash64 = hashFactory.newStreamingHash64(0);
        hash64.update(fileBytes, 0 , fileBytes.length);

        return filePathFromHash(hash64);
    }

    @Override
    public VirtualFile resolveVirtualFile(final URI uri) throws VirtualFilesystemException {
        try {
            return new SimpleVirtualFile(this.fsManager.resolveFile(uri));
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue resolving file with URI: " + uri.toString(), e);
        }
    }

    @Override
    public VirtualFile resolveVirtualFile(String uri) throws VirtualFilesystemException {
        if (StringUtils.isEmpty(uri)) {
            throw new VirtualFilesystemException("Cannot resolve file with empty name.");
        }
        try {
            return new SimpleVirtualFile(this.fsManager.resolveFile(uri));
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue resolving file with URI: " + uri, e);
        }
    }

    @Override
    public VirtualFile resolveVirtualFile(InputStream inputStream, String directory) throws VirtualFilesystemException {
        try (StreamingXXHash64 hash64 = hashFactory.newStreamingHash64(0)){
            FileObject temp = this.fsManager.resolveFile(UUID.randomUUID().toString());
            byte[] buffer = new byte[8192];
            int bytesRead = 0;
            try (OutputStream out = temp.getContent().getOutputStream(true)) {
                while ((bytesRead = inputStream.read(buffer)) >= 0) {
                    hash64.update(buffer, 0, bytesRead);
                    out.write(buffer, 0, bytesRead);
                }
            } catch (IOException e) {
                throw new VirtualFilesystemException("Issue reading file from InputStream.", e);
            }
            return getFileFromHash(temp, hash64, formatDirectory(directory));
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue resolving file.", e);
        }
    }

    @Override
    public VirtualFile resolveVirtualFile(byte[] fileBytes, String directory) throws VirtualFilesystemException {
        try (StreamingXXHash64 hash64 = hashFactory.newStreamingHash64(0)){
            FileObject temp = this.fsManager.resolveFile(UUID.randomUUID().toString());

            try (OutputStream out = temp.getContent().getOutputStream()) {
                hash64.update(fileBytes, 0, fileBytes.length);
                out.write(fileBytes);
            } catch (IOException e) {
                throw new VirtualFilesystemException("Issue reading file from InputStream.", e);
            }
            return getFileFromHash(temp, hash64, formatDirectory(directory));
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue resolving file.", e);
        }
    }

    private VirtualFile getFileFromHash(FileObject tempFile, StreamingXXHash64 hash64, String directory) throws
            FileSystemException {
        FileObject hashNameFile = this.fsManager.resolveFile(directory + filePathFromHash(hash64));
        if (hashNameFile.exists()) {
            tempFile.delete();
        } else {
            hashNameFile.createFile();
            tempFile.moveTo(hashNameFile);
        }
        return new SimpleVirtualFile(hashNameFile);
    }

    private String filePathFromHash(StreamingXXHash64 hash64) {
        String hash = Long.toHexString(hash64.getValue());
        return hash.substring(0, 2) + File.separator + hash.substring(2, 4) + File.separator + hash.substring(4);
    }

    private String formatDirectory(String directory) {
        if (StringUtils.isEmpty(directory)) {
            directory = "";
        } else if (!directory.endsWith(File.separator)) {
            directory = directory + File.separator;
        }
        return directory;
    }

    @Override
    public TemporaryVirtualFile createTemporaryVirtualFile(long timeToLive, TemporalUnit timeToLiveUnit)
            throws VirtualFilesystemException {
        final VirtualFile tmpDir = resolveVirtualFile(baseTempUrlTemplate);
        return createTemporaryVirtualFile(tmpDir, timeToLive, timeToLiveUnit);
    }

    @Override
    public TemporaryVirtualFile createTemporaryVirtualFile(VirtualFile directory, long timeToLive,
                                                           TemporalUnit timeToLiveUnit)
            throws VirtualFilesystemException {
        if (timeToLive > 0) {
            if (directory.isFolder()) {
                try {
                    final String id = directory.getIdentifier();
                    final FileObject obj = this.fsManager.resolveFile(id.endsWith(File.separator) ? id : id
                            + File.separator + UUID.randomUUID() + "-" + System.currentTimeMillis());
                    final SimpleTemporaryVirtualFile tvf = new SimpleTemporaryVirtualFile(obj, timeToLive,
                            timeToLiveUnit);
                    if (tempFiles.offer(tvf)) {
                        return tvf;
                    } else {
                        throw new VirtualFilesystemException("No more temporary files can be created, already have"
                                + "max of " + this.tempFiles.size());
                    }
                } catch (FileSystemException e) {
                    throw new VirtualFilesystemException("Issue creating temporary virtual file", e);
                }
            } else {
                throw new VirtualFilesystemException("Must specify a virtual directory to write the temp file in");
            }
        } else {
            throw new VirtualFilesystemException("Must specify a positive timeToLive duration (as opposed to "
                    + timeToLive + ")");
        }
    }

    @Override
    public TemporaryVirtualFile createTemporaryVirtualFile(long timeToLive, TemporalUnit timeToLiveUnit,
                                                           long createDuration, TimeUnit createTimeUnit)
            throws VirtualFilesystemException {
        final VirtualFile tmpDir = resolveVirtualFile(baseTempUrlTemplate);
        return createTemporaryVirtualFile(tmpDir, timeToLive, timeToLiveUnit,
                createDuration, createTimeUnit);
    }

    @Override
    public TemporaryVirtualFile createTemporaryVirtualFile(VirtualFile directory, long timeToLive,
                                                           TemporalUnit timeToLiveUnit,
                                                           long createDuration, TimeUnit createTimeUnit)
            throws VirtualFilesystemException {
        if (timeToLive > 0) {
            if (directory.isFolder()) {
                try {
                    final String id = directory.getIdentifier();
                    final FileObject obj = this.fsManager.resolveFile(id.endsWith(File.separator) ? id :
                            id + File.separator + UUID.randomUUID() + "-" + System.currentTimeMillis());
                    final SimpleTemporaryVirtualFile tvf = new SimpleTemporaryVirtualFile(obj, timeToLive,
                            timeToLiveUnit);
                    if (tempFiles.offer(tvf, createDuration, createTimeUnit)) {
                        return tvf;
                    } else {
                        throw new VirtualFilesystemException("Despite waiting, no more temporary files can be created"
                                + ", already have max of " + this.tempFiles.size());
                    }
                } catch (FileSystemException | InterruptedException e) {
                    throw new VirtualFilesystemException("Issue creating temporary virtual file", e);
                }
            } else {
                throw new VirtualFilesystemException("Must specify a virtual directory to write the temp file in");
            }
        } else {
            throw new VirtualFilesystemException("Must specify a positive timeToLive duration (as opposed to "
                    + timeToLive + ")");
        }
    }

    @Override
    public VirtualFile getBaseFile() throws VirtualFilesystemException {
        try {
            return new SimpleVirtualFile(this.fsManager.getBaseFile());
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue retrieving baseFile", e);
        }
    }

    @Override
    public String getBaseFilePath() throws VirtualFilesystemException {
        try {
            return this.fsManager.getBaseFile().getPublicURIString();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue retrieving baseFile", e);
        }

    }

    @Activate
    void activate(SimpleVirtualFilesystemConfig conf) throws VirtualFilesystemException {
        try {
            this.fsManager = VFS.getManager();
            File rootDirectory = new File(conf.defaultRootDirectory());
            if (!rootDirectory.exists()) {
                rootDirectory.mkdirs();
            }
            ((DefaultFileSystemManager) this.fsManager).setBaseFile(rootDirectory);
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue initializing virtual file system.", e);
        }
        // Set of queues.
        tempFiles = new ArrayBlockingQueue<>(conf.maxNumberOfTempFiles());

        // Schedule our temp file cleanup service.
        this.scheduledExecutorService = Executors.newScheduledThreadPool(1);
        this.scheduledExecutorService.scheduleAtFixedRate(new CleanTempFilesRunnable(LOGGER, tempFiles),
                conf.secondsBetweenTempCleanup(), conf.secondsBetweenTempCleanup(), TimeUnit.SECONDS);
        LOGGER.debug("Configured scheduled cleanup of temp files to run every {} seconds",
                conf.secondsBetweenTempCleanup());

        // Set default temp url template
        this.baseTempUrlTemplate = conf.defaultTemporaryDirectory() != null ? conf.defaultTemporaryDirectory() :
                ("file://" + System.getProperty("java.io.tmpdir"));
        LOGGER.debug("Going to use {} for our base temp directory template", this.baseTempUrlTemplate);

        // Initialize HashFactory
        this.hashFactory = XXHashFactory.fastestInstance();
    }

    @Modified
    void modified(final SimpleVirtualFilesystemConfig conf) throws VirtualFilesystemException {
        deactivate();
        activate(conf);
    }

    @Deactivate
    void deactivate() {
        this.fsManager = null;
        new CleanTempFilesRunnable(LOGGER, tempFiles, true).run();
        if (this.scheduledExecutorService != null) {
            this.scheduledExecutorService.shutdownNow();
        }
        LOGGER.debug("Deactivated Basic Virtual Filesystem service");
    }
}

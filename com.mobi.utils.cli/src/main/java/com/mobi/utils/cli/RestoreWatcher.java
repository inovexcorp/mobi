package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.exception.MobiException;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Closeable;
import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Component(immediate = true)
public class RestoreWatcher {
    private static final Logger LOGGER = LoggerFactory.getLogger(RestoreWatcher.class);
    private AutoRestoreSupport autoRestore;

    @Reference
    RestoreService restoreService;

    @Activate
    public void activate() {
        try {
            autoRestore = new AutoRestoreSupport();
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Deactivate
    public void deactivate() {
        autoRestore.close();
    }

    private class AutoRestoreSupport implements Runnable, Closeable {
        private Path restoreDir = Paths.get(System.getProperty("karaf.home"), "restore");
        private Path restoreProcessedDir = Paths.get(System.getProperty("karaf.home"), "restoreProcessed");
        private boolean running;
        private ExecutorService executor;

        public AutoRestoreSupport() throws IOException {
            Files.createDirectories(restoreDir);
            Files.createDirectories(restoreProcessedDir);
            running = true;
            executor = Executors.newSingleThreadExecutor();
            executor.execute(this);
        }

        @Override
        public void close() {
            running = false;
            executor.shutdown();
            try {
                executor.awaitTermination(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                // Ignore
            }
        }

        @Override
        public void run() {
            WatchService watchService = null;
            try {
                watchService = FileSystems.getDefault().newWatchService();
                restoreDir.register(watchService, StandardWatchEventKinds.ENTRY_CREATE);

                while (running) {
                    try {
                        WatchKey key = watchService.poll(1, TimeUnit.SECONDS);
                        if (key == null) {
                            continue;
                        }
                        for (WatchEvent<?> event : key.pollEvents()) {
                            try {
                                @SuppressWarnings("unchecked")
                                WatchEvent<Path> ev = (WatchEvent<Path>) event;

                                // Context for directory entry event is the file name of entry
                                Path backup = restoreDir.resolve(ev.context());
                                if (backup.toString().endsWith(".zip")) {
                                    Path backupMoved = restoreProcessedDir.resolve(backup.getFileName());
                                    Files.move(backup, backupMoved, StandardCopyOption.REPLACE_EXISTING);
                                    if (restoreService.execute(backupMoved.toString(), 10000)) {
                                        LOGGER.info("Restore completed successfully for file: {}."
                                                        + "Stopping watcher until restart.", backupMoved);
                                        running = false;
                                        break; // Stop after processing file. RestoreService restarts all services
                                    } else {
                                        LOGGER.warn("Restore failed for file: {}", backupMoved);
                                    }
                                }
                            } catch (IOException e) {
                                LOGGER.warn("IOException processing file", e);
                            }
                        }
                        key.reset();
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }
            } catch (IOException e) {
                throw new MobiException(e);
            } finally {
                try {
                    if (watchService != null) {
                        watchService.close();
                    }
                } catch (IOException e) {
                    LOGGER.error("Error closing directory watch service");
                }
            }
        }
    }
}

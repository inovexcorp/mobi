package org.matonto.vfs.impl.commons;

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

import org.matonto.vfs.api.TemporaryVirtualFile;
import org.slf4j.Logger;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.BlockingQueue;

public class CleanTempFilesRunnable implements Runnable {

    private final Logger LOGGER;

    private final boolean destroyAll;

    private final BlockingQueue<TemporaryVirtualFile> tempFiles;

    public CleanTempFilesRunnable(Logger LOGGER, BlockingQueue<TemporaryVirtualFile> tempFiles) {
        this(LOGGER, tempFiles, false);
    }

    public CleanTempFilesRunnable(Logger LOGGER, BlockingQueue<TemporaryVirtualFile> tempFiles, boolean destroyAll) {
        this.LOGGER = LOGGER;
        this.tempFiles = tempFiles;
        this.destroyAll = destroyAll;
    }

    @Override
    public void run() {
        LOGGER.trace("Temporary file cleanup initiated!");
        final Set<TemporaryVirtualFile> delete = new HashSet<>();
        tempFiles.stream().filter(TemporaryVirtualFile::isExpired).forEach(file -> {
            if (file.isExpired()) {
                try {
                    if (destroyAll || file.delete()) {
                        delete.add(file);
                        LOGGER.debug("Deleted temporary file {}", file.getIdentifier());
                    }
                } catch (Exception e) {
                    LOGGER.error("Issue deleting temporary virtual file", e);
                }
            }
        });
        delete.forEach(tempFiles::remove);
    }
}

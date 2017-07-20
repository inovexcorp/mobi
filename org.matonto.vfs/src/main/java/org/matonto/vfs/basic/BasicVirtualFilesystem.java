package org.matonto.vfs.basic;

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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import org.apache.commons.vfs2.FileSystemException;
import org.apache.commons.vfs2.FileSystemManager;
import org.apache.commons.vfs2.VFS;
import org.matonto.vfs.api.VirtualFile;
import org.matonto.vfs.api.VirtualFilesystem;
import org.matonto.vfs.api.VirtualFilesystemException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;

/**
 * This is a basic implementation of the {@link VirtualFilesystem} backed by the commons-vfs api.
 */
@Component(name = "Basic Virtual Filesystem")
public class BasicVirtualFilesystem implements VirtualFilesystem {

    private static final Logger LOGGER = LoggerFactory.getLogger(BasicVirtualFilesystem.class);

    private FileSystemManager fsManager;


    @Override
    public VirtualFile resolveVirtualFile(final URI uri) throws VirtualFilesystemException {
        try {
            return new BasicVirtualFile(this.fsManager.resolveFile(uri));
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue resolving file with URI: " + uri.toString(), e);
        }
    }

    @Override
    public VirtualFile resolveVirtualFile(String uri) throws VirtualFilesystemException {
        try {
            return new BasicVirtualFile(this.fsManager.resolveFile(uri));
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue resolving file with URI: " + uri, e);
        }
    }

    @Activate
    void activate() throws VirtualFilesystemException {
        try {
            this.fsManager = VFS.getManager();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException("Issue initializing virtual file system.", e);
        }
        LOGGER.debug("Initialized Basic Virtual Filesystem service");
    }

    @Deactivate
    void deactivate() {
        this.fsManager = null;
        LOGGER.debug("Deactivated Basic Virtual Filesystem service");
    }
}

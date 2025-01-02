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

import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystemException;
import org.apache.commons.vfs2.FileObject;
import org.apache.commons.vfs2.FileSystemException;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * This is a basic implementation of the {@link VirtualFile} interface backed by the commons-vfs implementation.
 */
public class SimpleVirtualFile implements VirtualFile {

    private final FileObject file;

    SimpleVirtualFile(final FileObject file) {
        this.file = file;
    }

    @Override
    public boolean exists() throws VirtualFilesystemException {
        try {
            return this.file.exists();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public boolean isFile() throws VirtualFilesystemException {
        try {
            return this.file.isFile();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public String getIdentifier() {
        return this.file.getPublicURIString();
    }

    @Override
    public URL getUrl() throws VirtualFilesystemException {
        try {
            return this.file.getURL();
        } catch (Exception e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public InputStream readContent() throws VirtualFilesystemException {
        try {
            return this.file.getContent().getInputStream();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public OutputStream writeContent() throws VirtualFilesystemException {
        try {
            return this.file.getContent().getOutputStream();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public OutputStream writeContent(boolean append) throws VirtualFilesystemException {
        try {
            return this.file.getContent().getOutputStream(append);
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public void writeToContent(byte[] fileBytes) throws VirtualFilesystemException {
        try (OutputStream os = this.writeContent()) {
            os.write(fileBytes);
        } catch (IOException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public void writeToContent(InputStream inputStream) throws VirtualFilesystemException {
        byte[] buffer = new byte[8192];
        int bytesRead = 0;
        try (OutputStream os = this.writeContent(true)) {
            while ((bytesRead = inputStream.read(buffer)) >= 0) {
                os.write(buffer, 0, bytesRead);
            }
        } catch (IOException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public boolean isFolder() throws VirtualFilesystemException {
        try {
            return this.file.isFolder();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public Stream<VirtualFile> streamChildren() throws VirtualFilesystemException {
        return getChildren().stream();
    }

    @Override
    public boolean delete() throws VirtualFilesystemException {
        try {
            return this.file.delete();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public int deleteAll() throws VirtualFilesystemException {
        try {
            return this.file.deleteAll();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public void create() throws VirtualFilesystemException {
        try {
            this.file.createFile();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public void createFolder() throws VirtualFilesystemException {
        try {
            this.file.createFolder();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public void close() throws VirtualFilesystemException {
        try {
            this.file.close();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public long getSize() throws VirtualFilesystemException {
        try {
            return this.file.getContent().getSize();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public long getLastModifiedTime() throws VirtualFilesystemException {
        try {
            return this.file.getContent().getLastModifiedTime();
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }

    @Override
    public Collection<VirtualFile> getChildren() throws VirtualFilesystemException {
        try {
            final FileObject[] children = this.file.getChildren();
            return (children != null ?
                    // Return translated list.
                    Arrays.stream(children)
                            // Convert to SimpleVirtualFile.
                            .map(SimpleVirtualFile::new)
                            // Collect into a list.
                            .collect(Collectors.toList())
                    // Else an empty list.
                    : Collections.EMPTY_LIST);
        } catch (FileSystemException e) {
            throw new VirtualFilesystemException(e);
        }
    }
}

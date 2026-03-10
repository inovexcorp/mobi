package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import org.apache.commons.io.IOUtils;
import org.apache.commons.io.output.DeferredFileOutputStream;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * An {@link InputStream} wrapper that buffers its source into memory or a temporary file,
 * allowing the stream to be read multiple times via {@link #reset()}.
 *
 * <p>On construction the entire source stream is consumed and buffered using a
 * {@link DeferredFileOutputStream} with a 10 MB in-memory threshold:
 * <ul>
 *   <li>If the data is &le; 10 MB it is held in a byte array in memory.</li>
 *   <li>If the data exceeds 10 MB it is spilled to a temporary file
 *       ({@code mobi-upload*.tmp}) in the default temp directory.</li>
 * </ul>
 *
 * <p><strong>Resetting:</strong> Call {@link #reset()} at any point to rewind the stream
 * back to the beginning for another read pass. Each call reopens the underlying source
 * (in-memory byte array or temp file).
 *
 * <p><strong>Mark support:</strong> {@link #markSupported()} returns {@code true}.
 * {@link #mark(int)} is only meaningful when the data is in memory; for file-backed
 * streams use {@link #reset()} to rewind to the start instead.
 *
 * <p><strong>Resource cleanup:</strong> Always close this stream when done. {@link #close()}
 * deletes the backing temporary file (if one was created) and releases the underlying stream.
 * Failure to close will leak the temp file on disk.
 *
 * <p><strong>Typical usage:</strong>
 * <pre>{@code
 * try (ResettableInputStream ris = new ResettableInputStream(httpInputStream)) {
 *     parseRdf(ris);   // first pass
 *     ris.reset();
 *     validateRdf(ris); // second pass
 * }
 * }</pre>
 *
 * <p><strong>Large-file caution:</strong> For very large uploads this class buffers the entire
 * payload before processing begins. If only a single read pass is needed, prefer streaming
 * directly from the source {@link InputStream} to avoid the memory/disk overhead.
 */
public class ResettableInputStream extends InputStream {

    private final DeferredFileOutputStream dfos;
    private InputStream currentStream;
    private File tempFile;

    /**
     * Constructs a {@code ResettableInputStream} by fully reading {@code source} into a buffer.
     *
     * @param source the upstream {@link InputStream} to buffer; it is fully consumed but
     *               not closed by this constructor
     * @throws IOException if an I/O error occurs while copying the source data
     */
    public ResettableInputStream(InputStream source) throws IOException {
        // Threshold: 10 MB
        this.dfos = new DeferredFileOutputStream(10 * 1024 * 1024, "mobi-upload", ".tmp", null);
        try {
            IOUtils.copy(source, dfos);
        } finally {
            dfos.close();
        }

        if (dfos.isInMemory()) {
            currentStream = dfos.toInputStream();
        } else {
            tempFile = dfos.getFile();
            currentStream = new FileInputStream(tempFile);
        }
    }

    @Override
    public int read() throws IOException {
        return currentStream.read();
    }

    @Override
    public int read(byte[] b, int off, int len) throws IOException {
        return currentStream.read(b, off, len);
    }

    /**
     * Closes the current stream and deletes the backing temporary file, if one exists.
     *
     * @throws IOException if an I/O error occurs while closing the stream
     */
    @Override
    public void close() throws IOException {
        currentStream.close();
        if (tempFile != null && tempFile.exists()) {
            tempFile.delete();
        }
    }

    /**
     * Rewinds the stream to the beginning so it can be read again from the start.
     * For file-backed streams this reopens the temporary file; for in-memory streams
     * it replaces the current stream with a fresh view of the buffered byte array.
     *
     * @throws IOException if an I/O error occurs while reopening the stream
     */
    @Override
    public synchronized void reset() throws IOException {
        currentStream.close();
        if (dfos.isInMemory()) {
            currentStream = dfos.toInputStream();
        } else {
            currentStream = new FileInputStream(tempFile);
        }
    }

    /** @return {@code true} always, since this stream supports {@link #reset()} */
    @Override
    public boolean markSupported() {
        return true;
    }

    /**
     * Marks the current position in the stream. Only effective when data is held in memory;
     * for file-backed streams, use {@link #reset()} to return to the start.
     *
     * @param readlimit the maximum number of bytes that can be read before the mark becomes invalid
     *                  (only relevant for in-memory streams)
     */
    @Override
    public void mark(int readlimit) {
        if (dfos.isInMemory()) {
            currentStream.mark(readlimit);
        }
    }
}

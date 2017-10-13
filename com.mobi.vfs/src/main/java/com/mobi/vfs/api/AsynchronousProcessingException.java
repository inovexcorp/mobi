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

/**
 * This is a simple {@link Exception} class that represents an issue that occurs during the asynchronous
 * processing of the children of a folder.
 */
public class AsynchronousProcessingException extends VirtualFilesystemException {

    /**
     * The identifier of the file that caused an issue.
     */
    private final String identifier;

    /**
     * Constructor for the {@link AsynchronousProcessingException}
     * @param msg The message to associate with this exception
     * @param identifier The ID of the folder {@link VirtualFile} that failed
     */
    public AsynchronousProcessingException(final String msg, final String identifier) {
        super(msg);
        this.identifier = identifier;
    }

    /**
     *
     * @return The ID of the {@link VirtualFile} that failed
     */
    public String getIdentifier() {
        return identifier;
    }
}

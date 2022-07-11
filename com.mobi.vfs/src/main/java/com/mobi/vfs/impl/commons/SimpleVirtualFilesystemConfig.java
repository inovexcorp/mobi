package com.mobi.vfs.impl.commons;

/*-
 * #%L
 * com.mobi.vfs
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * Configuration for the Virtual File System.
 */
@ObjectClassDefinition
public @interface SimpleVirtualFilesystemConfig {

    /**
     * The threshold for how often to clean up temporary files in the VFS.
     *
     * @return the number of seconds between when temporary files are cleaned up in the VFS.
     */
    @AttributeDefinition(defaultValue = "60000")
    long secondsBetweenTempCleanup() default 60000;

    /**
     * The maximum number of temporary files in the VFS.
     *
     * @return the maximum number of temporary files in the VFS
     */
    @AttributeDefinition(defaultValue = "10000")
    int maxNumberOfTempFiles() default 10000;

    /**
     * The default directory for temporary files.
     *
     * @return the default directory for temporary files.
     */
    @AttributeDefinition(required = false)
    String defaultTemporaryDirectory();

    /**
     * The absolute path to the root directory
     */
    @AttributeDefinition(defaultValue = "${karaf.data}/vfs")
    String defaultRootDirectory() default "${karaf.data}/vfs";

}

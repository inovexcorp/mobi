package com.mobi.repository.impl.sesame.nativestore;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * Configuration for on-disk, indexed Repository objects. It uses B-Trees for indexing statements, where
 * the index key consists of four fields: subject (s), predicate (p), object (o) and context (c). The order
 * in which each of these fields is used in the key determines the usability of an index on a specify statement
 * query pattern: searching statements with a specific subject in an index that has the subject as the first
 * field is significantly faster than searching these same statements in an index where the subject field is
 * second or third. In the worst case, the 'wrong' statement pattern will result in a sequential scan over
 * the entire set of statements.
 *
 * The native store automatically creates/drops indexes upon (re)initialization, so the parameter can be
 * adjusted and upon the first refresh of the configuration the native store will change its indexing strategy,
 * without loss of data.
 */
@ObjectClassDefinition(name = "NativeRepositoryConfig", description = "Configuration for a Native Repository")
public @interface NativeRepositoryConfig {

    /**
     * The Repository ID.
     *
     * @return String representing the Repository ID.
     */
    @AttributeDefinition(name = "id", description = "The ID of the Repository")
    String id();

    /**
     * The Repository Title.
     *
     * @return String representing the Repository Title.
     */
    @AttributeDefinition(name = "title", description = "The Title of the Repository")
    String title();

    /**
     * The data directory where the repository data is stored. NOTE: This is an optional property as some repositories
     * do not store data in a single directory.
     *
     * @return String representing the directory where the repository data is stored, if applicable.
     */
    @AttributeDefinition(name = "dataDir", description = "The directory of the Repository")
    String dataDir();

    /**
     * The triple indexes for the native store. Default value is: "spoc,posc".
     *
     * @return The Set of String representing triple indexes.
     */
    @AttributeDefinition(required = false, name = "tripleIndexes",
            description = "The list of indexes for the Repository")
    String tripleIndexes() default "spoc,posc";

}

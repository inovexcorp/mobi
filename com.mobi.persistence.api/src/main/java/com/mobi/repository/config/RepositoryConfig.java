package com.mobi.repository.config;

/*-
 * #%L
 * com.mobi.persistence.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.metatype.Meta;

/**
 * Base configuration for Repository Objects.
 */
@Meta.OCD
public interface RepositoryConfig {

    /**
     * The Repository ID
     *
     * @return String representing the Repository ID
     */
    String id();

    /**
     * The Repository Title
     *
     * @return String representing the Repository Title
     */
    String title();

    /**
     * The data directory where the repository data is stored. NOTE: This is
     * an optional property as some repositories do not store data in a single
     * directory.
     *
     * @return String representing the directory where the repository data is
     * stored, if applicable.
     */
    @Meta.AD(required = false)
    String dataDir();
}

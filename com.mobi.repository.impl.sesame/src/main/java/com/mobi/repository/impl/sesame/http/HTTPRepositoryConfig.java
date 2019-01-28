package com.mobi.repository.impl.sesame.http;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import com.mobi.repository.config.RepositoryConfig;

/**
 * Configuration for Repository objects accessed through an HTTP endpoint. The instance must be
 * initialized prior to using it.
 */
public interface HTTPRepositoryConfig extends RepositoryConfig {

    /**
     * The HTTP server URL.
     *
     * @return The String representing the HTTP server URL.
     */
    @Meta.AD
    String serverUrl();
}

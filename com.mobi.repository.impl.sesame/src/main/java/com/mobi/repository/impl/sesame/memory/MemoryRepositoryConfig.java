package com.mobi.repository.impl.sesame.memory;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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
import com.mobi.repository.config.RepositoryConfig;

/**
 * Configuration for in-memory Repository Objects
 */
public interface MemoryRepositoryConfig extends RepositoryConfig {

    /**
     * The syncDelay for write-backs to disk. This is an optional property
     * used in conjunction with dataDir.
     *
     * @return The long representing the syncDelay
     */
    @Meta.AD(required = false)
    long syncDelay();
}

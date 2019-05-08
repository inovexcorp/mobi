package com.mobi.jaas.modules.token;

/*-
 * #%L
 * com.mobi.jaas
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

@Meta.OCD
public interface SimpleTokenLoginModuleConfig {

    /**
     * The name of the {@link com.mobi.jaas.api.engines.Engine} to be used for the
     * {@link com.mobi.jaas.api.modules.token.SimpleTokenLoginModule}.
     *
     * @return The {@link Class#getName() name} of an {@link com.mobi.jaas.api.engines.Engine}
     */
    @Meta.AD(required = false)
    String engineName();
}

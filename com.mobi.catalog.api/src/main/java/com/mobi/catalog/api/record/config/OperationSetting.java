package com.mobi.catalog.api.record.config;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import java.io.Serializable;

public interface OperationSetting<T> extends Serializable {


    /**
     * Gets the String representation of a key that identifies a configuration setting.
     *
     * @return The key of a configuration setting
     */
    String getKey();

    /**
     * Gets the String description of a configuration setting.
     *
     * @return The description of a configuration setting
     */
    String getDescription();

    /**
     * Gets the default value of a configuration setting.
     *
     * @return The default value of a setting
     */
    T getDefaultValue();
}

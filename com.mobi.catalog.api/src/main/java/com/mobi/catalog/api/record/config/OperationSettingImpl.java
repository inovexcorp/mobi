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

public class OperationSettingImpl<T> implements OperationSetting<T> {

    private final String key;
    private final String description;
    private final T defaultValue;

    /**
     * Creates an OperationSettingImpl that represents a configuration setting with a key, description, and value.
     *
     * @param key Unique key to identify the setting
     * @param description A brief description of the setting
     * @param defaultValue A default value to initialize a setting to
     */
    public OperationSettingImpl(String key, String description, T defaultValue) {
        if (key == null) {
            throw new NullPointerException("Setting key cannot be null");
        } else if (description == null) {
            throw new NullPointerException("Setting description cannot be null");
        } else {
            this.key = key;
            this.description = description;
            this.defaultValue = defaultValue;
        }
    }

    public String getKey() {
        return this.key;
    }

    public String getDescription() {
        return this.description;
    }

    public T getDefaultValue() {
        return this.defaultValue;
    }
}

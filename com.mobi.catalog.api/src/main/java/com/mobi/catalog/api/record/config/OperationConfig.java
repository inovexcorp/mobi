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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class OperationConfig implements RecordOperationConfig {

    private static final long serialVersionUID = -3749564958548504905L;

    protected final ConcurrentMap<OperationSetting<Object>, Object> settings = new ConcurrentHashMap<>();
    protected final Logger log = LoggerFactory.getLogger(this.getClass());

    public OperationConfig() {
        super();
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T get(OperationSetting<T> setting) {
        Object result = settings.get(setting);

        if (result == null) {
            return setting.getDefaultValue();
        }

        return (T)result;
    }

    @Override
    public <T> boolean isSet(OperationSetting<T> setting) {
        return settings.containsKey(setting);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> RecordOperationConfig set(OperationSetting<T> setting, T value) {
        if (value == null) {
            settings.remove(setting);
        }
        else {
            Object putIfAbsent = settings.putIfAbsent((OperationSetting<Object>)setting, value);

            if (putIfAbsent != null) {
                // override the previous setting anyway, putIfAbsent just gives us
                // information about whether it was previously set or not
                settings.put((OperationSetting<Object>)setting, value);

                // this.log.trace("Overriding previous setting for {}",
                // setting.getKey());
            }
        }

        return this;
    }

    @Override
    public RecordOperationConfig useDefaults() {
        settings.clear();

        return this;
    }
}

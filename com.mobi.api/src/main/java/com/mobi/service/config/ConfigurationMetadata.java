package com.mobi.service.config;

/*-
 * #%L
 * com.mobi.api
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

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

/**
 * This annotation is used to define metadata for configuration properties. It is typically applied
 * to fields or methods that represent configuration options in an application. The annotation provides
 * additional information such as the name, description, type, whether the configuration is required,
 * and whether it should be masked (for sensitive information).
 *
 * @see java.lang.annotation.RetentionPolicy#RUNTIME
 */
@Retention(RetentionPolicy.RUNTIME)
public @interface ConfigurationMetadata {
    String name();
    String description();
    TypeReturn type();
    boolean required();
    boolean masked();
}

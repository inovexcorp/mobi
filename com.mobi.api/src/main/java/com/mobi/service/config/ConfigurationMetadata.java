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

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * This annotation is used to define metadata for configuration properties. It is typically applied
 * to fields or methods that represent configuration options in an application. The annotation provides
 * additional information such as the name, description, type, whether the configuration is required,
 * and whether it should be masked (for sensitive information).
 *
 * @see java.lang.annotation.RetentionPolicy#RUNTIME
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ConfigurationMetadata {
    /**
     * The name of the configuration property.
     *
     * @return the name of the configuration property.
     */
    String name();

    /**
     * A description of the configuration property.
     *
     * @return a human-readable description of the property.
     */
    String description();

    /**
     * The data type of the configuration property.
     *
     * @return the type of the property as a {@link TypeReturn} value.
     */
    TypeReturn type();

    /**
     * Indicates whether the configuration property is required.
     * Defaults to {@code false}.
     *
     * @return {@code true} if the property is required, {@code false} otherwise.
     */
    boolean required() default false;

    /**
     * Indicates whether the value of the configuration property should be masked
     * (e.g., for sensitive values like passwords).
     * Defaults to {@code false}.
     *
     * @return {@code true} if the property should be masked, {@code false} otherwise.
     */
    boolean masked() default false;

    /**
     * Indicates whether the configuration property is read-only.
     * Defaults to {@code false}.
     *
     * @return {@code true} if the property is read-only, {@code false} otherwise.
     */
    boolean readonly() default false;

    /**
     * Indicates whether the configuration property should be hidden from Rest endpoints.
     * Defaults to {@code false}.
     *
     * @return {@code true} if the property should be hidden, {@code false} otherwise.
     */
    boolean hidden() default false;

    /**
     * The order in which the configuration property should be displayed.
     * Lower values indicate higher priority. Defaults to 99.
     *
     * @return the order of the property.
     */
    int order() default 99;
}

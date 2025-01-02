package com.mobi.rest.security.annotations;

/*-
 * #%L
 * com.mobi.rest.security
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
 * An annotation to set a custom value for the Resource ID of a REST endpoint request. If
 * the annotation is not set, the Resource ID is assumed to be the REST endpoint path itself.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ResourceId {

    /**
     * The {@link ValueType type} of data provided for the Resource ID.
     */
    ValueType type() default ValueType.PRIMITIVE;

    /**
     * String representing the ID of the Resource of a request. If the type is {@link ValueType#PATH}, this will be
     * the {@link javax.ws.rs.PathParam} id. If the type is {@link ValueType#QUERY}, this will be the
     * {@link javax.ws.rs.QueryParam} id. If the type is {@link ValueType#BODY}, this will be the
     * {@link javax.ws.rs.FormParam} id. If the type is a {@link ValueType#PROP_PATH},
     * this will be the property path string.
     */
    String value();

    /**
     * The starting point for a {@link ValueType#PROP_PATH} type. Should be a single value, the array is simply to have
     * a default. Should also result in an IRI so the SPARQL query works. This value will be ignored for any other
     * ValueType.
     */
    Value[] start() default {};

    /**
     * A default value that can be provided for a Resource ID to be used if the value of
     * the Resource ID cannot be resolved given the Query Parameters, Path Parameters,
     * Form Data Parameters, or Property Path. If needed, it will be converted to a Resource ID
     * and thus contains all the same methods as ResourceId except defaultValue.
     */
    DefaultResourceId[] defaultValue() default {};
}

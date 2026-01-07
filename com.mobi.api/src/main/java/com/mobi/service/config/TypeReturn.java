package com.mobi.service.config;

/*-
 * #%L
 * com.mobi.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

/**
 * Enum representing the possible return types for configuration values.
 * The {@link TypeReturn} enum defines four types:
 * <ul>
 *   <li>{@link #ENUM} - Represents a ENUM value.</li>
 *   <li>{@link #STRING} - Represents a string value.</li>
 *   <li>{@link #BOOLEAN} - Represents a boolean value.</li>
 *   <li>{@link #NUMBER} - Represents a numeric value.</li>
 *   <li>{@link #NONE} - Represents an unspecified or unsupported type.</li>
 * </ul>
 * Use to convert configuration class fields into data type use to compare with JSON data types
 */
public enum TypeReturn {
    ENUM,
    STRING,
    BOOLEAN,
    NUMBER,
    NONE;

    /**
     * Determines the {@link TypeReturn} based on the provided {@link Class} type.
     * This method inspects the given {@code returnType} and returns the corresponding {@link TypeReturn}
     * value based on whether the class represents a string, boolean, or number type.
     * If the class does not match any of these types, {@link TypeReturn#NONE} is returned.
     *
     * @param returnType {@link Class} type for which to determine the corresponding {@link TypeReturn}.
     *
     * @return {@link TypeReturn} value that corresponds to the provided class type.
     */
    public static TypeReturn getTypeReturn(Class<?> returnType) {
        boolean isEnum = returnType.isEnum();
        boolean isStringType = String.class.isAssignableFrom(returnType);
        boolean isBooleanType = Boolean.class.isAssignableFrom(returnType)
                || boolean.class.isAssignableFrom(returnType);
        boolean isNumber = Number.class.isAssignableFrom(returnType)
                || long.class.isAssignableFrom(returnType)
                || int.class.isAssignableFrom(returnType);
        if (isEnum) {
            return TypeReturn.ENUM;
        } else if (isStringType) {
            return TypeReturn.STRING;
        } else if (isBooleanType) {
            return TypeReturn.BOOLEAN;
        } else if (isNumber) {
            return TypeReturn.NUMBER;
        }
        return TypeReturn.NONE;
    }
}


package com.mobi.analytic.api.jaxb;

/*-
 * #%L
 * com.mobi.analytic.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.exception.MobiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Field;
import javax.xml.bind.annotation.XmlElement;

public class JaxbValidator {
    private static final Logger LOG = LoggerFactory.getLogger(JaxbValidator.class);

    public static class ValidationException extends MobiException {
        public ValidationException(String message, Throwable cause) {
            super(message, cause);
        }
        public ValidationException(String message) {
            super(message);
        }
    }

    /**
     * Enforce 'required' attributes.
     */
    public static <T> void validateRequired(T target, Class<T> targetClass) throws ValidationException {
        StringBuilder errors = new StringBuilder();
        Field[] fields = targetClass.getDeclaredFields();
        for (Field field : fields) {
            XmlElement annotation = field.getAnnotation(XmlElement.class);
            if (annotation != null && annotation.required()) {
                try {
                    field.setAccessible(true);
                    if (field.get(target) == null) {
                        if (errors.length() != 0) {
                            errors.append(" ");
                        }
                        String message = String.format("%s: required field '%s' is null.", targetClass.getSimpleName(),
                                field.getName());
                        LOG.error(message);
                        errors.append(message);
                    }
                } catch (IllegalArgumentException | IllegalAccessException e) {
                    LOG.error(field.getName(), e);
                }
            }
        }
        if (errors.length() != 0) {
            throw new ValidationException(errors.toString());
        }
    }
}

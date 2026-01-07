package com.mobi.repository.impl.sesame;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

import com.mobi.repository.exception.RepositoryConfigException;
import org.apache.commons.validator.routines.UrlValidator;

import java.util.Arrays;

public class RepositoryConfigHelper {

    /**
     * Validates the base parameters of an OSGi Repository configuration.
     *
     * @param id The ID of the repository.
     * @param title The title of the repository.
     */
    public static void validateBaseParams(String id, String title) {
        if ("".equals(id) || id == null) {
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'id' cannot be empty.")
            );
        }
        if ("".equals(title) || title == null) {
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'title' cannot be empty.")
            );
        }
    }

    /**
     * Validates the triple indexes set for the repository.
     *
     * @param indexes A string of comma separated triple indexes.
     */
    public static void validateIndexes(String indexes) {
        Arrays.asList(indexes.split(",")).forEach(index -> {
            // Make sure String matches index regex
            if (!index.matches("^(?!.*s.*s)(?!.*p.*p)(?!.*o.*o)(?!.*c.*c)[spoc]{4}$")) {
                throw new RepositoryConfigException(new IllegalArgumentException("Invalid Triple Index"));
            }
        });
    }

    /**
     * Validates a URL against HTTP and HTTPS schemes. Allows local URLs.
     *
     * @param url The URL to validate.
     * @param fieldName The name of the URL field.
     */
    public static void validateUrl(String url, String fieldName) {
        String[] schemes = {"http","https"};
        UrlValidator urlValidator = new UrlValidator(schemes, UrlValidator.ALLOW_LOCAL_URLS);
        if (!urlValidator.isValid(url)) {
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository " + fieldName + " is not a valid URL: " + url)
            );
        }
    }
}

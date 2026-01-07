package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import java.util.regex.Pattern;

public class IRIUtils {
    private static final Pattern UUID_PATTERN = Pattern.compile("^[0-9a-fA-F]{8}"
            + "-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    /**
     * Gets the "beautified" IRI representation for the IRI passed. Returns the modified IRI Label.
     *
     * @param iri The IRI string that you want to beautify.
     * @return The beautified IRI Label string.
     */
    public static String getBeautifulIRILabel(String iri) {
        if (iri == null) {
            return "";
        }
        if (iri.trim().length() <= 2) {
            return iri.trim();
        }
        int hash = iri.indexOf('#');
        int slash = iri.lastIndexOf('/');
        int colon = iri.lastIndexOf(':');
        int index = Math.max(hash, Math.max(slash, colon));
        String splitEnd = iri.substring(index + 1);

        if (UUID_PATTERN.matcher(splitEnd).matches()) {
            return splitEnd.trim();
        } else {
            String replacedString = splitEnd
                    // Insert a space between lower & upper case letters
                    .replaceAll("([a-z])([A-Z])", "$1 $2")
                    // Insert a space after numbers (but not if it's the end of the string)
                    .replaceAll("([0-9]+)(?!$)", "$1 ")
                    // Insert a space before numbers that follow letters
                    .replaceAll("([a-zA-Z])([0-9]+)", "$1 $2")
                    // Space before the last upper in a sequence followed by lower case
                    .replaceAll("\\b([A-Z]+)([A-Z])([a-z])", "$1 $2$3");
            // Uppercase the first character
            return (replacedString.substring(0, 1).toUpperCase() + replacedString.substring(1)).trim();
        }
    }
}

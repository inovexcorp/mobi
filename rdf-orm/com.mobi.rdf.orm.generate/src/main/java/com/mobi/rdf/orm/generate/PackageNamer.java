package com.mobi.rdf.orm.generate;

/*-
 * #%L
 * rdf.orm.generate
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.apache.commons.lang3.StringUtils;

import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * This is a simple class for the conversion of IRI string values into package
 * names.
 *
 * @author bdgould
 */
public class PackageNamer {

    /**
     * Pattern we'll use to extract the necessary information.
     */
    private static Pattern PATTERN = Pattern.compile("^([^:]+)[:](?://)?((?:[^/]+\\.?)+)(.*+)$");

    /**
     * Convert the IRI string into a package name.
     *
     * @param uriString The provided IRI string
     * @return The {@link String} package name
     * @throws MalformedURLException If the IRI is malformed, doesn't match our pattern
     */
    public static String packageFromUrl(final String uriString) throws MalformedURLException {
        final java.util.regex.Matcher m = PATTERN.matcher(uriString);
        if (m.matches()) {
            List<String> elements = removeEmptyElements(Arrays.asList(m.group(2).split("[\\.|/]")), true);
            elements.addAll(removeEmptyElements(Arrays.asList(m.group(3).split("[\\.|/]")), false));
            elements = packageNameCleanup(elements);
            return StringUtils.join(elements, ".");
        } else {
            throw new MalformedURLException("Illegal IRI for ontology: " + uriString);
        }
    }

    /**
     * Protect package name elements by putting a '_' in front of numerics.
     *
     * @param elements The {@link List} of current package name elements
     * @return The updated {@link List} of package name elements
     */
    private static List<String> packageNameCleanup(List<String> elements) {
        final List<String> val = new ArrayList<>(elements.size());
        elements.stream().forEach(element -> {
            if (Pattern.matches("^\\d.*$", element)) {
                val.add("_" + element.toLowerCase());
            } else {
                val.add(element.toLowerCase());
            }
        });
        return val;
    }

    /**
     * Simple method to remove empty elements from a {@link List} of
     * {@link String}s.
     *
     * @param coll    The input list of {@link String}s with potential empty values
     * @param reverse Whether or not to reverse the order of the provided elements
     * @return The updated/new list of {@link String}s
     */
    private static List<String> removeEmptyElements(final List<String> coll, boolean reverse) {
        final List<String> list = new ArrayList<>(coll.size());
        coll.forEach(val -> {
            if (!StringUtils.isEmpty(val)) {
                if (reverse) {
                    list.add(0, val);
                } else {
                    list.add(val);
                }
            }
        });
        return list;
    }

}

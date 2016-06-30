package org.matonto.rdf.api;

/*-
 * #%L
 * org.matonto.persistence.api
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

/**
 * An Internationalized Resource Identifier (IRI). IRIs may contain characters from the Universal Character Set
 * (Unicode/ISO 10646), including Chinese or Japanese kanji, Korean, Cyrillic characters, and so forth. It is defined
 * by RFC 3987.
 *
 *  An IRI can be split into a namespace part and a local name part, which are derived from an IRI string by splitting
 *  it in two using the following algorithm:
 *
 *  <ul>
 *     <li>Split after the first occurrence of the '#' character,</li>
 *     <li>If this fails, split after the last occurrence of the '/' character,</li>
 *     <li>If this fails, split after the last occurrence of the ':' character.</li>
 *  </ul>
 *
 *  The last step should never fail as every legal (full) IRI contains at least one ':' character to separate the
 *  scheme from the rest of the IRI. The implementation should check this upon object creation.
 */
public interface IRI extends Resource {

    /**
     * Compares a IRI object to another object.
     *
     * @param object - The object to compare this IRI to.
     * @return true if the other object is an instance of IRI and their String-representations are equal, false
     * otherwise.
     */
    boolean equals(Object object);

    /**
     * Gets the local name part of this IRI. The local name is defined as per the algorithm described in the class
     * documentation.
     *
     * @return The IRI's local name.
     */
    String getLocalName();

    /**
     * Gets the namespace part of this IRI. The namespace is defined as per the algorithm described in the class
     * documentation.
     *
     * @return The IRI's namespace.
     */
    String getNamespace();

    /**
     * The hash code of an IRI is defined as the hash code of its String-representation: toString().hashCode.
     *
     * @return A hash code for the IRI.
     */
    int hashCode();

    /**
     * Returns the String-representation of this IRI.
     *
     * @return The String-representation of this IRI.
     */
    String toString();
}

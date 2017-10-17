package com.mobi.rdf.api;

/*-
 * #%L
 * com.mobi.persistence.api
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
 * A namespace, consisting of a namespace name and a prefix that has been assigned to it.
 */
public interface Namespace {

    /**
     * Gets the name of the current namespace (i.e. its IRI).
     *
     * @return name of namespace
     */
    String getName();

    /**
     * Gets the prefix of the current namespace. The default namespace is represented by an empty prefix string.
     *
     * @return prefix of namespace, or an empty string in case of the default namespace
     */
    String getPrefix();
}

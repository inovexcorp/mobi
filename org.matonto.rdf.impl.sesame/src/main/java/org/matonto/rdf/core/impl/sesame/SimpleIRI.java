package org.matonto.rdf.core.impl.sesame;

/*-
 * #%L
 * org.matonto.rdf.impl.sesame
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

import org.matonto.rdf.api.IRI;

public class SimpleIRI extends org.openrdf.model.impl.SimpleIRI implements IRI {
    private static final long serialVersionUID = 2569239388718344294L;

    protected SimpleIRI() {
    }

    /**
     * Creates a new IRI from the supplied string.
     *
     * Note that creating SimpleIRI objects directly via this constructor is not the recommended approach. Instead,
     * use a ValueFactory (obtained from your repository or by using SimpleValueFactory.getInstance()) to create new
     * IRI objects.
     *
     * @param iriString - A String representing a valid, absolute IRI. May not be null.
     * @throws IllegalArgumentException - If the supplied IRI is not a valid (absolute) IRI.
     */
    public SimpleIRI(String iriString) {
        super(iriString);
    }
}

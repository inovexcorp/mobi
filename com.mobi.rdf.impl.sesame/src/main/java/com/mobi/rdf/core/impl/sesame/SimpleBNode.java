package com.mobi.rdf.core.impl.sesame;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
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

import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.BNode;

/**
 * An simple default implementation of the BNode interface.
 */
public class SimpleBNode extends org.openrdf.model.impl.SimpleBNode implements BNode {
    private static final long serialVersionUID = -3536371650881494322L;

    protected SimpleBNode() {
        super();
    }

    /**
     * Creates a new blank node with the supplied identifier.
     *
     * @param id - The identifier for this blank node, must not be null.
     */
    public SimpleBNode(String id) {
        super(id);
    }

    @Override
    public String toString() {
        return stringValue();
    }
}

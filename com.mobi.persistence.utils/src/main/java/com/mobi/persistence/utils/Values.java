package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

@Component(provide = Values.class)
public class Values {

    private ValueFactory valueFactory;

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    public Resource getIriOrBnode(String resourceString) {
        if (resourceString.trim().matches("^_:.*$")) {
            return valueFactory.createBNode(resourceString.trim());
        } else {
            return valueFactory.createIRI(resourceString.trim());
        }
    }
}

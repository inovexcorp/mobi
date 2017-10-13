package com.mobi.ontology.core.impl.owlapi.change;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
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

import com.mobi.ontology.core.api.OWLObject;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.change.OntologyAddition;

public class SimpleOntologyAddition<T extends OWLObject> implements OntologyAddition<T> {

    private Ontology ontology;
    private T object;

    public SimpleOntologyAddition(Ontology ontology, T object) {
        this.ontology = ontology;
        this.object = object;
    }

    @Override
    public T getChangedObject() {
        return object;
    }
}

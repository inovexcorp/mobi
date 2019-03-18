package com.mobi.ontology.core.impl.owlapi;

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

import com.mobi.ontology.core.api.AnnotationProperty;
import com.mobi.rdf.api.IRI;

import javax.annotation.Nonnull;


public class SimpleAnnotationProperty implements AnnotationProperty {

    private IRI iri;

    public SimpleAnnotationProperty(@Nonnull IRI iri) {
        this.iri = iri;
    }
        
    @Override
    public IRI getIRI() {
        return iri;
    }
    
    @Override
    public String toString() {
        return iri.toString();
    }
    
    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }

        if (obj instanceof SimpleAnnotationProperty) {
            SimpleAnnotationProperty other = (SimpleAnnotationProperty) obj;
            return iri.equals(other.getIRI());
        }
        
        return false;
    }
    
}

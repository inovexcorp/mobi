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

import com.mobi.ontology.core.api.FacetRestriction;
import com.mobi.ontology.core.api.types.Facet;
import com.mobi.rdf.api.Literal;

import javax.annotation.Nonnull;


public class SimpleFacetRestriction implements FacetRestriction {


    private Facet facet;
    private Literal facetValue;


    public SimpleFacetRestriction(@Nonnull Facet facet, @Nonnull Literal facetValue) {
        this.facet = facet;
        this.facetValue = facetValue;
    }


    @Override
    public Facet getFacet() {
        return facet;
    }


    @Override
    public Literal getFacetValue() {
        return facetValue;
    }


    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if ((obj instanceof FacetRestriction)) {
            FacetRestriction other = (FacetRestriction) obj;
            return ((getFacet().equals(other.getFacet())) && (getFacetValue().equals(other.getFacetValue())));
        }
        return false;
    }

}

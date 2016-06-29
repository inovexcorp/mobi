package org.matonto.ontology.core.api.types;

/*-
 * #%L
 * org.matonto.ontology.api
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

import aQute.bnd.annotation.component.Reference;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;

import javax.annotation.Nonnull;

public enum DataRangeType {

    DATATYPE("Datatype"),
    DATA_ONE_OF("DataOneOf"),
    DATATYPE_RESTRICTION("DatatypeRestriction"),
    DATA_COMPLEMENT_OF("DataComplementOf"),
    DATA_UNION_OF("DataUnionOf"),
    DATA_INTERSECTION_OF("DataIntersectionOf");

    private final String name;
    private final String prefixedName;
    private final IRI iri;
    private static ValueFactory factory;
    
    @Reference
    protected void setValueFactory(final ValueFactory vf)
    {
        factory = vf;
    }

    DataRangeType(@Nonnull String name) {
        this.name = name;
        prefixedName = ("owl" + ':' + name);
        iri = createIRI("http://www.w3.org/2002/07/owl#", name);
    }

    private IRI createIRI(String namespace, String localName)
    {
        return factory.createIRI(namespace.toString(), localName);
    }	
   
    public String getName()
    {
        return name;
    }

    public String toString()
    {
        return name;
    }

    public String getShortForm()
    {
        return name;
    }

    public IRI getIRI()
    {
        return iri;
    }

    public String getPrefixedName()
    {
        return prefixedName;
    }
}

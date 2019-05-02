package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import com.mobi.ontology.core.api.Datatype;
import com.mobi.rdf.api.IRI;
import com.mobi.vocabularies.xsd.XSD;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import javax.annotation.Nonnull;


public class SimpleDatatype implements Datatype {

    private IRI iri;

    public SimpleDatatype(@Nonnull IRI iri) {
        this.iri = iri;
    }


    @Override
    public boolean isString() {
        return iri.stringValue().equals(XSD.STRING);
    }


    @Override
    public boolean isInteger() {
        return iri.stringValue().equals(XSD.INTEGER);
    }


    @Override
    public boolean isFloat()   {
        return iri.stringValue().equals(XSD.FLOAT);
    }


    @Override
    public boolean isDouble() {
        return iri.stringValue().equals(XSD.DOUBLE);
    }


    @Override
    public boolean isBoolean() {
        return iri.stringValue().equals(XSD.BOOLEAN);
    }


    @Override
    public boolean isRDFPlainLiteral() {
        return iri.stringValue().equals(RDFS.LITERAL.stringValue());
    }


    @Override
    public IRI getIRI() {
        return iri;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }

        if (obj instanceof Datatype) {
            Datatype other = (Datatype) obj;
            return iri.equals(other.getIRI());
        }

        return false;
    }
}

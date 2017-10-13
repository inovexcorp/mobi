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

import com.mobi.ontology.core.api.AnonymousIndividual;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import org.semanticweb.owlapi.model.NodeID;

import java.util.Optional;
import javax.annotation.Nonnull;


public class SimpleAnonymousIndividual
	implements AnonymousIndividual {


    /**
     *.
     */
    private static final long serialVersionUID = -1687216753927244254L;
    private NodeID nodeId;

    public SimpleAnonymousIndividual(@Nonnull NodeID nodeId) {
        this.nodeId = nodeId;
    }


    @Override
    public String getId() {
        return nodeId.getID();
    }


    public NodeID getNodeID() {
        return nodeId;
    }


    @Override
    public Optional<IRI> asIRI() {
        return Optional.empty();
    }


    public Optional<Literal> asLiteral() {
        return Optional.empty();
    }


    @Override
    public Optional<AnonymousIndividual> asAnonymousIndividual() {
        return Optional.of(this);
    }


    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj instanceof SimpleAnonymousIndividual) {
            SimpleAnonymousIndividual other = (SimpleAnonymousIndividual) obj;
            return nodeId.equals(other.getNodeID());
        }
        return false;
    }


    @Override
    public int hashCode() {
        return nodeId.hashCode();
    }


    @Override
    public boolean isNamed() {
        return false;
    }


    @Override
    public boolean isAnonymous() {
        return true;
    }


    @Override
    public String stringValue() {
        return getId();
    }

}

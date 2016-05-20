package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Literal;
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

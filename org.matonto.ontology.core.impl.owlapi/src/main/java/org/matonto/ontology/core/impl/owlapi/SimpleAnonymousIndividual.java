package org.matonto.ontology.core.impl.owlapi;

import java.util.Optional;

import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.OntologyIRI;
import org.openrdf.model.util.Models;
import org.semanticweb.owlapi.model.NodeID;
import org.semanticweb.owlapi.model.OWLAnonymousIndividual;
import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLAnonymousIndividualImpl;

public class SimpleAnonymousIndividual 
	implements AnonymousIndividual {

	
	private NodeID nodeId;
	
	
	public SimpleAnonymousIndividual(NodeID nodeId) 
	{
		this.nodeId = (NodeID)Preconditions.checkNotNull(nodeId,"nodeID cannot be null");
	}
	
	
	@Override 
	public String getId() 
	{
		return nodeId.getID();
	}
	
	
	public NodeID getNodeID() 
	{
		return nodeId;
	}

	
	@Override
	public Optional<OntologyIRI> asIRI() 
	{
		return Optional.empty();
	}

	
	@Override
	public Optional<Literal> asLiteral() 
	{
		return Optional.empty();
	}

	
	@Override
	public Optional<AnonymousIndividual> asAnonymousIndividual() 
	{
		return Optional.of(this);
	}
	
	
	@Override
	public boolean equals(Object obj) 
	{
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
	public int hashCode()
	{
		return nodeId.hashCode();
	}


	@Override
	public boolean isNamed() 
	{
		return false;
	}


	@Override
	public boolean isAnonymous() 
	{
		return true;
	}

}

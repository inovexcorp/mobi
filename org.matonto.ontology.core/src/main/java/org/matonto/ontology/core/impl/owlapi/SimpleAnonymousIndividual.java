package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.OntologyIRI;
import org.openrdf.model.util.Models;
import org.semanticweb.owlapi.model.NodeID;
import org.semanticweb.owlapi.model.OWLAnonymousIndividual;

import com.google.common.base.Optional;
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
		return Optional.absent();
	}

	
	@Override
	public Optional<Literal> asLiteral() 
	{
		return Optional.absent();
	}

	
	@Override
	public Optional<AnonymousIndividual> asAnonymousIndividual() 
	{
		return Optional.of(this);
	}
	
	
	public static OWLAnonymousIndividual owlapiAnonymousIndividual(AnonymousIndividual individual)
	{
		return new OWLAnonymousIndividualImpl(NodeID.getNodeID(individual.getId()));
	}
	
	
	public static AnonymousIndividual matontoAnonymousIndividual(OWLAnonymousIndividual owlIndividual)
	{
		return new SimpleAnonymousIndividual(owlIndividual.getID());
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

package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.AnonymousIndividual;
import org.semanticweb.owlapi.model.NodeID;

import uk.ac.manchester.cs.owl.owlapi.OWLAnonymousIndividualImpl;

public class SimpleAnonymousIndividual extends OWLAnonymousIndividualImpl implements AnonymousIndividual {

	private static final long serialVersionUID = -4307164465905801100L;
	private NodeID nodeId;
	
	public SimpleAnonymousIndividual(NodeID nodeID) 
	{
		super(nodeID);
	}
	
	@Override
	public String getNodeID() 
	{
		return nodeId.getID();
	}

}

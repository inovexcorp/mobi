package org.matonto.ontology.core.impl.owlapi.classexpression;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.types.ClassExpressionType;
import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.ontology.core.impl.owlapi.Values;
import org.semanticweb.owlapi.model.OWLClass;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;


public class SimpleClass implements OClass {

	private OntologyIRI iri;
	private final boolean isThing;
	private final boolean isNothing;
	private OWLClass owlClass;
	
	
	public SimpleClass(@Nonnull OntologyIRI iri)
	{
		this.iri = iri;
		owlClass = new OWLClassImpl(Values.owlapiIRI(iri));
		isThing = owlClass.isOWLThing();
		isNothing = owlClass.isOWLNothing();
	}
	
	@Override
	public OntologyIRI getIRI() 
	{
		return iri;
	}

	
	public boolean isTopEntity()
	{
		return isThing;
	}
	
	
	public boolean isBottomEntity()
	{
		return isNothing;
	}
	
	
	@Override
	public EntityType getEntityType()
	{
		return EntityType.CLASS;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (obj == this) {
			return true;
		}
		
		if(obj instanceof OClass) {
			OntologyIRI otherIri = ((OClass) obj).getIRI();
			return otherIri.equals(iri);
		}
		
		return false;
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OWL_CLASS;
	}

	
	@Override
	public Set<ClassExpression> asConjunctSet() 
	{
		Set<ClassExpression> result = new HashSet<ClassExpression>();
		result.add(this);
		return result;
	}	
	
	
	@Override
	public boolean containsConjunct(@Nonnull ClassExpression ce)
	{
		return ce.equals(this);
	}
	
	
	@Override
	public Set<ClassExpression> asDisjunctSet()
	{
		Set<ClassExpression> result = new HashSet<ClassExpression>();
		result.add(this);
		return result;
	}
	

}

package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.axiom.DatatypeDefinitionAxiom;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleDatatypeDefinitionAxiom 
	extends SimpleAxiom 
	implements DatatypeDefinitionAxiom {


	private Datatype datatype;
	private DataRange dataRange;
	
	
	public SimpleDatatypeDefinitionAxiom(@Nonnull Datatype datatype, @Nonnull DataRange dataRange, Set<Annotation> annotations) 
	{
		super(annotations);
		this.datatype = datatype;
		this.dataRange = dataRange;
	}

	
	@Override
	public DatatypeDefinitionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDatatypeDefinitionAxiom(datatype, dataRange, NO_ANNOTATIONS);	
	}

	
	@Override
	public DatatypeDefinitionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleDatatypeDefinitionAxiom(datatype, dataRange, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DATATYPE_DEFINITION;
	}

	
	@Override
	public Datatype getDatatype() 
	{
		return datatype;
	}

	
	@Override
	public DataRange getDataRange() 
	{
		return dataRange;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DatatypeDefinitionAxiom) {
			DatatypeDefinitionAxiom other = (DatatypeDefinitionAxiom)obj;			 
			return ((datatype.equals(other.getDatatype())) && (dataRange.equals(other.getDataRange())));
		}
		
		return false;
	}

}

package org.matonto.ontology.core.impl.owlapi.axiom;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.DatatypeDefinitionAxiom;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.types.AxiomType;

import java.util.Set;
import javax.annotation.Nonnull;


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

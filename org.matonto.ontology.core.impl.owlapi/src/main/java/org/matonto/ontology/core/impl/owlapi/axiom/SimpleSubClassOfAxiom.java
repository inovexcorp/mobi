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
import org.matonto.ontology.core.api.axiom.SubClassOfAxiom;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.types.AxiomType;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleSubClassOfAxiom extends SimpleClassAxiom implements SubClassOfAxiom {

	private ClassExpression subClass;
	private ClassExpression superClass;
	
	
	public SimpleSubClassOfAxiom(@Nonnull ClassExpression subClass, @Nonnull ClassExpression superClass, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subClass = subClass;
		this.superClass = subClass;
	}

	
	@Override
	public ClassExpression getSubClass() 
	{
		return subClass;
	}

	
	@Override
	public ClassExpression getSuperClass() 
	{
		return superClass;
	}
	
	
	@Override
	public SubClassOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubClassOfAxiom(subClass, superClass, NO_ANNOTATIONS);	
	}
	
	
	@Override
	public SubClassOfAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleSubClassOfAxiom(subClass, superClass, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.SUBCLASS_OF;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof SubClassOfAxiom) {
			SubClassOfAxiom other = (SubClassOfAxiom)obj;			 
			return ((subClass.equals(other.getSubClass())) && (superClass.equals(other.getSuperClass())));
		}
		
		return false;
	}

}

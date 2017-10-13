package com.mobi.ontology.core.impl.owlapi.axiom;

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

import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.types.AxiomType;
import com.mobi.ontology.core.api.axiom.DisjointUnionAxiom;
import com.mobi.ontology.core.api.classexpression.ClassExpression;
import com.mobi.ontology.core.api.classexpression.OClass;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;


public class SimpleDisjointUnionAxiom 
	extends SimpleClassAxiom 
	implements DisjointUnionAxiom {

	
	private OClass owlClass;
	private Set<ClassExpression> expressions;
	
	
	public SimpleDisjointUnionAxiom(@Nonnull OClass owlClass, @Nonnull Set<ClassExpression> expressions, Set<Annotation> annotations)
	{
		super(annotations);
		this.owlClass = owlClass;
		this.expressions = new TreeSet<ClassExpression>(expressions);
	}

	
	@Override
	public Set<ClassExpression> getClassExpressions() 
	{
		return new HashSet<ClassExpression>(expressions);
	}
	
	
	@Override
	public OClass getOWLClass() 
	{
		return owlClass;
	}
	
	
	@Override
	public DisjointUnionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDisjointUnionAxiom(owlClass, expressions, NO_ANNOTATIONS);	
	}
	
	
	@Override
	public DisjointUnionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleDisjointUnionAxiom(owlClass, expressions, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DISJOINT_UNION;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DisjointUnionAxiom) {
			DisjointUnionAxiom other = (DisjointUnionAxiom)obj;			 
			return ((expressions.equals(other.getClassExpressions())) && (owlClass.equals(other.getOWLClass())));
		}
		
		return false;
	}



}

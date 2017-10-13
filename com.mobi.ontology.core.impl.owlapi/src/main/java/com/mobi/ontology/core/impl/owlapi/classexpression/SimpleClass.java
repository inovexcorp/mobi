package com.mobi.ontology.core.impl.owlapi.classexpression;

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

import com.mobi.ontology.core.api.classexpression.ClassExpression;
import com.mobi.ontology.core.api.classexpression.OClass;
import com.mobi.ontology.core.api.types.ClassExpressionType;
import com.mobi.ontology.core.api.types.EntityType;
import com.mobi.ontology.core.impl.owlapi.SimpleOntologyValues;
import com.mobi.rdf.api.IRI;
import org.semanticweb.owlapi.model.OWLClass;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleClass implements OClass {

	private IRI iri;
	private final boolean isThing;
	private final boolean isNothing;
	private OWLClass owlClass;
	
	
	public SimpleClass(@Nonnull IRI iri)
	{
		this.iri = iri;
		owlClass = new OWLClassImpl(SimpleOntologyValues.owlapiIRI(iri));
		isThing = owlClass.isOWLThing();
		isNothing = owlClass.isOWLNothing();
	}
	
	@Override
	public IRI getIRI() 
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
			IRI otherIri = ((OClass) obj).getIRI();
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

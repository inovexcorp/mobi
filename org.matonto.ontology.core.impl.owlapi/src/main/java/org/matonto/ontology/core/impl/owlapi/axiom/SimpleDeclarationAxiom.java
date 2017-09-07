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
import org.matonto.ontology.core.api.Entity;
import org.matonto.ontology.core.api.axiom.DeclarationAxiom;
import org.matonto.ontology.core.api.types.AxiomType;

import java.util.Collections;
import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleDeclarationAxiom 
	extends SimpleAxiom
	implements DeclarationAxiom {

	private Entity entity;
	private Set<Annotation> NO_ANNOTATIONS = Collections.emptySet();
	private AxiomType axiomType = AxiomType.DECLARATION;
	
	
	public SimpleDeclarationAxiom(@Nonnull Entity entity, Set<Annotation> annotations) 
	{
		super(annotations);
		this.entity = entity;
	}

	@Override
	public Entity getEntity() 
	{
		return entity;
	}

	@Override
	public DeclarationAxiom getAxiomWithoutAnnotations() 
	{
		if (!isAnnotated()) {
			return this;
		}
		return new SimpleDeclarationAxiom(getEntity(), NO_ANNOTATIONS);
	}
	
	
	public DeclarationAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleDeclarationAxiom(getEntity(), mergeAnnos(annotations));
	}
	
	
	@Override
	public AxiomType getAxiomType()
	{
		return axiomType;
	}

		
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
	
		if ((obj instanceof DeclarationAxiom)) {
			DeclarationAxiom other = (DeclarationAxiom)obj;
				if(getAnnotations().equals(other.getAnnotations())) {
					return getEntity().equals(other.getEntity());
				}
		}
		
		return false;
	}
	

}

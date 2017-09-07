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
import org.matonto.ontology.core.api.axiom.Axiom;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;

public abstract class SimpleAxiom implements Axiom {

	private Set<Annotation> annotations = new HashSet<Annotation>();
	protected Set<Annotation> NO_ANNOTATIONS;
	
	public SimpleAxiom(Set<Annotation> annotations)
	{
	    if(annotations != null) {
    		if(annotations.isEmpty())
    			this.annotations = Collections.emptySet();
    		
    		else
    			this.annotations = new HashSet<Annotation>(annotations);
	    }
	}
	
	@Override
	public Set<Annotation> getAnnotations() 
	{
	    if (annotations.isEmpty()) 
	    	return Collections.emptySet();
	    
	    return annotations;
	}

	@Override
	public boolean isAnnotated() 
	{
		return !annotations.isEmpty();
	}

	
	protected Set<Annotation> mergeAnnos(@Nonnull Set<Annotation> annos)
	{
		Set<Annotation> merged = new HashSet<Annotation>(annos);
		merged.addAll(annotations);
		return merged;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (obj instanceof Axiom) {
			Axiom other = (Axiom)obj;			 
			return annotations.equals(other.getAnnotations());
		}
		
		return false;
	}

}

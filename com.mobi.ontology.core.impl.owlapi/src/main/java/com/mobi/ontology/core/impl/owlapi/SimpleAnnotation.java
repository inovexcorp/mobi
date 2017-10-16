package com.mobi.ontology.core.impl.owlapi;

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
import com.mobi.ontology.core.api.propertyexpression.AnnotationProperty;
import com.mobi.rdf.api.Value;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleAnnotation implements Annotation {

    private AnnotationProperty property;
    private Value value;
    private Set<Annotation> annotations;

    /**
     * .
     */
    public SimpleAnnotation(@Nonnull AnnotationProperty property, Value value, Set<? extends Annotation> annotations) {
        this.property = property;
        this.value = value;
        if (annotations != null) {
            this.annotations = new HashSet<>(annotations);
        }
    }

    @Override
    public AnnotationProperty getProperty() {
        return property;
    }

    @Override
    public Value getValue() {
        return value;
    }

    @Override
    public Set<Annotation> getAnnotations() {
        return annotations;
    }

    /**
     * .
     */
    public Annotation getAnnotatedAnnotation(@Nonnull Set<Annotation> annotations) {
        if (annotations.isEmpty()) {
            return this;
        }

        Set<Annotation> merged = new HashSet<Annotation>(this.annotations);
        merged.addAll(annotations);
        return new SimpleAnnotation(property, value, merged);
    }

    @Override
    public boolean isAnnotated() {
        return (!annotations.isEmpty());
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if ((obj instanceof SimpleAnnotation)) {
            SimpleAnnotation other = (SimpleAnnotation) obj;
            return (other.getProperty().equals(property)) && (other.getValue().equals(value))
                    && (other.getAnnotations().equals(annotations));
        }

        return false;
    }

}

package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import com.mobi.ontology.core.api.AnnotationProperty;
import org.eclipse.rdf4j.model.Value;

import javax.annotation.Nonnull;


public class SimpleAnnotation implements Annotation {

    private AnnotationProperty property;
    private Value value;

    public SimpleAnnotation(@Nonnull AnnotationProperty property, Value value) {
        this.property = property;
        this.value = value;
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
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if ((obj instanceof SimpleAnnotation)) {
            SimpleAnnotation other = (SimpleAnnotation) obj;
            return (other.getProperty().equals(property)) && (other.getValue().equals(value));
        }

        return false;
    }

}

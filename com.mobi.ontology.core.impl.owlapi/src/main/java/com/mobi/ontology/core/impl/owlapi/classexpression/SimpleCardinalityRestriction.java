package com.mobi.ontology.core.impl.owlapi.classexpression;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import com.mobi.ontology.core.api.propertyexpression.PropertyExpression;
import com.mobi.ontology.core.api.types.ClassExpressionType;
import com.mobi.ontology.core.api.classexpression.CardinalityRestriction;

import java.util.Collections;
import java.util.Set;
import javax.annotation.Nonnull;

public class SimpleCardinalityRestriction implements CardinalityRestriction {

    private int cardinality;
    private PropertyExpression propertyExpression;
    private ClassExpressionType classExpressionType;

    public SimpleCardinalityRestriction(@Nonnull PropertyExpression propertyExpression, int cardinality,
                                        ClassExpressionType classExpressionType) {
        this.cardinality = cardinality;
        this.propertyExpression = propertyExpression;
        this.classExpressionType = classExpressionType;
    }

    @Override
    public PropertyExpression getProperty() {
        return propertyExpression;
    }

    @Override
    public int getCardinality() {
        return cardinality;
    }

    @Override
    public ClassExpressionType getClassExpressionType() {
        return classExpressionType;
    }

    @Override
    public Set<ClassExpression> asConjunctSet() {
        return Collections.singleton(this);
    }

    @Override
    public boolean containsConjunct(@Nonnull ClassExpression ce) {
        return ce.equals(this);
    }

    @Override
    public Set<ClassExpression> asDisjunctSet() {
        return Collections.singleton(this);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj instanceof CardinalityRestriction) {
            CardinalityRestriction other = (CardinalityRestriction) obj;
            return other.getProperty().equals(propertyExpression) && other.getCardinality() == cardinality;
        }
        return false;
    }
}

package org.matonto.ontology.core.impl.owlapi.classexpression;

import org.matonto.ontology.core.api.classexpression.CardinalityRestriction;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.propertyexpression.PropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;

import java.util.Collections;
import java.util.Set;
import javax.annotation.Nonnull;

public class SimpleCardinalityRestriction implements CardinalityRestriction {

    private int cardinality;
    private PropertyExpression propertyExpression;

    public SimpleCardinalityRestriction(@Nonnull PropertyExpression propertyExpression, int cardinality) {
        this.cardinality = cardinality;
        this.propertyExpression = propertyExpression;
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
        return null;
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

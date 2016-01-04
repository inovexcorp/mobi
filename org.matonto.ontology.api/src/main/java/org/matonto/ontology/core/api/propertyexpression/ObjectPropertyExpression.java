package org.matonto.ontology.core.api.propertyexpression;

public interface ObjectPropertyExpression extends PropertyExpression {

    /**
     * Obtains the property that corresponds to the inverse of this property.
     * 
     * @return The inverse of this property.
     */
	ObjectPropertyExpression getInverseProperty();
	
    /**
     * Get the named object property used in this property expression.
     * 
     * @return P if PE = inv(P) otherwise PE.
     */
	ObjectPropertyExpression getNamedProperty();
}

package org.matonto.ontology.core.api.types;

/*-
 * #%L
 * org.matonto.ontology.api
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

import javax.annotation.Nonnull;

public enum AxiomType {

    DECLARATION ("Declaration", true, true, false),
    EQUIVALENT_CLASSES ("EquivalentClasses", false, false, true),
    SUBCLASS_OF ("SubClassOf", false, false, true),
    DISJOINT_CLASSES ("DisjointClasses", false, false, true),
    DISJOINT_UNION ("DisjointUnion", true, false, true),
    CLASS_ASSERTION ("ClassAssertion", false, false, true),
    SAME_INDIVIDUAL ("SameIndividual", false, false, true),
    DIFFERENT_INDIVIDUALS ("DifferentIndividuals", false, false, true),
    OBJECT_PROPERTY_ASSERTION ("ObjectPropertyAssertion", false, false, true),
    NEGATIVE_OBJECT_PROPERTY_ASSERTION ("NegativeObjectPropertyAssertion", true, false, true),
    DATA_PROPERTY_ASSERTION ("DataPropertyAssertion", false, false, true),
    NEGATIVE_DATA_PROPERTY_ASSERTION ("NegativeDataPropertyAssertion", true, false, true),
    EQUIVALENT_OBJECT_PROPERTIES ("EquivalentObjectProperties", false, false, true),
    SUB_OBJECT_PROPERTY ("SubObjectPropertyOf", false, false, true),
    INVERSE_OBJECT_PROPERTIES ("InverseObjectProperties", false, false, true),
    FUNCTIONAL_OBJECT_PROPERTY ("FunctionalObjectProperty", false, false, true),
    INVERSE_FUNCTIONAL_OBJECT_PROPERTY ("InverseFunctionalObjectProperty", false, false, true),
    SYMMETRIC_OBJECT_PROPERTY ("SymmetricObjectProperty", false, false, true),
    ASYMMETRIC_OBJECT_PROPERTY ("AsymmetricObjectProperty", true, true, true),
    TRANSITIVE_OBJECT_PROPERTY ("TransitiveObjectProperty", false, false, true),
    REFLEXIVE_OBJECT_PROPERTY ("ReflexiveObjectProperty", true, true, true),
    IRREFLEXIVE_OBJECT_PROPERTY ("IrrefexiveObjectProperty", true, true, true),
    OBJECT_PROPERTY_DOMAIN ("ObjectPropertyDomain", false, false, true),
    OBJECT_PROPERTY_RANGE ("ObjectPropertyRange", false, false, true),
    DISJOINT_OBJECT_PROPERTIES ("DisjointObjectProperties", true, true, true),
    SUB_PROPERTY_CHAIN_OF ("SubPropertyChainOf", true, true, true),
    EQUIVALENT_DATA_PROPERTIES ("EquivalentDataProperties", false, false, true),
    SUB_DATA_PROPERTY ("SubDataPropertyOf", false, false, true),
    FUNCTIONAL_DATA_PROPERTY ("FunctionalDataProperty", false, false, true),
    DATA_PROPERTY_DOMAIN ("DataPropertyDomain", false, false, true),
    DATA_PROPERTY_RANGE ("DataPropertyRange", false, false, true),
    DISJOINT_DATA_PROPERTIES ("DisjointDataProperties", true, true, true),
    DATATYPE_DEFINITION ("DatatypeDefinition", true, true, true),
    HAS_KEY ("HasKey", true, true, true),
    SWRL_RULE ("Rule", false, false, true),
    ANNOTATION_ASSERTION ("AnnotationAssertion", false, false, false),
    SUB_ANNOTATION_PROPERTY_OF ("SubAnnotationPropertyOf", true, true, false),
    ANNOTATION_PROPERTY_RANGE ("AnnotationPropertyRangeOf", true, true, false),
    ANNOTATION_PROPERTY_DOMAIN ("AnnotationPropertyDomain", true, true, false);

    private final String name;
    private final boolean owl2Axiom;
    private final boolean nonSyntacticOWL2Axiom;
    private final boolean isLogical;
   
    AxiomType(@Nonnull String name, boolean owl2Axiom, boolean nonSyntacticOWL2Axiom, boolean isLogical) {
        this.name = name;
        this.owl2Axiom = owl2Axiom;
        this.nonSyntacticOWL2Axiom = nonSyntacticOWL2Axiom;
        this.isLogical = isLogical;
    }

    @Override
    public String toString()
    {
        return name;
    }

    public String getName()
    {
        return name;
    }

    public boolean isOWL2Axiom()
    {
        return owl2Axiom;
    }

    public boolean isNonSyntacticOWL2Axiom()
    {
        return nonSyntacticOWL2Axiom;
    }

    public boolean isLogical()
    {
        return isLogical;
    }
}

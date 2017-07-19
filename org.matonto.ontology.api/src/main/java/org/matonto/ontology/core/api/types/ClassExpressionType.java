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

public enum ClassExpressionType {
    OWL_CLASS("Class"),
    OBJECT_SOME_VALUES_FROM("ObjectSomeValuesFrom"),
    OBJECT_ALL_VALUES_FROM("ObjectAllValuesFrom"),
    OBJECT_MIN_CARDINALITY("ObjectMinCardinality"),
    OBJECT_MAX_CARDINALITY("ObjectMaxCardinality"),
    OBJECT_EXACT_CARDINALITY("ObjectExactCardinality"),
    OBJECT_HAS_VALUE("ObjectHasValue"),
    OBJECT_HAS_SELF("ObjectHasSelf"),
    DATA_SOME_VALUES_FROM("DataSomeValuesFrom"),
    DATA_ALL_VALUES_FROM("DataAllValuesFrom"),
    DATA_MIN_CARDINALITY("DataMinCardinality"),
    DATA_MAX_CARDINALITY("DataMaxCardinality"),
    DATA_EXACT_CARDINALITY("DataExactCardinality"),
    DATA_HAS_VALUE("DataHasValue"),
    OBJECT_INTERSECTION_OF("ObjectIntersectionOf"),
    OBJECT_UNION_OF("ObjectUnionOf"),
    OBJECT_COMPLEMENT_OF("ObjectComplementOf"),
    OBJECT_ONE_OF("ObjectOneOf");

    private final String className;
    private final String prefixedName;

    ClassExpressionType(@Nonnull String className) {
        this.className = className;
        prefixedName = "owl" + ':' + className;
    }

    public String getName() {
        return className;
    }


    public String toString() {
        return className;
    }


    public String getShortForm() {
        return className;
    }


    public String getPrefixedName() {
        return prefixedName;
    }
}

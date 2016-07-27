package org.matonto.etl.service.delimited;

/*-
 * #%L
 * org.matonto.etl.csv
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

public enum Delimited {
    MAPPINGS("http://matonto.org/mappings"),
    TYPE("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
    MAPS_TO("http://matonto.org/ontologies/delimited/mapsTo"),
    COLUMN_INDEX("http://matonto.org/ontologies/delimited/columnIndex"),
    HAS_PREFIX("http://matonto.org/ontologies/delimited/hasPrefix"),
    HAS_PROPERTY("http://matonto.org/ontologies/delimited/hasProperty"),
    DATA_PROPERTY("http://matonto.org/ontologies/delimited/dataProperty"),
    OBJECT_PROPERTY("http://matonto.org/ontologies/delimited/objectProperty"),
    CLASS_MAPPING_PROP("http://matonto.org/ontologies/delimited/classMapping"),
    CLASS_MAPPING_OBJ("http://matonto.org/ontologies/delimited/ClassMapping"),
    LOCAL_NAME("http://matonto.org/ontologies/delimited/localName"),
    MAPPING("http://matonto.org/ontologies/delimited/Mapping"),
    VERSION("http://matonto.org/ontologies/delimited/versionIRI"),
    SOURCE_ONTOLOGY("http://matonto.org/ontologies/delimited/sourceOntology");
    private final String str;

    Delimited(String str) {
        this.str = str;
    }

    public String stringValue() {
        return str;
    }

}

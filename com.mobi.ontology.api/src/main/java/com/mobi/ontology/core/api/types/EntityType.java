package com.mobi.ontology.core.api.types;

/*-
 * #%L
 * com.mobi.ontology.api
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

public enum EntityType {

    CLASS("Class", "Class", "Classes"),
    OBJECT_PROPERTY("ObjectProperty", "Object property", "Object properties"),
    DATA_PROPERTY("DataProperty","Data property", "Data properties"),
    ANNOTATION_PROPERTY("AnnotationProperty", "Annotation property", "Annotation properties"),
    NAMED_INDIVIDUAL("NamedIndividual", "Named individual", "Named individuals"),
    DATATYPE("Datatype", "Datatype", "Datatypes");

    private final String name;
    private final String printName;
    private final String pluralPrintName;

    EntityType(@Nonnull String name, @Nonnull String printName, @Nonnull String pluralPrintName) {
        this.name = name;
        this.printName = printName;
        this.pluralPrintName = pluralPrintName;
    }

    public String getName()
    {
        return name;
    }

    public String getPrintName()
    {
        return printName;
    }

    public String getPluralPrintName()
    {
        return pluralPrintName;
    }

}

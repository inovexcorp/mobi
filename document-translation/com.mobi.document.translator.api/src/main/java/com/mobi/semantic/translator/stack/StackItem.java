package com.mobi.semantic.translator.stack;

        /*-
         * #%L
 * meaning.extraction.api
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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Value;
import org.springframework.util.MultiValueMap;

/**
 * This interface describes the minimum fields for an item you'll place on the stack of a
 * {@link StackingSemanticTranslator} implementation.  It will provide specific types of data necessary for generating
 * ontological structures from the content and structure of your input data.  Each item on the stack should represent a
 * layer in your data structure, and most likely be a class in your generated ontology.
 */
public interface StackItem {

    /**
     * @return The key that represents this item on the stack
     */
    String getIdentifier();

    /**
     * @return The IRI that will represent this item as a class in your generated ontology
     */
    IRI getClassIri();

    /**
     * @return A {@link MultiValueMap} that will populate the instance represented by this item with DatatypeProperties
     * in the resulting {@link com.mobi.rdf.api.Model}
     */
    MultiValueMap<IRI, Value> getProperties();

    /**
     * @return Whether or not this item is a root element of the entity
     */
    boolean isRoot();

}

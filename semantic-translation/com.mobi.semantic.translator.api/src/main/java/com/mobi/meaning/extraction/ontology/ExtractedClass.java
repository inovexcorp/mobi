
package com.mobi.meaning.extraction.ontology;

/*-
 * #%L
 * semantic.translator.api
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

import java.util.Optional;
import com.mobi.rdf.orm.OrmException;


/**
 * Generated class representing things with the type: urn://mobi.com/ontologies/MeaningExtraction#ExtractedClass
 * 
 */
public interface ExtractedClass extends MeaningExtraction_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "urn://mobi.com/ontologies/MeaningExtraction#ExtractedClass";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#string
     * 
     */
    public final static String spelInstanceUri_IRI = "urn://mobi.com/ontologies/MeaningExtraction#spelInstanceUri";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends ExtractedClass> DEFAULT_IMPL = ExtractedClassImpl.class;

    /**
     * Get the spelInstanceUri property from this instance of a urn://mobi.com/ontologies/MeaningExtraction#ExtractedClass' type.<br><br>Spring Expression Language template for generating URIs for instances of this class discovered from the meaning extraction APIs.
     * 
     * @return
     *     The spelInstanceUri {@link java.util.Optional<java.lang.String>} value for this instance
     */
    public Optional<String> getSpelInstanceUri()
        throws OrmException
    ;

    public void setSpelInstanceUri(String arg)
        throws OrmException
    ;

}

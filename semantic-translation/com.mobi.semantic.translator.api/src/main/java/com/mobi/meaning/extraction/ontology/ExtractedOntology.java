
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
 * Generated class representing things with the type: urn://mobi.com/ontologies/MeaningExtraction#ExtractedOntology
 * 
 */
public interface ExtractedOntology extends MeaningExtraction_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "urn://mobi.com/ontologies/MeaningExtraction#ExtractedOntology";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#string
     * 
     */
    public final static String spelPropertyUri_IRI = "urn://mobi.com/ontologies/MeaningExtraction#spelPropertyUri";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#string
     * 
     */
    public final static String spelClassUri_IRI = "urn://mobi.com/ontologies/MeaningExtraction#spelClassUri";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends ExtractedOntology> DEFAULT_IMPL = ExtractedOntologyImpl.class;

    /**
     * Get the spelPropertyUri property from this instance of a urn://mobi.com/ontologies/MeaningExtraction#ExtractedOntology' type.<br><br>Spring Expression Language template for generating URIs for classes discovered from the meaning extraction APIs.
     * 
     * @return
     *     The spelPropertyUri {@link java.util.Optional<java.lang.String>} value for this instance
     */
    public Optional<String> getSpelPropertyUri()
        throws OrmException
    ;

    public void setSpelPropertyUri(String arg)
        throws OrmException
    ;

    /**
     * Get the spelClassUri property from this instance of a urn://mobi.com/ontologies/MeaningExtraction#ExtractedOntology' type.<br><br>Spring Expression Language template for generating URIs for properties discovered from the meaning extraction APIs.
     * 
     * @return
     *     The spelClassUri {@link java.util.Optional<java.lang.String>} value for this instance
     */
    public Optional<String> getSpelClassUri()
        throws OrmException
    ;

    public void setSpelClassUri(String arg)
        throws OrmException
    ;

}

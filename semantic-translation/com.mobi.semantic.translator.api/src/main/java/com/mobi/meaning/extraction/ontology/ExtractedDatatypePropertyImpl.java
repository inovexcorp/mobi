
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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingImpl;


/**
 * This implementation of the 'urn://mobi.com/ontologies/MeaningExtraction#ExtractedDatatypeProperty' entity will allow developers to work in native java POJOs.
 * 
 */
public class ExtractedDatatypePropertyImpl
    extends ThingImpl
    implements ExtractedDatatypeProperty, ExtractedProperty, MeaningExtraction_Thing, Thing
{


    /**
     * Construct a new ExtractedDatatypeProperty with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this ExtractedDatatypeProperty
     * @param backingModel
     *     The backing dataset/model of this ExtractedDatatypeProperty
     * @param subjectIri
     *     The subject of this ExtractedDatatypeProperty
     * @param valueFactory
     *     The value factory to use for this ExtractedDatatypeProperty
     */
    public ExtractedDatatypePropertyImpl(final Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new ExtractedDatatypeProperty with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this ExtractedDatatypeProperty
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this ExtractedDatatypeProperty
     * @param subjectIriStr
     *     The subject of this ExtractedDatatypeProperty
     * @param valueFactory
     *     The value factory to use for this ExtractedDatatypeProperty
     */
    public ExtractedDatatypePropertyImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

}

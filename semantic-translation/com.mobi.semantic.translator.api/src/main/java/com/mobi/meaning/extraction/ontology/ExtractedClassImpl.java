
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
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmException;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingImpl;


/**
 * This implementation of the 'urn://mobi.com/ontologies/MeaningExtraction#ExtractedClass' entity will allow developers to work in native java POJOs.
 * 
 */
public class ExtractedClassImpl
    extends ThingImpl
    implements ExtractedClass, MeaningExtraction_Thing, Thing
{


    /**
     * Construct a new ExtractedClass with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this ExtractedClass
     * @param backingModel
     *     The backing dataset/model of this ExtractedClass
     * @param subjectIri
     *     The subject of this ExtractedClass
     * @param valueFactory
     *     The value factory to use for this ExtractedClass
     */
    public ExtractedClassImpl(final Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new ExtractedClass with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this ExtractedClass
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this ExtractedClass
     * @param subjectIriStr
     *     The subject of this ExtractedClass
     * @param valueFactory
     *     The value factory to use for this ExtractedClass
     */
    public ExtractedClassImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public Optional<String> getSpelInstanceUri()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(ExtractedClass.spelInstanceUri_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, String.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setSpelInstanceUri(String arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(ExtractedClass.spelInstanceUri_IRI));
    }

}

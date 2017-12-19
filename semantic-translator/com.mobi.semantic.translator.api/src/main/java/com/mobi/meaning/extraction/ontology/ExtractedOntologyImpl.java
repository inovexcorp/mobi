
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
 * This implementation of the 'urn://mobi.com/ontologies/MeaningExtraction#ExtractedOntology' entity will allow developers to work in native java POJOs.
 * 
 */
public class ExtractedOntologyImpl
    extends ThingImpl
    implements ExtractedOntology, MeaningExtraction_Thing, Thing
{


    /**
     * Construct a new ExtractedOntology with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this ExtractedOntology
     * @param backingModel
     *     The backing dataset/model of this ExtractedOntology
     * @param subjectIri
     *     The subject of this ExtractedOntology
     * @param valueFactory
     *     The value factory to use for this ExtractedOntology
     */
    public ExtractedOntologyImpl(final Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new ExtractedOntology with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this ExtractedOntology
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this ExtractedOntology
     * @param subjectIriStr
     *     The subject of this ExtractedOntology
     * @param valueFactory
     *     The value factory to use for this ExtractedOntology
     */
    public ExtractedOntologyImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public Optional<String> getSpelPropertyUri()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(ExtractedOntology.spelPropertyUri_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, String.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setSpelPropertyUri(String arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(ExtractedOntology.spelPropertyUri_IRI));
    }

    @Override
    public Optional<String> getSpelClassUri()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(ExtractedOntology.spelClassUri_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, String.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setSpelClassUri(String arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(ExtractedOntology.spelClassUri_IRI));
    }

}

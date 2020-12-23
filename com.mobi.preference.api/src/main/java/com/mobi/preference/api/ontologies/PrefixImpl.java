
package com.mobi.preference.api.ontologies;

/*-
 * #%L
 * com.mobi.preference.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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
 * This implementation of the 'http://mobi.com/ontologies/preference#Prefix' entity will allow developers to work in native java POJOs.
 * 
 */
public class PrefixImpl
    extends ThingImpl
    implements Preference_Thing, Prefix, Thing
{


    /**
     * Construct a new Prefix with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this Prefix
     * @param backingModel
     *     The backing dataset/model of this Prefix
     * @param subjectIri
     *     The subject of this Prefix
     * @param valueFactory
     *     The value factory to use for this Prefix
     */
    public PrefixImpl(final Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new Prefix with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this Prefix
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this Prefix
     * @param subjectIriStr
     *     The subject of this Prefix
     * @param valueFactory
     *     The value factory to use for this Prefix
     */
    public PrefixImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public Optional<String> getHasPrefix()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(Prefix.hasPrefix_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, String.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setHasPrefix(String arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Prefix.hasPrefix_IRI));
    }

    @Override
    public boolean clearHasPrefix() {
        return clearProperty(valueFactory.createIRI(Prefix.hasPrefix_IRI));
    }

    @Override
    public Optional<String> getHasNamespace()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(Prefix.hasNamespace_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, String.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setHasNamespace(String arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Prefix.hasNamespace_IRI));
    }

    @Override
    public boolean clearHasNamespace() {
        return clearProperty(valueFactory.createIRI(Prefix.hasNamespace_IRI));
    }

}

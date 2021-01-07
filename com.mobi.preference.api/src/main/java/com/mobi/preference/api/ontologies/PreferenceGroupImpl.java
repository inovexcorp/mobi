
package com.mobi.preference.api.ontologies;

/*-
 * #%L
 * com.mobi.preference.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
 * This implementation of the 'http://mobi.com/ontologies/preference#PreferenceGroup' entity will allow developers to work in native java POJOs.
 * 
 */
public class PreferenceGroupImpl
    extends ThingImpl
    implements PreferenceGroup, Preference_Thing, Thing
{


    /**
     * Construct a new PreferenceGroup with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this PreferenceGroup
     * @param backingModel
     *     The backing dataset/model of this PreferenceGroup
     * @param subjectIri
     *     The subject of this PreferenceGroup
     * @param valueFactory
     *     The value factory to use for this PreferenceGroup
     */
    public PreferenceGroupImpl(final Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new PreferenceGroup with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this PreferenceGroup
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this PreferenceGroup
     * @param subjectIriStr
     *     The subject of this PreferenceGroup
     * @param valueFactory
     *     The value factory to use for this PreferenceGroup
     */
    public PreferenceGroupImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

}

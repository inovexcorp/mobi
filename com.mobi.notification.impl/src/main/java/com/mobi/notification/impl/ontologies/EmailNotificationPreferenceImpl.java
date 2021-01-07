
package com.mobi.notification.impl.ontologies;

/*-
 * #%L
 * com.mobi.notification.impl
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

import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.Preference_Thing;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmException;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingImpl;


/**
 * This implementation of the 'http://mobi.com/ontologies/notification#EmailNotificationPreference' entity will allow developers to work in native java POJOs.
 * 
 */
public class EmailNotificationPreferenceImpl
    extends ThingImpl
    implements EmailNotificationPreference, Notification_Thing, Preference, Preference_Thing, com.mobi.rdf.orm.Thing
{


    /**
     * Construct a new EmailNotificationPreference with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this EmailNotificationPreference
     * @param backingModel
     *     The backing dataset/model of this EmailNotificationPreference
     * @param subjectIri
     *     The subject of this EmailNotificationPreference
     * @param valueFactory
     *     The value factory to use for this EmailNotificationPreference
     */
    public EmailNotificationPreferenceImpl(final com.mobi.rdf.api.Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new EmailNotificationPreference with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this EmailNotificationPreference
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this EmailNotificationPreference
     * @param subjectIriStr
     *     The subject of this EmailNotificationPreference
     * @param valueFactory
     *     The value factory to use for this EmailNotificationPreference
     */
    public EmailNotificationPreferenceImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public java.util.Optional<Literal> getHasDataValue()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(Preference.hasDataValue_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, Literal.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setHasDataValue(Literal arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Preference.hasDataValue_IRI));
    }

    @Override
    public boolean clearHasDataValue() {
        return clearProperty(valueFactory.createIRI(Preference.hasDataValue_IRI));
    }

    @Override
    public boolean addHasObjectValue(com.mobi.rdf.orm.Thing arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Preference.hasObjectValue_IRI));
    }

    @Override
    public boolean removeHasObjectValue(com.mobi.rdf.orm.Thing arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Preference.hasObjectValue_IRI));
    }

    @Override
    public java.util.Set<com.mobi.rdf.orm.Thing> getHasObjectValue()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(Preference.hasObjectValue_IRI));
        return valueConverterRegistry.convertValues(value, this, com.mobi.rdf.orm.Thing.class);
    }

    @Override
    public java.util.Set<com.mobi.rdf.api.Resource> getHasObjectValue_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(Preference.hasObjectValue_IRI));
        return valueConverterRegistry.convertValues(value, this, com.mobi.rdf.api.Resource.class);
    }

    @Override
    public void setHasObjectValue(java.util.Set<com.mobi.rdf.orm.Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(Preference.hasObjectValue_IRI));
    }

    @Override
    public boolean clearHasObjectValue() {
        return clearProperty(valueFactory.createIRI(Preference.hasObjectValue_IRI));
    }

    @Override
    public boolean addForUser(com.mobi.rdf.orm.Thing arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Preference.forUser_IRI));
    }

    @Override
    public boolean removeForUser(com.mobi.rdf.orm.Thing arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Preference.forUser_IRI));
    }

    @Override
    public java.util.Set<com.mobi.rdf.orm.Thing> getForUser()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(Preference.forUser_IRI));
        return valueConverterRegistry.convertValues(value, this, com.mobi.rdf.orm.Thing.class);
    }

    @Override
    public java.util.Set<com.mobi.rdf.api.Resource> getForUser_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(Preference.forUser_IRI));
        return valueConverterRegistry.convertValues(value, this, com.mobi.rdf.api.Resource.class);
    }

    @Override
    public void setForUser(java.util.Set<com.mobi.rdf.orm.Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(Preference.forUser_IRI));
    }

    @Override
    public boolean clearForUser() {
        return clearProperty(valueFactory.createIRI(Preference.forUser_IRI));
    }

}

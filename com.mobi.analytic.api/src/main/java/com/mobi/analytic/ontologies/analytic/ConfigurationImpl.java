
package com.mobi.analytic.ontologies.analytic;

/*-
 * #%L
 * com.mobi.analytic.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import java.util.Set;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmException;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingImpl;


/**
 * This implementation of the 'http://mobi.com/ontologies/analytic#Configuration' entity will allow developers to work in native java POJOs.
 * 
 */
public class ConfigurationImpl
    extends ThingImpl
    implements Configuration, MobiAnalytic_Thing, Thing
{


    /**
     * Construct a new Configuration with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this Configuration
     * @param backingModel
     *     The backing dataset/model of this Configuration
     * @param subjectIri
     *     The subject of this Configuration
     * @param valueFactory
     *     The value factory to use for this Configuration
     */
    public ConfigurationImpl(final Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new Configuration with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this Configuration
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this Configuration
     * @param subjectIriStr
     *     The subject of this Configuration
     * @param valueFactory
     *     The value factory to use for this Configuration
     */
    public ConfigurationImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public boolean addDatasetRecord(DatasetRecord arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Configuration.datasetRecord_IRI));
    }

    @Override
    public boolean removeDatasetRecord(DatasetRecord arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Configuration.datasetRecord_IRI));
    }

    @Override
    public Set<DatasetRecord> getDatasetRecord()
        throws OrmException
    {
        final Set<Value> value = getProperties(valueFactory.createIRI(Configuration.datasetRecord_IRI));
        return valueConverterRegistry.convertValues(value, this, DatasetRecord.class);
    }

    @Override
    public Set<Resource> getDatasetRecord_resource()
        throws OrmException
    {
        final Set<Value> value = getProperties(valueFactory.createIRI(Configuration.datasetRecord_IRI));
        return valueConverterRegistry.convertValues(value, this, Resource.class);
    }

    @Override
    public void setDatasetRecord(Set<DatasetRecord> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(Configuration.datasetRecord_IRI));
    }

    @Override
    public boolean clearDatasetRecord() {
        return clearProperty(valueFactory.createIRI(Configuration.datasetRecord_IRI));
    }

    @Override
    public Optional<Branch> getLinksToBranch()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToBranch_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, Branch.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public Optional<Resource> getLinksToBranch_resource()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToBranch_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, Resource.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setLinksToBranch(Branch arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(MobiAnalytic_Thing.linksToBranch_IRI));
    }

    @Override
    public boolean clearLinksToBranch() {
        return clearProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToBranch_IRI));
    }

    @Override
    public boolean addInfluenced(Thing arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
    }

    @Override
    public boolean removeInfluenced(Thing arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
    }

    @Override
    public Set<Thing> getInfluenced()
        throws OrmException
    {
        final Set<Value> value = getProperties(valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public Set<Resource> getInfluenced_resource()
        throws OrmException
    {
        final Set<Value> value = getProperties(valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
        return valueConverterRegistry.convertValues(value, this, Resource.class);
    }

    @Override
    public void setInfluenced(Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
    }

    @Override
    public boolean clearInfluenced() {
        return clearProperty(valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
    }

    @Override
    public Optional<VersionedRDFRecord> getLinksToRecord()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToRecord_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, VersionedRDFRecord.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public Optional<Resource> getLinksToRecord_resource()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToRecord_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, Resource.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setLinksToRecord(VersionedRDFRecord arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(MobiAnalytic_Thing.linksToRecord_IRI));
    }

    @Override
    public boolean clearLinksToRecord() {
        return clearProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToRecord_IRI));
    }

    @Override
    public Optional<Commit> getLinksToCommit()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToCommit_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, Commit.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public Optional<Resource> getLinksToCommit_resource()
        throws OrmException
    {
        final Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToCommit_IRI));
        if (value.isPresent()) {
            return Optional.of(valueConverterRegistry.convertValue(value.get(), this, Resource.class));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setLinksToCommit(Commit arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(MobiAnalytic_Thing.linksToCommit_IRI));
    }

    @Override
    public boolean clearLinksToCommit() {
        return clearProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToCommit_IRI));
    }

}

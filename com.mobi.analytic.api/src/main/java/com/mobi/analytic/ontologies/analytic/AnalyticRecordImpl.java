
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

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.MCAT_Thing;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmException;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingImpl;


/**
 * This implementation of the 'http://mobi.com/ontologies/analytic#AnalyticRecord' entity will allow developers to work in native java POJOs.
 * 
 */
public class AnalyticRecordImpl
    extends ThingImpl
    implements AnalyticRecord, MobiAnalytic_Thing, MCAT_Thing, Record, UnversionedRecord, Thing
{


    /**
     * Construct a new AnalyticRecord with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this AnalyticRecord
     * @param backingModel
     *     The backing dataset/model of this AnalyticRecord
     * @param subjectIri
     *     The subject of this AnalyticRecord
     * @param valueFactory
     *     The value factory to use for this AnalyticRecord
     */
    public AnalyticRecordImpl(final com.mobi.rdf.api.Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new AnalyticRecord with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this AnalyticRecord
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this AnalyticRecord
     * @param subjectIriStr
     *     The subject of this AnalyticRecord
     * @param valueFactory
     *     The value factory to use for this AnalyticRecord
     */
    public AnalyticRecordImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public java.util.Optional<Configuration> getHasConfig()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(AnalyticRecord.hasConfig_IRI));
        if (value.isPresent()&&this.getModel().subjects().contains(value.get())) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, Configuration.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public java.util.Optional<com.mobi.rdf.api.Resource> getHasConfig_resource()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(AnalyticRecord.hasConfig_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, com.mobi.rdf.api.Resource.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setHasConfig(Configuration arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(AnalyticRecord.hasConfig_IRI));
    }

    @Override
    public boolean clearHasConfig() {
        return clearProperty(valueFactory.createIRI(AnalyticRecord.hasConfig_IRI));
    }

    @Override
    public java.util.Optional<Branch> getLinksToBranch()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToBranch_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, Branch.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public java.util.Optional<com.mobi.rdf.api.Resource> getLinksToBranch_resource()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToBranch_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, com.mobi.rdf.api.Resource.class));
        } else {
            return java.util.Optional.empty();
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
    public java.util.Set<Thing> getInfluenced()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public java.util.Set<com.mobi.rdf.api.Resource> getInfluenced_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
        return valueConverterRegistry.convertValues(value, this, com.mobi.rdf.api.Resource.class);
    }

    @Override
    public void setInfluenced(java.util.Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
    }

    @Override
    public boolean clearInfluenced() {
        return clearProperty(valueFactory.createIRI(MobiAnalytic_Thing.influenced_IRI));
    }

    @Override
    public java.util.Optional<VersionedRDFRecord> getLinksToRecord()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToRecord_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, VersionedRDFRecord.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public java.util.Optional<com.mobi.rdf.api.Resource> getLinksToRecord_resource()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToRecord_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, com.mobi.rdf.api.Resource.class));
        } else {
            return java.util.Optional.empty();
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
    public java.util.Optional<Commit> getLinksToCommit()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToCommit_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, Commit.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public java.util.Optional<com.mobi.rdf.api.Resource> getLinksToCommit_resource()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(MobiAnalytic_Thing.linksToCommit_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, com.mobi.rdf.api.Resource.class));
        } else {
            return java.util.Optional.empty();
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

    @Override
    public boolean addUnversionedDistribution(Distribution arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(UnversionedRecord.unversionedDistribution_IRI));
    }

    @Override
    public boolean removeUnversionedDistribution(Distribution arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(UnversionedRecord.unversionedDistribution_IRI));
    }

    @Override
    public java.util.Set<Distribution> getUnversionedDistribution()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(UnversionedRecord.unversionedDistribution_IRI));
        return valueConverterRegistry.convertValues(value, this, Distribution.class);
    }

    @Override
    public java.util.Set<com.mobi.rdf.api.Resource> getUnversionedDistribution_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(UnversionedRecord.unversionedDistribution_IRI));
        return valueConverterRegistry.convertValues(value, this, com.mobi.rdf.api.Resource.class);
    }

    @Override
    public void setUnversionedDistribution(java.util.Set<Distribution> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(UnversionedRecord.unversionedDistribution_IRI));
    }

    @Override
    public boolean clearUnversionedDistribution() {
        return clearProperty(valueFactory.createIRI(UnversionedRecord.unversionedDistribution_IRI));
    }

    @Override
    public java.util.Optional<Catalog> getCatalog()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(Record.catalog_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, Catalog.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public java.util.Optional<com.mobi.rdf.api.Resource> getCatalog_resource()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(Record.catalog_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, com.mobi.rdf.api.Resource.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setCatalog(Catalog arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Record.catalog_IRI));
    }

    @Override
    public boolean clearCatalog() {
        return clearProperty(valueFactory.createIRI(Record.catalog_IRI));
    }

    @Override
    public boolean addKeyword(Literal arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Record.keyword_IRI));
    }

    @Override
    public boolean removeKeyword(Literal arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Record.keyword_IRI));
    }

    @Override
    public java.util.Set<Literal> getKeyword()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(Record.keyword_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setKeyword(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(Record.keyword_IRI));
    }

    @Override
    public boolean clearKeyword() {
        return clearProperty(valueFactory.createIRI(Record.keyword_IRI));
    }

}

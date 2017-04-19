
package org.matonto.ontology.core.api.ontologies.ontologyeditor;

/*-
 * #%L
 * org.matonto.ontology.api
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

import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.MCAT_Thing;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmException;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.impl.ThingImpl;


/**
 * This implementation of the 'http://matonto.org/ontologies/ontology-editor#OntologyRecord' entity will allow developers to work in native java POJOs.
 * 
 */
public class OntologyRecordImpl
    extends ThingImpl
    implements MCAT_Thing, Record, VersionedRDFRecord, VersionedRecord, OntologyEditor_Thing, OntologyRecord, Thing
{


    /**
     * Construct a new OntologyRecord with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this OntologyRecord
     * @param backingModel
     *     The backing dataset/model of this OntologyRecord
     * @param subjectIri
     *     The subject of this OntologyRecord
     * @param valueFactory
     *     The value factory to use for this OntologyRecord
     */
    public OntologyRecordImpl(final Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new OntologyRecord with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this OntologyRecord
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this OntologyRecord
     * @param subjectIriStr
     *     The subject of this OntologyRecord
     * @param valueFactory
     *     The value factory to use for this OntologyRecord
     */
    public OntologyRecordImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public java.util.Optional<IRI> getOntologyIRI()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(OntologyRecord.ontologyIRI_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, IRI.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setOntologyIRI(IRI arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(OntologyRecord.ontologyIRI_IRI));
    }

    @Override
    public java.util.Optional<org.matonto.catalog.api.ontologies.mcat.Branch> getMasterBranch()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(VersionedRDFRecord.masterBranch_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, org.matonto.catalog.api.ontologies.mcat.Branch.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setMasterBranch(org.matonto.catalog.api.ontologies.mcat.Branch arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(VersionedRDFRecord.masterBranch_IRI));
    }

    @Override
    public java.util.Set<org.matonto.catalog.api.ontologies.mcat.Branch> getBranch()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(VersionedRDFRecord.branch_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.catalog.api.ontologies.mcat.Branch.class);
    }

    @Override
    public void setBranch(java.util.Set<org.matonto.catalog.api.ontologies.mcat.Branch> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(VersionedRDFRecord.branch_IRI));
    }

    @Override
    public java.util.Set<Thing> getInfluenced()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(MCAT_Thing.influenced_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public void setInfluenced(java.util.Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(MCAT_Thing.influenced_IRI));
    }

    @Override
    public java.util.Set<org.matonto.catalog.api.ontologies.mcat.Version> getVersion()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(VersionedRecord.version_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.catalog.api.ontologies.mcat.Version.class);
    }

    @Override
    public void setVersion(java.util.Set<org.matonto.catalog.api.ontologies.mcat.Version> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(VersionedRecord.version_IRI));
    }

    @Override
    public java.util.Optional<org.matonto.catalog.api.ontologies.mcat.Version> getLatestVersion()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(VersionedRecord.latestVersion_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, org.matonto.catalog.api.ontologies.mcat.Version.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setLatestVersion(org.matonto.catalog.api.ontologies.mcat.Version arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(VersionedRecord.latestVersion_IRI));
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
    public void setCatalog(Catalog arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(Record.catalog_IRI));
    }

}

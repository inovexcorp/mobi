
package org.matonto.prov.api.ontologies.mobiprov;

/*-
 * #%L
 * org.matonto.prov.api
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

import java.util.Date;
import org.matonto.ontologies.provo.Agent;
import org.matonto.ontologies.provo.Association;
import org.matonto.ontologies.provo.Communication;
import org.matonto.ontologies.provo.End;
import org.matonto.ontologies.provo.Start;
import org.matonto.ontologies.provo.Usage;
import org.matonto.ontologies.provo._Thing;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmException;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.impl.ThingImpl;


/**
 * This implementation of the 'http://matonto.org/ontologies/prov#SystemActivity' entity will allow developers to work in native java POJOs.
 * 
 */
public class SystemActivityImpl
    extends ThingImpl
    implements org.matonto.ontologies.provo.Activity, _Thing, MobiProv_Thing, SystemActivity, Thing
{


    /**
     * Construct a new SystemActivity with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this SystemActivity
     * @param backingModel
     *     The backing dataset/model of this SystemActivity
     * @param subjectIri
     *     The subject of this SystemActivity
     * @param valueFactory
     *     The value factory to use for this SystemActivity
     */
    public SystemActivityImpl(final org.matonto.rdf.api.Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new SystemActivity with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this SystemActivity
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this SystemActivity
     * @param subjectIriStr
     *     The subject of this SystemActivity
     * @param valueFactory
     *     The value factory to use for this SystemActivity
     */
    public SystemActivityImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public boolean addWasAssociatedWith(Agent arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasAssociatedWith_IRI));
    }

    @Override
    public boolean removeWasAssociatedWith(Agent arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasAssociatedWith_IRI));
    }

    @Override
    public java.util.Set<Agent> getWasAssociatedWith()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasAssociatedWith_IRI));
        return valueConverterRegistry.convertValues(value, this, Agent.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getWasAssociatedWith_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasAssociatedWith_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setWasAssociatedWith(java.util.Set<Agent> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasAssociatedWith_IRI));
    }

    @Override
    public boolean addEndedAtTime(Date arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.endedAtTime_IRI));
    }

    @Override
    public boolean removeEndedAtTime(Date arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.endedAtTime_IRI));
    }

    @Override
    public java.util.Set<Date> getEndedAtTime()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.endedAtTime_IRI));
        return valueConverterRegistry.convertValues(value, this, Date.class);
    }

    @Override
    public void setEndedAtTime(java.util.Set<Date> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.endedAtTime_IRI));
    }

    @Override
    public boolean addQualifiedAssociation(Association arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedAssociation_IRI));
    }

    @Override
    public boolean removeQualifiedAssociation(Association arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedAssociation_IRI));
    }

    @Override
    public java.util.Set<Association> getQualifiedAssociation()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedAssociation_IRI));
        return valueConverterRegistry.convertValues(value, this, Association.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getQualifiedAssociation_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedAssociation_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setQualifiedAssociation(java.util.Set<Association> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedAssociation_IRI));
    }

    @Override
    public boolean addQualifiedEnd(End arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedEnd_IRI));
    }

    @Override
    public boolean removeQualifiedEnd(End arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedEnd_IRI));
    }

    @Override
    public java.util.Set<End> getQualifiedEnd()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedEnd_IRI));
        return valueConverterRegistry.convertValues(value, this, End.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getQualifiedEnd_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedEnd_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setQualifiedEnd(java.util.Set<End> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedEnd_IRI));
    }

    @Override
    public boolean addWasEndedBy(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasEndedBy_IRI));
    }

    @Override
    public boolean removeWasEndedBy(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasEndedBy_IRI));
    }

    @Override
    public java.util.Set<org.matonto.ontologies.provo.Entity> getWasEndedBy()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasEndedBy_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.ontologies.provo.Entity.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getWasEndedBy_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasEndedBy_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setWasEndedBy(java.util.Set<org.matonto.ontologies.provo.Entity> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasEndedBy_IRI));
    }

    @Override
    public boolean addQualifiedUsage(Usage arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedUsage_IRI));
    }

    @Override
    public boolean removeQualifiedUsage(Usage arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedUsage_IRI));
    }

    @Override
    public java.util.Set<Usage> getQualifiedUsage()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedUsage_IRI));
        return valueConverterRegistry.convertValues(value, this, Usage.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getQualifiedUsage_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedUsage_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setQualifiedUsage(java.util.Set<Usage> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedUsage_IRI));
    }

    @Override
    public boolean addQualifiedStart(Start arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedStart_IRI));
    }

    @Override
    public boolean removeQualifiedStart(Start arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedStart_IRI));
    }

    @Override
    public java.util.Set<Start> getQualifiedStart()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedStart_IRI));
        return valueConverterRegistry.convertValues(value, this, Start.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getQualifiedStart_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedStart_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setQualifiedStart(java.util.Set<Start> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedStart_IRI));
    }

    @Override
    public boolean addWasInformedBy(org.matonto.ontologies.provo.Activity arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasInformedBy_IRI));
    }

    @Override
    public boolean removeWasInformedBy(org.matonto.ontologies.provo.Activity arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasInformedBy_IRI));
    }

    @Override
    public java.util.Set<org.matonto.ontologies.provo.Activity> getWasInformedBy()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasInformedBy_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.ontologies.provo.Activity.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getWasInformedBy_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasInformedBy_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setWasInformedBy(java.util.Set<org.matonto.ontologies.provo.Activity> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasInformedBy_IRI));
    }

    @Override
    public boolean addInvalidated(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.invalidated_IRI));
    }

    @Override
    public boolean removeInvalidated(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.invalidated_IRI));
    }

    @Override
    public java.util.Set<org.matonto.ontologies.provo.Entity> getInvalidated()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.invalidated_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.ontologies.provo.Entity.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getInvalidated_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.invalidated_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setInvalidated(java.util.Set<org.matonto.ontologies.provo.Entity> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.invalidated_IRI));
    }

    @Override
    public boolean addStartedAtTime(Date arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.startedAtTime_IRI));
    }

    @Override
    public boolean removeStartedAtTime(Date arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.startedAtTime_IRI));
    }

    @Override
    public java.util.Set<Date> getStartedAtTime()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.startedAtTime_IRI));
        return valueConverterRegistry.convertValues(value, this, Date.class);
    }

    @Override
    public void setStartedAtTime(java.util.Set<Date> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.startedAtTime_IRI));
    }

    @Override
    public boolean addGenerated(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.generated_IRI));
    }

    @Override
    public boolean removeGenerated(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.generated_IRI));
    }

    @Override
    public java.util.Set<org.matonto.ontologies.provo.Entity> getGenerated()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.generated_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.ontologies.provo.Entity.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getGenerated_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.generated_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setGenerated(java.util.Set<org.matonto.ontologies.provo.Entity> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.generated_IRI));
    }

    @Override
    public boolean addUsed(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.used_IRI));
    }

    @Override
    public boolean removeUsed(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.used_IRI));
    }

    @Override
    public java.util.Set<org.matonto.ontologies.provo.Entity> getUsed()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.used_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.ontologies.provo.Entity.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getUsed_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.used_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setUsed(java.util.Set<org.matonto.ontologies.provo.Entity> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.used_IRI));
    }

    @Override
    public boolean addQualifiedCommunication(Communication arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedCommunication_IRI));
    }

    @Override
    public boolean removeQualifiedCommunication(Communication arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedCommunication_IRI));
    }

    @Override
    public java.util.Set<Communication> getQualifiedCommunication()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedCommunication_IRI));
        return valueConverterRegistry.convertValues(value, this, Communication.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getQualifiedCommunication_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedCommunication_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setQualifiedCommunication(java.util.Set<Communication> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.qualifiedCommunication_IRI));
    }

    @Override
    public boolean addWasStartedBy(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasStartedBy_IRI));
    }

    @Override
    public boolean removeWasStartedBy(org.matonto.ontologies.provo.Entity arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasStartedBy_IRI));
    }

    @Override
    public java.util.Set<org.matonto.ontologies.provo.Entity> getWasStartedBy()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasStartedBy_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.ontologies.provo.Entity.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getWasStartedBy_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasStartedBy_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setWasStartedBy(java.util.Set<org.matonto.ontologies.provo.Entity> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(org.matonto.ontologies.provo.Activity.wasStartedBy_IRI));
    }

    @Override
    public boolean addInfluenced(Thing arg)
        throws OrmException
    {
        return this.addProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(_Thing.influenced_IRI));
    }

    @Override
    public boolean removeInfluenced(Thing arg)
        throws OrmException
    {
        return this.removeProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(_Thing.influenced_IRI));
    }

    @Override
    public java.util.Set<Thing> getInfluenced()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(_Thing.influenced_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public java.util.Set<org.matonto.rdf.api.Resource> getInfluenced_resource()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(_Thing.influenced_IRI));
        return valueConverterRegistry.convertValues(value, this, org.matonto.rdf.api.Resource.class);
    }

    @Override
    public void setInfluenced(java.util.Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(_Thing.influenced_IRI));
    }

}

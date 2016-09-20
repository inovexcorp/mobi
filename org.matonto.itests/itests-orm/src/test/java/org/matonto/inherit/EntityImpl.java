
package org.matonto.inherit;

/*-
 * #%L
 * itests-orm
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.xmlns.foaf._0._1.Agent;
import com.xmlns.foaf._0._1.Image;
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
 * This implementation of the 'http://matonto.org/ontologies/test#entity' entity will allow developers to work in native java POJOs.
 * 
 */
public class EntityImpl
    extends ThingImpl
    implements Agent, com.xmlns.foaf._0._1.Person, com.xmlns.foaf._0._1.SpatialThing, Entity, Thing
{


    /**
     * Construct a new Entity with the subject IRI and the backing dataset
     * 
     * @param valueConverterRegistry
     *     The ValueConversionRegistry for this Entity
     * @param backingModel
     *     The backing dataset/model of this Entity
     * @param subjectIri
     *     The subject of this Entity
     * @param valueFactory
     *     The value factory to use for this Entity
     */
    public EntityImpl(final Resource subjectIri, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConverterRegistry) {
        super(subjectIri, backingModel, valueFactory, valueConverterRegistry);
    }

    /**
     * Construct a new Entity with the subject IRI and the backing dataset
     * 
     * @param backingModel
     *     The backing dataset/model of this Entity
     * @param valueConversionRegistry
     *     The ValueConversionRegistry for this Entity
     * @param subjectIriStr
     *     The subject of this Entity
     * @param valueFactory
     *     The value factory to use for this Entity
     */
    public EntityImpl(final String subjectIriStr, final Model backingModel, final ValueFactory valueFactory, final ValueConverterRegistry valueConversionRegistry) {
        super(subjectIriStr, backingModel, valueFactory, valueConversionRegistry);
    }

    @Override
    public java.util.Set<String> getReligion()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(religion_IRI));
        return valueConverterRegistry.convertValues(value, this, String.class);
    }

    @Override
    public void setReligion(java.util.Set<String> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(religion_IRI));
    }

    @Override
    public java.util.Set<Literal> getGeekcode()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(geekcode_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setGeekcode(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(geekcode_IRI));
    }

    @Override
    public java.util.Set<Literal> getFirstName()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(firstName_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setFirstName(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(firstName_IRI));
    }

    @Override
    public java.util.Set<Literal> getLastName()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(lastName_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setLastName(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(lastName_IRI));
    }

    @Override
    public java.util.Set<Literal> getSurname()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(surname_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setSurname(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(surname_IRI));
    }

    @Override
    public java.util.Set<Literal> getFamily_name()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(family_name_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setFamily_name(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(family_name_IRI));
    }

    @Override
    public java.util.Set<Literal> getFamilyName()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(familyName_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setFamilyName(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(familyName_IRI));
    }

    @Override
    public java.util.Set<Literal> getPlan()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(plan_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setPlan(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(plan_IRI));
    }

    @Override
    public java.util.Set<Image> getImg()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(img_IRI));
        return valueConverterRegistry.convertValues(value, this, Image.class);
    }

    @Override
    public void setImg(java.util.Set<Image> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(img_IRI));
    }

    @Override
    public java.util.Set<Literal> getMyersBriggs()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(myersBriggs_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setMyersBriggs(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(myersBriggs_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Document> getWorkplaceHomepage()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(workplaceHomepage_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Document.class);
    }

    @Override
    public void setWorkplaceHomepage(java.util.Set<com.xmlns.foaf._0._1.Document> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(workplaceHomepage_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Document> getWorkInfoHomepage()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(workInfoHomepage_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Document.class);
    }

    @Override
    public void setWorkInfoHomepage(java.util.Set<com.xmlns.foaf._0._1.Document> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(workInfoHomepage_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Document> getSchoolHomepage()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(schoolHomepage_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Document.class);
    }

    @Override
    public void setSchoolHomepage(java.util.Set<com.xmlns.foaf._0._1.Document> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(schoolHomepage_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Person> getKnows()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(knows_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Person.class);
    }

    @Override
    public void setKnows(java.util.Set<com.xmlns.foaf._0._1.Person> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(knows_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Document> getPublications()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(publications_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Document.class);
    }

    @Override
    public void setPublications(java.util.Set<com.xmlns.foaf._0._1.Document> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(publications_IRI));
    }

    @Override
    public java.util.Set<Thing> getCurrentProject()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(currentProject_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public void setCurrentProject(java.util.Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(currentProject_IRI));
    }

    @Override
    public java.util.Set<Thing> getPastProject()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(pastProject_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public void setPastProject(java.util.Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(pastProject_IRI));
    }

    @Override
    public java.util.Set<Thing> getMbox()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(mbox_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public void setMbox(java.util.Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(mbox_IRI));
    }

    @Override
    public java.util.Set<Literal> getMbox_sha1sum()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(mbox_sha1sum_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setMbox_sha1sum(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(mbox_sha1sum_IRI));
    }

    @Override
    public java.util.Optional<Literal> getGender()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(gender_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, Literal.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setGender(Literal arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(gender_IRI));
    }

    @Override
    public java.util.Set<Literal> getJabberID()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(jabberID_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setJabberID(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(jabberID_IRI));
    }

    @Override
    public java.util.Set<Literal> getAimChatID()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(aimChatID_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setAimChatID(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(aimChatID_IRI));
    }

    @Override
    public java.util.Set<Literal> getSkypeID()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(skypeID_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setSkypeID(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(skypeID_IRI));
    }

    @Override
    public java.util.Set<Literal> getIcqChatID()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(icqChatID_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setIcqChatID(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(icqChatID_IRI));
    }

    @Override
    public java.util.Set<Literal> getYahooChatID()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(yahooChatID_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setYahooChatID(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(yahooChatID_IRI));
    }

    @Override
    public java.util.Set<Literal> getMsnChatID()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(msnChatID_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setMsnChatID(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(msnChatID_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Document> getWeblog()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(weblog_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Document.class);
    }

    @Override
    public void setWeblog(java.util.Set<com.xmlns.foaf._0._1.Document> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(weblog_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Document> getOpenid()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(openid_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Document.class);
    }

    @Override
    public void setOpenid(java.util.Set<com.xmlns.foaf._0._1.Document> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(openid_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Document> getTipjar()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(tipjar_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Document.class);
    }

    @Override
    public void setTipjar(java.util.Set<com.xmlns.foaf._0._1.Document> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(tipjar_IRI));
    }

    @Override
    public java.util.Set<Thing> getMade()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(made_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public void setMade(java.util.Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(made_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.Document> getInterest()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(interest_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.Document.class);
    }

    @Override
    public void setInterest(java.util.Set<com.xmlns.foaf._0._1.Document> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(interest_IRI));
    }

    @Override
    public java.util.Set<Thing> getTopic_interest()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(topic_interest_IRI));
        return valueConverterRegistry.convertValues(value, this, Thing.class);
    }

    @Override
    public void setTopic_interest(java.util.Set<Thing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(topic_interest_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.OnlineAccount> getAccount()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(account_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.OnlineAccount.class);
    }

    @Override
    public void setAccount(java.util.Set<com.xmlns.foaf._0._1.OnlineAccount> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(account_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.OnlineAccount> getHoldsAccount()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(holdsAccount_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.OnlineAccount.class);
    }

    @Override
    public void setHoldsAccount(java.util.Set<com.xmlns.foaf._0._1.OnlineAccount> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(holdsAccount_IRI));
    }

    @Override
    public java.util.Optional<Literal> getBirthday()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(birthday_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, Literal.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setBirthday(Literal arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(birthday_IRI));
    }

    @Override
    public java.util.Optional<Literal> getAge()
        throws OrmException
    {
        final java.util.Optional<Value> value = getProperty(valueFactory.createIRI(age_IRI));
        if (value.isPresent()) {
            return java.util.Optional.of(valueConverterRegistry.convertValue(value.get(), this, Literal.class));
        } else {
            return java.util.Optional.empty();
        }
    }

    @Override
    public void setAge(Literal arg)
        throws OrmException
    {
        setProperty(valueConverterRegistry.convertType(arg, this), valueFactory.createIRI(age_IRI));
    }

    @Override
    public java.util.Set<Literal> getStatus()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(status_IRI));
        return valueConverterRegistry.convertValues(value, this, Literal.class);
    }

    @Override
    public void setStatus(java.util.Set<Literal> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(status_IRI));
    }

    @Override
    public java.util.Set<com.xmlns.foaf._0._1.SpatialThing> getBased_near()
        throws OrmException
    {
        final java.util.Set<Value> value = getProperties(valueFactory.createIRI(based_near_IRI));
        return valueConverterRegistry.convertValues(value, this, com.xmlns.foaf._0._1.SpatialThing.class);
    }

    @Override
    public void setBased_near(java.util.Set<com.xmlns.foaf._0._1.SpatialThing> arg)
        throws OrmException
    {
        setProperties(valueConverterRegistry.convertTypes(arg, this), valueFactory.createIRI(based_near_IRI));
    }

}

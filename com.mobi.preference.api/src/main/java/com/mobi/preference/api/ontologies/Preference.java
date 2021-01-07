
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

import java.util.Optional;
import java.util.Set;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmException;
import com.mobi.rdf.orm.Thing;


/**
 * Generated class representing things with the type: http://mobi.com/ontologies/preference#Preference
 * 
 */
public interface Preference extends Preference_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://mobi.com/ontologies/preference#Preference";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2000/01/rdf-schema#Literal
     * 
     */
    public final static String hasDataValue_IRI = "http://mobi.com/ontologies/preference#hasDataValue";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: null
     * 
     */
    public final static String hasObjectValue_IRI = "http://mobi.com/ontologies/preference#hasObjectValue";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://mobi.com/ontologies/user/management#User
     * 
     */
    public final static String forUser_IRI = "http://mobi.com/ontologies/preference#forUser";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends Preference> DEFAULT_IMPL = PreferenceImpl.class;

    /**
     * Get the hasDataValue property from this instance of a http://mobi.com/ontologies/preference#Preference' type.<br><br>
     * 
     * @return
     *     The hasDataValue {@link java.util.Optional<com.mobi.rdf.api.Literal>} value for this instance
     */
    public Optional<Literal> getHasDataValue()
        throws OrmException
    ;

    public void setHasDataValue(Literal arg)
        throws OrmException
    ;

    /**
     * Clear the hasDataValue property from this instance of a http://mobi.com/ontologies/preference#Preference.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasDataValue();

    public boolean addHasObjectValue(Thing arg)
        throws OrmException
    ;

    public boolean removeHasObjectValue(Thing arg)
        throws OrmException
    ;

    /**
     * Get the hasObjectValue property from this instance of a http://mobi.com/ontologies/preference#Preference' type.<br><br>
     * 
     * @return
     *     The hasObjectValue {@link java.util.Set<com.mobi.rdf.orm.Thing>} value for this instance
     */
    public Set<Thing> getHasObjectValue()
        throws OrmException
    ;

    /**
     * Get the hasObjectValue property from this instance of a http://mobi.com/ontologies/preference#Preference' type.<br><br>
     * 
     * @return
     *     The hasObjectValue {@link java.util.Set<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Set<Resource> getHasObjectValue_resource()
        throws OrmException
    ;

    public void setHasObjectValue(Set<Thing> arg)
        throws OrmException
    ;

    /**
     * Clear the hasObjectValue property from this instance of a http://mobi.com/ontologies/preference#Preference.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasObjectValue();

    public boolean addForUser(Thing arg)
        throws OrmException
    ;

    public boolean removeForUser(Thing arg)
        throws OrmException
    ;

    /**
     * Get the forUser property from this instance of a http://mobi.com/ontologies/preference#Preference' type.<br><br>
     * 
     * @return
     *     The forUser {@link java.util.Set<com.mobi.rdf.orm.Thing>} value for this instance
     */
    public Set<Thing> getForUser()
        throws OrmException
    ;

    /**
     * Get the forUser property from this instance of a http://mobi.com/ontologies/preference#Preference' type.<br><br>
     * 
     * @return
     *     The forUser {@link java.util.Set<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Set<Resource> getForUser_resource()
        throws OrmException
    ;

    public void setForUser(Set<Thing> arg)
        throws OrmException
    ;

    /**
     * Clear the forUser property from this instance of a http://mobi.com/ontologies/preference#Preference.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearForUser();

}


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
import com.mobi.rdf.orm.OrmException;


/**
 * Generated class representing things with the type: http://mobi.com/ontologies/preference#Prefix
 * 
 */
public interface Prefix extends Preference_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://mobi.com/ontologies/preference#Prefix";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#string
     * 
     */
    public final static String hasPrefix_IRI = "http://mobi.com/ontologies/preference#hasPrefix";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#string
     * 
     */
    public final static String hasNamespace_IRI = "http://mobi.com/ontologies/preference#hasNamespace";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends Prefix> DEFAULT_IMPL = PrefixImpl.class;

    /**
     * Get the hasPrefix property from this instance of a http://mobi.com/ontologies/preference#Prefix' type.<br><br>
     * 
     * @return
     *     The hasPrefix {@link java.util.Optional<java.lang.String>} value for this instance
     */
    public Optional<String> getHasPrefix()
        throws OrmException
    ;

    public void setHasPrefix(String arg)
        throws OrmException
    ;

    /**
     * Clear the hasPrefix property from this instance of a http://mobi.com/ontologies/preference#Prefix.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasPrefix();

    /**
     * Get the hasNamespace property from this instance of a http://mobi.com/ontologies/preference#Prefix' type.<br><br>
     * 
     * @return
     *     The hasNamespace {@link java.util.Optional<java.lang.String>} value for this instance
     */
    public Optional<String> getHasNamespace()
        throws OrmException
    ;

    public void setHasNamespace(String arg)
        throws OrmException
    ;

    /**
     * Clear the hasNamespace property from this instance of a http://mobi.com/ontologies/preference#Prefix.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasNamespace();

}

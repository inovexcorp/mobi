
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

import java.util.Set;
import com.xmlns.foaf._0._1.Person;
import org.matonto.rdf.orm.OrmException;
import org.matonto.rdf.orm.Thing;


/**
 * Generated class representing things with the type: http://matonto.org/ontologies/test#entity
 * 
 */
public interface Entity extends Person, Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://matonto.org/ontologies/test#entity";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#string
     * 
     */
    public final static String religion_IRI = "http://matonto.org/ontologies/test#religion";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends Entity> DEFAULT_IMPL = EntityImpl.class;

    /**
     * Get the religion property from this instance of a http://matonto.org/ontologies/test#entity' type.<br><br>Religion
     * 
     * @return
     *     The religion {@link java.util.Set<java.lang.String>} value for this instance
     */
    public Set<String> getReligion()
        throws OrmException
    ;

    public void setReligion(Set<String> arg)
        throws OrmException
    ;

}

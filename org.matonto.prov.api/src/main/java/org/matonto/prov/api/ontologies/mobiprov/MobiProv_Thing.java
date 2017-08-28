
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

import java.util.Set;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.orm.OrmException;
import org.matonto.rdf.orm.Thing;

public interface MobiProv_Thing
    extends Thing
{

    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: null
     * 
     */
    public final static String influenced_IRI = "http://www.w3.org/ns/prov#influenced";

    public boolean addInfluenced(Thing arg)
        throws OrmException
    ;

    public boolean removeInfluenced(Thing arg)
        throws OrmException
    ;

    /**
     * Get the influenced property from this instance of a org.matonto.prov.api.ontologies.mobiprov.MobiProv_Thing' type.<br><br>
     * 
     * @return
     *     The influenced {@link java.util.Set<org.matonto.rdf.orm.Thing>} value for this instance
     */
    public Set<Thing> getInfluenced()
        throws OrmException
    ;

    /**
     * Get the influenced property from this instance of a org.matonto.prov.api.ontologies.mobiprov.MobiProv_Thing' type.<br><br>
     * 
     * @return
     *     The influenced {@link java.util.Set<org.matonto.rdf.api.Resource>} value for this instance
     */
    public Set<Resource> getInfluenced_resource()
        throws OrmException
    ;

    public void setInfluenced(Set<Thing> arg)
        throws OrmException
    ;

}


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

import org.matonto.ontologies.provo.Activity;


/**
 * Generated class representing things with the type: http://matonto.org/ontologies/prov#UpdateActivity
 * 
 */
public interface UpdateActivity extends Activity, MobiProv_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://matonto.org/ontologies/prov#UpdateActivity";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends UpdateActivity> DEFAULT_IMPL = UpdateActivityImpl.class;

}

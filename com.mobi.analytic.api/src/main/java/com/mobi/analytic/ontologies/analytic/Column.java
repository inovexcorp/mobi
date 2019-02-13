
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
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmException;


/**
 * Generated class representing things with the type: http://mobi.com/ontologies/analytic#Column
 * 
 */
public interface Column extends MobiAnalytic_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://mobi.com/ontologies/analytic#Column";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#integer
     * 
     */
    public final static String hasIndex_IRI = "http://mobi.com/ontologies/analytic#hasIndex";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#anyURI
     * 
     */
    public final static String hasProperty_IRI = "http://mobi.com/ontologies/analytic#hasProperty";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends Column> DEFAULT_IMPL = ColumnImpl.class;

    /**
     * Get the hasIndex property from this instance of a http://mobi.com/ontologies/analytic#Column' type.<br><br>The index for the column being described.
     * 
     * @return
     *     The hasIndex {@link java.util.Optional<java.lang.Integer>} value for this instance
     */
    public Optional<Integer> getHasIndex()
        throws OrmException
    ;

    public void setHasIndex(Integer arg)
        throws OrmException
    ;

    /**
     * Clear the hasIndex property from this instance of a http://mobi.com/ontologies/analytic#Column.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasIndex();

    /**
     * Get the hasProperty property from this instance of a http://mobi.com/ontologies/analytic#Column' type.<br><br>The property for the column being described.
     * 
     * @return
     *     The hasProperty {@link java.util.Optional<com.mobi.rdf.api.IRI>} value for this instance
     */
    public Optional<IRI> getHasProperty()
        throws OrmException
    ;

    /**
     * Get the hasProperty property from this instance of a http://mobi.com/ontologies/analytic#Column' type.<br><br>The property for the column being described.
     * 
     * @return
     *     The hasProperty {@link java.util.Optional<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Optional<Resource> getHasProperty_resource()
        throws OrmException
    ;

    public void setHasProperty(IRI arg)
        throws OrmException
    ;

    /**
     * Clear the hasProperty property from this instance of a http://mobi.com/ontologies/analytic#Column.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasProperty();

}

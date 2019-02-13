
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
import java.util.Set;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmException;


/**
 * Generated class representing things with the type: http://mobi.com/ontologies/analytic#TableConfiguration
 * 
 */
public interface TableConfiguration extends Configuration, MobiAnalytic_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://mobi.com/ontologies/analytic#TableConfiguration";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#anyURI
     * 
     */
    public final static String hasRow_IRI = "http://mobi.com/ontologies/analytic#hasRow";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://mobi.com/ontologies/analytic#Column
     * 
     */
    public final static String hasColumn_IRI = "http://mobi.com/ontologies/analytic#hasColumn";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends TableConfiguration> DEFAULT_IMPL = TableConfigurationImpl.class;

    /**
     * Get the hasRow property from this instance of a http://mobi.com/ontologies/analytic#TableConfiguration' type.<br><br>The type of thing in each row of the table analytic.
     * 
     * @return
     *     The hasRow {@link java.util.Optional<com.mobi.rdf.api.IRI>} value for this instance
     */
    public Optional<IRI> getHasRow()
        throws OrmException
    ;

    /**
     * Get the hasRow property from this instance of a http://mobi.com/ontologies/analytic#TableConfiguration' type.<br><br>The type of thing in each row of the table analytic.
     * 
     * @return
     *     The hasRow {@link java.util.Optional<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Optional<Resource> getHasRow_resource()
        throws OrmException
    ;

    public void setHasRow(IRI arg)
        throws OrmException
    ;

    /**
     * Clear the hasRow property from this instance of a http://mobi.com/ontologies/analytic#TableConfiguration.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasRow();

    public boolean addHasColumn(Column arg)
        throws OrmException
    ;

    public boolean removeHasColumn(Column arg)
        throws OrmException
    ;

    /**
     * Get the hasColumn property from this instance of a http://mobi.com/ontologies/analytic#TableConfiguration' type.<br><br>The property to display in each column of the table analytic.
     * 
     * @return
     *     The hasColumn {@link java.util.Set<com.mobi.analytic.ontologies.analytic.Column>} value for this instance
     */
    public Set<Column> getHasColumn()
        throws OrmException
    ;

    /**
     * Get the hasColumn property from this instance of a http://mobi.com/ontologies/analytic#TableConfiguration' type.<br><br>The property to display in each column of the table analytic.
     * 
     * @return
     *     The hasColumn {@link java.util.Set<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Set<Resource> getHasColumn_resource()
        throws OrmException
    ;

    public void setHasColumn(Set<Column> arg)
        throws OrmException
    ;

    /**
     * Clear the hasColumn property from this instance of a http://mobi.com/ontologies/analytic#TableConfiguration.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasColumn();

}


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
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmException;


/**
 * Generated class representing things with the type: http://mobi.com/ontologies/analytic#AnalyticRecord
 * 
 */
public interface AnalyticRecord extends MobiAnalytic_Thing, UnversionedRecord
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://mobi.com/ontologies/analytic#AnalyticRecord";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://mobi.com/ontologies/analytic#Configuration
     * 
     */
    public final static String hasConfig_IRI = "http://mobi.com/ontologies/analytic#hasConfig";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends AnalyticRecord> DEFAULT_IMPL = AnalyticRecordImpl.class;

    /**
     * Get the hasConfig property from this instance of a http://mobi.com/ontologies/analytic#AnalyticRecord' type.<br><br>The configuration used to produce the analytic.
     * 
     * @return
     *     The hasConfig {@link java.util.Optional<com.mobi.analytic.ontologies.analytic.Configuration>} value for this instance
     */
    public Optional<Configuration> getHasConfig()
        throws OrmException
    ;

    /**
     * Get the hasConfig property from this instance of a http://mobi.com/ontologies/analytic#AnalyticRecord' type.<br><br>The configuration used to produce the analytic.
     * 
     * @return
     *     The hasConfig {@link java.util.Optional<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Optional<Resource> getHasConfig_resource()
        throws OrmException
    ;

    public void setHasConfig(Configuration arg)
        throws OrmException
    ;

    /**
     * Clear the hasConfig property from this instance of a http://mobi.com/ontologies/analytic#AnalyticRecord.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearHasConfig();

}


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

import java.util.Set;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmException;


/**
 * Generated class representing things with the type: http://mobi.com/ontologies/analytic#Configuration
 * 
 */
public interface Configuration extends MobiAnalytic_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://mobi.com/ontologies/analytic#Configuration";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://mobi.com/ontologies/dataset#DatasetRecord
     * 
     */
    public final static String datasetRecord_IRI = "http://mobi.com/ontologies/analytic#datasetRecord";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends Configuration> DEFAULT_IMPL = ConfigurationImpl.class;

    public boolean addDatasetRecord(DatasetRecord arg)
        throws OrmException
    ;

    public boolean removeDatasetRecord(DatasetRecord arg)
        throws OrmException
    ;

    /**
     * Get the datasetRecord property from this instance of a http://mobi.com/ontologies/analytic#Configuration' type.<br><br>The DatasetRecord(s) used to produce the analytic.
     * 
     * @return
     *     The datasetRecord {@link java.util.Set<com.mobi.dataset.ontology.dataset.DatasetRecord>} value for this instance
     */
    public Set<DatasetRecord> getDatasetRecord()
        throws OrmException
    ;

    /**
     * Get the datasetRecord property from this instance of a http://mobi.com/ontologies/analytic#Configuration' type.<br><br>The DatasetRecord(s) used to produce the analytic.
     * 
     * @return
     *     The datasetRecord {@link java.util.Set<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Set<Resource> getDatasetRecord_resource()
        throws OrmException
    ;

    public void setDatasetRecord(Set<DatasetRecord> arg)
        throws OrmException
    ;

    /**
     * Clear the datasetRecord property from this instance of a http://mobi.com/ontologies/analytic#Configuration.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearDatasetRecord();

}

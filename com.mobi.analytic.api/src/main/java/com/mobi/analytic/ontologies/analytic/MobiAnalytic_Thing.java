
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
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmException;
import com.mobi.rdf.orm.Thing;

public interface MobiAnalytic_Thing
    extends Thing
{

    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://mobi.com/ontologies/catalog#Branch
     * 
     */
    public final static String linksToBranch_IRI = "http://mobi.com/ontologies/dataset#linksToBranch";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: null
     * 
     */
    public final static String influenced_IRI = "http://www.w3.org/ns/prov#influenced";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://mobi.com/ontologies/catalog#VersionedRDFRecord
     * 
     */
    public final static String linksToRecord_IRI = "http://mobi.com/ontologies/dataset#linksToRecord";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://mobi.com/ontologies/catalog#Commit
     * 
     */
    public final static String linksToCommit_IRI = "http://mobi.com/ontologies/dataset#linksToCommit";

    /**
     * Get the linksToBranch property from this instance of a com.mobi.analytic.ontologies.analytic.MobiAnalytic_Thing' type.<br><br>
     * 
     * @return
     *     The linksToBranch {@link java.util.Optional<com.mobi.catalog.api.ontologies.mcat.Branch>} value for this instance
     */
    public Optional<Branch> getLinksToBranch()
        throws OrmException
    ;

    /**
     * Get the linksToBranch property from this instance of a com.mobi.analytic.ontologies.analytic.MobiAnalytic_Thing' type.<br><br>
     * 
     * @return
     *     The linksToBranch {@link java.util.Optional<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Optional<Resource> getLinksToBranch_resource()
        throws OrmException
    ;

    public void setLinksToBranch(Branch arg)
        throws OrmException
    ;

    /**
     * Clear the linksToBranch property from this instance of a null.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearLinksToBranch();

    public boolean addInfluenced(Thing arg)
        throws OrmException
    ;

    public boolean removeInfluenced(Thing arg)
        throws OrmException
    ;

    /**
     * Get the influenced property from this instance of a com.mobi.analytic.ontologies.analytic.MobiAnalytic_Thing' type.<br><br>
     * 
     * @return
     *     The influenced {@link java.util.Set<com.mobi.rdf.orm.Thing>} value for this instance
     */
    public Set<Thing> getInfluenced()
        throws OrmException
    ;

    /**
     * Get the influenced property from this instance of a com.mobi.analytic.ontologies.analytic.MobiAnalytic_Thing' type.<br><br>
     * 
     * @return
     *     The influenced {@link java.util.Set<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Set<Resource> getInfluenced_resource()
        throws OrmException
    ;

    public void setInfluenced(Set<Thing> arg)
        throws OrmException
    ;

    /**
     * Clear the influenced property from this instance of a null.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearInfluenced();

    /**
     * Get the linksToRecord property from this instance of a com.mobi.analytic.ontologies.analytic.MobiAnalytic_Thing' type.<br><br>
     * 
     * @return
     *     The linksToRecord {@link java.util.Optional<com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord>} value for this instance
     */
    public Optional<VersionedRDFRecord> getLinksToRecord()
        throws OrmException
    ;

    /**
     * Get the linksToRecord property from this instance of a com.mobi.analytic.ontologies.analytic.MobiAnalytic_Thing' type.<br><br>
     * 
     * @return
     *     The linksToRecord {@link java.util.Optional<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Optional<Resource> getLinksToRecord_resource()
        throws OrmException
    ;

    public void setLinksToRecord(VersionedRDFRecord arg)
        throws OrmException
    ;

    /**
     * Clear the linksToRecord property from this instance of a null.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearLinksToRecord();

    /**
     * Get the linksToCommit property from this instance of a com.mobi.analytic.ontologies.analytic.MobiAnalytic_Thing' type.<br><br>
     * 
     * @return
     *     The linksToCommit {@link java.util.Optional<com.mobi.catalog.api.ontologies.mcat.Commit>} value for this instance
     */
    public Optional<Commit> getLinksToCommit()
        throws OrmException
    ;

    /**
     * Get the linksToCommit property from this instance of a com.mobi.analytic.ontologies.analytic.MobiAnalytic_Thing' type.<br><br>
     * 
     * @return
     *     The linksToCommit {@link java.util.Optional<com.mobi.rdf.api.Resource>} value for this instance
     */
    public Optional<Resource> getLinksToCommit_resource()
        throws OrmException
    ;

    public void setLinksToCommit(Commit arg)
        throws OrmException
    ;

    /**
     * Clear the linksToCommit property from this instance of a null.
     * 
     * @return
     *     Whether or not data was removed for this property/instance
     */
    public boolean clearLinksToCommit();

}

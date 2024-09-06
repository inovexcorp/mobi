package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;

import java.io.File;

public interface CompiledResourceManager {

    /**
     * Gets the Model which represents the compiled resource at the instance of the Commit identified by the provided
     * Resource using previous Commit data to construct it.
     *
     * @param commitId  The Resource identifying the Commit identifying the spot in the entity's history that you wish
     *                  to retrieve.
     * @param conn      A RepositoryConnection for lookup.
     * @param entityIds Optional list of entity {@link Resource}s to filter the compiled resource by
     * @return Model which represents the resource at the Commit's point in history.
     * @throws IllegalArgumentException Thrown if the Commit could not be found.
     */
    Model getCompiledResource(Resource commitId, RepositoryConnection conn, Resource... entityIds);

    /**
     * Gets the Model which represents the compiled resource at the instance of the Commit identified by the provided
     * Resource using previous Commit data to construct it.
     *
     * @param versionedRDFRecordId The Resource identifying the Record from where the Branch should originate.
     * @param branchId             The Resource identifying the Branch from where the Commit should originate.
     * @param commitId             The Resource identifying the Commit identifying the spot in the entity's history that
     *                             you wish to retrieve.
     * @param conn                 A RepositoryConnection for lookup.
     * @param entityIds            Optional list of entity {@link Resource}s to filter the compiled resource by
     * @return Model which represents the resource at the Commit's point in history.
     * @throws IllegalArgumentException Thrown if the Commit could not be found.
     */
    Model getCompiledResource(Resource versionedRDFRecordId, Resource branchId, Resource commitId,
                              RepositoryConnection conn, Resource... entityIds);

    /**
     * Gets the File which represents the compiled resource at the instance of the Commit identified by the provided
     * Resource using previous Commit data to construct it.
     *
     * @param commitId  The Resource identifying the Commit identifying the spot in the entity's history that you wish
     *                  to retrieve.
     * @param rdfFormat The RDF serialization format of the file.
     * @param conn      The RepositoryConnection used to retrieve the resource.
     * @param entityIds Optional list of entity {@link Resource}s to filter the compiled resource by
     * @return A {@link File} which represents the resource at the Commit's point in history.
     */
    File getCompiledResourceFile(Resource commitId, RDFFormat rdfFormat, RepositoryConnection conn,
                                 Resource... entityIds);
}

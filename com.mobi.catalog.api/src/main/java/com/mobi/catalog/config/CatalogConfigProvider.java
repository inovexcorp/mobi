package com.mobi.catalog.config;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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


import com.mobi.rdf.api.IRI;
import com.mobi.repository.api.Repository;

public interface CatalogConfigProvider {
    /**
     * Returns the ID of the Repository which should store all catalog data.
     *
     * @return The ID of the catalog Repository
     */
    String getRepositoryId();

    /**
     * Returns the ID of the Repository which should store all catalog data.
     *
     * @return The ID of the catalog Repository
     */
    Repository getRepository();

    /**
     * Returns the IRI for the distributed Catalog.
     *
     * @return The IRI which identifies the distributed Catalog.
     */
    IRI getDistributedCatalogIRI();

    /**
     * Returns the IRI for the local Catalog.
     *
     * @return The IRI which identifies the local Catalog.
     */
    IRI getLocalCatalogIRI();
}

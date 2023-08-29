package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component
public class SimpleCatalogManager implements CatalogManager {
    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    ThingManager thingManager;

    @Reference
    CatalogFactory catalogFactory;

    @Override
    public Catalog getDistributedCatalog(RepositoryConnection conn) {
        return thingManager.getExpectedObject(configProvider.getDistributedCatalogIRI(), catalogFactory, conn);
    }

    @Override
    public Catalog getLocalCatalog(RepositoryConnection conn) {
        return thingManager.getExpectedObject(configProvider.getLocalCatalogIRI(), catalogFactory, conn);
    }
}

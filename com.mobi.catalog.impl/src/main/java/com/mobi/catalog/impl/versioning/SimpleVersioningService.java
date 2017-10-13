package com.mobi.catalog.impl.versioning;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.BaseVersioningService;
import com.mobi.catalog.api.versioning.VersioningService;

@Component(
        immediate = true,
        provide = { VersioningService.class, SimpleVersioningService.class }
)
public class SimpleVersioningService extends BaseVersioningService<VersionedRDFRecord> {
    @Reference
    protected void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    protected void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Override
    public String getTypeIRI() {
        return VersionedRDFRecord.TYPE;
    }
}

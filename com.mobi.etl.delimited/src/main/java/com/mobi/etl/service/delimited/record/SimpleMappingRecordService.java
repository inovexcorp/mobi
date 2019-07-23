package com.mobi.etl.service.delimited.record;

/*-
 * #%L
 * com.mobi.etl.delimited
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.record.AbstractMappingRecordService;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.etl.api.ontologies.delimited.MappingRecordFactory;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;

@Component(
        immediate = true,
        provide = { RecordService.class, SimpleMappingRecordService.class }
)
public class SimpleMappingRecordService extends AbstractMappingRecordService<MappingRecord> {

    @Reference
    void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    void setUtilsService(CatalogUtilsService utilsService) {
        this.utilsService = utilsService;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
    }

    @Reference
    void setVf(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    void setRecordFactory(MappingRecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    void setMergeRequestManager(MergeRequestManager mergeRequestManager) {
        this.mergeRequestManager = mergeRequestManager;
    }

    @Reference
    void setPolicyManager(XACMLPolicyManager xacmlPolicyManager) {
        this.xacmlPolicyManager = xacmlPolicyManager;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setCatalogConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setManager(MappingManager manager) {
        this.manager = manager;
    }

    @Activate
    public void activate() {
        checkForMissingPolicies();
    }

    @Override
    public Class<MappingRecord> getType() {
        return MappingRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return MappingRecord.TYPE;
    }
}

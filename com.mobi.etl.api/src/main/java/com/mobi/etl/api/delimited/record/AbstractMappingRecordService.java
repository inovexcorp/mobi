package com.mobi.etl.api.delimited.record;

/*-
 * #%L
 * com.mobi.etl.api
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

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.delimited.record.config.MappingRecordCreateSettings;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;

public abstract class AbstractMappingRecordService<T extends MappingRecord> extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    protected MappingManager manager;

    private static final String USER_IRI_BINDING = "%USERIRI%";
    private static final String RECORD_IRI_BINDING = "%RECORDIRI%";
    private static final String ENCODED_RECORD_IRI_BINDING = "%RECORDIRIENCODED%";
    private static final String MASTER_BRANCH_IRI_BINDING = "%MASTER%";

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified);
        Branch masterBranch = createMasterBranch(record);
        MappingWrapper mapping = createMapping(config);
        conn.begin();
        addRecord(record, masterBranch, conn);

        IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
        Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                new IllegalStateException("MappingRecord must have a master Branch"));
        Model model = mapping.getModel();
        versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId, user, "The initial commit.", model,
                null, conn);
        conn.commit();
        writePolicies(user, record);
        return record;
    }

    protected Resource writeRecordPolicy(Resource user, Resource recordId, Resource masterBranchId) {
        try {
            // Record Policy
            InputStream recordPolicyStream = AbstractMappingRecordService.class
                    .getResourceAsStream("/mappingRecordPolicy.xml");
            String encodedRecordIRI = ResourceUtils.encode(recordId);

            String[] search = {USER_IRI_BINDING, RECORD_IRI_BINDING, ENCODED_RECORD_IRI_BINDING,
                    MASTER_BRANCH_IRI_BINDING};
            String[] replace = {user.stringValue(), recordId.stringValue(), encodedRecordIRI,
                    masterBranchId.stringValue()};
            String recordPolicy = StringUtils.replaceEach(IOUtils.toString(recordPolicyStream, "UTF-8"),
                    search, replace);

            return addPolicy(recordPolicy);
        } catch (IOException e) {
            throw new MobiException("Error writing record policy.", e);
        }
    }

    private MappingWrapper createMapping(RecordOperationConfig config) {
        MappingWrapper mapping;
        try {
            if (config.get(MappingRecordCreateSettings.INPUT_STREAM) != null
                    && config.get(MappingRecordCreateSettings.RDF_FORMAT) != null) {
                mapping = manager.createMapping(config.get(MappingRecordCreateSettings.INPUT_STREAM),
                        config.get(MappingRecordCreateSettings.RDF_FORMAT));
            } else if (config.get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA) != null) {
                mapping = manager.createMapping(config.get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA));
            } else {
                throw new IllegalArgumentException("Mapping config does not have the correct settings for initial "
                        + "data.");
            }
            return mapping;
        } catch (IOException e) {
            throw new MobiException("Error creating mapping", e);
        }
    }
}

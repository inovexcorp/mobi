package com.mobi.etl.api.delimited.record;

/*-
 * #%L
 * com.mobi.etl.api
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

import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.record.statistic.Statistic;
import com.mobi.catalog.api.record.statistic.StatisticDefinition;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.delimited.record.config.MappingRecordCreateSettings;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ResourceUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.osgi.service.component.annotations.Reference;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;

public abstract class AbstractMappingRecordService<T extends MappingRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    private static final String CLASS_MAPPINGS_STATISTIC_QUERY;
    private static final StatisticDefinition CLASS_MAPPINGS_STATISTIC_DEFINITION;

    static {
        try {
            CLASS_MAPPINGS_STATISTIC_QUERY = IOUtils.toString(Objects.requireNonNull(AbstractMappingRecordService.class
                    .getResourceAsStream("/total-class-mappings.rq")), StandardCharsets.UTF_8);
            CLASS_MAPPINGS_STATISTIC_DEFINITION = new StatisticDefinition(
                    "totalClassMappings", "The total number of Class Mappings.");
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public MappingManager manager;

    private static final String USER_IRI_BINDING = "%USERIRI%";
    private static final String RECORD_IRI_BINDING = "%RECORDIRI%";
    private static final String ENCODED_RECORD_IRI_BINDING = "%RECORDIRIENCODED%";
    private static final String MASTER_BRANCH_IRI_BINDING = "%MASTER%";

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified);
        MasterBranch masterBranch = createMasterBranch(record);
        MappingWrapper mapping = createMapping(config);

        IRI catalogIdIRI = vf.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
        Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                new IllegalStateException("MappingRecord must have a master Branch"));
        Model model = mapping.getModel();
        File versionedRdf = null;
        InitialLoad initialLoad = null;
        try {
            Path tmpFile = Files.createTempFile(null, ".ttl");
            Rio.write(model, Files.newOutputStream(tmpFile), RDFFormat.TURTLE);
            versionedRdf = tmpFile.toFile();
            initialLoad = loadHeadGraph(masterBranch, user, versionedRdf);

            conn.begin();
            addRecord(record, masterBranch, conn);
            commitManager.addInProgressCommit(catalogIdIRI, record.getResource(), initialLoad.ipc(), conn);
            Resource initialCommitIRI = versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId,
                    user, "The initial commit.", conn);
            Commit initialCommit = commitManager.getCommit(initialCommitIRI, conn).orElseThrow(
                    () -> new IllegalStateException("Could not retrieve commit " + initialCommitIRI.stringValue()));
            initialCommit.setInitialRevision(initialLoad.initialRevision());
            initialCommit.getModel().addAll(initialLoad.initialRevision().getModel());
            thingManager.updateObject(initialCommit, conn);

            conn.commit();
            writePolicies(user, record);
            versionedRdf.delete();
        } catch (IOException e) {
            throw new MobiException(e);
        } catch (Exception e) {
            Revision revision = null;
            if (initialLoad != null) {
                revision = initialLoad.initialRevision();
            }
            handleError(masterBranch, revision, versionedRdf, e);
        }
        return record;
    }

    @Override
    protected Resource writeRecordPolicy(Resource user, Resource recordId, Resource masterBranchId) {
        // Record Policy
        Path recordPolicyPath = Paths.get(System.getProperty("karaf.etc") + File.separator + "policies"
                + File.separator + "policyTemplates" + File.separator + "mappingRecordPolicy.xml");
        try (InputStream data = Files.newInputStream(recordPolicyPath)) {
            String recordPolicy = new String(data.readAllBytes(), StandardCharsets.UTF_8);
            String encodedRecordIRI = ResourceUtils.encode(recordId);

            String[] search = {USER_IRI_BINDING, RECORD_IRI_BINDING, ENCODED_RECORD_IRI_BINDING,
                    MASTER_BRANCH_IRI_BINDING};
            String[] replace = {user.stringValue(), recordId.stringValue(), encodedRecordIRI,
                    masterBranchId.stringValue()};
            recordPolicy = StringUtils.replaceEach(recordPolicy, search, replace);

            return addPolicy(recordPolicy);
        } catch (IOException e) {
            throw new MobiException("Error writing record policy.", e);
        }
    }

    @Override
    public List<Statistic> getStatistics(Resource recordId, RepositoryConnection conn) {
        return List.of(
                getStatistic(recordId, conn, CLASS_MAPPINGS_STATISTIC_QUERY, CLASS_MAPPINGS_STATISTIC_DEFINITION)
        );
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

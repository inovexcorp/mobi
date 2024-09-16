package com.mobi.dataset.api.record;

/*-
 * #%L
 * com.mobi.dataset.api.record
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

import com.mobi.catalog.api.record.AbstractUnversionedRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.statistic.Statistic;
import com.mobi.catalog.api.record.statistic.StatisticDefinition;
import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.dataset.api.builder.OntologyIdentifier;
import com.mobi.dataset.api.record.config.DatasetRecordCreateSettings;
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ResourceUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Reference;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Semaphore;

public abstract class DatasetRecordService<T extends DatasetRecord>
        extends AbstractUnversionedRecordService<T> implements RecordService<T> {

    @Reference
    public DatasetFactory dsFactory;

    @Reference
    public DatasetUtilsService dsUtilsService;

    /**
     * Semaphore for protecting dataset IRI uniqueness checks.
     */
    private final Semaphore semaphore = new Semaphore(1, true);
    private static final String DEFAULT_DS_NAMESPACE = "http://mobi.com/dataset/";
    private static final String USER_IRI_BINDING = "%USERIRI%";
    private static final String RECORD_IRI_BINDING = "%RECORDIRI%";
    private static final String ENCODED_RECORD_IRI_BINDING = "%RECORDIRIENCODED%";
    private static final String TYPE_STATISTIC_QUERY;
    private static final String TRIPLES_STATISTIC_QUERY;
    private static final StatisticDefinition TYPE_STATISTIC_DEFINITION;
    private static final StatisticDefinition TRIPLES_STATISTIC_DEFINITION;

    static {
        try {
            TYPE_STATISTIC_QUERY = IOUtils.toString(Objects.requireNonNull(DatasetRecordService.class
                    .getResourceAsStream("/number-of-types.rq")), StandardCharsets.UTF_8);

            TRIPLES_STATISTIC_QUERY = IOUtils.toString(Objects.requireNonNull(DatasetRecordService.class
                    .getResourceAsStream("/number-of-triples.rq")), StandardCharsets.UTF_8);

            TYPE_STATISTIC_DEFINITION = new StatisticDefinition(
                    "totalTypes", "The total number of class types represented in the dataset.");
            TRIPLES_STATISTIC_DEFINITION = new StatisticDefinition(
                    "totalTriples", "The total number of triples contained in the dataset.");
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        try {
            semaphore.acquire();
            T datasetRecord = createRecordObject(config, issued, modified);
            String datasetConfig = config.get(DatasetRecordCreateSettings.DATASET);
            String repositoryId = config.get(DatasetRecordCreateSettings.REPOSITORY_ID);
            Set<OntologyIdentifier> ontologiesConfig = config.get(DatasetRecordCreateSettings.ONTOLOGIES);

            if (datasetConfig == null || StringUtils.isBlank(datasetConfig)) {
                datasetConfig = DEFAULT_DS_NAMESPACE + UUID.randomUUID();
            }
            IRI datasetIRI = vf.createIRI(datasetConfig);

            conn.begin();

            boolean success = dsUtilsService.createDataset(datasetIRI, repositoryId, iri -> {
                datasetRecord.setDataset(dsFactory.createNew(datasetIRI));
                datasetRecord.setRepository(repositoryId);
                Set<Value> ontologies = new HashSet<>();
                ontologiesConfig.forEach(identifier -> {
                    ontologies.add(identifier.getNode());
                    datasetRecord.getModel().addAll(identifier.getStatements());
                });
                datasetRecord.setOntology(ontologies);
                return true;
            });
            if (success) {
                thingManager.addObject(datasetRecord, conn);
            }
            conn.commit();

            writePolicies(user.getResource(), datasetRecord.getResource());
            return datasetRecord;
        } catch (InterruptedException e) {
            throw new MobiException(e);
        } finally {
            semaphore.release();
        }
    }

    @Override
    protected Optional<Resource> writeRecordPolicy(Resource user, Resource recordId) {
        try {
            Path recordPolicyPath = Paths.get(System.getProperty("karaf.etc") + File.separator + "policies"
                    + File.separator + "policyTemplates" + File.separator + "datasetRecordPolicy.xml");
            try (InputStream stream = Files.newInputStream(recordPolicyPath)) {
                String recordPolicy = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
                String encodedRecordIRI = ResourceUtils.encode(recordId);

                String[] search = {USER_IRI_BINDING, RECORD_IRI_BINDING, ENCODED_RECORD_IRI_BINDING};
                String[] replace = {user.stringValue(), recordId.stringValue(), encodedRecordIRI};
                recordPolicy = StringUtils.replaceEach(recordPolicy, search, replace);

                return Optional.of(addPolicy(recordPolicy));
            }
        } catch (IOException e) {
            throw new MobiException("Error writing record policy.", e);
        }
    }

    @Override
    protected void deleteRecord(T record, RepositoryConnection conn) {
        super.deleteRecord(record, conn);
        deletePolicies(record, conn);
    }

    @Override
    public List<Statistic> getStatistics(Resource recordId, RepositoryConnection conn) {
        List<Statistic> stats = new ArrayList<>();
        stats.add(getStatistic(recordId, conn, TYPE_STATISTIC_QUERY, TYPE_STATISTIC_DEFINITION));
        stats.add(getStatistic(recordId, conn, TRIPLES_STATISTIC_QUERY, TRIPLES_STATISTIC_DEFINITION));
        return stats;
    }

    /**
     * Overwrite Dataset Record with default policy.
     *
     * @param datasetRecord Dataset record to overwrite
     */
    public abstract void overwritePolicyDefault(DatasetRecord datasetRecord);
}

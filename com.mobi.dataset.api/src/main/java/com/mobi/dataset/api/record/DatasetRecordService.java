package com.mobi.dataset.api.record;

/*-
 * #%L
 * com.mobi.dataset.api.record
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import com.mobi.dataset.api.builder.OntologyIdentifier;
import com.mobi.dataset.api.record.config.DatasetRecordCreateSettings;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.exception.RepositoryException;
import org.apache.commons.io.IOUtils;
import org.osgi.service.component.annotations.Reference;
import org.apache.commons.lang.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Semaphore;

public abstract class DatasetRecordService<T extends DatasetRecord>
        extends AbstractUnversionedRecordService<T> implements RecordService<T> {

    @Reference
    public RepositoryManager repoManager;

    @Reference
    public DatasetFactory dsFactory;

    /**
     * Semaphore for protecting dataset IRI uniqueness checks.
     */
    private final Semaphore semaphore = new Semaphore(1, true);
    private static final String DEFAULT_DS_NAMESPACE = "http://mobi.com/dataset/";
    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";
    private static final String USER_IRI_BINDING = "%USERIRI%";
    private static final String RECORD_IRI_BINDING = "%RECORDIRI%";
    private static final String ENCODED_RECORD_IRI_BINDING = "%RECORDIRIENCODED%";

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
            IRI datasetIRI = valueFactory.createIRI(datasetConfig);
            IRI sdgIRI = valueFactory.createIRI(datasetConfig + SYSTEM_DEFAULT_NG_SUFFIX);

            if (conn.contains(datasetIRI, null, null)) {
                throw new IllegalArgumentException("The datasetIRI already exists in the specified repository.");
            }

            conn.begin();

            Repository dsRepo = repoManager.getRepository(repositoryId).orElseThrow(() ->
                    new IllegalArgumentException("Dataset target repository does not exist."));

            Dataset dataset = dsFactory.createNew(datasetIRI);
            dataset.setSystemDefaultNamedGraph(sdgIRI);

            datasetRecord.setDataset(dataset);
            datasetRecord.setRepository(repositoryId);
            Set<Value> ontologies = new HashSet<>();
            ontologiesConfig.forEach(identifier -> {
                ontologies.add(identifier.getNode());
                datasetRecord.getModel().addAll(identifier.getStatements());
            });
            datasetRecord.setOntology(ontologies);

            try (RepositoryConnection dsRepoConn = dsRepo.getConnection()) {
                dsRepoConn.add(dataset.getModel(), datasetIRI);
            } catch (RepositoryException e){
                throw new IllegalArgumentException(e.getMessage());
            }
            utilsService.addObject(datasetRecord, conn);
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
            InputStream recordPolicyStream = DatasetRecordService.class
                    .getResourceAsStream("/datasetRecordPolicy.xml");
            String encodedRecordIRI = ResourceUtils.encode(recordId);

            String[] search = {USER_IRI_BINDING, RECORD_IRI_BINDING, ENCODED_RECORD_IRI_BINDING};
            String[] replace = {user.stringValue(), recordId.stringValue(), encodedRecordIRI};
            String recordPolicy = StringUtils.replaceEach(IOUtils.toString(recordPolicyStream, StandardCharsets.UTF_8),
                    search, replace);

            return Optional.of(addPolicy(recordPolicy));
        } catch (IOException e) {
            throw new MobiException("Error writing record policy.", e);
        }
    }

    /**
     * Overwrite Dataset Record with default policy
     * @param datasetRecord Dataset record to overwrite
     */
    public abstract void overwritePolicyDefault(DatasetRecord datasetRecord);
}
package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.record.DatasetRecordService;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.utils.cli.Restore;
import com.mobi.utils.cli.api.PostRestoreOperation;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component(
        service = { DatasetNoPolicies.class, PostRestoreOperation.class }
)
public class DatasetNoPolicies implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(DatasetNoPolicies.class);
    private static final String FIND_DATASET_NO_POLICIES;

    static {
        try {
            FIND_DATASET_NO_POLICIES = IOUtils.toString(
                    Restore.class.getResourceAsStream("/findDatasetNoPolicy.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    protected CatalogConfigProvider config;

    @Reference
    protected DatasetManager datasetManager;

    @Reference
    protected DatasetRecordService datasetRecordService;

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 111;
    }

    @Override
    public VersionRange getVersionRange () throws InvalidVersionSpecificationException {
        return VersionRange.createFromVersionSpec("(0.1,]"); // All Versions
    }

    @Override
    public void execute() {
        LOGGER.debug(getClass().getSimpleName() + " execute");
        createDatesetPolicies();
    }

    /**
     * Create Dataset Policies for datasets that do not have polices.
     * <p>
     * Steps:
     * - Find all dataset records that does not have policies
     * - Create dataset policies for those records
     */
    protected void createDatesetPolicies() {
        List<Resource> datasetResources;
        try (RepositoryConnection conn = config.getRepository().getConnection()) {
            datasetResources = getDatasetNoPolicyResources(conn);
        }
        LOGGER.debug("There are " + datasetResources.size() + " dataset records without policies");
        LOGGER.trace("Records: " + datasetResources);

        List<DatasetRecord> datasetRecords = datasetResources.stream()
                .map(resource -> datasetManager.getDatasetRecord(resource))
                .filter(datasetRecord -> datasetRecord.isPresent())
                .map(datasetRecordOptional -> datasetRecordOptional.get())
                .collect(Collectors.toList());

        for (DatasetRecord datasetRecord : datasetRecords) {
            LOGGER.debug(String.format("Overwriting DatasetRecord Policy for %s", datasetRecord.getResource()));
            datasetRecordService.overwritePolicyDefault(datasetRecord);
        }
    }

    protected List<Resource> getDatasetNoPolicyResources(RepositoryConnection conn) {
        List<Resource> datasetResources = new ArrayList<>();
        TupleQueryResult results = conn.prepareTupleQuery(FIND_DATASET_NO_POLICIES).evaluate();
        results.forEach(bindingSet -> datasetResources.add(Bindings.requiredResource(bindingSet, "datasetRecord")));
        return datasetResources;
    }

}

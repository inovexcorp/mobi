package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api.record
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.statistic.Statistic;
import com.mobi.catalog.api.record.statistic.StatisticDefinition;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.security.policy.api.ontologies.policy.Policy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.query.QueryEvaluationException;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.explanation.Explanation;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/**
 * Defines basic functionality of a RecordService. Provides common methods for exporting and deleting a Record.
 * Subclasses of Record can override exportRecord() and deleteRecord() to perform Record specific operations.
 * @param <T> of Record
 */
public abstract class AbstractRecordService<T extends Record> implements RecordService<T> {

    private static final Logger LOGGER = LoggerFactory.getLogger(AbstractRecordService.class);
    private static final String CONFIG_PARAMETER = "Config parameter ";
    private static final String IS_REQUIRED = " is required.";

    @Reference
    public CatalogProvUtils provUtils;

    @Reference
    public ThingManager thingManager;

    @Reference
    public CatalogFactory catalogFactory;

    @Reference
    public XACMLPolicyManager xacmlPolicyManager;

    public OrmFactory<T> recordFactory;

    public final ValueFactory vf = new ValidatingValueFactory();

    @Override
    public T create(User user, RecordOperationConfig config, RepositoryConnection conn) {
        validateCreationConfig(config);
        CreateActivity createActivity = provUtils.startCreateActivity(user);
        try {
            OffsetDateTime now = OffsetDateTime.now();
            T record = createRecord(user, config, now, now, conn);
            provUtils.endCreateActivity(createActivity, record.getResource());
            return record;
        } catch (Exception e) {
            provUtils.removeActivity(createActivity);
            throw e;
        }
    }

    @Override
    public T delete(Resource recordId, User user, RepositoryConnection conn) {
        T record = getRecord(recordId, conn);
        DeleteActivity deleteActivity = provUtils.startDeleteActivity(user, recordId);
        try {
            conn.begin();
            deleteRecord(record, conn);
            conn.commit();
            provUtils.endDeleteActivity(deleteActivity, record);

            return record;
        } catch (Exception e) {
            provUtils.removeActivity(deleteActivity);
            throw e;
        }
    }

    @Override
    public void export(Resource recordId, RecordOperationConfig config, RepositoryConnection conn) {
        validateSettings(config);

        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        boolean exporterIsActive = exporter.isActive();
        if (!exporterIsActive) {
            exporter.startRDF();
        }
        T record = getRecord(recordId, conn);
        exportRecord(record, config, conn);
        if (!exporterIsActive) {
            exporter.endRDF();
        }
    }

    /**
     * Creates the recordObject then commits that object to the repository.
     *
     * @param user The {@link User} that is creating the Record
     * @param config A {@link RecordOperationConfig} that contains the record configuration
     * @param issued Time the record was issued
     * @param modified Time the record was modified
     * @param conn A {@link RepositoryConnection} to use for lookup
     * @return The record that was added to the repository
     */
    protected T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                             RepositoryConnection conn) {
        T recordObject = createRecordObject(config, issued, modified);
        conn.begin();
        thingManager.addObject(recordObject, conn);
        conn.commit();
        return recordObject;
    }

    /**
     * Generates a new record namespace and adds the properties from the config to that record.
     *
     * @param config A {@link RecordOperationConfig} that contains the record configuration
     * @param issued Time the record was issued
     * @param modified Time the record was modified
     * @return A {@link Record} of the provided config
     */
    protected T createRecordObject(RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified) {
        T record = recordFactory.createNew(vf.createIRI(Catalogs.RECORD_NAMESPACE + UUID.randomUUID()));
        Literal titleLiteral = vf.createLiteral(config.get(RecordCreateSettings.RECORD_TITLE));
        Literal issuedLiteral = vf.createLiteral(issued);
        Literal modifiedLiteral = vf.createLiteral(modified);
        Set<Value> publishers = config.get(RecordCreateSettings.RECORD_PUBLISHERS).stream()
                .map(user -> (Value) user.getResource())
                .collect(Collectors.toSet());
        IRI catalogIdIRI = vf.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
        record.setCatalog(catalogFactory.createNew(catalogIdIRI));

        record.setProperty(titleLiteral, vf.createIRI(_Thing.title_IRI));
        record.setProperty(issuedLiteral, vf.createIRI(_Thing.issued_IRI));
        record.setProperty(modifiedLiteral, vf.createIRI(_Thing.modified_IRI));
        record.setProperties(publishers, vf.createIRI(_Thing.publisher_IRI));
        if (config.get(RecordCreateSettings.RECORD_DESCRIPTION) != null
                && StringUtils.isNotEmpty(config.get(RecordCreateSettings.RECORD_DESCRIPTION))) {
            record.setProperty(vf.createLiteral(config.get(RecordCreateSettings.RECORD_DESCRIPTION)),
                    vf.createIRI(_Thing.description_IRI));
        }
        if (config.get(RecordCreateSettings.RECORD_MARKDOWN) != null
                && StringUtils.isNotEmpty(config.get(RecordCreateSettings.RECORD_MARKDOWN))) {
            record.setProperty(vf.createLiteral(config.get(RecordCreateSettings.RECORD_MARKDOWN)),
                    vf.createIRI(DCTERMS.ABSTRACT.stringValue()));
        }
        if (!config.get(RecordCreateSettings.RECORD_KEYWORDS).isEmpty()) {
            record.setKeyword(config.get(RecordCreateSettings.RECORD_KEYWORDS).stream()
                    .map(vf::createLiteral).collect(Collectors.toSet()));
        }
        return record;
    }

    /**
     * Method that specifies {@link Record} specific write behavior. Can be overridden by subclasses to apply specific
     * export behavior.
     *
     * @param record The {@link Record} to be exported
     * @param config A {@link RecordOperationConfig} that contains the export configuration.
     * @param conn A {@link RepositoryConnection} to the repo where the Record exists
     */
    protected void exportRecord(T record, RecordOperationConfig config, RepositoryConnection conn) {
        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        writeRecordData(record, exporter);
    }

    /**
     * Checks that the required passed in settings for a {@link RecordOperationConfig} are valid.
     *
     * @param config The {@link RecordOperationConfig} to validate settings
     * @throws IllegalArgumentException If a setting is not valid
     */
    protected void validateSettings(RecordOperationConfig config) {
        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        if (exporter == null) {
            throw new IllegalArgumentException("BatchExporter must not be null");
        }
    }

    /**
     * Gets a {@link Record} object from the associated factory.
     *
     * @param recordId {@link Resource} of the Record
     * @param conn A {@link RepositoryConnection} to use for lookup
     * @return A {@link Record} of the provided Resource
     */
    protected T getRecord(Resource recordId, RepositoryConnection conn) {
        return thingManager.optObject(recordId, recordFactory, conn).orElseThrow(()
                -> new IllegalArgumentException("Record " + recordId + " does not exist"));
    }

    /**
     * Method that specifies {@link Record} type specific delete behavior. Can be overridden by subclasses to apply
     * specific delete behavior.
     *
     * @param record The {@link Record} to be removed
     * @param conn A {@link RepositoryConnection} to use for lookup
     */
    protected void deleteRecord(T record, RepositoryConnection conn) {
        deleteRecordObject(record, conn);
    }

    /**
     * Removes the Record object from the repository.
     *
     * @param record Record to remove
     * @param conn A {@link RepositoryConnection} to use for lookup
     */
    protected void deleteRecordObject(T record, RepositoryConnection conn) {
        thingManager.removeObject(record, conn);
    }

    /**
     * Writes the base Record data to the provided ExportWriter.
     *
     * @param record The Record to write out
     * @param exporter The BatchExporter that writes the Record data
     */
    protected void writeRecordData(T record, BatchExporter exporter) {
        record.getModel().forEach(exporter::handleStatement);
    }

    /**
     * Verifies if the required config settings have a value.
     *
     * @param config The {@link RecordOperationConfig} to validate settings
     */

    protected void validateCreationConfig(RecordOperationConfig config) {
        if (config.get(RecordCreateSettings.CATALOG_ID) == null) {
            throw new IllegalArgumentException(CONFIG_PARAMETER + RecordCreateSettings.CATALOG_ID.getKey()
                    + IS_REQUIRED);
        }
        if (config.get(RecordCreateSettings.RECORD_PUBLISHERS).isEmpty()) {
            throw new IllegalArgumentException(CONFIG_PARAMETER + RecordCreateSettings.RECORD_PUBLISHERS.getKey()
                    + IS_REQUIRED);
        }
        if (config.get(RecordCreateSettings.RECORD_TITLE) == null) {
            throw new IllegalArgumentException(CONFIG_PARAMETER + RecordCreateSettings.RECORD_TITLE.getKey()
                    + IS_REQUIRED);
        }
    }

    @Override
    public Optional<List<Resource>> deleteBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                                 RepositoryConnection conn){
        return Optional.empty();
    }

    @Override
    public List<Statistic> getStatistics(Resource recordId, RepositoryConnection conn) {
        return List.of();
    }

    /**
     * Deletes the two Policy files associated with the provided Record.
     *
     * @param record The Record whose policies to delete
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void deletePolicies(T record, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null,
                vf.createIRI(Policy.relatedResource_IRI), record.getResource());
        if (results.hasNext()) {
            Resource recordPolicyId = results.next().getSubject();
            results.close();

            RepositoryResult<Statement> policyPolicyIds = conn.getStatements(null,
                    vf.createIRI(Policy.relatedResource_IRI), recordPolicyId);
            if (!policyPolicyIds.hasNext()) {
                LOGGER.info("Could not find policy policy for record: " + record.getResource()
                        + " with a policyId of: " + recordPolicyId + ". Continuing with record deletion.");
            }
            Resource policyPolicyId = policyPolicyIds.next().getSubject();
            xacmlPolicyManager.deletePolicy(recordPolicyId);
            xacmlPolicyManager.deletePolicy(policyPolicyId);
            policyPolicyIds.close();
        } else {
            LOGGER.info("Could not find policy for record: " + record.getResource()
                    + ". Continuing with record deletion.");
        }
    }

    /**
     * Executes a SPARQL query on the given repository connection and extracts statistics from the result set.
     * Assumption: The names of the statistics in the statisticDefinitions array must match
     * the binding names in the SPARQL query.
     *
     * @param query SPARQL query to execute
     * @param recordId the record ID to bind to the query if not null
     * @param statisticDefinition  Definition of the statistic to extract from the query result
     * @param conn  Repository connection to execute the query on
     *
     * @return The statistic if one exists
     */
    public Statistic getStatistic(Resource recordId, RepositoryConnection conn, String query,
                                         StatisticDefinition statisticDefinition) {
        AtomicReference<Statistic> statistic = new AtomicReference<>();
        try {
            TupleQuery tupleQuery = conn.prepareTupleQuery(QueryLanguage.SPARQL, query);
            if (recordId != null) {
                tupleQuery.setBinding("record", recordId);
            }
            try (TupleQueryResult result = tupleQuery.evaluate()) {
                result.forEach(bindings -> {
                    Value value = bindings.getValue(statisticDefinition.name());
                    if (value != null) {
                        try {
                            statistic.set(new Statistic(statisticDefinition, Integer.parseInt(value.stringValue())));
                        } catch (NumberFormatException e) {
                            LOGGER.trace("Error: Invalid integer value for statistic " + statisticDefinition.name());
                        }
                    } else {
                        LOGGER.trace("Error: Null value for statistic " + statisticDefinition.name());
                    }
                });
            }
            if (LOGGER.isTraceEnabled()) {
                LOGGER.trace(tupleQuery.explain(Explanation.Level.Timed).toString());
            }
        } catch (QueryEvaluationException e) {
            LOGGER.error(e.getMessage(), e);
        }
        return statistic.get();
    }
}

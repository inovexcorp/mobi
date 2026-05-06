package com.mobi.webhooks.impl.record;

/*-
 * #%L
 * com.mobi.webhooks.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecordFactory;
import com.mobi.webhooks.api.record.config.WebhookRecordCreateSettings;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Service implementation for handling operations related to {@link WebhookRecord}. This class
 * is responsible for creating, deleting, and managing the policies associated with webhook
 * records in the system. It leverages a configuration model to ensure the consistency and
 * validity of the records it manages.
 *
 * This class extends {@link AbstractUnversionedRecordService} and implements the
 * {@link RecordService} interface, specializing in handling {@link WebhookRecord} entities.
 *
 * Key features of this service include:
 * - Creation of webhook records while validating and applying configurations.
 * - Deletion of webhook records along with their associated configurations and policies.
 * - Writing access policies for webhook records.
 */
@Component(
        immediate = true,
        service = { RecordService.class, WebhookRecordServiceImpl.class }
)
public class WebhookRecordServiceImpl extends AbstractUnversionedRecordService<WebhookRecord>
        implements RecordService<WebhookRecord> {

    private static final Logger LOG = LoggerFactory.getLogger(WebhookRecordServiceImpl.class);
    private static final String USER_IRI_BINDING = "%USERIRI%";
    private static final String RECORD_IRI_BINDING = "%RECORDIRI%";
    private static final String ENCODED_RECORD_IRI_BINDING = "%RECORDIRIENCODED%";

    @Reference
    WebhookRecordFactory webhookRecordFactory;

    @Reference
    WebhookConfigurationService webhookConfigurationService;

    @Activate
    void start() {
        this.recordFactory = this.webhookRecordFactory;
    }

    @Override
    public Class<WebhookRecord> getType() {
        return WebhookRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return WebhookRecord.TYPE;
    }

    @Override
    protected WebhookRecord createRecord(User user, RecordOperationConfig config, OffsetDateTime issued,
                                         OffsetDateTime modified, RepositoryConnection conn) {
        final long startTime = System.currentTimeMillis();
        Model configModel = config.get(WebhookRecordCreateSettings.CONFIGURATION_MODEL);

        WebhookRecord webhookRecord = createRecordObject(config, issued, modified);
        LOG.debug("WebhookRecord object initialized: {}", webhookRecord.getResource());

        if (configModel != null) {
            LOG.debug("Beginning WebhookRecord creation with provided configuration model");
            webhookConfigurationService.validateConfiguration(configModel);
            webhookConfigurationService.createConfiguration(webhookRecord, configModel);
            LOG.debug("WebhookConfiguration from provided model added to record");
        } else {
            throw new IllegalArgumentException("WebhookRecord must be created with a configuration model");
        }

        conn.begin();
        thingManager.addObject(webhookRecord, conn);
        LOG.debug("WebhookRecord and configuration persisted to repository");
        conn.commit();

        writePolicies(user.getResource(), webhookRecord.getResource());
        LOG.debug("WebhookRecord creation completed in {}ms", calcTimeDiff(startTime));
        return webhookRecord;
    }

    @Override
    protected void deleteRecord(WebhookRecord record, RepositoryConnection conn) {
        final long startTime = System.currentTimeMillis();
        LOG.debug("Deleting WebhookRecord: {}", record.getResource());

        webhookConfigurationService.deleteConfiguration(record, conn);
        super.deleteRecord(record, conn);
        deletePolicies(record, conn);

        LOG.debug("WebhookRecord {} deletion complete in {}ms: ", record.getResource(), calcTimeDiff(startTime));
    }

    @Override
    protected Optional<Resource> writeRecordPolicy(Resource user, Resource recordId) {
        final long startTime = System.currentTimeMillis();
        LOG.debug("Now attempting to write policies for record: {}", recordId);
        try {
            Path recordPolicyPath = Paths.get(System.getProperty("karaf.etc") + File.separator + "policies"
                    + File.separator + "policyTemplates" + File.separator + "webhookRecordPolicy.xml");
            try (InputStream stream = Files.newInputStream(recordPolicyPath)) {
                String recordPolicy = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
                String encodedRecordIRI = ResourceUtils.encode(recordId);
                String[] search = {USER_IRI_BINDING, RECORD_IRI_BINDING, ENCODED_RECORD_IRI_BINDING};
                String[] replace = {user.stringValue(), recordId.stringValue(), encodedRecordIRI};
                recordPolicy = StringUtils.replaceEach(recordPolicy, search, replace);
                LOG.debug("Successful writing of policies for record: {} in {}ms", recordId, calcTimeDiff(startTime));
                return Optional.of(addPolicy(recordPolicy));
            }
        } catch (IOException e) {
            throw new MobiException("Error writing webhook record policy.", e);
        }
    }

    private long calcTimeDiff(long startTime) {
        return System.currentTimeMillis() - startTime;
    }
}

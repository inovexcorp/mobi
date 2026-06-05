package com.mobi.webhooks.impl;

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

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfigurationFactory;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;

import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.common.exception.ValidationException;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDF4J;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.eclipse.rdf4j.sail.shacl.ShaclSail;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * implementation of WebhookConfigurationService for managing webhook configurations.
 */
@Component(immediate = true, service = { WebhookConfigurationService.class })
public class WebhookConfigurationServiceImpl implements WebhookConfigurationService {

    private static final Logger LOG = LoggerFactory.getLogger(WebhookConfigurationServiceImpl.class);
    //TODO ensure removal of PLACEHOLDER method by MVP completion.
    private static final String PLACEHOLDER = "Method not implemented yet";
    private static final String GET_EVENT_FILTERS_QUERY;

    private final ConcurrentMap<Resource, String> eventFilters = new ConcurrentHashMap<>();
    protected final ValueFactory vf = new ValidatingValueFactory();

    static {
        try {
            GET_EVENT_FILTERS_QUERY = IOUtils.toString(
                    Objects.requireNonNull(WebhookConfigurationServiceImpl.class.getResourceAsStream("/get-webhook-event-filters.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    WebhookConfigurationFactory webhookConfigurationFactory;

    @Reference
    CatalogConfigProvider configProvider;

    @Activate
    @Modified
    void start() {
        eventFilters.clear();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(GET_EVENT_FILTERS_QUERY);
            try (TupleQueryResult result = query.evaluate()) {
                result.forEach(bindings -> {
                    Resource recordId = Bindings.requiredResource(bindings, "recordId");
                    String filterString = Bindings.requiredLiteral(bindings, "filterString").stringValue();
                    eventFilters.put(recordId, filterString);
                });
            }
        }
        LOG.debug("Populated eventFilters cache with {} entries", eventFilters.size());
    }

    @Override
    public void validateConfiguration(Model configModel) {
        IRI webhookConfigType = vf.createIRI(WebhookConfiguration.TYPE);
        long configCount = configModel.filter(null, RDF.TYPE, webhookConfigType).size();
        if (configCount != 1) {
            throw new IllegalArgumentException(
                    "Model must contain exactly one WebhookConfiguration, found: " + configCount);
        }
        Repository validationRepo = new SailRepository(new ShaclSail(new MemoryStore()));
        try (RepositoryConnection conn = validationRepo.getConnection()) {
            conn.begin();
            conn.add(configModel);
            conn.add(WebhookConfigurationService.class.getResource("/webhooks.ttl"), RDFFormat.TURTLE,
                    RDF4J.SHACL_SHAPE_GRAPH);
            conn.commit();
        } catch (IOException ex) {
            throw new MobiException("Could not read webhooks ontology for SHACL validation", ex);
        } catch (RepositoryException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof ValidationException ve) {
                Model report = ve.validationReportAsModel();
                StringWriter sw = new StringWriter();
                try {
                    Rio.write(report, sw, RDFFormat.TURTLE);
                } catch (Exception ignored) { /* best-effort */ }
                throw new IllegalArgumentException(
                        "WebhookConfiguration failed SHACL validation:\n" + sw, ex);
            }
            throw ex;
        } finally {
            validationRepo.shutDown();
        }
    }

    @Override
    public WebhookConfiguration getWebhookConfig(String recordIri) {
        LOG.info(PLACEHOLDER);
        return null;
    }

    @Override
    public PaginatedSearchResults<WebhookRecord> getWebhooks() {
        LOG.info(PLACEHOLDER);
        return null;
    }

    @Override
    public PaginatedSearchResults<WebhookRecord> getWebhooks(PaginatedSearchParams params) {
        LOG.info(PLACEHOLDER);
        return null;
    }

    @Override
    public void createConfiguration(WebhookRecord webhookRecord, Model configModel) {
        IRI webhookConfigType = vf.createIRI(WebhookConfiguration.TYPE);

        Resource configIRI = configModel.filter(null, RDF.TYPE, webhookConfigType).subjects().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No WebhookConfiguration found in model"));

        assertConfigUniqueness(configIRI);
        WebhookConfiguration webhookConfig = webhookConfigurationFactory.createNew(configIRI, configModel);

        webhookRecord.setHasWebhookConfiguration(webhookConfig);
        webhookRecord.getModel().addAll(webhookConfig.getModel());
        String filter = webhookConfig.getEventFilter()
                .orElseThrow(() -> new IllegalArgumentException("WebhookConfiguration is missing required eventFilter"));
        eventFilters.put(webhookRecord.getResource(), filter);
    }

    @Override
    public void updateConfiguration(WebhookRecord webhookRecord, Model configModel) {
        long start = System.currentTimeMillis();
        Resource recordIri = webhookRecord.getResource();
        LOG.debug("Updating WebhookConfiguration for WebhookRecord: {}", recordIri);

        validateConfiguration(configModel);

        Resource existingConfigIRI = webhookRecord.getHasWebhookConfiguration_resource()
                .orElseThrow(() -> new IllegalStateException(
                        "WebhookRecord " + recordIri + " does not have a linked configuration"));

        IRI webhookConfigType = vf.createIRI(WebhookConfiguration.TYPE);
        Resource newConfigResource = configModel.filter(null, RDF.TYPE, webhookConfigType)
                .subjects().iterator().next();

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            conn.begin();
            try {
                removeConfigHeaders(existingConfigIRI, recordIri, conn);
                conn.remove(existingConfigIRI, null, null, recordIri);

                IRI hasWebhookConfigIRI = vf.createIRI(WebhookRecord.hasWebhookConfiguration_IRI);
                conn.remove(recordIri, hasWebhookConfigIRI, existingConfigIRI, recordIri);
                conn.add(recordIri, hasWebhookConfigIRI, newConfigResource, recordIri);
                conn.add(configModel, recordIri);
                conn.commit();
            } catch (Exception ex) {
                conn.rollback();
                throw ex;
            }
        }

        // Extract new event filter and update cache
        WebhookConfiguration newConfig = webhookConfigurationFactory.getExisting(newConfigResource, configModel)
                .orElseThrow(() -> new MobiException("Could not resolve updated WebhookConfiguration"));
        String newFilter = newConfig.getEventFilter()
                .orElseThrow(() -> new IllegalStateException(
                        "WebhookConfiguration is missing required eventFilter"));

        String oldFilter = eventFilters.put(recordIri, newFilter);
        if (!newFilter.equals(oldFilter)) {
            LOG.debug("Event filter cache updated for record {}: was=[{}], now=[{}]", recordIri, oldFilter, newFilter);
        } else {
            LOG.debug("Event filter cache unchanged for record {}: [{}]", recordIri, newFilter);
        }
        LOG.debug("updateConfiguration for record {} completed in {}ms",
                recordIri, System.currentTimeMillis() - start);
    }

    @Override
    public void deleteConfiguration(WebhookRecord webhookRecord, RepositoryConnection conn) {
        long startTime = System.currentTimeMillis();
        LOG.debug("Deleting WebhookConfiguration linked to WebhookRecord: {}", webhookRecord.getResource());
        webhookRecord.getHasWebhookConfiguration_resource()
                .ifPresent(configIRI -> {
                    LOG.debug("Removing WebhookConfiguration: {}", configIRI);
                    removeConfigHeaders(configIRI, webhookRecord.getResource(), conn);
                    conn.remove(configIRI, null, null, webhookRecord.getResource());
                    LOG.debug("WebhookConfiguration deletion for record: {} complete in {}ms",
                            webhookRecord.getResource(), System.currentTimeMillis() - startTime);
                });
        eventFilters.remove(webhookRecord.getResource());
    }

    @Override
    public Map<Resource, String> retrieveEventFilters() {
        return Collections.unmodifiableMap(eventFilters);
    }

    private void removeConfigHeaders(Resource configIRI, Resource namedGraph, RepositoryConnection conn) {
        Set<Resource> headerIRIs = new HashSet<>();
        IRI hasRequestHeaderIRI = vf.createIRI(WebhookConfiguration.hasRequestHeader_IRI);
        conn.getStatements(configIRI, hasRequestHeaderIRI, null, namedGraph)
                .forEach(stmt -> {
                    if (stmt.getObject() instanceof Resource r) {
                        headerIRIs.add(r);
                    }
                });
        for (Resource headerIri : headerIRIs) {
            conn.remove(headerIri, null, null, namedGraph);
        }
    }

    private void assertConfigUniqueness(Resource configIRI) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (conn.hasStatement(configIRI, null, null, false)) {
                throw new IllegalArgumentException("Webhook configuration with IRI " + configIRI + " already exists");
            }
        }
    }
}

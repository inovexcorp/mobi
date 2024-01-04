package com.mobi.ontology.utils.cache.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
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


import com.google.common.collect.Maps;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyCreationService;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.utils.OntologyUtils;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.cache.repository.OntologyDatasets;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.repository.api.OsgiRepository;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;
import javax.cache.Cache;
import javax.cache.CacheManager;
import javax.cache.configuration.CacheEntryListenerConfiguration;
import javax.cache.configuration.Configuration;
import javax.cache.integration.CompletionListener;
import javax.cache.processor.EntryProcessor;
import javax.cache.processor.EntryProcessorException;
import javax.cache.processor.EntryProcessorResult;

@Component
public class OntologyCacheImpl implements OntologyCache {
    private static final String CACHE_NAME = "ontologyCache";
    private static final Logger LOG = LoggerFactory.getLogger(OntologyCacheImpl.class);
    protected final ValueFactory vf = new ValidatingValueFactory();
    protected final ModelFactory mf = new DynamicModelFactory();

    @Reference(target = "(id=" + CACHE_NAME + ")")
    protected OsgiRepository repository;

    @Reference
    protected DatasetUtilsService dsUtilsService;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    protected ThingManager thingManager;

    @Reference
    protected RecordManager recordManager;

    @Reference
    protected CommitManager commitManager;

    @Reference
    protected OntologyRecordFactory ontologyRecordFactory;

    @Reference
    protected OntologyCreationService ontologyCreationService;

    @Override
    public String generateKey(String recordIri, String commitIri) {
        return String.format("%s&%s", recordIri, commitIri);
    }

    @Override
    public void clearCacheImports(Resource ontologyIRI) {
        Set<String> cachesToRemove = new HashSet<>();
        for (Cache.Entry<String, Ontology> entry : this) {
            Set<? extends Resource> importedIRIs = entry.getValue().getImportedOntologyIRIs();
            if (importedIRIs.contains(ontologyIRI)) {
                cachesToRemove.add(entry.getKey());
            }
        }
        removeAll(cachesToRemove);
    }

    @Override
    public void clearCache(@Nonnull Resource recordId) {
        for (Cache.Entry<String, Ontology> entry : this) {
            if (entry.getKey().startsWith(recordId.stringValue())) {
                remove(entry.getKey());
            }
        }
    }

    @Override
    public void removeFromCache(String recordIdStr, String commitIdStr) {
        String key = generateKey(recordIdStr, commitIdStr);

        if (containsKey(key)) {
            remove(key);
        }
    }

    /**
     * Retrieve an ontology from cache using a key comprised of the RecordIRI and CommitIRI in the format of
     * recordIRI&commitIRI.
     *
     * @param key The String of the combined RecordIRI and CommitIRI
     * @return The Ontology in the cache associated with the key
     */
    @Override
    public Ontology get(String key) {
        LOG.debug("Retrieving ontology from cache for key " + key);
        requireNotClosed();
        IRI datasetIRI = OntologyDatasets.createDatasetIRIFromKey(key, vf);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false)) {
            return getValueFromRepo(dsConn, key);
        } catch (IllegalArgumentException e) {
            LOG.debug("Cache does not contain ontology for key " + key);
            return null;
        }
    }

    @Override
    public Map<String, Ontology> getAll(Set<? extends String> keys) {
        return keys.stream()
                .map(key -> Maps.immutableEntry(key, get(key)))
                .filter(entry -> entry.getValue() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    @Override
    public boolean containsKey(String key) {
        requireNotClosed();
        IRI datasetIRI = OntologyDatasets.createDatasetIRIFromKey(key, vf);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false)) {
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @Override
    public void loadAll(Set<? extends String> keys, boolean replaceExistingValues,
                        CompletionListener completionListener) {
        throw new UnsupportedOperationException("CompletionListener not supported in implementation.");
    }

    @Override
    public void put(String key, Ontology ontology) {
        LOG.debug("Putting ontology in cache for key " + key);
        requireNotClosed();
        IRI datasetIRI = OntologyDatasets.createDatasetIRIFromKey(key, vf);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, true)) {
            IRI ontNamedGraphIRI = OntologyDatasets.createSystemDefaultNamedGraphIRIFromKey(key, vf);
            putValueInRepo(ontology, ontNamedGraphIRI, dsConn);
        }

    }

    @Override
    public Ontology getAndPut(String key, Ontology ontology) {
        throw new UnsupportedOperationException("Cannot replace ontology. Old ontology must exist in the cache "
                + "when accessed.");
    }

    @Override
    public void putAll(Map<? extends String, ? extends Ontology> map) {
        map.forEach(this::put);
    }

    @Override
    public boolean putIfAbsent(String key, Ontology ontology) {
        requireNotClosed();
        IRI datasetIRI = OntologyDatasets.createDatasetIRIFromKey(key, vf);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false)) {
            return false;
        } catch (IllegalArgumentException e) {
            put(key, ontology);
            return true;
        }
    }

    @Override
    public boolean remove(String key) {
        requireNotClosed();
        IRI datasetIRI = OntologyDatasets.createDatasetIRIFromKey(key, vf);
        return removeValueFromRepo(datasetIRI);
    }

    @Override
    public boolean remove(String key, Ontology ontology) {
        requireNotClosed();
        IRI datasetIRI = OntologyDatasets.createDatasetIRIFromKey(key, vf);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false)) {
            Ontology repoOntology = getValueFromRepo(dsConn, key);
            if (ontology.equals(repoOntology)) {
                return removeValueFromRepo(datasetIRI);
            }
        }
        return false;
    }

    @Override
    public Ontology getAndRemove(String key) {
        throw new UnsupportedOperationException("Cannot remove ontology. It must exist in the cache when accessed.");
    }

    @Override
    public boolean replace(String key, Ontology ontology, Ontology newOntology) {
        requireNotClosed();
        IRI datasetIRI = OntologyDatasets.createDatasetIRIFromKey(key, vf);
        boolean success = false;
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false)) {
            Ontology repoOntology = getValueFromRepo(dsConn, key);
            if (ontology.equals(repoOntology)) {
                success = removeValueFromRepo(datasetIRI);
            }
        } catch (IllegalArgumentException e) {
            return false;
        }
        if (success) {
            put(key, newOntology);
            return true;
        }
        return false;
    }

    @Override
    public boolean replace(String key, Ontology ontology) {
        requireNotClosed();
        IRI datasetIRI = OntologyDatasets.createDatasetIRIFromKey(key, vf);
        boolean success;
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false)) {
            success = removeValueFromRepo(datasetIRI);
        } catch (IllegalArgumentException e) {
            return false;
        }
        if (success) {
            put(key, ontology);
            return true;
        }
        return false;
    }

    @Override
    public Ontology getAndReplace(String key, Ontology ontology) {
        throw new UnsupportedOperationException("Cannot replace ontology. Retrieved ontology must exist in the cache"
                + " when accessed.");
    }

    @Override
    public void removeAll(Set<? extends String> set) {
        set.forEach(this::remove);
    }

    @Override
    public void removeAll() {
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.clear();
        }
    }

    @Override
    public void clear() {
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.clear();
        }
    }

    @Override
    public <C extends Configuration<String, Ontology>> C getConfiguration(Class<C> clazz) {
        throw new UnsupportedOperationException("Method not supported for OntologyCache");
    }

    @Override
    public <T> T invoke(String key, EntryProcessor<String, Ontology, T> entryProcessor, Object... objects)
            throws EntryProcessorException {
        throw new UnsupportedOperationException("Invoke not supported in implementation.");
    }

    @Override
    public <T> Map<String, EntryProcessorResult<T>> invokeAll(Set<? extends String> set,
                                                              EntryProcessor<String, Ontology, T> entryProcessor,
                                                              Object... objects) {
        throw new UnsupportedOperationException("Invoke not supported in implementation.");
    }

    @Override
    public String getName() {
        return CACHE_NAME;
    }

    @Override
    public CacheManager getCacheManager() {
        throw new UnsupportedOperationException("Method not supported for OntologyCache");
    }

    @Override
    public void close() {
        throw new UnsupportedOperationException("Method not supported for OntologyCache");
    }

    @Override
    public boolean isClosed() {
        return false;
    }

    @Override
    public <T> T unwrap(Class<T> clazz) {
        if (clazz.isAssignableFrom(getClass())) {
            return clazz.cast(this);
        }
        throw new IllegalArgumentException("Unwrapping to " + clazz + " is not supported by this implementation");
    }

    @Override
    public void registerCacheEntryListener(CacheEntryListenerConfiguration<String,
            Ontology> cacheEntryListenerConfiguration) {
        throw new UnsupportedOperationException("CacheEntryListener not supported in implementation.");
    }

    @Override
    public void deregisterCacheEntryListener(CacheEntryListenerConfiguration<String,
            Ontology> cacheEntryListenerConfiguration) {
        throw new UnsupportedOperationException("CacheEntryListener not supported in implementation.");
    }

    @Override
    public Iterator<Cache.Entry<String, Ontology>> iterator() {
        try (RepositoryConnection conn = repository.getConnection()) {
            Set<String> keys = QueryResults.asList(
                            conn.getStatements(null, RDF.TYPE, vf.createIRI(Dataset.TYPE)))
                    .stream()
                    .map(Statement::getSubject)
                    .map(Resource::stringValue)
                    .map(resourceStr -> StringUtils.removeStart(resourceStr,
                            OntologyDatasets.DEFAULT_DS_NAMESPACE))
                    .map(ResourceUtils::decode)
                    .collect(Collectors.toSet());
            return getAll(keys)
                    .entrySet()
                    .stream()
                    .map(entry -> cacheEntryFor(entry.getKey(), entry.getValue()))
                    .collect(Collectors.toSet())
                    .iterator();
        }
    }

    private Ontology getValueFromRepo(DatasetConnection dsConn, String key) {
        updateDatasetTimestamp(dsConn);
        String[] ids = key.split(OntologyDatasets.CACHE_KEY_SEPARATOR);
        return retrieveOntologyByCommit(vf.createIRI(ids[0]), vf.createIRI(ids[1]))
                .orElseThrow(() -> new IllegalStateException("Ontology must exist in cache repository"));
    }

    private Optional<Ontology> retrieveOntologyByCommit(Resource recordId, Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.validateRecord(configProvider.getLocalCatalogIRI(), recordId,
                    ontologyRecordFactory.getTypeIRI(), conn);
            if (commitManager.commitInRecord(recordId, commitId, conn)) {
                return getOntology(recordId, commitId);
            }
            return Optional.empty();
        }
    }

    private Optional<Ontology> getOntology(Resource recordId, Resource commitId) {
        if (containsKey(String.format("%s&%s", recordId, commitId))) {
            return Optional.of(ontologyCreationService.createOntology(recordId, commitId));
        } else {
            return Optional.empty();
        }
    }

    private void putValueInRepo(Ontology ontology, IRI ontNamedGraphIRI, DatasetConnection dsConn) {
        LOG.debug("Adding ontology to cache dataset " + ontNamedGraphIRI.stringValue());
        Model ontologyModel = ontology.asModel();
        dsConn.addDefault(ontologyModel, ontNamedGraphIRI);
        Set<Ontology> importedOntologies = OntologyUtils.getImportedOntologies(ontology);

        importedOntologies.forEach(importedOntology -> {
            Model importedModel = importedOntology.asModel();
            IRI ontSdNg = vf.createIRI(importedOntology.getOntologyId().getOntologyIRI()
                    .orElse((IRI)importedOntology.getOntologyId().getOntologyIdentifier()).stringValue()
                    + OntologyDatasets.SYSTEM_DEFAULT_NG_SUFFIX);
            if (!dsConn.containsContext(ontSdNg)) {
                dsConn.addDefault(importedModel, ontSdNg);
            }
            dsConn.addDefaultNamedGraph(ontSdNg);
        });
    }

    private boolean removeValueFromRepo(IRI datasetIRI) {
        try {
            LOG.debug("Removing cache dataset " + datasetIRI.stringValue());
            dsUtilsService.safeDeleteDataset(datasetIRI, repository.getRepositoryID());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static <K, V> Cache.Entry<K, V> cacheEntryFor(K key, V value) {
        return new Entry<>(key, value);
    }

    static class Entry<K, V> implements Cache.Entry<K, V> {

        private final K key;
        private final V value;

        Entry(K key, V value) {
            this.key = key;
            this.value = value;
        }

        @Override
        public K getKey() {
            return key;
        }

        @Override
        public V getValue() {
            return value;
        }

        @Override
        public <T> T unwrap(Class<T> clazz) {
            throw new IllegalArgumentException();
        }

        @Override
        public int hashCode() {
            return (key == null ? 0 : key.hashCode()) ^ (value == null ? 0 : value.hashCode());
        }

        @Override
        public boolean equals(Object obj) {
            if (obj instanceof Entry) {
                Entry<?, ?> other = (Entry<?, ?>) obj;

                Object key1 = getKey();
                Object key2 = other.getKey();
                if (key1 == key2 || (key1 != null && key1.equals(key2))) {
                    Object value1 = getValue();
                    Object value2 = other.getValue();
                    return (value1 == value2 || (value1 != null && value1.equals(value2)));
                }
            }
            return false;
        }
    }

    protected DatasetConnection getDatasetConnection(Resource datasetIRI, boolean createNotExists) {
        LOG.debug("Retrieving cache dataset connection for " + datasetIRI.stringValue());
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(datasetIRI, null, null);
            boolean contains = statements.hasNext();
            statements.close();
            if (!contains) {
                if (createNotExists) {
                    LOG.debug("Creating cache dataset " + datasetIRI.stringValue());
                    dsUtilsService.createDataset(datasetIRI, repository.getRepositoryID());
                } else {
                    LOG.trace("The dataset " + datasetIRI + " does not exist in the specified repository.");
                    throw new IllegalArgumentException("The dataset " + datasetIRI
                            + " does not exist in the specified repository.");
                }
            }
        }
        DatasetConnection conn = dsUtilsService.getConnection(datasetIRI, repository.getRepositoryID());
        updateDatasetTimestamp(conn);
        return conn;
    }

    protected void updateDatasetTimestamp(Resource datasetIRI) {
        DatasetConnection conn = getDatasetConnection(datasetIRI, false);
        updateDatasetTimestamp(conn);
    }

    protected void updateDatasetTimestamp(DatasetConnection conn) {
        IRI pred = vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING);
        Literal timestamp = vf.createLiteral(OffsetDateTime.now());

        Resource dataset = conn.getDataset();
        LOG.debug("Updating cache dataset last accessed property for " + dataset);
        conn.remove(dataset, pred, null, dataset);
        conn.add(dataset, pred, timestamp, dataset);
    }

    protected void requireNotClosed() {
        if (isClosed()) {
            LOG.error("Cache is closed. Cannot perform operation");
            throw new IllegalStateException("Cache is closed. Cannot perform operation.");
        }
    }
}

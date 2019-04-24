package com.mobi.cache.impl.repository.jcache;

/*-
 * #%L
 * com.mobi.cache.impl.repository
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

import com.google.common.collect.Maps;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.OntologyUtils;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.OffsetDateTime;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.cache.Cache;
import javax.cache.CacheManager;
import javax.cache.configuration.CacheEntryListenerConfiguration;
import javax.cache.configuration.Configuration;
import javax.cache.integration.CompletionListener;
import javax.cache.processor.EntryProcessor;
import javax.cache.processor.EntryProcessorException;
import javax.cache.processor.EntryProcessorResult;

public class OntologyRepositoryCache extends AbstractDatasetRepositoryCache<String, Ontology> {

    // TODO: Remove ontology manager & change Ontology usages to new Repository Ontology
    private OntologyManager ontologyManager;
    private final String name;
    private final CacheManager cacheManager;
    private final Configuration configuration;

    private volatile boolean closed;

    public OntologyRepositoryCache(String name, Repository repository, CacheManager cacheManager,
                                   Configuration configuration) {
        this.name = name;
        this.repository = repository;
        this.cacheManager = cacheManager;
        this.configuration = configuration;
    }

    public void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    public void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    public void setModelFactory(ModelFactory mf) {
        this.mf = mf;
    }

    public void setDatasetFactory(DatasetFactory datasetFactory) {
        this.datasetFactory = datasetFactory;
    }

    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Override
    public Ontology get(String key) {
        requireNotClosed();
        IRI datasetIRI = createDatasetIRIFromKey(key);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false)) {
            return getValueFromRepo(dsConn);
        } catch (IllegalArgumentException e) {
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
        IRI datasetIRI = createDatasetIRIFromKey(key);
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
        requireNotClosed();
        IRI datasetIRI = createDatasetIRIFromKey(key);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, true)) {
            IRI ontNamedGraphIRI = createSystemDefaultNamedGraphIRIFromKey(key);
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
        IRI datasetIRI = createDatasetIRIFromKey(key);
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
        IRI datasetIRI = createDatasetIRIFromKey(key);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false);
                RepositoryConnection repoConn = repository.getConnection()) {
            return removeValueFromRepo(datasetIRI, dsConn, repoConn);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @Override
    public boolean remove(String key, Ontology ontology) {
        requireNotClosed();
        IRI datasetIRI = createDatasetIRIFromKey(key);
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false);
                RepositoryConnection repoConn = repository.getConnection()) {
            Ontology repoOntology = getValueFromRepo(dsConn);
            if (ontology.equals(repoOntology)) {
                return removeValueFromRepo(datasetIRI, dsConn, repoConn);
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
        IRI datasetIRI = createDatasetIRIFromKey(key);
        boolean success = false;
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false);
                RepositoryConnection repoConn = repository.getConnection()) {
            Ontology repoOntology = getValueFromRepo(dsConn);
            if (ontology.equals(repoOntology)) {
                success = removeValueFromRepo(datasetIRI, dsConn, repoConn);
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
        IRI datasetIRI = createDatasetIRIFromKey(key);
        boolean success;
        try (DatasetConnection dsConn = getDatasetConnection(datasetIRI, false);
                RepositoryConnection repoConn = repository.getConnection()) {
            success = removeValueFromRepo(datasetIRI, dsConn, repoConn);
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
        throw new UnsupportedOperationException("Cannot remove ontology. It must exist in the cache when accessed.");
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
        if (clazz.isInstance(configuration)) {
            return clazz.cast(configuration);
        }
        throw new IllegalArgumentException("The configuration class " + clazz
                + " is not supported by this implementation");
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
        return name;
    }

    @Override
    public CacheManager getCacheManager() {
        return cacheManager;
    }

    @Override
    public void close() {
        if (isClosed()) {
            return;
        }

        synchronized (configuration) {
            if (!isClosed()) {
                closed = true;
                cacheManager.destroyCache(name);
            }
        }
    }

    @Override
    public boolean isClosed() {
        return closed;
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
            Set<String> keys = RepositoryResults.asList(
                    conn.getStatements(null, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(Dataset.TYPE)))
                    .stream()
                    .map(Statement::getSubject)
                    .map(Resource::stringValue)
                    .map(resourceStr -> StringUtils.removeStart(resourceStr, DEFAULT_DS_NAMESPACE))
                    .map(ResourceUtils::decode)
                    .collect(Collectors.toSet());
            System.out.println(keys);
            return getAll(keys)
                    .entrySet()
                    .stream()
                    .map(entry -> cacheEntryFor(entry.getKey(), entry.getValue()))
                    .collect(Collectors.toSet())
                    .iterator();
        }
    }

    private Ontology getValueFromRepo(DatasetConnection dsConn) {
        updateNamedGraphTimestamps(dsConn);
        Resource sdNamedGraphIRI = dsConn.getSystemDefaultNamedGraph();
        Model ontologyModel = RepositoryResults.asModelNoContext(
                dsConn.getStatements(null, null, null, sdNamedGraphIRI), mf);
        ontologyModel.remove(null, vf.createIRI(TIMESTAMP_IRI_STRING), null);
        if (ontologyModel.size() == 0) {
            return null;
        }
        return ontologyManager.createOntology(ontologyModel);
    }

    private void putValueInRepo(Ontology ontology, IRI ontNamedGraphIRI, DatasetConnection dsConn) {
        Model ontologyModel = ontology.asModel(mf);
        dsConn.add(ontologyModel, ontNamedGraphIRI);
        dsConn.add(ontNamedGraphIRI, vf.createIRI(TIMESTAMP_IRI_STRING),
                vf.createLiteral(OffsetDateTime.now()), ontNamedGraphIRI);
        Set<Ontology> importedOntologies = OntologyUtils.getImportedOntologies(ontology);

        // TODO: how do i identify if it is a mobi ontology?
        importedOntologies.forEach(importedOntology -> {
            Model importedModel = importedOntology.asModel(mf);

            // TODO: Is this the correct ID??
            IRI ontId = importedOntology.getOntologyId().getOntologyIRI()
                    .orElse((IRI)importedOntology.getOntologyId().getOntologyIdentifier());
            if (!dsConn.containsContext(ontId)) {
                dsConn.add(importedModel, ontId);
            }
            dsConn.addNamedGraph(ontId);
        });
        updateNamedGraphTimestamps(dsConn);
    }

    private boolean removeValueFromRepo(IRI datasetIRI, DatasetConnection dsConn, RepositoryConnection repoConn) {
        RepositoryResult<Resource> namedGraphs = dsConn.getNamedGraphs();
        repoConn.clear(datasetIRI);
        namedGraphs.forEach(namedGraphResource -> {
            if (!repoConn.contains(null, vf.createIRI(Dataset.namedGraph_IRI), namedGraphResource)
                    && !repoConn.contains(null, vf.createIRI(Dataset.defaultNamedGraph_IRI), namedGraphResource)
                    && !repoConn.contains(null, vf.createIRI(Dataset.systemDefaultNamedGraph_IRI),
                    namedGraphResource)) {
                repoConn.clear(namedGraphResource);
            }
        });
        return true;
    }

    private IRI createDatasetIRIFromKey(String key) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key));
    }

    private IRI createSystemDefaultNamedGraphIRIFromKey(String key) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key) + SYSTEM_DEFAULT_NG_SUFFIX);
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
}

package com.mobi.ontology.utils.cache.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.cache.ImportsResolver;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.vocabulary.OWL;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.Nullable;

@Component
public class ImportsResolverImpl implements ImportsResolver {

    private CatalogManager catalogManager;
    private DatasetManager datasetManager;
    private ModelFactory mf;
    private ValueFactory vf;
    private SesameTransformer transformer;
    private Set<String> formats = Stream.of(".rdf", ".ttl", ".owl", ".xml", ".jsonld", ".trig", ".json", ".n3", ".nq",
            ".nt").collect(Collectors.toSet());

    private static final String DEFAULT_DS_NAMESPACE = "http://mobi.com/dataset/";
    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";
    private static final String TIMESTAMP_IRI_STRING = "http://mobi.com/ontologies/graph#lastAccessed";
    private static final String UNRESOLVED_IRI_STRING = "http://mobi.com/ontologies/graph#unresolved";

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Reference
    void setModelFactory(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public Map<String, Set<Resource>> loadOntologyIntoCache(Resource ontologyId, @Nullable String key, Model ontModel,
                                                            Repository cacheRepo, OntologyManager ontologyManager) {
        Set<Resource> unresolvedImports = new HashSet<>();
        Set<Resource> processedImports = new HashSet<>();
        List<Resource> importsToProcess = new ArrayList<>();
        importsToProcess.add(ontologyId);
        Resource datasetKey = key == null ? getDatasetIRI(ontologyId, ontologyManager) : createDatasetIRIFromKey(key);

        try (RepositoryConnection cacheConn = cacheRepo.getConnection()) {
            for (int i = 0; i < importsToProcess.size(); i++) {
                Resource ontologyIRI = importsToProcess.get(i);

                Model model;
                if (i == 0) {
                    model = ontModel;
                    if (!cacheConn.getStatements(null, null, null, datasetKey).hasNext()) {
                        datasetManager.createDataset(datasetKey.stringValue(), cacheRepo.getConfig().id());
                    }
                    addOntologyToRepo(cacheRepo, model, datasetKey, datasetKey, true);
                } else {
                    IRI iri = getDatasetIRI(ontologyIRI, ontologyManager);

                    if (iri.stringValue().equals(ontologyIRI.stringValue())) {
                        Optional<Model> modelOpt = retrieveOntologyFromWeb(ontologyIRI);
                        if (modelOpt.isPresent()) {
                            model = modelOpt.get();
                            addOntologyToRepo(cacheRepo, model, datasetKey, iri, false);
                        } else {
                            unresolvedImports.add(ontologyIRI);
                            processedImports.add(ontologyIRI);
                            continue;
                        }
                    } else {
                        Optional<Resource> recordIRI = ontologyManager.getOntologyRecordResource(ontologyIRI);
                        Optional<Resource> headCommit = catalogManager.getMasterBranch(
                                catalogManager.getLocalCatalog().getResource(), recordIRI.get()).getHead_resource();
                        model = catalogManager.getCompiledResource(headCommit.get());
                        String headKey = recordIRI.get().stringValue() + "&" + headCommit.get().stringValue();
                        addOntologyToRepo(cacheRepo, model, datasetKey, createDatasetIRIFromKey(headKey), false);
                    }
                }

                List<Resource> imports = model.filter(null, vf.createIRI(OWL.IMPORTS.stringValue()), null)
                        .stream()
                        .map(Statement::getObject)
                        .filter(o -> o instanceof IRI)
                        .map(r -> (IRI) r)
                        .collect(Collectors.toList());

                processedImports.add(ontologyIRI);
                imports.forEach(imported -> {
                    if (!processedImports.contains(imported) && !importsToProcess.contains(imported)) {
                        importsToProcess.add(imported);
                    }
                });
            }
            processedImports.forEach(imported
                    -> cacheConn.add(datasetKey, vf.createIRI(OWL.IMPORTS.stringValue()), imported, datasetKey));
            unresolvedImports.forEach(imported
                    -> cacheConn.add(datasetKey, vf.createIRI(UNRESOLVED_IRI_STRING), imported, datasetKey));
        }

        Map<String, Set<Resource>> imports = new HashMap<>();
        imports.put("unresolved", unresolvedImports);
        imports.put("closure", processedImports);
        return imports;
    }

    @Override
    public Optional<Model> retrieveOntologyFromWeb(Resource resource) {
        Model model = mf.createModel();
        String urlStr = resource.stringValue();
        if (urlStr.endsWith("/")) {
            urlStr = urlStr.substring(0, urlStr.lastIndexOf("/"));
        }
        try {
            if (StringUtils.endsWithAny(urlStr, formats.stream().toArray(String[]::new))) {
                Optional<URL> urlOpt = getURL(urlStr);
                if (urlOpt.isPresent()) {
                    model = Models.createModel(urlOpt.get().openStream(), transformer);
                }
            } else {
                for (String format : formats) {
                    try {
                        Optional<URL> urlOpt = getURL(urlStr + format);
                        if (urlOpt.isPresent()) {
                            model = Models.createModel(urlOpt.get().openStream(), transformer);
                            break;
                        }
                    } catch (IOException e) {
                        continue;
                    }
                }
            }
        } catch (IOException | IllegalArgumentException e) {
            model = mf.createModel();
        }
        return model.size() > 0 ? Optional.of(model) : Optional.empty();
    }

    private Optional<URL> getURL(String urlStr) throws IOException {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("HEAD");
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US; "
                + "rv:1.9.1.2) Gecko/20090729 Firefox/3.5.2 (.NET CLR 3.5.30729)");
        conn.setInstanceFollowRedirects(true);
        conn.setConnectTimeout(3000);

        int status = conn.getResponseCode();
        if (status == 200) {
            return Optional.of(url);
        } else if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM
                || status == HttpURLConnection.HTTP_SEE_OTHER) {
            return Optional.of(new URL(conn.getHeaderField("Location")));
        }
        return Optional.empty();
    }

    @Override
    public Optional<Model> retrieveOntologyLocal(Resource ontologyIRI, OntologyManager ontologyManager) {
        Model model = mf.createModel();
        Optional<Resource> recordIRIOpt = ontologyManager.getOntologyRecordResource(ontologyIRI);
        if (recordIRIOpt.isPresent()) {
            Resource recordIRI = recordIRIOpt.get();
            Optional<Resource> masterHead = catalogManager.getMasterBranch(
                    catalogManager.getLocalCatalog().getResource(), recordIRI).getHead_resource();
            if (masterHead.isPresent()) {
                model = catalogManager.getCompiledResource(masterHead.get());
            }
        }
        return model.size() > 0 ? Optional.of(model) : Optional.empty();
    }

    @Override
    public IRI getDatasetIRI(Resource ontologyIRI, OntologyManager ontologyManager) {
        Optional<Resource> recordIRI = ontologyManager.getOntologyRecordResource(ontologyIRI);
        if (recordIRI.isPresent()) {
            Optional<Resource> headCommit = catalogManager.getMasterBranch(
                    catalogManager.getLocalCatalog().getResource(), recordIRI.get()).getHead_resource();
            if (headCommit.isPresent()) {
                String headKey = recordIRI.get().stringValue() + "&" + headCommit.get().stringValue();
                return createDatasetIRIFromKey(headKey);
            }
        }
        return (IRI) ontologyIRI;
    }

    private void addOntologyToRepo(Repository repository, Model ontologyModel, Resource datasetIRI,
                                   Resource ontologyIRI, boolean addTimestamp) {
        try (DatasetConnection dsConn = datasetManager.getConnection(datasetIRI, repository.getConfig().id(),
                false)) {
            IRI ontNamedGraphIRI = vf.createIRI(ontologyIRI.stringValue() + SYSTEM_DEFAULT_NG_SUFFIX);
            dsConn.addDefaultNamedGraph(ontNamedGraphIRI);

            if (!dsConn.contains(null, null, null, ontNamedGraphIRI)) {
                dsConn.addDefault(ontologyModel, ontNamedGraphIRI);
            }
            if (addTimestamp) {
                dsConn.addDefault(datasetIRI, vf.createIRI(TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now()),
                        datasetIRI);
                dsConn.removeGraph(datasetIRI);
            }
        }
    }

    private IRI createDatasetIRIFromKey(String key) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key));
    }
}

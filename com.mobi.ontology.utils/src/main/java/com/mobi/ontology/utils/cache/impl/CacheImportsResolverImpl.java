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
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.cache.CacheImportsResolver;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
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

@Component
public class CacheImportsResolverImpl implements CacheImportsResolver {

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
    public Map<String, Set<Resource>> loadOntologyIntoCache(OntologyId ontologyId, String key, Model ontModel,
                                                            Repository cacheRepo, OntologyManager ontologyManager) {
        Set<Resource> unresolvedImports = new HashSet<>();
        Set<Resource> processedImports = new HashSet<>();
        List<Resource> importsToProcess = new ArrayList<>();
        importsToProcess.add(ontologyId.getOntologyIRI().orElse((IRI) ontologyId.getOntologyIdentifier()));
        IRI datasetKey = createDatasetIRIFromKey(key);

        try (RepositoryConnection cacheConn = cacheRepo.getConnection()) {
            for (int i = 0; i < importsToProcess.size(); i++) {
                Resource ontologyIRI = importsToProcess.get(i);
                if (cacheConn.containsContext(ontologyIRI)) {
                    updateTimestamp(cacheConn, ontologyIRI);
                    continue;
                }

                Model model;
                if (i == 0) {
                    model = ontModel;
                    if (!cacheConn.getStatements(datasetKey, null, null).hasNext()) {
                        datasetManager.createDataset(datasetKey.stringValue(), cacheRepo.getConfig().id());
                    }
                    addOntologyToRepo(cacheRepo, model, datasetKey, datasetKey, true);
                } else {
                    Optional<Resource> recordIRI = ontologyManager.getOntologyRecordResource(ontologyIRI);
                    if (recordIRI.isPresent()) {
                        Optional<Resource> headCommit = catalogManager.getMasterBranch(
                                catalogManager.getLocalCatalog().getResource(), recordIRI.get()).getHead_resource();
                        model = catalogManager.getCompiledResource(headCommit.get());
                        String headKey = recordIRI.get().stringValue() + "&" + headCommit.get().stringValue();
                        addOntologyToRepo(cacheRepo, model, datasetKey, createDatasetIRIFromKey(headKey), false);
                    } else {
                        Optional<Model> modelOpt = retrieveOntologyFromWeb(ontologyIRI);
                        if (modelOpt.isPresent()) {
                            model = modelOpt.get();
                            addOntologyToRepo(cacheRepo, model, datasetKey, ontologyIRI, false);
                        } else {
                            unresolvedImports.add(ontologyIRI);
                            processedImports.add(ontologyIRI);
                            continue;
                        }
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
                    if (!processedImports.contains(imported)) {
                        importsToProcess.add(imported);
                    }
                });
            }
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
            for (String format : formats) {
                URL url = new URL(urlStr + format);
                HttpURLConnection httpURLConnection = (HttpURLConnection) url.openConnection();
                httpURLConnection.setRequestMethod("HEAD");
                httpURLConnection.setRequestProperty("User-Agent","Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US; "
                        + "rv:1.9.1.2) Gecko/20090729 Firefox/3.5.2 (.NET CLR 3.5.30729)");
                if (httpURLConnection.getResponseCode() == 200) {
                    model = Models.createModel(new URL(urlStr + format).openStream(), transformer);
                    break;
                }
            }
        } catch (IOException | IllegalArgumentException e) {
            model = mf.createModel();
        }
        return model.size() > 0 ? Optional.of(model) : Optional.empty();
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

    private void addOntologyToRepo(Repository repository, Model ontologyModel, Resource datasetIRI,
                                   Resource ontologyIRI, boolean addTimestamp) {
        try (DatasetConnection dsConn = datasetManager.getConnection(datasetIRI, repository.getConfig().id(),
                false)) {
            IRI ontNamedGraphIRI = vf.createIRI(ontologyIRI.stringValue() + SYSTEM_DEFAULT_NG_SUFFIX);
            dsConn.addNamedGraph(ontNamedGraphIRI);
            dsConn.add(ontologyModel, ontNamedGraphIRI);
            if (addTimestamp) {
                dsConn.add(ontNamedGraphIRI, vf.createIRI(TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now()),
                        ontNamedGraphIRI);
            }
        }
    }

    private void updateTimestamp(RepositoryConnection conn, Resource namedGraphIRI) {
        IRI pred = vf.createIRI(TIMESTAMP_IRI_STRING);
        Literal timestamp = vf.createLiteral(OffsetDateTime.now());
        conn.remove(namedGraphIRI, pred, null, namedGraphIRI);
        conn.add(namedGraphIRI, pred, timestamp, namedGraphIRI);
    }

    private IRI createDatasetIRIFromKey(String key) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key));
    }
}

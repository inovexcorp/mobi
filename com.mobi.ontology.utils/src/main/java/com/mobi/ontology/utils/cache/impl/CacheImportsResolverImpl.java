package com.mobi.ontology.utils.cache.impl;

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
                    IRI sdNg = createSystemDefaultNamedGraphIRIFromKey(key);
                    if (!cacheConn.getStatements(datasetKey, null, null).hasNext()) {
                        datasetManager.createDataset(datasetKey.stringValue(), cacheRepo.getConfig().id());
                    }
                    addOntologyToRepo(cacheRepo, model, datasetKey, sdNg);
                } else {
                    Optional<Model> modelOpt = retrieveOntologyLocal(ontologyIRI, ontologyManager);
                    if (modelOpt.isPresent()) {
                        model = modelOpt.get();
                    } else {
                        modelOpt = retrieveOntologyFromWeb(ontologyIRI);
                        if (modelOpt.isPresent()) {
                            model = modelOpt.get();
                            addOntologyToRepo(cacheRepo, model, datasetKey, ontologyIRI);
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
    public Optional<Model> retrieveOntologyLocal(Resource resource, OntologyManager ontologyManager) {
        Model model = mf.createModel();
        Optional<Resource> recordIRIOpt = ontologyManager.getOntologyRecordResource(resource);
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
                                   Resource ontologyIRI) {
        try (DatasetConnection dsConn = datasetManager.getConnection(datasetIRI, repository.getConfig().id(),
                false)) {
            IRI ontNamedGraphIRI = vf.createIRI(ontologyIRI.stringValue() + SYSTEM_DEFAULT_NG_SUFFIX);
            dsConn.addNamedGraph(ontNamedGraphIRI);
            dsConn.add(ontologyModel, ontNamedGraphIRI);
            dsConn.add(ontNamedGraphIRI, vf.createIRI(TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now()),
                    ontNamedGraphIRI);
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

    private IRI createSystemDefaultNamedGraphIRIFromKey(String key) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key) + SYSTEM_DEFAULT_NG_SUFFIX);
    }
}

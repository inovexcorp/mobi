package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.namespace.api.NamespaceService;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.impl.core.AbstractOntologyManager;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.ApplicationSetting;
import org.apache.commons.lang.NotImplementedException;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.InputStream;
import java.util.Optional;
import javax.annotation.Nonnull;
import javax.cache.Cache;

@Component(
        service = { SimpleOntologyManager.class, OntologyManager.class },
        name = SimpleOntologyManager.COMPONENT_NAME,
        configurationPolicy = ConfigurationPolicy.REQUIRE
)
public class SimpleOntologyManager extends AbstractOntologyManager {

    static final String COMPONENT_NAME = "com.mobi.ontology.impl.repository.OntologyManager";

    private DatasetManager datasetManager;
    private ImportsResolver importsResolver;
    private BNodeService bNodeService;
    private RDFImportService importService;
    private SettingService<ApplicationSetting> settingService;
    private NamespaceService namespaceService;

    public SimpleOntologyManager() {
    }

    @Reference
    public void setSettingService(SettingService<ApplicationSetting> settingService) {
        this.settingService = settingService;
    }

    @Reference
    public void setNamespaceService(NamespaceService namespaceService) {
        this.namespaceService = namespaceService;
    }

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Reference
    void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    public void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setUtilsService(CatalogUtilsService utilsService) {
        this.utilsService = utilsService;
    }

    @Reference
    public void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference
    public void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    public void addOntologyCache(OntologyCache ontologyCache) {
        this.ontologyCache = ontologyCache;
    }

    public void removeOntologyCache(OntologyCache ontologyCache) {
    }

    @Reference
    public void setImportsResolver(ImportsResolver importsResolver) {
        this.importsResolver = importsResolver;
    }

    @Reference
    public void setbNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

    @Reference
    public void setRDFImportService(RDFImportService importService) {
        this.importService = importService;
    }

    /**
     * Activate method required in order to have config file service.ranking property used.
     */
    @Activate
    public void activate() {
        log = LoggerFactory.getLogger(SimpleOntologyManager.class);
        log.trace("Repository based SimpleOntologyManager started.");
    }

    @Modified
    public void modified() {
        log = LoggerFactory.getLogger(SimpleOntologyManager.class);
        log.trace("Repository based SimpleOntologyManager restarted.");
    }

    @Override
    public Ontology createOntology(InputStream inputStream, boolean resolveImports) {
        throw new NotImplementedException("Method not applicable for repository based OntologyManager.");
    }

    @Override
    public Ontology createOntology(Model model) {
        throw new NotImplementedException("Method not applicable for repository based OntologyManager.");
    }

    @Override
    public Ontology applyChanges(Ontology ontology, Difference difference) {
        if (ontology instanceof SimpleOntology) {
            SimpleOntology simpleOntology = (SimpleOntology) ontology;
            simpleOntology.setDifference(difference);
            return simpleOntology;
        } else {
            throw new MobiException("Ontology must be a " + SimpleOntology.class.toString());
        }
    }

    @Override
    public OntologyId createOntologyId() {
        return new SimpleOntologyId.Builder(valueFactory, settingService, namespaceService).build();
    }

    @Override
    public OntologyId createOntologyId(Resource resource) {
        return new SimpleOntologyId.Builder(valueFactory, settingService, namespaceService).id(resource).build();
    }

    @Override
    public OntologyId createOntologyId(IRI ontologyIRI) {
        return new SimpleOntologyId.Builder(valueFactory, settingService, namespaceService).ontologyIRI(ontologyIRI).build();
    }

    @Override
    public OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI) {
        return new SimpleOntologyId.Builder(valueFactory, settingService, namespaceService).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
    }

    @Override
    public OntologyId createOntologyId(Model model) {
        return new SimpleOntologyId.Builder(valueFactory, settingService, namespaceService).model(model).build();
    }

    @Override
    protected Optional<Ontology> getOntology(@Nonnull Resource recordId, @Nonnull Resource commitId) {
        Optional<Ontology> result;
        Optional<Cache<String, Ontology>> optCache = ontologyCache.getOntologyCache();
        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());

        if (optCache.isPresent() && optCache.get().containsKey(key)) {
            log.trace("cache hit");
            result = Optional.of(createOntology(recordId, commitId));
        } else {
            log.trace("cache miss");
            // Operation puts the ontology in the cache on construction
            final Ontology ontology = createOntologyFromCommit(recordId, commitId);
            result = Optional.of(ontology);
        }
        return result;
    }

    /**
     * Creates an Ontology using the provided Commit.
     *
     * @param recordId The Commit identifying the version of the Ontology that you want to create.
     * @param commitId The Commit identifying the version of the Ontology that you want to create.
     * @return An Ontology built at the time identified by the Commit.
     */
    private Ontology createOntologyFromCommit(Resource recordId, Resource commitId) {
        File ontologyFile = catalogManager.getCompiledResourceFile(commitId);
        return createOntology(ontologyFile, recordId, commitId);
    }

    /**
     * Creates an Ontology using the provided File. Using the recordId and commitId to generate the cache key.
     *
     * @param ontologyFile The {@link File} containing valid RDF.
     * @param recordId The {@link Resource} of the Record.
     * @param commitId The {@link Resource} of the Commit.
     * @return An Ontology loaded into the cache using the File.
     */
    private Ontology createOntology(File ontologyFile, Resource recordId, Resource commitId) {
        OsgiRepository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());
        return new SimpleOntology(key, ontologyFile, repository, this, catalogManager, configProvider, datasetManager,
                importsResolver, bNodeService, valueFactory, modelFactory, importService);
    }

    /**
     * Creates an Ontology using the recordId and commitId to generate the key to retrieve the ontology from the cache.
     *
     * @param recordId The {@link Resource} of the Record.
     * @param commitId The {@link Resource} of the Commit.
     * @return An Ontology that was previously loaded into the cache.
     */
    private Ontology createOntology(Resource recordId, Resource commitId) {
        OsgiRepository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());
        return new SimpleOntology(key, repository, this, catalogManager, configProvider, datasetManager,
                importsResolver, bNodeService, valueFactory, modelFactory, importService);
    }
}

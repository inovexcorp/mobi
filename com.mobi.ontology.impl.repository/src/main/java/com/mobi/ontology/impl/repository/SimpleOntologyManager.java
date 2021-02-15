package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.impl.core.AbstractOntologyManager;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryManager;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.semanticweb.owlapi.rio.RioFunctionalSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioManchesterSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioOWLXMLParserFactory;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import javax.annotation.Nonnull;
import javax.cache.Cache;

@Component(
        provide = { SimpleOntologyManager.class, OntologyManager.class },
        name = SimpleOntologyManager.COMPONENT_NAME,
        configurationPolicy = ConfigurationPolicy.require
)
public class SimpleOntologyManager extends AbstractOntologyManager {

    static final String COMPONENT_NAME = "com.mobi.ontology.impl.repository.OntologyManager";

    private DatasetManager datasetManager;
    private ImportsResolver importsResolver;
    private BNodeService bNodeService;
    private RDFImportService importService;


    public SimpleOntologyManager() {
    }

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setSesameTransformer(SesameTransformer sesameTransformer) {
        this.sesameTransformer = sesameTransformer;
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

    @Reference(type = '*', dynamic = true, optional = true)
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
        try {
            Model model = Models.createModel(inputStream, sesameTransformer,
                    new RioFunctionalSyntaxParserFactory().getParser(),
                    new RioManchesterSyntaxParserFactory().getParser(),
                    new RioOWLXMLParserFactory().getParser());
            if (!OntologyModels.findFirstOntologyIRI(model, valueFactory).isPresent()) {
                OntologyId id = createOntologyId(model);
                IRI iri = id.getOntologyIRI().orElse((IRI) id.getOntologyIdentifier());
                model.add(iri, valueFactory.createIRI(RDF.TYPE.stringValue()),
                        valueFactory.createIRI(OWL.ONTOLOGY.stringValue()));
            }
            return createOntology(model);
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Ontology createOntology(Model model) {
        Repository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        return new SimpleOntology(model, repository, this, catalogManager, configProvider, datasetManager,
                importsResolver, sesameTransformer, bNodeService, valueFactory, modelFactory, importService);
    }

    private Ontology createOntology(File ontologyFile, Resource recordId, Resource commitId) {
        Repository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());
        return new SimpleOntology(key, ontologyFile, repository, this, catalogManager, configProvider, datasetManager,
                importsResolver, sesameTransformer, bNodeService, valueFactory, modelFactory, importService);
    }

    private Ontology createOntology(Resource recordId, Resource commitId) {
        Repository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());
        return new SimpleOntology(key, repository, this, catalogManager, configProvider, datasetManager,
                importsResolver, sesameTransformer, bNodeService, valueFactory, modelFactory, importService);
    }

    @Override
    public Ontology applyChanges(Ontology ontology, Difference difference) {
        if (ontology instanceof SimpleOntology) {
            SimpleOntology simpleOntology = (SimpleOntology) ontology;
            simpleOntology.setDifference(difference);
            return simpleOntology;
        } else {
            Model changedOntologyModel = utilsService.applyDifference(ontology.asModel(modelFactory), difference);
            return createOntology(changedOntologyModel);
        }
    }

    @Override
    public OntologyId createOntologyId() {
        return new SimpleOntologyId.Builder(valueFactory).build();
    }

    @Override
    public OntologyId createOntologyId(Resource resource) {
        return new SimpleOntologyId.Builder(valueFactory).id(resource).build();
    }

    @Override
    public OntologyId createOntologyId(IRI ontologyIRI) {
        return new SimpleOntologyId.Builder(valueFactory).ontologyIRI(ontologyIRI).build();
    }

    @Override
    public OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI) {
        return new SimpleOntologyId.Builder(valueFactory).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
    }

    @Override
    public OntologyId createOntologyId(Model model) {
        return new SimpleOntologyId.Builder(valueFactory).model(model).build();
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
     * @param recordId the Commit identifying the version of the Ontology that you want to create.
     * @param commitId the Commit identifying the version of the Ontology that you want to create.
     * @return an Ontology built at the time identified by the Commit.
     */
    private Ontology createOntologyFromCommit(Resource recordId, Resource commitId) {
        File ontologyFile = catalogManager.getCompiledResourceFile(commitId);
        return createOntology(ontologyFile, recordId, commitId);
    }
}

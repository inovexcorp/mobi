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

import com.mobi.catalog.api.builder.Difference;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.ontology.cacheloader.api.CacheLoader;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.impl.core.AbstractOntologyManager;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.Repository;
import org.apache.commons.lang.NotImplementedException;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.component.annotations.ReferencePolicyOption;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
import javax.cache.Cache;
import java.io.File;
import java.io.InputStream;
import java.util.Optional;

@Component(
        service = { SimpleOntologyManager.class, OntologyManager.class },
        name = SimpleOntologyManager.COMPONENT_NAME,
        configurationPolicy = ConfigurationPolicy.REQUIRE
)
public class SimpleOntologyManager extends AbstractOntologyManager {

    static final String COMPONENT_NAME = "com.mobi.ontology.impl.repository.OntologyManager";

    @Reference
    protected DatasetManager datasetManager;

    @Reference
    protected ImportsResolver importsResolver;

    @Reference(
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            policyOption = ReferencePolicyOption.GREEDY
    )
    protected volatile CacheLoader cacheLoader;

    public SimpleOntologyManager() {
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
        Repository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());
        return new SimpleOntology(key, ontologyFile, repository, this, catalogManager, configProvider, datasetManager,
                importsResolver, sesameTransformer, bNodeService, valueFactory, modelFactory, cacheLoader);
    }

    /**
     * Creates an Ontology using the recordId and commitId to generate the key to retrieve the ontology from the cache.
     *
     * @param recordId The {@link Resource} of the Record.
     * @param commitId The {@link Resource} of the Commit.
     * @return An Ontology that was previously loaded into the cache.
     */
    private Ontology createOntology(Resource recordId, Resource commitId) {
        Repository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());
        return new SimpleOntology(key, repository, this, catalogManager, configProvider, datasetManager,
                importsResolver, sesameTransformer, bNodeService, valueFactory, modelFactory, cacheLoader);
    }
}

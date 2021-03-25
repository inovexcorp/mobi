package com.mobi.ontology.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.impl.owlapi
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
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.impl.core.AbstractOntologyManager;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
import javax.cache.Cache;
import java.io.InputStream;
import java.util.Optional;
import java.util.concurrent.ForkJoinPool;

@Component(
        service = { SimpleOntologyManager.class, OntologyManager.class },
        configurationPolicy = ConfigurationPolicy.REQUIRE,
        name = SimpleOntologyManager.COMPONENT_NAME
)
@Designate(ocd = OntologyManagerConfig.class)
public class SimpleOntologyManager extends AbstractOntologyManager {

    private ForkJoinPool threadPool;

    static final String COMPONENT_NAME = "com.mobi.ontology.impl.owlapi.OntologyManager";

    public SimpleOntologyManager() {
    }

    @Activate
    @Modified
    protected void start(final OntologyManagerConfig config) {
        log = LoggerFactory.getLogger(SimpleOntologyManager.class);
        if (config.poolSize() == 0) {
            int cpus = Runtime.getRuntime().availableProcessors();
            int parallelism = cpus / 2 == 0 ? 1 : cpus / 2;
            log.debug("OntologyManager pool size: " + parallelism);
            threadPool = new ForkJoinPool(parallelism);
        } else {
            int parallelism = config.poolSize();
            if (parallelism < 1) {
                log.warn("Pool size must be greater than 0. Setting to default of 1.");
                parallelism = 1;
            }
            log.debug("OntologyManager pool size: " + parallelism);
            threadPool = new ForkJoinPool(parallelism);
        }
    }

    @Override
    public Ontology createOntology(InputStream inputStream, boolean resolveImports) {
        return new SimpleOntology(inputStream, this, sesameTransformer, bNodeService, repositoryManager,
                resolveImports, threadPool);
    }

    @Override
    public Ontology createOntology(Model model) {
        return new SimpleOntology(model, this, sesameTransformer, bNodeService, repositoryManager, threadPool);
    }

    @Override
    public Ontology applyChanges(Ontology ontology, Difference difference) {
        Model changedOntologyModel = utilsService.applyDifference(ontology.asModel(modelFactory), difference);
        return createOntology(changedOntologyModel);
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
            result = Optional.ofNullable(optCache.get().get(key));
        } else {
            log.trace("cache miss");
            final Ontology ontology = createOntologyFromCommit(commitId);
            result = Optional.of(ontology);
            ontologyCache.getOntologyCache().ifPresent(cache -> cache.put(key, ontology));
        }
        return result;
    }

    /**
     * Creates an Ontology using the provided Commit.
     *
     * @param commit the Commit identifying the version of the Ontology that you want to create.
     * @return an Ontology built at the time identified by the Commit.
     */
    private Ontology createOntologyFromCommit(Resource commit) {
        Model ontologyModel = catalogManager.getCompiledResource(commit);
        return createOntology(ontologyModel);
    }
}

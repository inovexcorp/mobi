package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Reference;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.exception.MatOntoException;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.*;
import org.matonto.rdf.api.IRI;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.config.RepositoryConsumerConfig;
import org.matonto.repository.exception.RepositoryException;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.RioRDFXMLDocumentFormatFactory;
import org.semanticweb.owlapi.model.*;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioParserImpl;

import javax.annotation.Nonnull;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashSet;
import java.util.Optional;

@Component(provide = OntologyManager.class,
        name = SimpleOntologyManager.COMPONENT_NAME,
        designateFactory = RepositoryConsumerConfig.class,
        configurationPolicy = ConfigurationPolicy.require)
public class SimpleOntologyManager implements OntologyManager {

    protected static final String COMPONENT_NAME = "org.matonto.ontology.core.OntologyManager";
    private static final Logger log = Logger.getLogger(SimpleOntologyManager.class);
    private Repository repository;
    private ValueFactory valueFactory;
    private SesameTransformer sesameTransformer;
    private ModelFactory modelFactory;
    private CatalogManager catalogManager;
    private OntologyRecordFactory ontologyRecordFactory;
    private CommitFactory commitFactory;

    private static final String GET_SUB_CLASSES_OF;
    private static final String GET_SUB_DATATYPE_PROPERTIES_OF;
    private static final String GET_SUB_OBJECT_PROPERTIES_OF;
    private static final String GET_CLASSES_WITH_INDIVIDUALS;
    private static final String GET_ENTITY_USAGES;
    private static final String GET_CONCEPT_RELATIONSHIPS;
    private static final String GET_SEARCH_RESULTS;
    private static final String ENTITY_BINDING = "entity";
    private static final String SEARCH_TEXT = "searchText";

    static {
        try {
            GET_SUB_CLASSES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-classes-of.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_SUB_DATATYPE_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-datatype-properties-of.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_SUB_OBJECT_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-object-properties-of.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_CLASSES_WITH_INDIVIDUALS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-classes-with-individuals.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-entity-usages.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_CONCEPT_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-concept-relationships.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_SEARCH_RESULTS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-search-results.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    public SimpleOntologyManager() {}

    @Reference(name = "repository")
    protected void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    protected void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    protected void setSesameTransformer(SesameTransformer sesameTransformer) {
        this.sesameTransformer = sesameTransformer;
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
    }

    @Reference
    protected void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Override
    public Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException {
        return new SimpleOntology(ontologyId, this);
    }

    @Override
    public Ontology createOntology(File file) throws MatontoOntologyException, FileNotFoundException {
        return new SimpleOntology(file, this);
    }

    @Override
    public Ontology createOntology(IRI iri) throws MatontoOntologyException {
        return new SimpleOntology(iri, this);
    }

    @Override
    public Ontology createOntology(InputStream inputStream) throws MatontoOntologyException {
        return new SimpleOntology(inputStream, this);
    }

    @Override
    public Ontology createOntology(String json) throws MatontoOntologyException {
        return new SimpleOntology(json, this);
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource ontologyId) throws MatontoOntologyException {
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(null,
                    sesameTransformer.matontoIRI(DCTERMS.IDENTIFIER), ontologyId);
            if (statements.hasNext()) {
                OntologyRecord record = catalogManager.getRecord(catalogManager.getLocalCatalog().getResource(),
                        statements.next().getSubject(), ontologyRecordFactory).orElseThrow(() ->
                        new MatontoOntologyException("The OntologyRecord could not be retrieved."));
                Branch masterBranch = record.getMasterBranch().orElseThrow(() ->
                        new MatontoOntologyException("The master Branch was not set on the OntologyRecord."));
                masterBranch = catalogManager.getBranch(masterBranch.getResource()).orElseThrow(() ->
                        new MatontoOntologyException("The master Branch could not be retrieved."));
                Commit commit = masterBranch.getHead().orElseThrow(() ->
                        new MatontoOntologyException("The head Commit was not set on the master Branch."));
                return Optional.of(createOntologyFromCommit(commit));
            } else {
                throw new MatontoOntologyException("The OntologyRecord could not be found.");
            }
        } catch (MatOntoException | OWLOntologyCreationException e) {
            throw new MatontoOntologyException(e.getMessage(), e);
        }
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource ontologyId, @Nonnull Resource branchId) throws
            MatontoOntologyException {
        try (RepositoryConnection conn = repository.getConnection()) {
            Optional<Ontology> result = Optional.empty();
            RepositoryResult<Statement> statements = conn.getStatements(null,
                    sesameTransformer.matontoIRI(DCTERMS.IDENTIFIER), ontologyId);
            if (statements.hasNext()) {
                OntologyRecord record = catalogManager.getRecord(catalogManager.getLocalCatalog().getResource(),
                        statements.next().getSubject(), ontologyRecordFactory).orElseThrow(() ->
                        new MatontoOntologyException("The OntologyRecord could not be retrieved."));
                for (Branch branch : record.getBranch()) {
                    if (branch.getResource().equals(branchId)) {
                        branch = catalogManager.getBranch(branch.getResource()).orElseThrow(() ->
                                new MatontoOntologyException("The identified Branch could not be retrieved."));
                        Commit headCommit = branch.getHead().orElseThrow(() ->
                                new MatontoOntologyException("The head Commit was not set on the Branch."));
                        result = Optional.of(createOntologyFromCommit(headCommit));
                        break;
                    }
                }
            }
            return result;
        } catch (MatOntoException | OWLOntologyCreationException e) {
            throw new MatontoOntologyException(e.getMessage(), e);
        }
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource ontologyId, @Nonnull Resource branchId,
                                               @Nonnull Resource commitId) throws MatontoOntologyException {
        try (RepositoryConnection conn = repository.getConnection()) {
            Optional<Ontology> result = Optional.empty();
            RepositoryResult<Statement> statements = conn.getStatements(null,
                    sesameTransformer.matontoIRI(DCTERMS.IDENTIFIER), ontologyId);
            if (statements.hasNext()) {
                OntologyRecord record = catalogManager.getRecord(catalogManager.getLocalCatalog().getResource(),
                        statements.next().getSubject(), ontologyRecordFactory).orElseThrow(() ->
                        new MatontoOntologyException("The OntologyRecord could not be retrieved."));
                for (Branch branch : record.getBranch()) {
                    if (branch.getResource().equals(branchId)) {
                        branch = catalogManager.getBranch(branch.getResource()).orElseThrow(() ->
                                new MatontoOntologyException("The identified Branch could not be retrieved."));
                        Commit headCommit = branch.getHead().orElseThrow(() ->
                                new MatontoOntologyException("The head Commit was not set on the Branch."));
                        LinkedHashSet<Resource> commitChain =  catalogManager.getCommitChain(headCommit.getResource());
                        if (commitChain.contains(commitId)) {
                            Commit commit = catalogManager.getCommit(commitId, commitFactory).orElseThrow(() ->
                                    new MatontoOntologyException("The identified Commit could not be retrieved."));
                            result = Optional.of(createOntologyFromCommit(commit));
                        }
                        break;
                    }
                }
            }
            return result;
        } catch (MatOntoException | OWLOntologyCreationException e) {
            throw new MatontoOntologyException(e.getMessage(), e);
        }
    }

    @Override
    public boolean deleteOntology(@Nonnull Resource ontologyId) throws MatontoOntologyException {
        return false;
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
    public TupleQueryResult getSubClassesOf(Ontology ontology) throws MatontoOntologyException {
        Repository repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            TupleQuery query = conn.prepareTupleQuery(GET_SUB_CLASSES_OF);
            return query.evaluate();
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection.", e);
        } finally {
            repo.shutDown();
        }
    }

    @Override
    public TupleQueryResult getSubDatatypePropertiesOf(Ontology ontology) {
        Repository repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            TupleQuery query = conn.prepareTupleQuery(GET_SUB_DATATYPE_PROPERTIES_OF);
            return query.evaluate();
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection.", e);
        } finally {
            repo.shutDown();
        }
    }

    @Override
    public TupleQueryResult getSubObjectPropertiesOf(Ontology ontology) {
        Repository repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            TupleQuery query = conn.prepareTupleQuery(GET_SUB_OBJECT_PROPERTIES_OF);
            return query.evaluate();
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection.", e);
        } finally {
            repo.shutDown();
        }
    }

    @Override
    public TupleQueryResult getClassesWithIndividuals(Ontology ontology) {
        Repository repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            TupleQuery query = conn.prepareTupleQuery(GET_CLASSES_WITH_INDIVIDUALS);
            return query.evaluate();
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection.", e);
        } finally {
            repo.shutDown();
        }
    }

    @Override
    public TupleQueryResult getEntityUsages(Ontology ontology, String entityIRIStr) {
        Repository repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            TupleQuery query = conn.prepareTupleQuery(GET_ENTITY_USAGES);
            query.setBinding(ENTITY_BINDING, valueFactory.createIRI(entityIRIStr));
            return query.evaluate();
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection.", e);
        } finally {
            repo.shutDown();
        }
    }

    @Override
    public TupleQueryResult getConceptRelationships(Ontology ontology) {
        Repository repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            TupleQuery query = conn.prepareTupleQuery(GET_CONCEPT_RELATIONSHIPS);
            return query.evaluate();
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection.", e);
        } finally {
            repo.shutDown();
        }
    }

    @Override
    public TupleQueryResult getSearchResults(Ontology ontology, String searchText) {
        Repository repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            TupleQuery query = conn.prepareTupleQuery(GET_SEARCH_RESULTS);
            query.setBinding(SEARCH_TEXT, valueFactory.createLiteral(searchText.toLowerCase()));
            return query.evaluate();
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection.", e);
        } finally {
            repo.shutDown();
        }
    }

    /**
     * Creates an Ontology using the provided Commit.
     *
     * @param commit the Commit identifying the version of the Ontology that you want to create.
     * @return an Ontology built at the time identified by the Commit.
     * @throws OWLOntologyCreationException - if the Ontology could not be created.
     */
    private Ontology createOntologyFromCommit(Commit commit) throws OWLOntologyCreationException {
        Model ontologyModel = catalogManager.getCompiledResource(commit.getResource()).orElseThrow(() ->
                new MatontoOntologyException("The compiled resource could not be retrieved."));
        try {
            OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
            OWLOntology ontology = manager.createOntology();
            org.openrdf.model.Model sesameModel = new org.openrdf.model.impl.LinkedHashModel();
            ontologyModel.forEach(statement -> sesameModel.add(sesameTransformer.sesameStatement(statement)));
            OWLOntologyLoaderConfiguration config = new OWLOntologyLoaderConfiguration()
                    .setMissingImportHandlingStrategy(MissingImportHandlingStrategy.SILENT);
            RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
            parser.parse(new RioMemoryTripleSource(sesameModel), ontology, config);
            return SimpleOntologyValues.matontoOntology(ontology);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Unable to create an ontology object.", e);
        }
    }
}

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

import static java.util.Arrays.asList;
import static java.util.Arrays.copyOf;

import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.AnnotationProperty;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.Datatype;
import com.mobi.ontology.core.api.Hierarchy;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.OClass;
import com.mobi.ontology.core.api.ObjectProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.ontology.core.utils.MobiStringUtils;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.*;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.NotImplementedException;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParserRegistry;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.UnsupportedRDFormatException;
import org.eclipse.rdf4j.rio.WriterConfig;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.OWLXMLDocumentFormat;
import org.semanticweb.owlapi.formats.PrefixDocumentFormatImpl;
import org.semanticweb.owlapi.formats.RioRDFXMLDocumentFormatFactory;
import org.semanticweb.owlapi.model.AsOWLClass;
import org.semanticweb.owlapi.model.AsOWLDatatype;
import org.semanticweb.owlapi.model.AxiomType;
import org.semanticweb.owlapi.model.HasDomain;
import org.semanticweb.owlapi.model.HasRange;
import org.semanticweb.owlapi.model.MissingImportHandlingStrategy;
import org.semanticweb.owlapi.model.MissingImportListener;
import org.semanticweb.owlapi.model.MissingOntologyHeaderStrategy;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLClassAssertionAxiom;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLDataPropertyDomainAxiom;
import org.semanticweb.owlapi.model.OWLDataPropertyExpression;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLImportsDeclaration;
import org.semanticweb.owlapi.model.OWLIndividual;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import org.semanticweb.owlapi.model.OWLObjectPropertyAssertionAxiom;
import org.semanticweb.owlapi.model.OWLObjectPropertyDomainAxiom;
import org.semanticweb.owlapi.model.OWLObjectPropertyExpression;
import org.semanticweb.owlapi.model.OWLObjectSomeValuesFrom;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyFactory;
import org.semanticweb.owlapi.model.OWLOntologyIRIMapper;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLOntologyStorageException;
import org.semanticweb.owlapi.model.OWLOntologyWriterConfiguration;
import org.semanticweb.owlapi.model.OWLPropertyDomainAxiom;
import org.semanticweb.owlapi.model.OWLRuntimeException;
import org.semanticweb.owlapi.model.OWLSubAnnotationPropertyOfAxiom;
import org.semanticweb.owlapi.model.OWLSubClassOfAxiom;
import org.semanticweb.owlapi.model.OWLSubPropertyAxiom;
import org.semanticweb.owlapi.model.UnknownOWLOntologyException;
import org.semanticweb.owlapi.model.parameters.Imports;
import org.semanticweb.owlapi.model.parameters.Navigation;
import org.semanticweb.owlapi.model.parameters.OntologyCopy;
import org.semanticweb.owlapi.reasoner.Node;
import org.semanticweb.owlapi.reasoner.NodeSet;
import org.semanticweb.owlapi.reasoner.OWLReasoner;
import org.semanticweb.owlapi.reasoner.OWLReasonerFactory;
import org.semanticweb.owlapi.reasoner.structural.StructuralReasonerFactory;
import org.semanticweb.owlapi.rio.OWLAPIRDFFormat;
import org.semanticweb.owlapi.rio.RioAbstractParserFactory;
import org.semanticweb.owlapi.rio.RioFunctionalSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioManchesterSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioOWLXMLParserFactory;
import org.semanticweb.owlapi.rio.RioParserImpl;
import org.semanticweb.owlapi.rio.RioRenderer;
import org.semanticweb.owlapi.util.OWLOntologyWalker;
import org.semanticweb.owlapi.util.OWLOntologyWalkerVisitor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedInputStream;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class SimpleOntology implements Ontology {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntology.class);
    private ValueFactory valueFactory;
    private OntologyId ontologyId;
    private OntologyManager ontologyManager;
    private SesameTransformer transformer;
    private BNodeService bNodeService;
    private RepositoryManager repoManager;
    private Set<Annotation> ontoAnnotations;
    private Set<Annotation> annotations;
    private Set<AnnotationProperty> annotationProperties;
    private Set<IRI> missingImports = new HashSet<>();
    private Set<IRI> deprecatedIris = new HashSet<>();
    private org.eclipse.rdf4j.model.Model sesameModel;
    private ForkJoinPool threadPool;

    //Owlapi variables
    private OWLOntology owlOntology;
    private OWLReasoner owlReasoner;
    private OWLReasonerFactory owlReasonerFactory = new StructuralReasonerFactory();
    // Instance initialization block sets MissingImportListener for handling missing imports for an ontology.
    private final OWLOntologyLoaderConfiguration config = new OWLOntologyLoaderConfiguration()
            .setMissingImportHandlingStrategy(MissingImportHandlingStrategy.SILENT)
            .setMissingOntologyHeaderStrategy(MissingOntologyHeaderStrategy.IMPORT_GRAPH)
            .setTreatDublinCoreAsBuiltIn(true);
    private OWLOntologyManager owlManager;

    private static String CONCEPT = SKOS.CONCEPT.stringValue();
    private static String CONCEPT_SCHEME = SKOS.CONCEPT_SCHEME.stringValue();

    private static final String SELECT_ENTITY_USAGES;
    private static final String CONSTRUCT_ENTITY_USAGES;
    private static final String GET_SEARCH_RESULTS;
    private static final String GET_ALL_DEPRECATED_IRIS;
    private static final String ENTITY_BINDING = "entity";
    private static final String SEARCH_TEXT = "searchText";

    static {
        try {
            SELECT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-entity-usages.rq"),
                    StandardCharsets.UTF_8
            );
            CONSTRUCT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/construct-entity-usages.rq"),
                    StandardCharsets.UTF_8
            );
            GET_SEARCH_RESULTS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-search-results.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ALL_DEPRECATED_IRIS = IOUtils.toString(
                    SimpleOntology.class.getResourceAsStream("/get-all-deprecated-iris.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    /**
     * Creates a SimpleOntology using the ontology data in an InputStream.
     *
     * @param inputStream     An InputStream containing a serialized ontology
     * @param ontologyManager An OntologyManager
     * @param transformer     A SesameTransformer
     * @param bNodeService    A BNodeService
     * @throws MobiOntologyException If an error occurs during ontology creation
     */
    public SimpleOntology(InputStream inputStream, OntologyManager ontologyManager, SesameTransformer transformer,
                          BNodeService bNodeService, RepositoryManager repoManager, boolean resolveImports,
                          ForkJoinPool threadPool, ValueFactory valueFactory) throws MobiOntologyException {
        initialize(ontologyManager, transformer, bNodeService, repoManager, resolveImports, threadPool, valueFactory);
        byte[] bytes = inputStreamToByteArray(inputStream);
        try {
            sesameModel = createSesameModel(new ByteArrayInputStream(bytes));
        } catch (IOException e) {
            LOG.error("InputStream error. Unable to initialize sesame model", e);
        }
        createOntologyFromSesameModel();
    }

    /**
     * Creates a SimpleOntology using the ontology data in a Mobi Model.
     *
     * @param model           A model containing statements that make up an ontology
     * @param ontologyManager An OntologyManager
     * @param transformer     A SesameTransformer
     * @param bNodeService    A BNodeService
     * @throws MobiOntologyException If an error occurs during ontology creation
     */
    public SimpleOntology(Model model, OntologyManager ontologyManager, SesameTransformer transformer,
                          BNodeService bNodeService, RepositoryManager repoManager, ForkJoinPool threadPool, ValueFactory valueFactory)
            throws MobiOntologyException {
        initialize(ontologyManager, transformer, bNodeService, repoManager, true, threadPool, valueFactory);
        sesameModel = new LinkedHashModel();
        sesameModel = this.transformer.sesameModel(model);
        createOntologyFromSesameModel();

    }

    private void initialize(OntologyManager ontologyManager, SesameTransformer transformer, BNodeService bNodeService,
                            RepositoryManager repoManager, boolean resolveImports, ForkJoinPool threadPool, ValueFactory valueFactory) {
        this.threadPool = threadPool;
        this.ontologyManager = ontologyManager;
        this.transformer = transformer;
        this.bNodeService = bNodeService;
        this.repoManager = repoManager;
        this.owlManager = OWLManager.createOWLOntologyManager();
        this.valueFactory = valueFactory;
        owlManager.addMissingImportListener((MissingImportListener) arg0 -> {
            missingImports.add(SimpleOntologyValues.mobiIRI(arg0.getImportedOntologyURI()));
            LOG.warn("Missing import {} ", arg0.getImportedOntologyURI());
        });
        owlManager.setOntologyLoaderConfiguration(config);
        OWLOntologyWriterConfiguration writerConfig = new OWLOntologyWriterConfiguration()
                .withRemapAllAnonymousIndividualsIds(false)
                .withSaveIdsForAllAnonymousIndividuals(true);
        owlManager.setOntologyWriterConfiguration(writerConfig);
        owlManager.setOntologyConfigurator(owlManager.getOntologyConfigurator()
                .withRemapAllAnonymousIndividualsIds(false)
                .withSaveIdsForAllAnonymousIndividuals(true));
        if (resolveImports) {
            owlManager.getIRIMappers().add(new MobiOntologyIRIMapper(ontologyManager));
            OWLOntologyFactory originalFactory = owlManager.getOntologyFactories().iterator().next();
            owlManager.getOntologyFactories().add(new MobiOntologyFactory(ontologyManager, originalFactory,
                    transformer));
        } else {
            owlManager.setIRIMappers(Collections.singleton(new NoImportLoader()));
        }

        RDFParserRegistry parserRegistry = RDFParserRegistry.getInstance();
        Set<RioAbstractParserFactory> owlParsers = new HashSet<>(Arrays.asList(new RioOWLXMLParserFactory(),
                new RioManchesterSyntaxParserFactory(), new RioFunctionalSyntaxParserFactory()));
        owlParsers.forEach(parserRegistry::add);
    }

    /**
     * Creates a new SimpleOntology object using the provided OWLOntology and OWLOntologyManager. If the provided
     * OWLOntologyManager does not contain the provided OWLOntology, the provided OWLOntology is copied into the
     * OWLOntologyManager. Otherwise, the provided OWLOntology is used.
     */
    protected SimpleOntology(OWLOntology ontology, OWLOntologyManager owlManager, Resource resource,
                             OntologyManager ontologyManager, SesameTransformer transformer,
                             BNodeService bNodeService, RepositoryManager repoManager, ForkJoinPool threadPool) {
        this.ontologyManager = ontologyManager;
        this.transformer = transformer;
        this.bNodeService = bNodeService;
        this.owlManager = owlManager;
        this.repoManager = repoManager;

        try {
            if (!owlManager.contains(ontology)) {
                owlOntology = owlManager.copyOntology(ontology, OntologyCopy.DEEP);
            } else {
                owlOntology = ontology;
            }
        } catch (OWLOntologyCreationException e) {
            throw new MobiOntologyException("Error in ontology creation", e);
        }

        createOntologyId(resource);
        owlReasoner = owlReasonerFactory.createReasoner(owlOntology);
    }

    private void createOntologyId(Resource resource) {
        Optional<org.semanticweb.owlapi.model.IRI> owlOntIRI = owlOntology.getOntologyID().getOntologyIRI();
        Optional<org.semanticweb.owlapi.model.IRI> owlVerIRI = owlOntology.getOntologyID().getVersionIRI();

        IRI matOntIRI;
        IRI matVerIRI;

        if (owlOntIRI.isPresent()) {
            matOntIRI = SimpleOntologyValues.mobiIRI(owlOntIRI.get());

            if (owlVerIRI.isPresent()) {
                matVerIRI = SimpleOntologyValues.mobiIRI(owlVerIRI.get());
                this.ontologyId = ontologyManager.createOntologyId(matOntIRI, matVerIRI);
            } else {
                this.ontologyId = ontologyManager.createOntologyId(matOntIRI);
            }
        } else if (resource != null) {
            this.ontologyId = ontologyManager.createOntologyId(resource);
        } else {
            try {
                org.semanticweb.owlapi.model.IRI docId = owlManager.getOntologyDocumentIRI(owlOntology);
                this.ontologyId = ontologyManager.createOntologyId(SimpleOntologyValues.mobiIRI(docId));
            } catch (UnknownOWLOntologyException ex) {
                this.ontologyId = ontologyManager.createOntologyId();
            }
            if (sesameModel == null) {
                setSesameModel();
            }
            sesameModel.add(transformer.sesameResource(this.ontologyId.getOntologyIdentifier()), RDF.TYPE,
                    OWL.ONTOLOGY);
        }
    }

    /**
     * Creates an Ontology from an initialized sesame model.
     */
    private void createOntologyFromSesameModel() {
        try {
            owlOntology = owlManager.createOntology();
            RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
            parser.parse(new RioMemoryTripleSource(sesameModel), owlOntology, config);
            createOntologyId(null);
            owlReasoner = owlReasonerFactory.createReasoner(owlOntology);
        } catch (OWLOntologyCreationException e) {
            throw new MobiOntologyException("Error in ontology creation", e);
        }
    }

    @Override
    public OntologyId getOntologyId() {
        return ontologyId;
    }

    @Override
    public Set<IRI> getUnloadableImportIRIs() {
        return missingImports;
    }

    @Override
    public Set<Ontology> getImportsClosure() {
        LOG.trace("Enter getImportsClosure()");
        Set<Ontology> ontologies = owlOntology.importsClosure()
                .map(ontology -> {
                    if (ontology.equals(owlOntology)) {
                        return this;
                    }
                    return new SimpleOntology(ontology, owlManager, null, ontologyManager, transformer, bNodeService,
                            repoManager, threadPool);
                })
                .collect(Collectors.toSet());
        LOG.trace("Exit getImportsClosure()");
        return ontologies;
    }

    @Override
    public Set<IRI> getImportedOntologyIRIs() {
        return owlOntology.importsDeclarations()
                .map(OWLImportsDeclaration::getIRI)
                .map(SimpleOntologyValues::mobiIRI)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<IRI> getDeprecatedIRIs() {
        assert GET_ALL_DEPRECATED_IRIS != null;
        return getIRISet(runQueryOnOntology(GET_ALL_DEPRECATED_IRIS, null,
                "getDeprecatedIRIs()", true));
    }

    @Override
    public Set<Annotation> getOntologyAnnotations() throws MobiOntologyException {
        if (ontoAnnotations == null) {
            getAnnotations();
        }
        return ontoAnnotations;
    }

    @Override
    public Set<Annotation> getAllAnnotations() throws MobiOntologyException {
        if (annotations == null) {
            getAnnotations();
        }
        return annotations;
    }

    @Override
    public Set<AnnotationProperty> getAllAnnotationProperties() throws MobiOntologyException {
        if (annotationProperties == null) {
            getAnnotationProperties();
        }
        return annotationProperties;
    }

    @Override
    public Set<OClass> getAllClasses() {
        return getDeclaredClasses(Imports.EXCLUDED)
                .map(SimpleOntologyValues::mobiClass)
                .collect(Collectors.toSet());
    }

    @Override
    public boolean containsClass(IRI iri) {
        org.semanticweb.owlapi.model.IRI classIRI = SimpleOntologyValues.owlapiIRI(iri);
        return owlOntology.containsClassInSignature(classIRI);
    }

    @Override
    public Set<ObjectProperty> getAllClassObjectProperties(IRI iri) {
        org.semanticweb.owlapi.model.IRI classIRI = SimpleOntologyValues.owlapiIRI(iri);
        if (owlOntology.containsClassInSignature(classIRI)) {
            OWLClass owlClass = owlManager.getOWLDataFactory().getOWLClass(classIRI);
            Node<OWLClass> equivalentClasses = owlReasoner.getEquivalentClasses(owlClass);
            NodeSet<OWLClass> superClasses = owlReasoner.getSuperClasses(owlClass);
            return owlOntology.objectPropertiesInSignature(Imports.INCLUDED)
                    .filter(property -> {
                        Set<OWLObjectPropertyDomainAxiom> domains = owlOntology.axioms(
                                OWLObjectPropertyDomainAxiom.class, OWLObjectPropertyExpression.class, property,
                                Imports.INCLUDED, Navigation.IN_SUB_POSITION).collect(Collectors.toSet());
                        return hasClassAsDomain(domains.stream(), classIRI, equivalentClasses, superClasses)
                                || hasNoDomain(domains.stream());
                    })
                    .map(SimpleOntologyValues::mobiObjectProperty)
                    .collect(Collectors.toSet());
        }
        throw new IllegalArgumentException("Class not found in ontology");
    }

    @Override
    public Set<ObjectProperty> getAllNoDomainObjectProperties() {
        return owlOntology.objectPropertiesInSignature(Imports.INCLUDED)
                .filter(property -> hasNoDomain(owlOntology.axioms(OWLObjectPropertyDomainAxiom.class,
                        OWLObjectPropertyExpression.class, property, Imports.INCLUDED, Navigation.IN_SUB_POSITION)))
                .map(SimpleOntologyValues::mobiObjectProperty)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<DataProperty> getAllClassDataProperties(IRI iri) {
        org.semanticweb.owlapi.model.IRI classIRI = SimpleOntologyValues.owlapiIRI(iri);
        if (owlOntology.containsClassInSignature(classIRI)) {
            OWLClass owlClass = owlManager.getOWLDataFactory().getOWLClass(classIRI);
            Node<OWLClass> equivalentClasses = owlReasoner.getEquivalentClasses(owlClass);
            NodeSet<OWLClass> superClasses = owlReasoner.getSuperClasses(owlClass);
            return owlOntology.dataPropertiesInSignature(Imports.INCLUDED)
                    .filter(property -> {
                        Set<OWLDataPropertyDomainAxiom> domains = owlOntology.axioms(OWLDataPropertyDomainAxiom.class,
                                OWLDataPropertyExpression.class, property, Imports.INCLUDED,
                                Navigation.IN_SUB_POSITION).collect(Collectors.toSet());
                        return hasClassAsDomain(domains.stream(), classIRI, equivalentClasses, superClasses)
                                || hasNoDomain(domains.stream());
                    })
                    .map(SimpleOntologyValues::mobiDataProperty)
                    .collect(Collectors.toSet());
        }
        throw new IllegalArgumentException("Class not found in ontology");
    }

    @Override
    public Set<DataProperty> getAllNoDomainDataProperties() {
        return owlOntology.dataPropertiesInSignature(Imports.INCLUDED)
                .filter(property -> hasNoDomain(owlOntology.axioms(OWLDataPropertyDomainAxiom.class,
                        OWLDataPropertyExpression.class, property, Imports.INCLUDED,
                        Navigation.IN_SUB_POSITION)))
                .map(SimpleOntologyValues::mobiDataProperty)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Datatype> getAllDatatypes() {
        return owlOntology.datatypesInSignature()
                .map(SimpleOntologyValues::mobiDatatype)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<ObjectProperty> getAllObjectProperties() {
        return getDeclaredObjectProperties(Imports.EXCLUDED)
                .map(SimpleOntologyValues::mobiObjectProperty)
                .collect(Collectors.toSet());
    }

    @Override
    public Optional<ObjectProperty> getObjectProperty(IRI iri) {
        return getOwlObjectProperty(iri)
                .flatMap(owlObjectProperty -> Optional.of(
                        SimpleOntologyValues.mobiObjectProperty(owlObjectProperty)));
    }

    @Override
    public Set<Resource> getObjectPropertyRange(ObjectProperty objectProperty) {
        getOwlObjectProperty(objectProperty.getIRI()).orElseThrow(() ->
                new IllegalArgumentException("Object property not found in ontology"));
        return owlOntology.objectPropertyRangeAxioms(SimpleOntologyValues.owlapiObjectProperty(objectProperty))
                .map(HasRange::getRange)
                // TODO: Return all range values, not just classes
                .filter(AsOWLClass::isOWLClass)
                .map(owlClassExpression -> SimpleOntologyValues.mobiIRI(owlClassExpression.asOWLClass().getIRI()))
                .collect(Collectors.toSet());
    }

    // TODO: Function to get the domain of a object property

    @Override
    public Set<DataProperty> getAllDataProperties() {
        return getDeclaredDatatypeProperties(Imports.EXCLUDED)
                .map(SimpleOntologyValues::mobiDataProperty)
                .collect(Collectors.toSet());
    }

    @Override
    public Optional<DataProperty> getDataProperty(IRI iri) {
        return getOwlDataProperty(iri)
                .flatMap(owlDataProperty -> Optional.of(
                        SimpleOntologyValues.mobiDataProperty(owlDataProperty)));
    }

    @Override
    public Set<Resource> getDataPropertyRange(DataProperty dataProperty) {
        getOwlDataProperty(dataProperty.getIRI()).orElseThrow(() ->
                new IllegalArgumentException("Data property not found in ontology"));
        return owlOntology.dataPropertyRangeAxioms(SimpleOntologyValues.owlapiDataProperty(dataProperty))
                .map(HasRange::getRange)
                // TODO: Return all range values, not just datatypes
                .filter(AsOWLDatatype::isOWLDatatype)
                .map(owlDataRange -> SimpleOntologyValues.mobiIRI(owlDataRange.asOWLDatatype().getIRI()))
                .collect(Collectors.toSet());
    }

    // TODO: Function to get the domain of a data property

    @Override
    public Set<Individual> getAllIndividuals() {
        return owlOntology.individualsInSignature()
                .filter(this::isDeclaredIndividual)
                .map(SimpleOntologyValues::mobiIndividual)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Individual> getIndividualsOfType(IRI classIRI) {
        return getIndividualsOfType(new SimpleClass(classIRI));
    }

    @Override
    public Set<Individual> getIndividualsOfType(OClass clazz) {
        return owlReasoner.getInstances(SimpleOntologyValues.owlapiClass(clazz)).entities()
                .filter(this::isDeclaredIndividual)
                .map(SimpleOntologyValues::mobiIndividual)
                .collect(Collectors.toSet());
    }

    @Override
    public Hierarchy getSubClassesOf(ValueFactory vf, ModelFactory mf) {
        long start = getStartTime();
        try {
            Hierarchy hierarchy = new Hierarchy(vf, mf);
            Set<OWLClass> classes = getDeclaredClasses(Imports.INCLUDED).collect(Collectors.toSet());
            threadPool.submit(() -> classes.parallelStream()
                    .forEach(owlClass -> {
                        if (owlClass.isTopEntity()) {
                            return;
                        }
                        IRI classIRI = SimpleOntologyValues.mobiIRI(owlClass.getIRI());
                        hierarchy.addIRI(classIRI);
                        getSubClassesFor(owlClass, true)
                                .forEach(subclassIRI -> hierarchy.addParentChild(classIRI, subclassIRI));
                    })).get();
            return hierarchy;
        } catch (InterruptedException | ExecutionException e) {
            throw new MobiOntologyException("Error retrieving getSubClassesOf", e);
        } finally {
            logTrace("getSubClassesOf()", start);
        }
    }

    @Override
    public Set<IRI> getSubClassesFor(IRI iri) {
        long start = getStartTime();
        try {
            OWLClass owlClass = owlManager.getOWLDataFactory().getOWLClass(SimpleOntologyValues.owlapiIRI(iri));
            return getSubClassesFor(owlClass, false).collect(Collectors.toSet());
        } finally {
            logTrace("getSubClassesFor(IRI)", start);
        }
    }

    private Stream<IRI> getSubClassesFor(OWLClass owlClass, boolean direct) {
        if (direct) {
            return owlOntology.axioms(AxiomType.SUBCLASS_OF, Imports.INCLUDED)
                    .filter(axiom -> axiom.getSuperClass().equals(owlClass))
                    .map(OWLSubClassOfAxiom::getSubClass)
                    .filter(subclass -> !subclass.isBottomEntity() && subclass.isOWLClass()
                                && !subclass.asOWLClass().getIRI().equals(owlClass.getIRI()))
                    .map(subclass -> SimpleOntologyValues.mobiIRI(subclass.asOWLClass().getIRI()));
        } else {
            return owlReasoner.getSubClasses(owlClass, false).entities()
                    .filter(subclass -> !subclass.isBottomEntity() && !subclass.getIRI().equals(owlClass.getIRI()))
                    .map(subclass -> SimpleOntologyValues.mobiIRI(subclass.getIRI()));
        }
    }

    private Stream<IRI> getSubClassesFor(Set<OWLSubClassOfAxiom> axioms, OWLClass owlClass, boolean direct) {
        if (direct) {
            return axioms.stream()
                    .filter(axiom -> axiom.getSuperClass().equals(owlClass))
                    .map(OWLSubClassOfAxiom::getSubClass)
                    .filter(subclass -> !subclass.isBottomEntity() && subclass.isOWLClass()
                            && !subclass.asOWLClass().getIRI().equals(owlClass.getIRI()))
                    .map(subclass -> SimpleOntologyValues.mobiIRI(subclass.asOWLClass().getIRI()));
        } else {
            return owlReasoner.getSubClasses(owlClass, false).entities()
                    .filter(subclass -> !subclass.isBottomEntity() && !subclass.getIRI().equals(owlClass.getIRI()))
                    .map(subclass -> SimpleOntologyValues.mobiIRI(subclass.getIRI()));
        }
    }

    private Stream<OWLClass> getDeclaredClasses(Imports imports) {
        return owlOntology.axioms(AxiomType.DECLARATION, imports)
                .filter(axiom -> axiom.getEntity().isOWLClass())
                .map(axiom -> axiom.getEntity().asOWLClass());
    }

    @Override
    public Set<IRI> getSubPropertiesFor(IRI iri) {
        long start = getStartTime();
        try {
            org.semanticweb.owlapi.model.IRI owlapiIRI = SimpleOntologyValues.owlapiIRI(iri);
            if (owlOntology.containsDataPropertyInSignature(owlapiIRI, Imports.INCLUDED)) {
                OWLDataProperty owlDataProperty = owlManager.getOWLDataFactory().getOWLDataProperty(owlapiIRI);
                return getSubDatatypePropertiesFor(owlDataProperty, false).collect(Collectors.toSet());
            } else if (owlOntology.containsObjectPropertyInSignature(owlapiIRI, Imports.INCLUDED)) {
                OWLObjectProperty owlObjectProperty = owlManager.getOWLDataFactory().getOWLObjectProperty(owlapiIRI);
                return getSubObjectPropertiesFor(owlObjectProperty, false).collect(Collectors.toSet());
            } else if (owlOntology.containsAnnotationPropertyInSignature(owlapiIRI, Imports.INCLUDED)) {
                OWLAnnotationProperty owlAnnotationProperty = owlManager.getOWLDataFactory()
                        .getOWLAnnotationProperty(owlapiIRI);
                return getSubAnnotationPropertiesFor(owlAnnotationProperty, false).collect(Collectors.toSet());
            } else {
                return Collections.emptySet();
            }
        } finally {
            logTrace("getSubPropertiesFor(IRI)", start);
        }
    }

    @Override
    public Hierarchy getSubDatatypePropertiesOf(ValueFactory vf, ModelFactory mf) {
        long start = getStartTime();
        try {
            Hierarchy hierarchy = new Hierarchy(vf, mf);
            Set<OWLDataProperty> properties = getDeclaredDatatypeProperties(Imports.INCLUDED)
                    .collect(Collectors.toSet());
            threadPool.submit(() -> properties.parallelStream()
                    .forEach(property -> {
                        IRI propIRI = SimpleOntologyValues.mobiIRI(property.getIRI());
                        hierarchy.addIRI(propIRI);
                        getSubDatatypePropertiesFor(property, true)
                                .forEach(subpropIRI -> hierarchy.addParentChild(propIRI, subpropIRI));
                    })).get();
            return hierarchy;
        } catch (InterruptedException | ExecutionException e) {
            throw new MobiOntologyException("Error retrieving getSubDatatypePropertiesOf", e);
        } finally {
            logTrace("getSubDatatypePropertiesOf()", start);
        }
    }

    private Stream<IRI> getSubDatatypePropertiesFor(OWLDataProperty property, boolean direct) {
        if (direct) {
            return owlOntology.axioms(AxiomType.SUB_DATA_PROPERTY, Imports.INCLUDED)
                    .filter(axiom -> axiom.getSuperProperty().equals(property))
                    .map(OWLSubPropertyAxiom::getSubProperty)
                    .filter(subproperty -> !subproperty.isBottomEntity() && subproperty.isOWLDataProperty()
                            && !subproperty.asOWLDataProperty().getIRI().equals(property.getIRI()))
                    .map(subproperty -> SimpleOntologyValues.mobiIRI(subproperty.asOWLDataProperty().getIRI()));
        } else {
            return owlReasoner.getSubDataProperties(property, false).entities()
                    .filter(subproperty -> !subproperty.isBottomEntity()
                            && !subproperty.getIRI().equals(property.getIRI()))
                    .map(subproperty -> SimpleOntologyValues.mobiIRI(subproperty.getIRI()));
        }
    }

    private Stream<OWLDataProperty> getDeclaredDatatypeProperties(Imports imports) {
        return owlOntology.axioms(AxiomType.DECLARATION, imports)
                .filter(axiom -> axiom.getEntity().isOWLDataProperty())
                .map(axiom -> axiom.getEntity().asOWLDataProperty());
    }

    @Override
    public Hierarchy getSubAnnotationPropertiesOf(ValueFactory vf, ModelFactory mf) {
        long start = getStartTime();
        try {
            Hierarchy hierarchy = new Hierarchy(vf, mf);
            Set<OWLAnnotationProperty> properties = getDeclaredAnnotationProperties(Imports.INCLUDED)
                    .collect(Collectors.toSet());
            threadPool.submit(() -> properties.parallelStream()
                    .forEach(property -> {
                        if (property.isBuiltIn()) {
                            return;
                        }
                        IRI propIRI = SimpleOntologyValues.mobiIRI(property.getIRI());
                        hierarchy.addIRI(propIRI);
                        getSubAnnotationPropertiesFor(property, true)
                                .forEach(subpropIRI -> hierarchy.addParentChild(propIRI, subpropIRI));
                    })).get();
            return hierarchy;
        } catch (InterruptedException | ExecutionException e) {
            throw new MobiOntologyException("Error retrieving subAnnotationPropertiesOf", e);
        } finally {
            logTrace("getSubAnnotationPropertiesOf()", start);
        }
    }

    private Stream<OWLAnnotationProperty> getDeclaredAnnotationProperties(Imports imports) {
        return owlOntology.axioms(AxiomType.DECLARATION, imports)
                .filter(axiom -> axiom.getEntity().isOWLAnnotationProperty())
                .map(axiom -> axiom.getEntity().asOWLAnnotationProperty());
    }

    private Stream<IRI> getSubAnnotationPropertiesFor(OWLAnnotationProperty property, boolean direct) {
        Set<OWLAnnotationProperty> directProps = owlOntology.axioms(AxiomType.SUB_ANNOTATION_PROPERTY_OF,
                Imports.INCLUDED)
                .filter(axiom -> axiom.getSuperProperty().equals(property))
                .map(OWLSubAnnotationPropertyOfAxiom::getSubProperty)
                .filter(subproperty -> !subproperty.isBottomEntity() && subproperty.isOWLAnnotationProperty()
                        && !subproperty.getIRI().equals(property.getIRI()))
                .collect(Collectors.toSet());
        if (direct) {
            return directProps.stream()
                    .map(subproperty -> SimpleOntologyValues.mobiIRI(subproperty.getIRI()));
        } else {
            Set<IRI> rtn = directProps.stream()
                    .map(subproperty -> SimpleOntologyValues.mobiIRI(subproperty.getIRI()))
                    .collect(Collectors.toSet());
            while (directProps.size() > 0) {
                OWLAnnotationProperty nextProp = directProps.iterator().next();
                directProps.remove(nextProp);
                owlOntology.axioms(AxiomType.SUB_ANNOTATION_PROPERTY_OF, Imports.INCLUDED)
                        .filter(axiom -> axiom.getSuperProperty().equals(nextProp))
                        .map(OWLSubAnnotationPropertyOfAxiom::getSubProperty)
                        .filter(subproperty -> !subproperty.isBottomEntity() && subproperty.isOWLAnnotationProperty()
                                && !subproperty.getIRI().equals(nextProp.getIRI()))
                        .forEach(subproperty -> {
                            rtn.add(SimpleOntologyValues.mobiIRI(subproperty.getIRI()));
                            directProps.add(subproperty);
                        });
            }
            return rtn.stream();
        }
    }

    @Override
    public Hierarchy getSubObjectPropertiesOf(ValueFactory vf, ModelFactory mf) {
        long start = getStartTime();
        try {
            Hierarchy hierarchy = new Hierarchy(vf, mf);
            Set<OWLObjectProperty> properties = getDeclaredObjectProperties(Imports.INCLUDED)
                    .collect(Collectors.toSet());
            threadPool.submit(() -> properties.parallelStream()
                    .forEach(property -> {
                        IRI propIRI = SimpleOntologyValues.mobiIRI(property.getIRI());
                        hierarchy.addIRI(propIRI);
                        getSubObjectPropertiesFor(property, true)
                                .forEach(subpropIRI -> hierarchy.addParentChild(propIRI, subpropIRI));
                    })).get();
            return hierarchy;
        } catch (InterruptedException | ExecutionException e) {
            throw new MobiOntologyException("Error retrieving getSubObjectPropertiesOf", e);
        } finally {
            logTrace("getSubObjectPropertiesOf()", start);
        }
    }

    private Stream<IRI> getSubObjectPropertiesFor(OWLObjectProperty property, boolean direct) {
        if (direct) {
            return owlOntology.axioms(AxiomType.SUB_OBJECT_PROPERTY, Imports.INCLUDED)
                    .filter(axiom -> axiom.getSuperProperty().equals(property))
                    .map(OWLSubPropertyAxiom::getSubProperty)
                    .filter(subproperty -> !subproperty.isBottomEntity() && subproperty.isOWLObjectProperty()
                            && !subproperty.getNamedProperty().getIRI().equals(property.getIRI()))
                    .map(subproperty -> SimpleOntologyValues.mobiIRI(subproperty.getNamedProperty().getIRI()));
        } else {
            return owlReasoner.getSubObjectProperties(property, false).entities()
                    .filter(subproperty -> !subproperty.isBottomEntity()
                            && !subproperty.getNamedProperty().getIRI().equals(property.getIRI()))
                    .map(subproperty -> SimpleOntologyValues.mobiIRI(subproperty.getNamedProperty().getIRI()));
        }
    }

    private Stream<OWLObjectProperty> getDeclaredObjectProperties(Imports imports) {
        return owlOntology.axioms(AxiomType.DECLARATION, imports)
                .filter(axiom -> axiom.getEntity().isOWLObjectProperty())
                .map(axiom -> axiom.getEntity().asOWLObjectProperty());
    }

    @Override
    public Hierarchy getClassesWithIndividuals(ValueFactory vf, ModelFactory mf) {
        long start = getStartTime();
        try {
            Hierarchy hierarchy = new Hierarchy(vf, mf);
            Set<OWLClass> classes = getDeclaredClasses(Imports.INCLUDED).collect(Collectors.toSet());
            threadPool.submit(() -> classes.parallelStream()
                    .forEach(owlClass -> {
                        Set<IRI> iris = owlReasoner.instances(owlClass, true)
                                .map(individual -> SimpleOntologyValues.mobiIRI(individual.getIRI()))
                                .collect(Collectors.toSet());
                        if (iris.size() > 0) {
                            IRI classIRI = SimpleOntologyValues.mobiIRI(owlClass.getIRI());
                            iris.forEach(iri -> hierarchy.addParentChild(classIRI, iri));
                        }
                    })).get();
            return hierarchy;
        } catch (InterruptedException | ExecutionException e) {
            throw new MobiOntologyException("Error retrieving getClassesWithIndividuals", e);
        } finally {
            logTrace("getClassesWithIndividuals()", start);
        }
    }

    @Override
    public TupleQueryResult getEntityUsages(Resource entity) {
        return runQueryOnOntology(SELECT_ENTITY_USAGES, tupleQuery -> {
            tupleQuery.setBinding(ENTITY_BINDING, entity);
            return tupleQuery;
        }, "getEntityUsages(ontology, entity)", true);
    }

    @Override
    public Model constructEntityUsages(Resource entity, ModelFactory modelFactory) {
        long start = getStartTime();
        Repository repo = repoManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(transformer.mobiModel(asSesameModel()));
            return constructEntityUsages(entity, conn, modelFactory);
        } finally {
            repo.shutDown();
            logTrace("constructEntityUsages(ontology, entity)", start);
        }
    }

    private Model constructEntityUsages(Resource entity, RepositoryConnection conn, ModelFactory modelFactory) {
        long start = getStartTime();
        try {
            GraphQuery query = conn.prepareGraphQuery(CONSTRUCT_ENTITY_USAGES);
            query.setBinding(ENTITY_BINDING, entity);
            return QueryResults.asModel(query.evaluate(), modelFactory);
        } finally {
            logTrace("constructEntityUsages(entity, conn)", start);
        }
    }

    @Override
    public Hierarchy getConceptRelationships(ValueFactory vf, ModelFactory mf) {
        long start = getStartTime();
        try {
            Hierarchy hierarchy = new Hierarchy(vf, mf);

            OWLClass conceptClass = owlManager.getOWLDataFactory()
                    .getOWLClass(org.semanticweb.owlapi.model.IRI.create(CONCEPT));
            owlReasoner.instances(conceptClass)
                    .filter(this::isDeclaredIndividual)
                    .forEach(concept -> {
                        IRI conceptIRI = SimpleOntologyValues.mobiIRI(concept.getIRI());
                        hierarchy.addIRI(conceptIRI);

                        Set<IRI> superConcepts = new HashSet<>();
                        Set<IRI> subConcepts = new HashSet<>();
                        owlOntology.axioms(concept, Imports.INCLUDED)
                                .filter(axiom -> axiom.getAxiomType() == AxiomType.OBJECT_PROPERTY_ASSERTION)
                                .map(axiom -> (OWLObjectPropertyAssertionAxiom) axiom)
                                .forEach(axiom -> {
                                    String property = axiom.getProperty().getNamedProperty().toStringID();
                                    if (property.equals(SKOS.NARROWER.stringValue())
                                            || property.equals(SKOS.NARROWER_TRANSITIVE.stringValue())
                                            || property.equals(SKOS.NARROW_MATCH.stringValue())) {
                                        IRI subConceptIRI = SimpleOntologyValues.mobiIRI(
                                                org.semanticweb.owlapi.model.IRI.create(axiom.getObject()
                                                        .toStringID()));
                                        if (!subConceptIRI.equals(conceptIRI)
                                                && isDeclaredIndividual(axiom.getObject())) {
                                            subConcepts.add(subConceptIRI);
                                        }
                                    } else if (property.equals(SKOS.BROADER.stringValue())
                                            || property.equals(SKOS.BROADER_TRANSITIVE.stringValue())
                                            || property.equals(SKOS.BROAD_MATCH.stringValue())) {
                                        IRI superConceptIRI = SimpleOntologyValues.mobiIRI(
                                                org.semanticweb.owlapi.model.IRI.create(axiom.getObject()
                                                        .toStringID()));
                                        if (!superConceptIRI.equals(conceptIRI)
                                                && isDeclaredIndividual(axiom.getObject())) {
                                            superConcepts.add(superConceptIRI);
                                        }
                                    }
                                });

                        superConcepts.forEach(iri -> hierarchy.addParentChild(iri, conceptIRI));
                        subConcepts.forEach(iri -> hierarchy.addParentChild(conceptIRI, iri));
                    });

            return hierarchy;
        } finally {
            logTrace("getConceptRelationships()", start);
        }
    }

    @Override
    public Hierarchy getConceptSchemeRelationships(ValueFactory vf, ModelFactory mf) {
        long start = getStartTime();
        try {
            Hierarchy hierarchy = new Hierarchy(vf, mf);
            OWLClass schemeClass = owlManager.getOWLDataFactory()
                    .getOWLClass(org.semanticweb.owlapi.model.IRI.create(CONCEPT_SCHEME));
            owlReasoner.instances(schemeClass)
                    .filter(this::isDeclaredIndividual)
                    .forEach(conceptScheme -> {
                        IRI schemeIRI = SimpleOntologyValues.mobiIRI(conceptScheme.getIRI());
                        hierarchy.addIRI(schemeIRI);
                        owlOntology.referencingAxioms(conceptScheme, Imports.INCLUDED)
                                .filter(axiom -> axiom.getAxiomType() == AxiomType.OBJECT_PROPERTY_ASSERTION)
                                .map(owlIndividualAxiom -> (OWLObjectPropertyAssertionAxiom) owlIndividualAxiom)
                                .forEach(axiom -> {
                                    String property = axiom.getProperty().getNamedProperty().toStringID();
                                    if (property.equals(SKOS.HAS_TOP_CONCEPT.stringValue())) {
                                        IRI conceptIRI = SimpleOntologyValues.mobiIRI(
                                                org.semanticweb.owlapi.model.IRI.create(axiom.getObject()
                                                        .toStringID()));
                                        hierarchy.addParentChild(schemeIRI, conceptIRI);
                                    } else if (property.equals(SKOS.IN_SCHEME.stringValue())
                                            || property.equals(SKOS.TOP_CONCEPT_OF.stringValue())) {
                                        IRI conceptIRI = SimpleOntologyValues.mobiIRI(
                                                org.semanticweb.owlapi.model.IRI.create(axiom.getSubject()
                                                        .toStringID()));
                                        hierarchy.addParentChild(schemeIRI, conceptIRI);
                                    }
                                });
                    });
            return hierarchy;
        } finally {
            logTrace("getConceptSchemeRelationships()", start);
        }
    }

    private boolean isDeclaredIndividual(OWLIndividual individual) {
        return owlOntology.axioms(OWLClassAssertionAxiom.class, OWLIndividual.class, individual, Imports.INCLUDED,
                Navigation.IN_SUB_POSITION).count() > 0;
    }

    @Override
    public TupleQueryResult getSearchResults(String searchText, ValueFactory valueFactory) {
        return runQueryOnOntology(GET_SEARCH_RESULTS, tupleQuery -> {
            tupleQuery.setBinding(SEARCH_TEXT, valueFactory.createLiteral(searchText.toLowerCase()));
            return tupleQuery;
        }, "getSearchResults(ontology, searchText)", true);
    }

    @Override
    public TupleQueryResult getTupleQueryResults(String queryString, boolean includeImports) {
        return runQueryOnOntology(queryString, null, "getTupleQueryResults(ontology, queryString)", includeImports);
    }

    @Override
    public Model getGraphQueryResults(String queryString, boolean includeImports, ModelFactory modelFactory) {
        return runGraphQueryOnOntology(queryString, null, "getGraphQueryResults(ontology, queryString)", includeImports,
                modelFactory);
    }

    /**
     * Uses the provided TupleQueryResult to construct a set of the entities provided.
     *
     * @param tupleQueryResult the TupleQueryResult that contains IRIs
     * @return a Set of IRIs from the TupleQueryResult
     */
    private Set<IRI> getIRISet(TupleQueryResult tupleQueryResult) {
        Set<IRI> iris = new HashSet<>();
        tupleQueryResult.forEach(r -> r.getBinding("s")
                .ifPresent(b -> {
                    if (!(b.getValue() instanceof BNode)) {
//                        System.out.println(b);

                        iris.add(this.valueFactory.createIRI(b.getValue().stringValue()));

//                        SimpleOntologyValues.mobiIRI(b.getValue().stringValue());

                    }
                }));
        return iris;
    }

    /**
     * Retrieves an unmodifiable model for the Ontology. Sets the model if not already found.
     *
     * @return the unmodifiable sesame model that represents this Ontology.
     */
    protected synchronized org.eclipse.rdf4j.model.Model asSesameModel() throws MobiOntologyException {
        if (sesameModel != null) {
            return sesameModel.unmodifiable();
        } else {
            setSesameModel();
            return sesameModel.unmodifiable();
        }
    }

    protected synchronized void setSesameModel() throws MobiOntologyException {
        sesameModel = new org.eclipse.rdf4j.model.impl.LinkedHashModel();
        RDFHandler rdfHandler = new StatementCollector(sesameModel);
        OWLDocumentFormat format = this.owlOntology.getFormat();
        format.setAddMissingTypes(false);
        RioRenderer renderer = new RioRenderer(this.owlOntology, rdfHandler, format);
        renderer.render();
    }

    @Override
    public Model asModel(ModelFactory factory) throws MobiOntologyException {
        Model model = factory.createModel();

        org.eclipse.rdf4j.model.Model sesameModel = asSesameModel();
        sesameModel.forEach(stmt -> model.add(transformer.mobiStatement(stmt)));

        return model;
    }

    @Override
    public OutputStream asTurtle() throws MobiOntologyException {
        OutputStream outputStream = new ByteArrayOutputStream();
        return asTurtle(outputStream);
    }

    @Override
    public OutputStream asTurtle(OutputStream outputStream) throws MobiOntologyException {
        try {
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.TURTLE, outputStream));
            org.eclipse.rdf4j.model.Model sesameModel = asSesameModel();
            Rio.write(sesameModel, rdfWriter);
        } catch (RDFHandlerException e) {
            throw new MobiOntologyException("Error while writing Ontology.");
        }
        return outputStream;
    }

    @Override
    public OutputStream asRdfXml() throws MobiOntologyException {
        OutputStream outputStream = new ByteArrayOutputStream();
        return asRdfXml(outputStream);
    }

    @Override
    public OutputStream asRdfXml(OutputStream outputStream) throws MobiOntologyException {
        try {
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.RDFXML, outputStream));
            org.eclipse.rdf4j.model.Model sesameModel = asSesameModel();
            Rio.write(sesameModel, rdfWriter);
        } catch (RDFHandlerException e) {
            throw new MobiOntologyException("Error while writing Ontology.");
        }
        return outputStream;
    }

    @Override
    public OutputStream asOwlXml() throws MobiOntologyException {
        return getOntologyDocument(new OWLXMLDocumentFormat());
    }

    @Override
    public OutputStream asOwlXml(OutputStream outputStream) throws MobiOntologyException {
        throw new NotImplementedException("OWL/XML format to a given outputStream is not yet implemented. "
              +  "This class will be DEPRECATED in favor of com.mobi.ontology.repository.SimpleOntology.");
    }

    @Override
    public @Nonnull OutputStream asJsonLD(boolean skolemize) throws MobiOntologyException {
        OutputStream outputStream = new ByteArrayOutputStream();
        return asJsonLD(skolemize, outputStream);
    }

    @Override
    public @Nonnull OutputStream asJsonLD(boolean skolemize, OutputStream outputStream) throws MobiOntologyException {
        WriterConfig config = new WriterConfig();
        try {
            org.eclipse.rdf4j.model.Model sesameModel = asSesameModel();
            if (skolemize) {
                sesameModel = transformer.sesameModel(bNodeService.skolemize(transformer.mobiModel(sesameModel)));
            }
            Rio.write(sesameModel, outputStream, RDFFormat.JSONLD, config);
        } catch (RDFHandlerException e) {
            throw new MobiOntologyException("Error while parsing Ontology.");
        }

        return outputStream;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (obj instanceof SimpleOntology) {
            SimpleOntology simpleOntology = (SimpleOntology) obj;
            OntologyId ontologyId = simpleOntology.getOntologyId();
            if (this.ontologyId.equals(ontologyId)) {
                org.eclipse.rdf4j.model.Model thisSesameModel = this.asSesameModel();
                org.eclipse.rdf4j.model.Model otherSesameModel = simpleOntology.asSesameModel();
                return Models.isomorphic(thisSesameModel, otherSesameModel);
            }
        }

        return false;
    }

    @Override
    public int hashCode() {
        // TODO: This looks like an expensive operation
        org.eclipse.rdf4j.model.Model sesameModel = this.asSesameModel();
        return this.ontologyId.hashCode() + sesameModel.hashCode();
    }

    protected OWLOntology getOwlapiOntology() {
        return this.owlOntology;
    }

    protected OWLOntologyManager getOwlapiOntologyManager() {
        return this.owlManager;
    }

    private void addOntologyData(RepositoryConnection conn, boolean includeImports) {
        if (includeImports) {
            conn.begin();
            owlOntology.importsClosure()
                    .map(ontology -> {
                        if (ontology.equals(owlOntology)) {
                            return this;
                        }
                        return new SimpleOntology(ontology, owlManager, null, ontologyManager, transformer,
                                bNodeService, repoManager, threadPool);
                    }).forEach(ont -> conn.add(transformer.mobiModel(ont.asSesameModel())));
            conn.commit();
        } else {
            conn.add(transformer.mobiModel(asSesameModel()));
        }
    }

    /**
     * Executes the provided Graph query on the provided Ontology.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @return the results of the query as a model.
     */
    private Model runGraphQueryOnOntology(String queryString,
                                          @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, boolean includeImports, ModelFactory modelFactory) {
        Repository repo = repoManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            addOntologyData(conn, includeImports);
            return runGraphQueryOnOntology(queryString, addBinding, methodName, conn, modelFactory);
        } finally {
            repo.shutDown();
        }
    }

    /**
     * Executes the provided Graph query on the provided RepositoryConnection.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @param conn        the {@link RepositoryConnection} to run the query against.
     * @return the results of the query as a model.
     */
    private Model runGraphQueryOnOntology(String queryString, @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, RepositoryConnection conn, ModelFactory modelFactory) {
        long start = getStartTime();
        try {
            GraphQuery query = conn.prepareGraphQuery(queryString);
            if (addBinding != null) {
                query = addBinding.apply(query);
            }
            return QueryResults.asModel(query.evaluate(), modelFactory);
        } finally {
            logTrace(methodName, start);
        }
    }

    /**
     * Executes the provided query on the provided RepositoryConnection.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @return the results of the query.
     */
    private TupleQueryResult runQueryOnOntology(String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding,
                                                String methodName, boolean includeImports) {
        Repository repo = repoManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            addOntologyData(conn, includeImports);
            return runQueryOnOntology(queryString, addBinding, methodName, conn);
        } finally {
            repo.shutDown();
        }
    }

    /**
     * Executes the provided query on the provided RepositoryConnection.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @param conn        the {@link RepositoryConnection} to run the query against.
     * @return the results of the query.
     */
    private TupleQueryResult runQueryOnOntology(String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding,
                                                String methodName, RepositoryConnection conn) {
        long start = getStartTime();
        try {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            if (addBinding != null) {
                query = addBinding.apply(query);
            }
            return query.evaluateAndReturn();
        } finally {
            logTrace(methodName, start);
        }
    }

    private long getStartTime() {
        return LOG.isTraceEnabled() ? System.currentTimeMillis() : 0L;
    }

    private void logTrace(String methodName, Long start) {
        if (LOG.isTraceEnabled()) {
            LOG.trace(String.format(methodName + " complete in %d ms", System.currentTimeMillis() - start));
        }
    }

    private @Nonnull OutputStream getOntologyDocument(PrefixDocumentFormatImpl prefixFormat)
            throws MobiOntologyException {
        OutputStream os;
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        OWLDocumentFormat format = owlManager.getOntologyFormat(owlOntology);
        if (format != null && format.isPrefixOWLDocumentFormat()) {
            prefixFormat.copyPrefixesFrom(format.asPrefixOWLDocumentFormat());
        }

        try {
            owlManager.saveOntology(owlOntology, prefixFormat, outputStream);
            os = MobiStringUtils.replaceLanguageTag(outputStream);
        } catch (OWLOntologyStorageException e) {
            throw new MobiOntologyException("Unable to save to an ontology object", e);
        } finally {
            IOUtils.closeQuietly(outputStream);
        }

        return MobiStringUtils.removeOWLGeneratorSignature(os);
    }

    private void getAnnotations() throws MobiOntologyException {
        if (owlOntology == null) {
            throw new MobiOntologyException("ontology is null");
        }
        ontoAnnotations = new HashSet<>();
        annotations = new HashSet<>();

        ontoAnnotations = owlOntology.annotations()
                .map(SimpleOntologyValues::mobiAnnotation)
                .collect(Collectors.toSet());
        annotations.addAll(ontoAnnotations);

        OWLOntologyWalker walker = new OWLOntologyWalker(Collections.singleton(owlOntology));
        OWLOntologyWalkerVisitor visitor = new OWLOntologyWalkerVisitor(walker) {
            @Override
            public void visit(OWLObjectSomeValuesFrom desc) {
                annotations.add(SimpleOntologyValues.mobiAnnotation(getCurrentAnnotation()));
            }
        };

        walker.walkStructure(visitor);
    }

    private void getAnnotationProperties() throws MobiOntologyException {
        if (owlOntology == null) {
            throw new MobiOntologyException("ontology is null");
        }
        annotationProperties = new HashSet<>();

        annotationProperties = getDeclaredAnnotationProperties(Imports.EXCLUDED)
                .map(SimpleOntologyValues::mobiAnnotationProperty)
                .collect(Collectors.toSet());
    }

    private Optional<OWLObjectProperty> getOwlObjectProperty(IRI iri) {
        return owlOntology.objectPropertiesInSignature(Imports.INCLUDED)
                .filter(objectProperty -> objectProperty.getIRI().equals(SimpleOntologyValues.owlapiIRI(iri)))
                .findFirst();
    }

    private Optional<OWLDataProperty> getOwlDataProperty(IRI iri) {
        return owlOntology.dataPropertiesInSignature(Imports.INCLUDED)
                .filter(dataProperty -> dataProperty.getIRI().equals(SimpleOntologyValues.owlapiIRI(iri)))
                .findFirst();
    }

    private <T extends OWLPropertyDomainAxiom<?>> boolean hasClassAsDomain(Stream<T> stream,
                                                                           org.semanticweb.owlapi.model.IRI iri,
                                                                           Node<OWLClass> equivalentClasses,
                                                                           NodeSet<OWLClass> superClasses) {
        return stream.map(HasDomain::getDomain)
                .filter(AsOWLClass::isOWLClass)
                .map(AsOWLClass::asOWLClass)
                .anyMatch(owlClass -> owlClass.getIRI().equals(iri) || equivalentClasses.contains(owlClass)
                        || superClasses.containsEntity(owlClass));
    }

    private <T extends OWLPropertyDomainAxiom<?>> boolean hasNoDomain(Stream<T> stream) {
        return stream.map(HasDomain::getDomain).count() == 0;
    }

    /**
     * Reads the provided {@link InputStream} into a byte[].
     *
     * @param inputStream An ontology {@link InputStream} to convert into a byte array for reuse.
     * @return The {@link InputStream} as a byte array.
     */
    private byte[] inputStreamToByteArray(InputStream inputStream) {
        int size = 8192;
        byte[] bytes = new byte[0];
        try {
            while (size == 8192) {
                byte[] read = new byte[size];
                size = inputStream.read(read);
                int offset = bytes.length;
                bytes = copyOf(bytes, offset + size);
                System.arraycopy(read, 0, bytes, offset, size);
            }
        } catch (IOException e) {
            LOG.error("Unable to read ontology file.", e);
            throw new MobiOntologyException("Unable to read ontology file.", e);
        } catch (NegativeArraySizeException e) {
            LOG.error("InputStream is empty.", e);
            throw new MobiOntologyException("InputStream is empty.", e);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
        return bytes;
    }

    /**
     * Parses and intitializes a {@link org.eclipse.rdf4j.model.Model} for the ontology represented by the
     * {@link InputStream}.
     *
     * @param inputStream the InputStream to parse
     * @throws IOException If there is an error reading the InputStream
     * @throws MobiOntologyException If the stream is invalid for all formats
     */
    private org.eclipse.rdf4j.model.Model createSesameModel(InputStream inputStream) throws IOException,
            MobiOntologyException {
        org.eclipse.rdf4j.model.Model model = new LinkedHashModel();

        Set<RDFFormat> formats = new HashSet<>(asList(RDFFormat.JSONLD, RDFFormat.TRIG, RDFFormat.TURTLE,
                RDFFormat.RDFJSON, RDFFormat.RDFXML, RDFFormat.NTRIPLES, RDFFormat.NQUADS, OWLAPIRDFFormat.OWL_XML,
                OWLAPIRDFFormat.MANCHESTER_OWL, OWLAPIRDFFormat.OWL_FUNCTIONAL));

        Iterator<RDFFormat> rdfFormatIterator = formats.iterator();
        InputStream ontologyData = inputStream.markSupported() ? inputStream : new BufferedInputStream(inputStream);

        try {
            ontologyData.mark(0);

            while (rdfFormatIterator.hasNext()) {
                RDFFormat format = rdfFormatIterator.next();
                try {
                    model = Rio.parse(ontologyData, "", format);
                    LOG.debug("File is {} formatted.", format.getName());
                    break;
                } catch (RDFParseException | UnsupportedRDFormatException | OWLRuntimeException e) {
                    ontologyData.reset();
                    LOG.info("File is not {} formatted.", format.getName());
                }
            }
        } finally {
            IOUtils.closeQuietly(ontologyData);
        }

        if (model.isEmpty()) {
            throw new MobiOntologyException("Ontology was invalid for all formats.");
        }

        return model;
    }

    private class NoImportLoader implements OWLOntologyIRIMapper {
        private static final long serialVersionUID = 1053401035177616554L;
        // Copy and pasted from a blank Protégé document.
        final String blankDocument = "<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">\n";

        @Override
        public org.semanticweb.owlapi.model.IRI getDocumentIRI(org.semanticweb.owlapi.model.IRI iri) {
            File tmp = null;
            try {
                // Create temp file.
                tmp = File.createTempFile("blank", ".rdf");

                // Delete tmp file when program exits.
                tmp.deleteOnExit();

                // Write to temp file
                BufferedWriter out = new BufferedWriter(new FileWriter(tmp));
                out.write(blankDocument);
                out.close();
            } catch (IOException ignored) {
            }
            return org.semanticweb.owlapi.model.IRI.create(tmp); // create blank IRI
        }
    }
}

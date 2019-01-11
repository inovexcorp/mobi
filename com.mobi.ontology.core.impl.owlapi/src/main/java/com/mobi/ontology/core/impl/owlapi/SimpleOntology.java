package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
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

import static java.util.Arrays.asList;
import static java.util.Arrays.copyOf;

import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.NamedIndividual;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.axiom.Axiom;
import com.mobi.ontology.core.api.classexpression.CardinalityRestriction;
import com.mobi.ontology.core.api.classexpression.OClass;
import com.mobi.ontology.core.api.datarange.Datatype;
import com.mobi.ontology.core.api.propertyexpression.AnnotationProperty;
import com.mobi.ontology.core.api.propertyexpression.DataProperty;
import com.mobi.ontology.core.api.propertyexpression.ObjectProperty;
import com.mobi.ontology.core.api.propertyexpression.PropertyExpression;
import com.mobi.ontology.core.api.types.ClassExpressionType;
import com.mobi.ontology.core.impl.owlapi.classexpression.SimpleCardinalityRestriction;
import com.mobi.ontology.core.impl.owlapi.classexpression.SimpleClass;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.ontology.core.utils.MobiStringUtils;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.RDFParserRegistry;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.UnsupportedRDFormatException;
import org.eclipse.rdf4j.rio.WriterConfig;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;
import org.eclipse.rdf4j.rio.helpers.XMLParserSettings;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.OWLXMLDocumentFormat;
import org.semanticweb.owlapi.formats.PrefixDocumentFormatImpl;
import org.semanticweb.owlapi.formats.RioRDFXMLDocumentFormatFactory;
import org.semanticweb.owlapi.model.AsOWLClass;
import org.semanticweb.owlapi.model.AsOWLDatatype;
import org.semanticweb.owlapi.model.HasDomain;
import org.semanticweb.owlapi.model.HasRange;
import org.semanticweb.owlapi.model.MissingImportHandlingStrategy;
import org.semanticweb.owlapi.model.MissingImportListener;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLClassExpressionVisitor;
import org.semanticweb.owlapi.model.OWLDataCardinalityRestriction;
import org.semanticweb.owlapi.model.OWLDataExactCardinality;
import org.semanticweb.owlapi.model.OWLDataMaxCardinality;
import org.semanticweb.owlapi.model.OWLDataMinCardinality;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLDataPropertyDomainAxiom;
import org.semanticweb.owlapi.model.OWLDataPropertyExpression;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLImportsDeclaration;
import org.semanticweb.owlapi.model.OWLObjectCardinalityRestriction;
import org.semanticweb.owlapi.model.OWLObjectExactCardinality;
import org.semanticweb.owlapi.model.OWLObjectMaxCardinality;
import org.semanticweb.owlapi.model.OWLObjectMinCardinality;
import org.semanticweb.owlapi.model.OWLObjectProperty;
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
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;

import java.io.BufferedInputStream;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.Nonnull;

public class SimpleOntology implements Ontology {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyManager.class);

    private OntologyId ontologyId;
    private OntologyManager ontologyManager;
    private SesameTransformer transformer;
    private BNodeService bNodeService;
    private Set<Annotation> ontoAnnotations;
    private Set<Annotation> annotations;
    private Set<AnnotationProperty> annotationProperties;
    private Set<IRI> missingImports = new HashSet<>();
    private org.eclipse.rdf4j.model.Model sesameModel;

    //Owlapi variables
    private OWLOntology owlOntology;
    private OWLReasoner owlReasoner;
    private OWLReasonerFactory owlReasonerFactory = new StructuralReasonerFactory();
    // Instance initialization block sets MissingImportListener for handling missing imports for an ontology.
    private final OWLOntologyLoaderConfiguration config = new OWLOntologyLoaderConfiguration()
            .setMissingImportHandlingStrategy(MissingImportHandlingStrategy.SILENT);
    private OWLOntologyManager owlManager;

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
                          BNodeService bNodeService, boolean resolveImports) throws MobiOntologyException {
        initialize(ontologyManager, transformer, bNodeService, resolveImports);
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
                          BNodeService bNodeService) throws MobiOntologyException {
        initialize(ontologyManager, transformer, bNodeService, true);
        sesameModel = new LinkedHashModel();
        sesameModel = this.transformer.sesameModel(model);
        createOntologyFromSesameModel();

    }

    private void initialize(OntologyManager ontologyManager, SesameTransformer transformer, BNodeService bNodeService,
                            boolean resolveImports) {
        this.ontologyManager = ontologyManager;
        this.transformer = transformer;
        this.bNodeService = bNodeService;
        this.owlManager = OWLManager.createOWLOntologyManager();
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
        owlParsers.forEach(parser -> parserRegistry.add(parser));
    }

    /**
     * Creates a new SimpleOntology object using the provided OWLOntology and OWLOntologyManager. If the provided
     * OWLOntologyManager does not contain the provided OWLOntology, the provided OWLOntology is copied into the
     * OWLOntologyManager. Otherwise, the provided OWLOntology is used.
     */
    protected SimpleOntology(OWLOntology ontology, OWLOntologyManager owlManager, Resource resource,
                             OntologyManager ontologyManager, SesameTransformer transformer,
                             BNodeService bNodeService) {
        this.ontologyManager = ontologyManager;
        this.transformer = transformer;
        this.bNodeService = bNodeService;
        this.owlManager = owlManager;

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
            this.ontologyId = ontologyManager.createOntologyId();
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
                    return new SimpleOntology(ontology, owlManager, null, ontologyManager, transformer, bNodeService);
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
        return owlOntology.classesInSignature()
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
    public Set<Axiom> getAxioms() {
        return owlOntology.axioms()
                .map(SimpleOntologyValues::mobiAxiom)
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
        return owlOntology.objectPropertiesInSignature()
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
        return owlOntology.dataPropertiesInSignature(Imports.INCLUDED)
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
        return Stream.concat(owlOntology.anonymousIndividuals(), owlOntology.individualsInSignature())
                .map(SimpleOntologyValues::mobiIndividual)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<NamedIndividual> getAllNamedIndividuals() {
        return owlOntology.individualsInSignature()
                .map(SimpleOntologyValues::mobiNamedIndividual)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Individual> getIndividualsOfType(IRI classIRI) {
        return getIndividualsOfType(new SimpleClass(classIRI));
    }

    @Override
    public Set<Individual> getIndividualsOfType(OClass clazz) {
        return owlReasoner.getInstances(SimpleOntologyValues.owlapiClass(clazz)).entities()
                .map(SimpleOntologyValues::mobiIndividual)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<CardinalityRestriction> getCardinalityProperties(IRI classIRI) {
        CardinalityVisitor cardinalityVisitor = new CardinalityVisitor();
        OWLClass owlClass = new OWLClassImpl(org.semanticweb.owlapi.model.IRI.create(classIRI.stringValue()));
        owlOntology.subClassAxiomsForSubClass(owlClass).forEach(ax -> ax.getSuperClass().accept(cardinalityVisitor));
        owlOntology.equivalentClassesAxioms(owlClass).forEach(ax -> ax.classExpressions().forEach(classExpression ->
                classExpression.accept(cardinalityVisitor)));
        return cardinalityVisitor.getCardinalityProperties();
    }

    /**
     * Visits existential restrictions and collects the properties which are
     * restricted.
     */
    private static class CardinalityVisitor implements OWLClassExpressionVisitor {

        private final Set<CardinalityRestriction> cardinalityProperties;

        CardinalityVisitor() {
            cardinalityProperties = new HashSet<>();
        }

        Set<CardinalityRestriction> getCardinalityProperties() {
            return cardinalityProperties;
        }

        public void visit(@Nonnull OWLObjectMinCardinality ce) {
            addObjectPropertyExpression(ce, ClassExpressionType.OBJECT_MIN_CARDINALITY);
        }

        public void visit(@Nonnull OWLObjectExactCardinality ce) {
            addObjectPropertyExpression(ce, ClassExpressionType.OBJECT_EXACT_CARDINALITY);
        }

        public void visit(@Nonnull OWLObjectMaxCardinality ce) {
            addObjectPropertyExpression(ce, ClassExpressionType.OBJECT_MAX_CARDINALITY);
        }

        public void visit(@Nonnull OWLDataMinCardinality ce) {
            addDataPropertyExpression(ce, ClassExpressionType.DATA_MIN_CARDINALITY);
        }

        public void visit(@Nonnull OWLDataExactCardinality ce) {
            addDataPropertyExpression(ce, ClassExpressionType.DATA_EXACT_CARDINALITY);
        }

        public void visit(@Nonnull OWLDataMaxCardinality ce) {
            addDataPropertyExpression(ce, ClassExpressionType.DATA_MAX_CARDINALITY);
        }

        private void addObjectPropertyExpression(OWLObjectCardinalityRestriction ce,
                                                 ClassExpressionType classExpressionType) {
            add(SimpleOntologyValues.mobiObjectProperty(ce.getProperty().asOWLObjectProperty()),
                    ce.getCardinality(), classExpressionType);
        }

        private void addDataPropertyExpression(OWLDataCardinalityRestriction ce,
                                               ClassExpressionType classExpressionType) {
            add(SimpleOntologyValues.mobiDataProperty(ce.getProperty().asOWLDataProperty()),
                    ce.getCardinality(), classExpressionType);
        }

        private void add(PropertyExpression pe, int cardinality, ClassExpressionType classExpressionType) {
            cardinalityProperties.add(new SimpleCardinalityRestriction(pe, cardinality, classExpressionType));
        }
    }

    /**
     * @return the unmodifiable sesame model that represents this Ontology.
     */
    protected synchronized org.eclipse.rdf4j.model.Model asSesameModel() throws MobiOntologyException {
        if (sesameModel != null) {
            return sesameModel.unmodifiable();
        } else {
            sesameModel = new org.eclipse.rdf4j.model.impl.LinkedHashModel();
            RDFHandler rdfHandler = new StatementCollector(sesameModel);
            OWLDocumentFormat format = this.owlOntology.getFormat();
            format.setAddMissingTypes(false);
            RioRenderer renderer = new RioRenderer(this.owlOntology, rdfHandler, format);
            renderer.render();
            return sesameModel.unmodifiable();
        }
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
    public @Nonnull OutputStream asJsonLD(boolean skolemize) throws MobiOntologyException {
        OutputStream outputStream = new ByteArrayOutputStream();
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

    private @Nonnull OutputStream getOntologyDocument(PrefixDocumentFormatImpl prefixFormat)
            throws MobiOntologyException {
        OutputStream os = null;
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        OWLDocumentFormat format = owlManager.getOntologyFormat(owlOntology);
        if (format.isPrefixOWLDocumentFormat()) {
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

        annotationProperties = owlOntology.annotationPropertiesInSignature()
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
                .filter(owlClass -> owlClass.getIRI().equals(iri) || equivalentClasses.contains(owlClass)
                        || superClasses.containsEntity(owlClass))
                .count() > 0;
    }

    private <T extends OWLPropertyDomainAxiom<?>> boolean hasNoDomain(Stream<T> stream) {
        return stream.map(HasDomain::getDomain).count() == 0;
    }

    /**
     * Reads the provided {@link InputStream} into a {@link byte[]}
     *
     * @param inputStream
     * @return {@link byte[]}
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
        InputStream markSupported = inputStream.markSupported() ? inputStream : new BufferedInputStream(inputStream);

        try {
            markSupported.mark(0);

            while (rdfFormatIterator.hasNext()) {
                RDFFormat format = rdfFormatIterator.next();
                try {
                    RDFParser parser = Rio.createParser(format);
                    StatementCollector collector = new StatementCollector(model);
                    parser.setRDFHandler(collector);
                    if (format == RDFFormat.RDFXML || format == OWLAPIRDFFormat.OWL_XML) {
                        parser.getParserConfig().set(XMLParserSettings.DISALLOW_DOCTYPE_DECL, false);
                    }
                    parser.parse(markSupported, "");
                    LOG.debug("File is {} formatted.", format.getName());
                    break;
                } catch (RDFParseException | UnsupportedRDFormatException | OWLRuntimeException e) {
                    markSupported.reset();
                    LOG.info("File is not {} formatted.", format.getName());
                }
            }
        } finally {
            if (markSupported != null) {
                IOUtils.closeQuietly(markSupported);
            } else {
                IOUtils.closeQuietly(inputStream);
            }
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

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

import com.google.common.base.Optional;
import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.ontology.core.utils.MatOntoStringUtils;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.openrdf.model.util.Models;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.RDFParseException;
import org.openrdf.rio.Rio;
import org.openrdf.rio.WriterConfig;
import org.openrdf.rio.helpers.JSONLDMode;
import org.openrdf.rio.helpers.JSONLDSettings;
import org.openrdf.rio.helpers.StatementCollector;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.OWLXMLDocumentFormat;
import org.semanticweb.owlapi.formats.PrefixDocumentFormatImpl;
import org.semanticweb.owlapi.formats.RDFXMLDocumentFormat;
import org.semanticweb.owlapi.formats.TurtleDocumentFormat;
import org.semanticweb.owlapi.io.IRIDocumentSource;
import org.semanticweb.owlapi.io.OWLOntologyDocumentSource;
import org.semanticweb.owlapi.io.OWLParser;
import org.semanticweb.owlapi.io.OWLParserFactory;
import org.semanticweb.owlapi.io.StringDocumentSource;
import org.semanticweb.owlapi.model.AddImport;
import org.semanticweb.owlapi.model.MissingImportEvent;
import org.semanticweb.owlapi.model.MissingImportHandlingStrategy;
import org.semanticweb.owlapi.model.MissingImportListener;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLImportsDeclaration;
import org.semanticweb.owlapi.model.OWLObjectSomeValuesFrom;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyID;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLOntologyStorageException;
import org.semanticweb.owlapi.model.parameters.OntologyCopy;
import org.semanticweb.owlapi.rio.RioJsonLDParserFactory;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioRenderer;
import org.semanticweb.owlapi.util.OWLOntologyWalker;
import org.semanticweb.owlapi.util.OWLOntologyWalkerVisitor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;



public class SimpleOntology implements Ontology {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyManager.class);
    
    private OntologyId ontologyId;
    private OntologyManager ontologyManager;
    private Set<Annotation> ontoAnnotations;
    private Set<Annotation> annotations;
    private Set<AnnotationProperty> annotationProperties;
    private Set<IRI> missingImports = new HashSet<>();

    //Owlapi variables
    private OWLOntology owlOntology;
    // Instance initialization block sets MissingImportListener for handling missing imports for an ontology.
    private final OWLOntologyLoaderConfiguration config = new OWLOntologyLoaderConfiguration()
			.setMissingImportHandlingStrategy(MissingImportHandlingStrategy.SILENT);
    private final OWLOntologyManager owlManager = OWLManager.createOWLOntologyManager();

    {
        owlManager.addMissingImportListener(new MissingImportListener() {
            @Override public void importMissing(MissingImportEvent arg0) {
                missingImports.add(SimpleOntologyValues.matontoIRI(arg0.getImportedOntologyURI()));
                LOG.warn("Missing import {} ", arg0.getImportedOntologyURI());
            }
        });
    }

    /**
     * .
     */
    public SimpleOntology(OntologyId ontologyId, OntologyManager ontologyManager) throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;
        this.ontologyId = ontologyId;

        try {
            Optional<org.semanticweb.owlapi.model.IRI> ontologyIRI = Optional.absent();
            Optional<org.semanticweb.owlapi.model.IRI> versionIRI = Optional.absent();

            if (ontologyId.getOntologyIRI().isPresent()) {
                ontologyIRI = Optional.of(SimpleOntologyValues.owlapiIRI(ontologyId.getOntologyIRI().get()));
                if (ontologyId.getVersionIRI().isPresent()) {
                    versionIRI = Optional.of(SimpleOntologyValues.owlapiIRI(ontologyId.getVersionIRI().get()));
                }
            }

            OWLOntologyID owlOntologyID = new OWLOntologyID(ontologyIRI, versionIRI);
            owlOntology = owlManager.createOntology(owlOntologyID);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        }
    }

    /**
     * .
     */
    public SimpleOntology(InputStream inputStream, OntologyManager ontologyManager) throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;

        try {
            OWLOntologyDocumentSource documentSource = new StringDocumentSource(MatOntoStringUtils
                    .inputStreamToText(inputStream));
            owlOntology = owlManager.loadOntologyFromOntologyDocument(documentSource, config);
            createOntologyId(null);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }

    /**
     * .
     */
    public SimpleOntology(File file, OntologyManager ontologyManager) throws MatontoOntologyException,
            FileNotFoundException {
        this(new FileInputStream(file), ontologyManager);
    }

    /**
     * .
     */
    public SimpleOntology(IRI iri, SimpleOntologyManager ontologyManager) throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;

        try {
            OWLOntologyDocumentSource documentSource = new IRIDocumentSource(SimpleOntologyValues.owlapiIRI(iri));
            owlOntology = owlManager.loadOntologyFromOntologyDocument(documentSource, config);
            createOntologyId(null);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        }
    }

    /**
     * .
     */
    public SimpleOntology(String json, OntologyManager ontologyManager) throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;

        OWLParserFactory factory = new RioJsonLDParserFactory();
        OWLParser parser = factory.createParser();

        try {
            OWLOntologyDocumentSource source = new RioMemoryTripleSource(
                    Rio.parse(new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8)), "", RDFFormat.JSONLD));
            owlOntology = owlManager.createOntology();
            parser.parse(source, owlOntology, config);
            createOntologyId(null);
        } catch (IOException | RDFParseException | OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        }

    }

    protected SimpleOntology(OWLOntology ontology, Resource resource, OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;

        try {
            owlOntology = owlManager.copyOntology(ontology, OntologyCopy.DEEP);

            // Copy Imports
            Set<OWLImportsDeclaration> declarations = ontology.getImportsDeclarations();
            for (OWLImportsDeclaration dec : declarations) {
                this.owlManager.makeLoadImportRequest(dec, config);
                this.owlManager.applyChange(new AddImport(this.owlOntology, dec));
            }
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        }

        createOntologyId(resource);
    }

    private void createOntologyId(Resource resource) {
        Optional<org.semanticweb.owlapi.model.IRI> owlOntIriOptional = owlOntology.getOntologyID().getOntologyIRI();
        Optional<org.semanticweb.owlapi.model.IRI> owlVerIriOptional = owlOntology.getOntologyID().getVersionIRI();

        IRI matontoOntIri;
        IRI matontoVerIri;

        if (owlOntIriOptional.isPresent()) {
            matontoOntIri = SimpleOntologyValues.matontoIRI(owlOntIriOptional.get());

            if (owlVerIriOptional.isPresent()) {
                matontoVerIri = SimpleOntologyValues.matontoIRI(owlVerIriOptional.get());
                this.ontologyId = ontologyManager.createOntologyId(matontoOntIri, matontoVerIri);
            } else {
                this.ontologyId = ontologyManager.createOntologyId(matontoOntIri);
            }
        } else if (resource != null) {
            this.ontologyId = ontologyManager.createOntologyId(resource);
        } else {
            this.ontologyId = ontologyManager.createOntologyId();
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
    public Set<Ontology> getDirectImports() {
        return owlOntology.getDirectImports()
                .stream()
                .map(SimpleOntologyValues::matontoOntology)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Ontology> getImportsClosure() {
        return owlOntology.getImportsClosure()
                .stream()
                .map(SimpleOntologyValues::matontoOntology)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Annotation> getOntologyAnnotations() throws MatontoOntologyException {
        if (ontoAnnotations == null) {
            getAnnotations();
        }
        return ontoAnnotations;
    }

    @Override
    public Set<Annotation> getAllAnnotations() throws MatontoOntologyException {
        if (annotations == null) {
            getAnnotations();
        }
        return annotations;
    }

    @Override
    public Set<AnnotationProperty> getAllAnnotationProperties() throws MatontoOntologyException {
        if (annotationProperties == null) {
            getAnnotationProperties();
        }
        return annotationProperties;
    }

    @Override
    public Set<OClass> getAllClasses() {
        return owlOntology.getClassesInSignature()
                .stream()
                .map(SimpleOntologyValues::matontoClass)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Axiom> getAxioms() {
        return owlOntology.getAxioms()
                .stream()
                .map(SimpleOntologyValues::matontoAxiom)
                .collect(Collectors.toSet());
    }
    
    @Override
    public Set<Datatype> getAllDatatypes() {
        return owlOntology.getDatatypesInSignature()
                .stream()
                .map(SimpleOntologyValues::matontoDatatype)
                .collect(Collectors.toSet());
    }
    
    @Override
    public Set<ObjectProperty> getAllObjectProperties() {
        return owlOntology.getObjectPropertiesInSignature()
                .stream()
                .map(SimpleOntologyValues::matontoObjectProperty)
                .collect(Collectors.toSet());
    }
    
    @Override
    public Set<DataProperty> getAllDataProperties() {
        return owlOntology.getDataPropertiesInSignature()
                .stream()
                .map(SimpleOntologyValues::matontoDataProperty)
                .collect(Collectors.toSet());
    }
    
    @Override
    public Set<Individual> getAllIndividuals() {
        return owlOntology.getIndividualsInSignature()
                .stream()
                .map(SimpleOntologyValues::matontoIndividual)
                .collect(Collectors.toSet());
    }

    /**
     * .
     * @return the unmodifiable sesame model that represents this Ontology.
     */
    protected org.openrdf.model.Model asSesameModel() throws MatontoOntologyException {
        org.openrdf.model.Model sesameModel = new org.openrdf.model.impl.LinkedHashModel();
        ByteArrayOutputStream bos = null;
        ByteArrayInputStream is = null;

        try {
            bos = (ByteArrayOutputStream) this.asRdfXml();
            is = new ByteArrayInputStream(bos.toByteArray());
            OWLOntologyManager tempManager = OWLManager.createOWLOntologyManager();
            OWLOntologyDocumentSource documentSource = new StringDocumentSource(MatOntoStringUtils
                    .inputStreamToText(is));
            OWLOntology tempOntology = tempManager.loadOntologyFromOntologyDocument(documentSource, config);
            OWLDocumentFormat parsedFormat = tempManager.getOntologyFormat(tempOntology);
            RDFHandler rdfHandler = new StatementCollector(sesameModel);
            RioRenderer renderer = new RioRenderer(tempOntology, rdfHandler, parsedFormat);

            renderer.render();

        } catch (IOException e) {
            throw new MatontoOntologyException("Error in Rio Rendering", e);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in loading ontology document", e);
        } finally {
            IOUtils.closeQuietly(bos);
            IOUtils.closeQuietly(is);
        }

        return sesameModel.unmodifiable();
    }

    @Override
    public Model asModel(ModelFactory factory) throws MatontoOntologyException {
        Model matontoModel = factory.createModel();

        asSesameModel().forEach(stmt -> matontoModel.add(ontologyManager.getTransformer().matontoStatement(stmt)));

        return matontoModel;
    }

    @Override
    public OutputStream asTurtle() throws MatontoOntologyException {
        return getOntologyDocument(new TurtleDocumentFormat());
    }

    @Override
    public OutputStream asRdfXml() throws MatontoOntologyException {
        return getOntologyDocument(new RDFXMLDocumentFormat());
    }

    @Override
    public OutputStream asOwlXml() throws MatontoOntologyException {
        return getOntologyDocument(new OWLXMLDocumentFormat());
    }

    @Override
    public @Nonnull OutputStream asJsonLD() throws MatontoOntologyException {
        OutputStream outputStream = new ByteArrayOutputStream();
        WriterConfig config = new WriterConfig();
        config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
        try {
            Rio.write(asSesameModel(), outputStream, RDFFormat.JSONLD, config);
        } catch (RDFHandlerException e) {
            throw new MatontoOntologyException("Error while parsing Ontology.");
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
            if (ontologyId.equals(ontologyId)) {
                return Models.isomorphic(this.asSesameModel(), simpleOntology.asSesameModel());
            }
        }

        return false;
    }

    @Override
    public int hashCode() {
        // TODO: This looks like an expensive operation
        return this.ontologyId.hashCode() + this.asSesameModel().hashCode();
    }

    protected OWLOntology getOwlapiOntology() {
        return this.owlOntology;
    }

    protected OWLOntologyManager getOwlapiOntologyManager() {
        return this.owlManager;
    }

    private @Nonnull OutputStream getOntologyDocument(PrefixDocumentFormatImpl prefixFormat)
            throws MatontoOntologyException {
        OutputStream os = null;
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        OWLDocumentFormat format = owlManager.getOntologyFormat(owlOntology);
        if (format.isPrefixOWLOntologyFormat()) {
            prefixFormat.copyPrefixesFrom(format.asPrefixOWLOntologyFormat());
        }

        try {
            owlManager.saveOntology(owlOntology, prefixFormat, outputStream);
            os = MatOntoStringUtils.replaceLanguageTag(outputStream);

        } catch (OWLOntologyStorageException e) {
            throw new MatontoOntologyException("Unable to save to an ontology object", e);
        } finally {
            IOUtils.closeQuietly(outputStream);
        }

        if (os != null) {
            return MatOntoStringUtils.removeOWLGeneratorSignature(os);
        } else {
            return new ByteArrayOutputStream();
        }
    }

    private void getAnnotations() throws MatontoOntologyException {
        if (owlOntology == null) {
            throw new MatontoOntologyException("ontology is null");
        }
        ontoAnnotations = new HashSet<>();
        annotations = new HashSet<>();

        ontoAnnotations = owlOntology.getAnnotations().stream()
                .map(SimpleOntologyValues::matontoAnnotation)
                .collect(Collectors.toSet());
        annotations.addAll(ontoAnnotations);

        OWLOntologyWalker walker = new OWLOntologyWalker(Collections.singleton(owlOntology));
        OWLOntologyWalkerVisitor visitor = new OWLOntologyWalkerVisitor(walker) {
            @Override
            public void visit(OWLObjectSomeValuesFrom desc) {
                annotations.add(SimpleOntologyValues.matontoAnnotation(getCurrentAnnotation()));
            }
        };

        walker.walkStructure(visitor);
    }

    private void getAnnotationProperties() throws MatontoOntologyException {
        if (owlOntology == null) {
            throw new MatontoOntologyException("ontology is null");
        }
        annotationProperties = new HashSet<>();

        annotationProperties = owlOntology.getAnnotationPropertiesInSignature().stream()
                .map(SimpleOntologyValues::matontoAnnotationProperty)
                .collect(Collectors.toSet());
    }
}

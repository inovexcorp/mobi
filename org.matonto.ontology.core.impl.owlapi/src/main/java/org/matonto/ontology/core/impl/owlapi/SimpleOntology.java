package org.matonto.ontology.core.impl.owlapi;

import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.*;
import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.impl.owlapi.axiom.SimpleAxiom;
import org.matonto.ontology.core.utils.MatOntoStringUtils;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.openrdf.model.Model;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.model.util.Models;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.StatementCollector;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.OWLXMLDocumentFormat;
import org.semanticweb.owlapi.formats.PrefixDocumentFormatImpl;
import org.semanticweb.owlapi.formats.RDFXMLDocumentFormat;
import org.semanticweb.owlapi.formats.TurtleDocumentFormat;
import org.semanticweb.owlapi.model.*;
import org.semanticweb.owlapi.rio.RioRenderer;

import java.io.*;
import java.util.Set;
import java.util.stream.Collectors;


public class SimpleOntology implements Ontology {

	private OntologyId ontologyId;
	
	//Owlapi variables
	private OWLOntology ontology;
	private OWLOntologyManager manager = OWLManager.createOWLOntologyManager();

    protected SimpleOntology(OWLOntology ontology) {
        this.ontology = ontology;

        OWLOntologyID owlApiID = ontology.getOntologyID();
        com.google.common.base.Optional<IRI> oIRI = owlApiID.getOntologyIRI();
        com.google.common.base.Optional<IRI> vIRI = owlApiID.getVersionIRI();

        if (owlApiID.isAnonymous()) {
            ontologyId = new SimpleOntologyId();
        } else if (vIRI.isPresent()) {
            ontologyId = new SimpleOntologyId(SimpleIRI.matontoIRI(oIRI.get()), SimpleIRI.matontoIRI(vIRI.get()));
        } else {
            ontologyId = new SimpleOntologyId(SimpleIRI.matontoIRI(oIRI.get()));
        }
    }
	
	public SimpleOntology(OntologyId ontologyId) throws MatontoOntologyException {
        this.ontologyId = ontologyId;

		try {
			ontology = manager.createOntology();
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}
	
	public SimpleOntology(InputStream inputStream, OntologyId ontologyId) throws MatontoOntologyException {
        this.ontologyId = ontologyId;

		try {
			ontology = manager.loadOntologyFromOntologyDocument(inputStream);
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}
	
	public SimpleOntology(File file, OntologyId ontologyId) throws MatontoOntologyException, FileNotFoundException {
        this(new FileInputStream(file), ontologyId);
	}
	
	public SimpleOntology(OntologyIRI iri, OntologyId ontologyId) throws MatontoOntologyException {
        this.ontologyId = ontologyId;

		try {
			ontology = manager.loadOntologyFromOntologyDocument(SimpleIRI.owlapiIRI(iri));
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}

	@Override
	public OntologyId getOntologyId() {
		return ontologyId;
	}

//    @Override
//    public void addOWLObject(@Nonnull org.matonto.ontology.core.api.OWLObject object) {
//        OWLOntologyChange change;
//
//        if (object instanceof Annotation) {
//            change = new AddOntologyAnnotation(ontology, SimpleAnnotation.owlapiAnnotation( (Annotation) object));
//        } else {
//            throw new IllegalArgumentException("OWLObject not supported.");
//        }
//
//        manager.applyChange(change);
//    }

	@Override
	public Set<Annotation> getAnnotations() {
        return ontology.getAnnotations()
                .stream()
                .map(SimpleAnnotation::matontoAnnotation)
                .collect(Collectors.toSet());
	}

    @Override
    public Set<Axiom> getAxioms() {
        return ontology.getAxioms()
                .stream()
                .map(SimpleAxiom::matontoAxiom)
                .collect(Collectors.toSet());
    }

//    @Override
//    public void addAnnotation(@Nonnull Annotation annotation) {
//        AnnotationChange change = new AddOntologyAnnotation(ontology, SimpleAnnotation.owlapiAnnotation(annotation));
//        manager.applyChange(change);
//    }
//
//    @Override
//    public void addAnnotations(@Nonnull Set<Annotation> annotations) {
//        List<AnnotationChange> changes = annotations
//                .stream()
//                .map(annotation -> new AddOntologyAnnotation(ontology, SimpleAnnotation.owlapiAnnotation(annotation)))
//                .collect(Collectors.toList());
//
//        manager.applyChanges(changes);
//    }
//
//    @Override
//    public void removeAnnotation(Annotation annotation) {
//        AnnotationChange change = new RemoveOntologyAnnotation(ontology, SimpleAnnotation.owlapiAnnotation(annotation));
//        manager.applyChange(change);
//    }
//
//    @Override
//    public void removeAllAnnotations() {
//        List<AnnotationChange> changes = ontology.getAnnotations()
//                .stream()
//                .map(annotation -> new RemoveOntologyAnnotation(ontology, annotation))
//                .collect(Collectors.toList());
//
//        manager.applyChanges(changes);
//    }
//
//    @Override
//    public void setAnnotations(@Nonnull Set<Annotation> annotations) {
//        removeAllAnnotations();
//        addAnnotations(annotations);
//    }

    /**
     * @return the unmodifiable sesame model that represents this Ontology
     */
	@Override
	public Model asModel() throws MatontoOntologyException
	{
		Model sesameModel = new LinkedHashModel();
		ByteArrayOutputStream bos = null;
		ByteArrayInputStream is = null;
		
		try {
			bos = (ByteArrayOutputStream) this.asRdfXml();
			is = new ByteArrayInputStream(bos.toByteArray());
			OWLOntologyManager tempManager = OWLManager.createOWLOntologyManager();
			OWLOntology tempOntology = tempManager.loadOntologyFromOntologyDocument(is);
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
	public OutputStream asJsonLD() throws MatontoOntologyException {
		OutputStream outputStream = new ByteArrayOutputStream();
		try {
			Rio.write(asModel(), outputStream, RDFFormat.JSONLD);
		} catch (RDFHandlerException e) {
			e.printStackTrace();
		}
		return outputStream;
	}

	@Override
	public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o instanceof SimpleOntology) {
        	SimpleOntology simpleOntology = (SimpleOntology) o;
        	OntologyId oId = simpleOntology.getOntologyId();
        	if(oId.equals(ontologyId))
        		return Models.isomorphic(this.asModel(), simpleOntology.asModel());
        }

        return false;
	}

    @Override
    public int hashCode() {
    	return this.ontologyId.hashCode() + this.asModel().hashCode();
    }

    protected OWLOntology getOwlapiOntology() {
        return this.ontology;
    }

    protected OWLOntologyManager getOwlapiOntologyManager() {
        return this.manager;
    }

	private OutputStream getOntologyDocument(PrefixDocumentFormatImpl prefixFormat) throws MatontoOntologyException {
		OutputStream os = null;
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		OWLDocumentFormat format = manager.getOntologyFormat(ontology);
		if (format.isPrefixOWLOntologyFormat()) { 
			  prefixFormat.copyPrefixesFrom(format.asPrefixOWLOntologyFormat()); 
		}
		
		try {
			manager.saveOntology(ontology, prefixFormat, outputStream);
			os = MatOntoStringUtils.replaceLanguageTag(outputStream);
			
		} catch (OWLOntologyStorageException e) {
			throw new MatontoOntologyException("Unable to save to an ontology object", e);
		} finally {
			IOUtils.closeQuietly(outputStream);
		}
		
		if(os != null)
			return MatOntoStringUtils.removeOWLGeneratorSignature(os);
		
		else
			return os;
	}
}

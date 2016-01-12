package org.matonto.ontology.core.impl.owlapi;

import com.google.common.base.Optional;
import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.*;
import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.utils.MatOntoStringUtils;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.openrdf.model.util.Models;
import org.openrdf.rio.*;
import org.openrdf.rio.helpers.JSONLDMode;
import org.openrdf.rio.helpers.JSONLDSettings;
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
    private OntologyManager ontologyManager;

	public SimpleOntology(OntologyId ontologyId, OntologyManager ontologyManager) throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;
        this.ontologyId = ontologyId;

		try {
            Optional<org.semanticweb.owlapi.model.IRI> oIri = Optional.absent();
            Optional<org.semanticweb.owlapi.model.IRI> vIri = Optional.absent();

            if (ontologyId.getOntologyIRI().isPresent()) {
                oIri = Optional.of(SimpleOntologyValues.owlapiIRI(ontologyId.getOntologyIRI().get()));
                if (ontologyId.getVersionIRI().isPresent()) {
                    vIri = Optional.of(SimpleOntologyValues.owlapiIRI(ontologyId.getVersionIRI().get()));
                }
            }

            OWLOntologyID owlOntologyID = new OWLOntologyID(oIri, vIri);
            ontology = manager.createOntology(owlOntologyID);
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}
	
	public SimpleOntology(InputStream inputStream, OntologyManager ontologyManager) throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;

        try {
			ontology = manager.loadOntologyFromOntologyDocument(inputStream);
            createOntologyId();
        } catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}

	public SimpleOntology(File file, OntologyManager ontologyManager) throws MatontoOntologyException, FileNotFoundException {
        this(new FileInputStream(file), ontologyManager);
	}
	
	public SimpleOntology(IRI iri, SimpleOntologyManager ontologyManager) throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;

		try {
			ontology = manager.loadOntologyFromOntologyDocument(SimpleOntologyValues.owlapiIRI(iri));
            createOntologyId();
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}

    protected SimpleOntology(OWLOntology ontology, OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;

        this.ontology = ontology;
        this.manager = this.ontology.getOWLOntologyManager();

        createOntologyId();
    }

    private void createOntologyId() {
        Optional<org.semanticweb.owlapi.model.IRI> owlOntIriOptional = ontology.getOntologyID().getOntologyIRI();
        Optional<org.semanticweb.owlapi.model.IRI> owlVerIriOptional = ontology.getOntologyID().getVersionIRI();

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
        } else {
            this.ontologyId = ontologyManager.createOntologyId();
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
                .map(SimpleOntologyValues::matontoAnnotation)
                .collect(Collectors.toSet());
	}

    @Override
    public Set<Axiom> getAxioms() {
        return ontology.getAxioms()
                .stream()
                .map(SimpleOntologyValues::matontoAxiom)
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
	protected org.openrdf.model.Model asSesameModel() throws MatontoOntologyException {
	    org.openrdf.model.Model sesameModel = new org.openrdf.model.impl.LinkedHashModel();
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
    public Model asModel(ModelFactory factory) throws MatontoOntologyException {
        Model matontoModel = factory.createModel();

        asSesameModel().forEach(stmt -> {
            matontoModel.add(ontologyManager.getTransformer().matontoStatement(stmt));
        });

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
	public OutputStream asJsonLD() throws MatontoOntologyException {
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
	public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o instanceof SimpleOntology) {
        	SimpleOntology simpleOntology = (SimpleOntology) o;
        	OntologyId oId = simpleOntology.getOntologyId();
        	if(oId.equals(ontologyId))
        		return Models.isomorphic(this.asSesameModel(), simpleOntology.asSesameModel());
        }

        return false;
	}

    @Override
    public int hashCode() {
        // TODO: This looks like an expensive operation
    	return this.ontologyId.hashCode() + this.asSesameModel().hashCode();
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

package org.matonto.ontology.core.impl.owlapi;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Axiom;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.OntologyId;
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
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLOntologyStorageException;
import org.semanticweb.owlapi.rio.RioRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class SimpleOntology implements Ontology {

	private OntologyIRI iri;
	private OntologyId ontologyId;
	private Set<Axiom> axioms;
	private Set<Annotation> annotations = new HashSet<Annotation>();
	private Set<OntologyIRI> directImportIris = new HashSet<OntologyIRI>();
	
	//Owlapi variables
	private OWLOntology ontology;
	private OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
	private static final Logger LOG = LoggerFactory.getLogger(SimpleOntology.class);
	
	protected SimpleOntology() throws MatontoOntologyException
	{
		try {
			ontology = manager.createOntology();
			iri = SimpleIRI.matontoIRI(manager.getOntologyDocumentIRI(ontology));
			
		} catch (OWLOntologyCreationException e) {		
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
		
	}
	
	public SimpleOntology(OntologyId ontologyId) throws MatontoOntologyException
	{
		try {
			ontology = manager.createOntology();
			iri = SimpleIRI.matontoIRI(manager.getOntologyDocumentIRI(ontology));
			this.ontologyId = ontologyId;
			
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}
	
	
	public SimpleOntology(InputStream inputStream, OntologyId ontologyId) throws MatontoOntologyException
	{
		try {
			ontology = manager.loadOntologyFromOntologyDocument(inputStream);
			iri = SimpleIRI.matontoIRI(manager.getOntologyDocumentIRI(ontology));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}
	
	
	public SimpleOntology(File file, OntologyId ontologyId) throws MatontoOntologyException
	{
		iri = SimpleIRI.create(file);
		try {
			ontology = manager.loadOntologyFromOntologyDocument(SimpleIRI.owlapiIRI(iri));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}
	
	
	public SimpleOntology(URL url, OntologyId ontologyId) throws MatontoOntologyException
	{
		iri = SimpleIRI.create(url);
		try {
			ontology = manager.loadOntologyFromOntologyDocument(SimpleIRI.owlapiIRI(iri));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}
	
	
	protected OWLOntology getOwlapiOntology()
	{
		return this.ontology;
	}
	
	
	protected void setOntology(OWLOntology ontology)
	{
		this.ontology = ontology;
	}
	
	
	protected OWLOntologyManager getOwlapiOntologyManager()
	{
		return this.manager;
	}
	
	
	protected void setOwlapiOntologyManager(OWLOntologyManager manager)
	{
		this.manager = manager;
	}
	
	
	public OntologyIRI getIRI()
	{
		return iri;
	}
	
	
	protected void setIRI(OntologyIRI iri)
	{
		this.iri = iri;
	}
	
	
	@Override
	public void setOntologyId(OntologyId ontologyId)
	{
		this.ontologyId = ontologyId;
	}
	

	@Override
	public OntologyId getOntologyId() 
	{
		return ontologyId;
	}
	
	
	@Override
	public void setAnnotations(Set<Annotation> annotations) 
	{
		mergeAnnos(annotations);
	}
	
	
	@Override
	public Set<Annotation> getAnnotations()
	{
		return new HashSet<Annotation>(annotations);
	}
	
	
	protected void setAxioms()
	{
		getOntologyAxioms();
	}

	
//	@Override
	public Set<Axiom> getAxioms() 
	{
		return new HashSet<Axiom>(axioms);
	}
	
	
	protected void setDirectImportsDocuments()
	{
		getOntologyDirectImportsIris();
	}
	
	
	@Override
	public Set<OntologyIRI> getDirectImportsDocuments() 
	{
		return directImportIris;
	}
	

    /**
     * @return the unmodifiable sesame model that represents this Ontology
     */
	@Override
	public Model asModel() 
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
			e.printStackTrace();
		} catch (OWLOntologyCreationException e) {
			e.printStackTrace();
		} finally {
			IOUtils.closeQuietly(bos);
			IOUtils.closeQuietly(is);
		}
		
		return sesameModel.unmodifiable();
	}
	
	
	@Override
	public OutputStream asTurtle() 
	{		
		return getOntologyDocument(new TurtleDocumentFormat());		
	}

	
	@Override
	public OutputStream asRdfXml() 
	{
		return getOntologyDocument(new RDFXMLDocumentFormat());		
	}

	
	@Override
	public OutputStream asOwlXml() 
	{
		return getOntologyDocument(new OWLXMLDocumentFormat());
	}
	
	
	@Override
	public OutputStream asJsonLD()
	{
		OutputStream outputStream = new ByteArrayOutputStream();
		try {
			Rio.write(asModel(), outputStream, RDFFormat.JSONLD);
		} catch (RDFHandlerException e) {
			e.printStackTrace();
		}
		return outputStream;
	}
	


	@Override
	public boolean importOntology(InputStream inputStream, OntologyId ontologyId) throws MatontoOntologyException
	{
		try {
			ontology = manager.loadOntologyFromOntologyDocument(inputStream);
			iri = SimpleIRI.matontoIRI(manager.getOntologyDocumentIRI(ontology));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
			return true;
			
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}
	
	
	@Override
	public boolean importOntology(File file, OntologyId ontologyId)  throws MatontoOntologyException
	{
		try {
			iri = SimpleIRI.create(file);
			ontology = manager.loadOntologyFromOntologyDocument(SimpleIRI.owlapiIRI(iri));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
			return true;
			
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}
	

	@Override
	public boolean importOntology(URL url, OntologyId ontologyId) throws MatontoOntologyException
	{
		try {
			iri = SimpleIRI.create(url);
			ontology = manager.loadOntologyFromOntologyDocument(SimpleIRI.owlapiIRI(iri));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
			return true;
			
		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Error in ontology creation", e);
		}
	}

	

	@Override
	public boolean equals(Object o) 
	{
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
    public int hashCode() 
    {
    	return this.ontologyId.hashCode();
    }
    
    
	private OutputStream getOntologyDocument(PrefixDocumentFormatImpl prefixFormat)
	{
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
			e.printStackTrace();
		} finally {
			IOUtils.closeQuietly(outputStream);
		}
		
		if(os != null)
			return MatOntoStringUtils.removeOWLGeneratorSignature(os);
		
		else
			return os;
		
	}
	
	
	protected void getOntologyAnnotations()
	{
		if(ontology != null) {
			Set<OWLAnnotation> owlAnnos = ontology.getAnnotations();
			for(OWLAnnotation owlAnno : owlAnnos) {
				annotations.add(SimpleAnnotation.matontoAnnotation(owlAnno));
			}
		}			
	}
	
	
	private void mergeAnnos(Set<Annotation> annotations)
	{
		if(this.annotations.isEmpty())
			this.annotations = new HashSet<Annotation>(annotations);
		else
			this.annotations.addAll(annotations);
	}


	private void getOntologyDirectImportsIris()
	{
		if(ontology != null) {
			Set<IRI> owlIris = ontology.getDirectImportsDocuments();
			for(IRI owlIri : owlIris) {
				directImportIris.add(SimpleIRI.matontoIRI(owlIri));
			}
		}
	}
	
	
	private void getOntologyAxioms()
	{
//		if(ontology != null) 
//			axioms = ontology.getAxioms();
	}
	

}

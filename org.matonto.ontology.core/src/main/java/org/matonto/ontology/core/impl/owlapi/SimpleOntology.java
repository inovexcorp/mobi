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
import org.matonto.ontology.core.utils.MatOntoStringUtils;
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
	private SimpleOntologyId ontologyId;
	private Set<OWLAxiom> axioms;
	private Set<Annotation> annotations;
	private Set<OntologyIRI> directImportIris;
	
	//Owlapi variables
	private OWLOntology ontology;
	private OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
	private static final Logger LOG = LoggerFactory.getLogger(SimpleOntology.class);
	
	protected SimpleOntology()
	{
		try {
			ontology = manager.createOntology();
			iri = SimpleIRI.matontoIRI(manager.getOntologyDocumentIRI(ontology));
			
		} catch (OWLOntologyCreationException e) {		
			e.printStackTrace();
		}
		
	}
	
	public SimpleOntology(SimpleOntologyId ontologyId)
	{
		try {
			ontology = manager.createOntology();
			iri = SimpleIRI.matontoIRI(manager.getOntologyDocumentIRI(ontology));
			this.ontologyId = ontologyId;
			
		} catch (OWLOntologyCreationException e) {
			e.printStackTrace();
		}
	}
	
	
	public SimpleOntology(InputStream inputStream, SimpleOntologyId ontologyId)
	{
		try {
			ontology = manager.loadOntologyFromOntologyDocument(inputStream);
			iri = SimpleIRI.matontoIRI(manager.getOntologyDocumentIRI(ontology));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
		} catch (OWLOntologyCreationException e) {
			e.printStackTrace();
		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}
	
	
	public SimpleOntology(File file, SimpleOntologyId ontologyId)
	{
		iri = SimpleIRI.create(file);
		try {
			ontology = manager.loadOntologyFromOntologyDocument(SimpleIRI.owlapiIRI(iri));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
		} catch (OWLOntologyCreationException e) {
			e.printStackTrace();
		}
	}
	
	
	public SimpleOntology(URL url, SimpleOntologyId ontologyId)
	{
		iri = SimpleIRI.create(url);
		try {
			ontology = manager.loadOntologyFromOntologyDocument(SimpleIRI.owlapiIRI(iri));
			this.ontologyId = ontologyId;
			getOntologyAnnotations();
			getOntologyDirectImportsIris();
			getOntologyAxioms();
		} catch (OWLOntologyCreationException e) {
			e.printStackTrace();
		}
	}
	
	
	protected OWLOntology getOntology()
	{
		return this.ontology;
	}
	
	
	protected void setOntology(OWLOntology ontology)
	{
		this.ontology = ontology;
	}
	
	
	protected OWLOntologyManager getOntologyManager()
	{
		return this.manager;
	}
	
	
	protected void setOntologyManager(OWLOntologyManager manager)
	{
		this.manager = manager;
	}
	
	
	protected OntologyIRI getIRI()
	{
		return iri;
	}
	
	
	protected void setIRI(OntologyIRI iri)
	{
		this.iri = iri;
	}
	
	
	protected void setOntologyId(SimpleOntologyId ontologyId)
	{
		this.ontologyId = ontologyId;
	}
	

	@Override
	public SimpleOntologyId getOntologyId() 
	{
		return ontologyId;
	}
	
	
	protected void setAnnotations() 
	{
		getOntologyAnnotations();
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
	public Set<OWLAxiom> getAxioms() 
	{
		return new HashSet<OWLAxiom>(axioms);
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
	public boolean importOntology(InputStream inputStream, SimpleOntologyId ontologyId) 
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
			e.printStackTrace();
		} finally {
			IOUtils.closeQuietly(inputStream);
		}
		
		return false;
	}
	
	
	@Override
	public boolean importOntology(File file, SimpleOntologyId ontologyId) 
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
			e.printStackTrace();
		}
		
		return false;
	}
	

	@Override
	public boolean importOntology(URL url, SimpleOntologyId ontologyId) 
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
			e.printStackTrace();
		}
		return false;
	}

	

	@Override
	public boolean equals(Object o) 
	{
        if (this == o) {
            return true;
        }
        if (o instanceof SimpleOntology) {
        	SimpleOntology simpleOntology = (SimpleOntology) o;
        	SimpleOntologyId oId = simpleOntology.getOntologyId();
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
	
	private void getOntologyAnnotations()
	{
		if(ontology != null) {
			Set<OWLAnnotation> owlAnnos = ontology.getAnnotations();
			for(OWLAnnotation owlAnno : owlAnnos) {
				annotations.add(SimpleAnnotation.matontoAnnotation(owlAnno));
			}
		}			
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
		if(ontology != null) 
			axioms = ontology.getAxioms();
	}
	

}

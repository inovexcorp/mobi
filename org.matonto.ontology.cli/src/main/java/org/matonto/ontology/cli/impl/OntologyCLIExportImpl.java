package org.matonto.ontology.cli.impl;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Optional;
import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.api.action.lifecycle.Reference;

//import aQute.bnd.annotation.component.Activate;
//import aQute.bnd.annotation.component.Component;
//import aQute.bnd.annotation.component.Deactivate;
//import aQute.bnd.annotation.component.Reference;


@Command(scope = "matonto", name = "exportOntology", description="Exports ontology from a repository")
@Service
public class OntologyCLIExportImpl implements Action
{
    @Reference
	private static OntologyManager manager;
	private static final Logger LOG = LoggerFactory.getLogger(OntologyCLIExportImpl.class);
    

	protected void setOntologyManager(final OntologyManager ontoManager)
	{
		manager = ontoManager;
	}
	
	protected void unsetOntologyManager(final OntologyManager ontoManager)
	{
		manager = null;
	}
	
	protected OntologyManager getOntologyManager()
	{
		return manager;
	}
	
	//Command Line Arguments and Options	
	@Argument(index = 0, name = "ontologyId", description = "The ontology id/context id for the ontology named graph to be exported", required = true, multiValued = false)
	String ontologyId = null;

	@Argument(index = 2, name = "DataFormat", description = "The data format of the ontology being exported. Supported data formats are: RDF(rdf/xml), OWL(owl/xml) and TURTLE (default type)", required = true)
	String dataFormat = null;
	
	@Argument(index = 3, name = "exportToFile", description = "The file where exported ontology to be stored", required = true, multiValued = false)
	String toFile = null;
	
	
	@Override
	public Object execute() throws Exception 
	{
		if(manager == null)
			throw new IllegalStateException("Ontology manager is null");

		boolean exported = false;
		String errorMsg = null;
		
		try {
			exported = exportOntology();
		} catch(MatontoOntologyException ex) {
			errorMsg = ex.getMessage();
		}
		
		if(exported)
			System.out.println("Succesful export to file.");
		else
			System.out.println("Unsuccessful export to file. " + errorMsg);

		return null;
	}
	

	
	private boolean exportOntology() throws MatontoOntologyException
	{	
		boolean exported = false;		
		OutputStream outputStream = null;
	
		try {
			System.out.println("Exporting ontology to file...");
			File newFile = new File(toFile);
				
			if (!newFile.exists())
				newFile.createNewFile();
			
			IRI iri = manager.createOntologyIRI(ontologyId);
			OntologyId id = manager.createOntologyId(iri);
			Optional<Ontology> ontology = manager.retrieveOntology(id);
			
			if(ontology.isPresent()) 
			{
				if(dataFormat.equalsIgnoreCase("rdf"))
					outputStream = ontology.get().asRdfXml();
				
				else if(dataFormat.equalsIgnoreCase("owl"))
					outputStream = ontology.get().asOwlXml();
				
				else
					outputStream = ontology.get().asTurtle();
				
				BufferedWriter bw = new BufferedWriter(new FileWriter(newFile.getAbsoluteFile()));
				bw.write(outputStream.toString());
				bw.flush();
				bw.close();
				exported = true;
			}
			
		} catch (IOException fileError) {
			System.out.println("Failed to create file.");
			fileError.printStackTrace();
		} finally {
			IOUtils.closeQuietly(outputStream);	
		}
			
		return exported;
	}

}

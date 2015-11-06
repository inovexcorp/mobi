package org.matonto.ontology.cli.impl;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Optional;

import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.openrdf.model.URI;
import org.openrdf.model.impl.URIImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Action;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;


@Component (immediate=true)
@Command(scope = "matonto", name = "exportOntology", description="Exports ontology from a repository")
public class OntologyCLIExportImpl  implements Action
{
	private static OntologyManager manager;
	private static final Logger LOG = LoggerFactory.getLogger(OntologyCLIExportImpl.class);
	
	
    @Activate
    public void activate() 
    {
        LOG.info("Activating the OntologyCLIExportImpl");
    }
 
    @Deactivate
    public void deactivate() 
    {
        LOG.info("Deactivating the OntologyCLIExportImpl");
    }
    
	@Reference
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
	@Argument(index = 0, name = "RepositoryID", description = "The id of the repository the file will be exported from", required = true, multiValued = false)
	String repositoryId = null;
	
	@Argument(index = 1, name = "namespace", description = "The namespace of the context id for the ontology named graph to be exported", required = true, multiValued = false)
	String namespace = null;
	
	@Argument(index = 2, name = "localName", description = "The local name of the context id for the ontology named graph to be exported", required = true, multiValued = false)
	String localName = null;
	
	@Argument(index = 3, name = "DataFormat", description = "The data format of the ontology being exported. Supported data formats are: RDF(rdf/xml), OWL(owl/xml) and TURTLE (default type)", required = true)
	String dataFormat = null;
	
	@Argument(index = 4, name = "exportToFile", description = "The file where exported ontology to be stored", required = true, multiValued = false)
	String toFile = null;
	
	
	@Override
	public Object execute() throws Exception 
	{
		if(manager == null)
			throw new IllegalStateException("Ontology manager is null");

		boolean exported = false;
		exported = exportOntology();
		
		if(exported)
			System.out.println("Succesful export to file.");
		else
			System.out.println("Unsuccessful export to file.");

		return null;
	}
	

	
	private boolean exportOntology()
	{	
		boolean exported = false;		
		OutputStream outputStream = null;
	
		try {
			System.out.println("Exporting ontology to file...");
			File newFile = new File(toFile);
				
			if (!newFile.exists())
				newFile.createNewFile();
			
			URI uri = new URIImpl(namespace + "#" + localName);
			Optional<Ontology> ontology = manager.retrieveOntology(uri);
			
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

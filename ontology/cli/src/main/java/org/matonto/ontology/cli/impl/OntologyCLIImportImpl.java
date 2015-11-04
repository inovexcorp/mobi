package org.matonto.ontology.cli.impl;

import java.io.File;
import org.apache.felix.gogo.commands.Argument;
import org.apache.felix.gogo.commands.Command;
import org.apache.karaf.shell.console.OsgiCommandSupport;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;

import org.openrdf.model.URI;
import org.openrdf.model.impl.URIImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;


@Component (immediate=true)
@Command(scope = "matonto", name = "importOntology", description = "Imports ontology to a repository")
public class OntologyCLIImportImpl extends OsgiCommandSupport
{
	private OntologyManager manager;
	private static final Logger LOG = LoggerFactory.getLogger(OntologyCLIImportImpl.class);
	
    @Activate
    public void activate() 
    {
        LOG.info("Activating the OntologyCLIImportImpl");
    }
 
    @Deactivate
    public void deactivate() 
    {
        LOG.info("Deactivating the OntologyCLIImportImpl");
    }
	
	@Reference
	protected void setOntologyManager(OntologyManager manager)
	{
		this.manager = manager;
	}

	
	//Command Line Arguments and Options	
	@Argument(index = 0, name = "RepositoryID", description = "The id of the repository the file will be imported to", required = true, multiValued = false)
	String repositoryId = null;
	
	@Argument(index = 1, name = "ImportFile", description = "The file to be imported into the repository", required = true, multiValued = false)
	String fromFile = null;
	
	@Argument(index = 2, name = "namespace", description = "The namespace of the context id for ontology named graph to be created under", required = true, multiValued = false)
	String namespace = null;
	
	@Argument(index = 3, name = "localName", description = "The local name of the context id for ontology named graph to be created under", required = true, multiValued = false)
	String localName = null;
	
	
	@Override
	protected Object doExecute() throws Exception 
	{	
		if(manager == null)
			throw new IllegalStateException("Ontology manager is null");

		boolean persisted = false;
		persisted = importOntology();
		
		if(persisted)
			System.out.println("Succesful file import.");
		else
			System.out.println("Unsuccessful file import.");

		return null;
	}

	
	private boolean importOntology()
	{	
		boolean persisted = false;

		System.out.println("Importing ontology file...");

		File newFile = new File(fromFile);
		if(newFile.exists()) {
			URI uri = new URIImpl(namespace + "#" + localName);
			Ontology ontology = manager.createOntology(newFile, uri);
			persisted = manager.storeOntology(ontology);
		}
				
		else
			System.out.println("File does not exist.");
			

		return persisted;
	}

}

package org.matonto.ontology.cli.impl;

import java.io.File;
import java.io.FileNotFoundException;

import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;


@Command(scope = "matonto", name = "importOntology", description = "Imports ontology to a repository")
@Service
@Component (immediate=true)
public class OntologyCLIImportImpl implements Action
{
	private static OntologyManager manager;
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
	@Argument(index = 0, name = "ImportFile", description = "The file to be imported into the repository", required = true, multiValued = false)
	String fromFile = null;
	
	@Argument(index = 1, name = "namespace", description = "The namespace of the context id for ontology named graph to be created under", required = true, multiValued = false)
	String namespace = null;
	
	@Argument(index = 2, name = "localName", description = "The local name of the context id for ontology named graph to be created under", required = true, multiValued = false)
	String localName = null;
	
	
	@Override
	public Object execute() throws Exception 
	{	
		if(manager == null)
			throw new IllegalStateException("Ontology manager is null");

		boolean persisted = false;
		String errorMsg = null;
		
		try {
			persisted = importOntology();
		} catch(MatontoOntologyException ex) {
			errorMsg = ex.getMessage();
		}
		
		if(persisted)
			System.out.println("Succesful file import.");
		else
			System.out.println("Unsuccessful file import. " + errorMsg);

		return null;
	}

	
	private boolean importOntology() throws MatontoOntologyException, FileNotFoundException {
		boolean persisted = false;

		System.out.println("Importing ontology file...");

		File newFile = new File(fromFile);
		if(newFile.exists()) {
			IRI iri = manager.createOntologyIRI(namespace + "#" + localName);
			Ontology ontology = manager.createOntology(newFile, manager.createOntologyId(iri));
			persisted = manager.storeOntology(ontology);
		}
				
		else
			System.out.println("File does not exist.");
			
		return persisted;
	}

}

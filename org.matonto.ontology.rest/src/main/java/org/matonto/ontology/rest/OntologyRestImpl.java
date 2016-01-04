package org.matonto.ontology.rest;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Map;
import java.util.Optional;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import com.sun.jersey.multipart.FormDataParam;
import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;


@Component (immediate=true)
@Path("/ontology")
public class OntologyRestImpl {
	
	private static OntologyManager manager;
	private static final Logger LOG = LoggerFactory.getLogger(OntologyRestImpl.class);

	@Activate
    public void activate() 
    {
        LOG.info("Activating the OntologyRestImpl");
    }
 
    @Deactivate
    public void deactivate() 
    {
        LOG.info("Deactivating the OntologyRestImpl");
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
	
	
	
	@GET
	@Path("getAllOntologyIds")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getAllOntologyIds()
	{
		if(manager == null)
		    return Response.status(500).entity("Ontology manager is null").build();

		Map<OntologyId, String> ontologies = manager.getOntologyRegistry();
		JSONObject json = new JSONObject();

		if(!ontologies.isEmpty()) {
			for(OntologyId oid : ontologies.keySet()) {
				String ontologyId = oid.getOntologyIdentifier().stringValue();
				json.put(ontologyId, ontologies.get(oid));
			}
		}

		return Response.status(200).entity(json.toString()).build();
	}
	
	
	
	@GET
    @Path("/getAllOntologies")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllOntologies()
    {
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();

        Map<OntologyId, String> ontologyRegistry = manager.getOntologyRegistry();
        JSONArray jsonArray = new JSONArray();

        Optional<Ontology> ontology;
        OutputStream outputStream = null;

        if(!ontologyRegistry.isEmpty()) {
            for(OntologyId oid : ontologyRegistry.keySet()) {
                ontology = manager.retrieveOntology(oid);
                if(ontology.isPresent()) {
                    try {
                        outputStream = ontology.get().asJsonLD();
                        if(outputStream != null) 
                            jsonArray.add(outputStream.toString());
                    } catch(MatontoOntologyException ex) {
                        JSONObject json = new JSONObject();
                        json.put("Error in retrieving ontology with ontologyId " + oid, ex.getMessage());
                        jsonArray.add(json);              
                    }
             
                }
            }
        }

        return Response.status(200).entity(jsonArray.toString()).build();
    }

	
	
	/*
	 * Ingests/uploads an ontology file to a data store configured in the config file (settings.xml)
	 */
	@POST
	@Path("/uploadOntology")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	@Produces(MediaType.APPLICATION_JSON)
	public Response uploadFile(
							@FormDataParam("file") InputStream fileInputStream,
							@FormDataParam("ontologyIdStr") String ontologyIdStr)
	{	     
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
        
		if (ontologyIdStr == null || ontologyIdStr.length() == 0)
			return Response.status(500).entity("OntologyID is empty").build();
		
		boolean persisted = false;
		JSONObject json = new JSONObject();
		Ontology ontology;
		String message;
		
		try{
			IRI iri = manager.createOntologyIRI(ontologyIdStr);
			ontology = manager.createOntology(fileInputStream, manager.createOntologyId(iri));
			persisted = manager.storeOntology(ontology);
			
		} catch(MatontoOntologyException ex) {
		    message = ex.getMessage();
            LOG.error("Exception occurred while uploading ontology: " + message, ex);
			json.put("error", "Exception occurred while uploading ontology: " + message);
		} finally {	
			IOUtils.closeQuietly(fileInputStream);
		}
		
		json.put("result", persisted);
		return Response.status(200).entity(json.toString()).build();
	}
	
	
	
	/*
	 * Returns JSON-formated ontology with requested context
	 */
	@GET
	@Path("/getOntology")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getOntology(@QueryParam("ontologyIdStr") String ontologyIdStr,
								@QueryParam("rdfFormat") String rdfFormat) 
	{	       
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
        
		if (ontologyIdStr == null || ontologyIdStr.length() == 0)
			return Response.status(500).entity("OntologyID is empty").build();
		
		if (rdfFormat == null || rdfFormat.length() == 0)
			return Response.status(500).entity("Output format is empty").build();
		
		JSONObject json = new JSONObject();
        Optional<Ontology> ontology = Optional.empty();
		String message = null;
        IRI iri = manager.createOntologyIRI(ontologyIdStr);
        OntologyId ontologyId = manager.createOntologyId(iri);
		try{
			ontology = manager.retrieveOntology(ontologyId);
		} catch(MatontoOntologyException ex) {
		    message = ex.getMessage();
		    LOG.error("Exception occurred while retrieving ontology: " + message, ex);
		} 
		
		
		if(ontology.isPresent()) {
			OutputStream outputStream = null;
			
			if(rdfFormat.equalsIgnoreCase("rdf/xml"))
				outputStream = ontology.get().asRdfXml();
			
			else if(rdfFormat.equalsIgnoreCase("owl/xml"))
				outputStream = ontology.get().asOwlXml();
			
			else if(rdfFormat.equalsIgnoreCase("turtle"))
				outputStream = ontology.get().asTurtle();
			
			else {
				outputStream = ontology.get().asJsonLD();
			}
		
			String content = "";
			if(outputStream != null)
				content = outputStream.toString();
				
			IOUtils.closeQuietly(outputStream);	
				
			json.put("document format", rdfFormat);
            json.put("ontology id", ontologyId.getOntologyIdentifier().stringValue());
            json.put("ontology", content);
			
		} else if(message == null) {
            json.put("error", "OntologyId doesn't exist.");
		} else {
            json.put("error", "Exception occurred while retrieving ontology: " + message);
		}
		
	  return Response.status(200).entity(json.toString()).build();
	}
	
	
	/*
	 * Downloads ontology with requested context to a file with given a file name 
	*/
	@GET
	@Path("/downloadOntology")
	@Produces(MediaType.APPLICATION_OCTET_STREAM)
	public Response downloadOntologyFile(@QueryParam("ontologyIdStr") String ontologyIdStr,
										@QueryParam("rdfFormat") String rdfFormat) 
	{  
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
        
		if (ontologyIdStr == null || ontologyIdStr.length() == 0)
			return Response.status(500).entity("OntologyID is empty").build();
		
		if (rdfFormat == null || rdfFormat.length() == 0)
			return Response.status(500).entity("Output format is empty").build();
	
		Optional<Ontology> ontology = Optional.empty();
		
		try{
			IRI iri = manager.createOntologyIRI(ontologyIdStr);
			OntologyId ontologyId = manager.createOntologyId(iri);
			ontology = manager.retrieveOntology(ontologyId);
		} catch(MatontoOntologyException ex) {
		    LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
            return Response.status(500).entity(ex.getMessage()).build();
		} 
		
		OutputStream outputStream = null;
		StreamingOutput stream = null;
		
		if(ontology.isPresent()) {
			
			if(rdfFormat.equalsIgnoreCase("rdf/xml"))
				outputStream = ontology.get().asRdfXml();
			
			else if(rdfFormat.equalsIgnoreCase("owl/xml"))
				outputStream = ontology.get().asOwlXml();
			
			else if(rdfFormat.equalsIgnoreCase("turtle"))
				outputStream = ontology.get().asTurtle();
			
			else {
				outputStream = ontology.get().asJsonLD();
			}
		}
		
		
		if(outputStream != null) 
		{
			final String content = outputStream.toString();
			
			stream = new StreamingOutput() {
			    @Override
			    public void write(OutputStream os) throws IOException, WebApplicationException 
			    {
			      Writer writer = new BufferedWriter(new OutputStreamWriter(os));
			      writer.write(content);
			      writer.flush();
			      writer.close();
			    }
			};
		}
		
		else {
			stream = new StreamingOutput() {
			    @Override
			    public void write(OutputStream os) throws IOException, WebApplicationException 
			    {
			      Writer writer = new BufferedWriter(new OutputStreamWriter(os));
			      writer.write("");
			      writer.flush();
			      writer.close();
			    }
			};
		}
		
		IOUtils.closeQuietly(outputStream);	
		
		  
		return Response.ok(stream).build();
	}
	
	
	/*
	 * Delete ontology with requested context from the server
	 */
	@GET
	@Path("/deleteOntology")
	@Produces(MediaType.APPLICATION_JSON)
	public Response deleteOntology(@QueryParam("ontologyIdStr") String ontologyIdStr) 
	{	       
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
        
		if (ontologyIdStr == null || ontologyIdStr.length() == 0)
			return Response.status(500).entity("OntologyID is empty").build();

		JSONObject json = new JSONObject();
		boolean deleted = false;
		String message;
		try{
			IRI iri = manager.createOntologyIRI(ontologyIdStr);
			OntologyId ontologyId = manager.createOntologyId(iri);
			deleted = manager.deleteOntology(ontologyId);
		} catch(MatontoOntologyException ex) {
		    message = ex.getMessage();
		    LOG.error("Exception occurred while deleting ontology: " + message, ex);
            json.put("error", "Exception occurred while deleting ontology: " + message);
		} 

		json.put("result", deleted);
		  
		return Response.ok(json.toString()).build();
	}
	
}

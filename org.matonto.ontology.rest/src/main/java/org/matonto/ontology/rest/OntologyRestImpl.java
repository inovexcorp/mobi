package org.matonto.ontology.rest;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Map;

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

import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.impl.owlapi.SimpleOntologyId;
import org.matonto.ontology.core.impl.owlapi.SimpleOntologyManager;
import org.openrdf.model.Resource;
import org.openrdf.model.URI;
import org.openrdf.model.impl.URIImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Optional;
import com.sun.jersey.multipart.FormDataParam;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;

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
				throw new IllegalStateException("Ontology manager is null");
			
			Optional<Map<SimpleOntologyId, String>> ontologyRegistry = manager.getOntologyRegistry();	
			Map<SimpleOntologyId, String> ontologies = ontologyRegistry.get();
			JSONObject json = new JSONObject();
			
			if(!ontologies.isEmpty()) {
				for(SimpleOntologyId oid : ontologies.keySet()) {
					String ontologyId = oid.getContextId().stringValue();
					json.put(ontologyId, ontologies.get(oid));
				}
			}

			return Response.status(200).entity(json.toString()).build();
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
								@FormDataParam("namespace") String namespace,
								@FormDataParam("localName") String localName)
		{	
			if (namespace == null || namespace.length() == 0)
				return Response.status(500).entity("Namespace is empty").build();
			
			if (localName == null || localName.length() == 0)
				return Response.status(500).entity("Local name is empty").build();
			
			if(manager == null)
				throw new IllegalStateException("Ontology manager is null");
			
			boolean persisted = false;

			URI uri = new URIImpl(namespace + "#" + localName);
			Ontology ontology = manager.createOntology(fileInputStream, SimpleOntologyManager.createOntologyId(uri));

			persisted = manager.storeOntology(ontology);
			IOUtils.closeQuietly(fileInputStream);
			
			JSONObject json = new JSONObject();
			json.put("result", persisted);
		
			return Response.status(200).entity(json.toString()).build();
		}
		
		
		
		/*
		 * Returns JSON-formated ontology with requested context
		 */
		@GET
		@Path("/getOntology")
		@Produces(MediaType.APPLICATION_JSON)
		public Response getOntology(@QueryParam("namespace") String namespace,
									@QueryParam("localName") String localName,
									@QueryParam("rdfFormat") String rdfFormat) 
		{
			
			if (namespace == null || namespace.length() == 0)
				return Response.status(500).entity("Namespace is empty").build();
			
			if (localName == null || localName.length() == 0)
				return Response.status(500).entity("Local name is empty").build();
			
			if (rdfFormat == null || rdfFormat.length() == 0)
				return Response.status(500).entity("Output format is empty").build();
			
			if(manager == null)
				throw new IllegalStateException("Ontology manager is null");
			
			URI uri = new URIImpl(namespace + "#" + localName);

			JSONObject json = new JSONObject();
			Optional<Ontology> ontology = manager.retrieveOntology(SimpleOntologyManager.createOntologyId(uri));
			OutputStream outputStream = null;
			
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
			
			String content = "";
			if(outputStream != null)
				content = outputStream.toString();
				
			IOUtils.closeQuietly(outputStream);	
				
			json.put("document format", rdfFormat);
			json.put("ontology id", uri.stringValue());
			json.put("ontology", content);
			
		  return Response.status(200).entity(json.toString()).build();
		}
		
		
		/*
		 * Downloads ontology with requested context to a file with given a file name 
		*/
		@GET
		@Path("/downloadOntology")
		@Produces(MediaType.APPLICATION_OCTET_STREAM)
		public Response downloadOntologyFile(@QueryParam("namespace") String namespace,
											@QueryParam("localName") String localName,
											@QueryParam("rdfFormat") String rdfFormat) 
		{
			if (namespace == null || namespace.length() == 0)
				return Response.status(500).entity("Namespace is empty").build();
			
			if (localName == null || localName.length() == 0)
				return Response.status(500).entity("Local name is empty").build();
			
			if (rdfFormat == null || rdfFormat.length() == 0)
				return Response.status(500).entity("Output format is empty").build();
			
			if(manager == null)
				throw new IllegalStateException("Ontology manager is null");

			
			URI uri = new URIImpl(namespace + "#" + localName);
			Optional<Ontology> ontology = manager.retrieveOntology(SimpleOntologyManager.createOntologyId(uri));
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
		public Response deleteOntology(@QueryParam("namespace") String namespace,
											@QueryParam("localName") String localName) 
		{
			if (namespace == null || namespace.length() == 0)
				return Response.status(500).entity("Namespace is empty").build();
			
			if (localName == null || localName.length() == 0)
				return Response.status(500).entity("Local name is empty").build();
			
			if(manager == null)
				throw new IllegalStateException("Ontology manager is null");


			URI uri = new URIImpl(namespace + "#" + localName);
			boolean deleted = false;
			deleted = manager.deleteOntology(SimpleOntologyManager.createOntologyId(uri));

			JSONObject json = new JSONObject();
			json.put("result", deleted);
			  
			return Response.ok(json.toString()).build();
		}
		
}

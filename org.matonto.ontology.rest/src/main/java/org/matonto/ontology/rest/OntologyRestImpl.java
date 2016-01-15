package org.matonto.ontology.rest;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import javax.annotation.Nonnull;
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
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;


@Component (immediate=true)
@Path("/")
public class OntologyRestImpl {
	
	private static OntologyManager manager;
    private static ValueFactory factory;
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

    @Reference
    protected void setValueFactory(final ValueFactory vf) {
        factory = vf;
    }
    
    protected void unsetValueFactory(final ValueFactory vf) {
        factory = null;
    }
    
    
	
	@GET
	@Path("getAllOntologyIds")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getAllOntologyIds()
	{
		if(manager == null)
		    return Response.status(500).entity("Ontology manager is null").build();

		JSONObject json = new JSONObject();

		Map<Resource, String> ontoIdRegistry = manager.getOntologyRegistry();
		if(!ontoIdRegistry.isEmpty()) {
			for(Resource oid : ontoIdRegistry.keySet()) 
				json.put(oid.stringValue(), ontoIdRegistry.get(oid));
		}

		return Response.status(200).entity(json.toString()).build();
	}
	
	
    /*
     * Returns JSON-formated ontologies in the ontology registry
     */
	@GET
    @Path("/getAllOntologies")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllOntologies()
    {
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
            
        JSONArray jsonArray = new JSONArray();
        Map<Resource, String> ontoIdRegistry = manager.getOntologyRegistry();
        if(!ontoIdRegistry.isEmpty()) {
            for(Resource oid : ontoIdRegistry.keySet()) 
            {
                JSONObject json = new JSONObject();
                json.put("ontology id", oid.stringValue());
                Optional<Ontology> optOntology = Optional.empty();
                String message = null;
                
                try {
                    optOntology = getOntology(oid.stringValue());
                } catch(MatontoOntologyException ex) {
                    message = ex.getMessage();
                    LOG.error("Exception occurred while retrieving ontology with ontology id " + oid + ": " + message + ex);
                } 

                if(optOntology.isPresent()) {
                    OutputStream outputStream = optOntology.get().asJsonLD();
                
                    String content = "";
                    if(outputStream != null)
                        json.put("ontology", outputStream.toString());
                        
                    IOUtils.closeQuietly(outputStream); 
                    
                } else if(message == null) {
                    json.put("error", "OntologyId doesn't exist.");
                } else {
                    json.put("error", "Exception occurred while retrieving ontology: " + message);
                }
                
                jsonArray.add(json);            
            }
        }

        return Response.status(200).entity(jsonArray.toString()).build();
    }

	
	   
    /*
     * Returns JSON-formated ontologies with requested ontology IDs; The ontology id list
     * is provided as a comma separated string.  
     */
    @GET
    @Path("/getOntologies")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getOntologies(@QueryParam("ontologyIdList") String ontologyIdList) 
    {          
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
        
        if (ontologyIdList == null || ontologyIdList.length() == 0)
            return Response.status(400).entity("OntologyID is empty").build();
 
        List<String> ontologyIds = Arrays.asList(ontologyIdList.trim().split("\\s*,\\s*"));
        
        if(ontologyIds.isEmpty())
            return Response.status(400).entity("Invalid ontology id(s) on the list").build();
        
        JSONArray jsonArray = new JSONArray();
        
        for(String id : ontologyIds)
        {
            Optional<Ontology> optOntology = Optional.empty();
            JSONObject json = new JSONObject();
            String message = null;
            json.put("ontology id", id);
            
            try {
                optOntology = getOntology(id);
            } catch(MatontoOntologyException ex) {
                message = ex.getMessage();
                LOG.error("Exception occurred while retrieving ontology with ontology id " + id + ": " + message + ex);
            } 
            
            if(optOntology.isPresent()) {
                OutputStream outputStream = optOntology.get().asJsonLD();        
                String content = "";
                if(outputStream != null)
                    content = outputStream.toString();
                    
                IOUtils.closeQuietly(outputStream); 
                json.put("ontology", content);
                
            } else if(message == null) {
                json.put("error", "OntologyId doesn't exist.");
            } else {
                json.put("error", "Exception occurred while retrieving ontology: " + message);
            }
            
            jsonArray.add(json);
        }
        
      return Response.status(200).entity(jsonArray.toString()).build();
    }
    
	
	
	/*
	 * Ingests/uploads an ontology file to a data store 
	 */
	@POST
	@Path("/uploadOntology")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	@Produces(MediaType.APPLICATION_JSON)
	public Response uploadFile(@FormDataParam("file") InputStream fileInputStream)
	{	     
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();

		boolean persisted = false;
		JSONObject json = new JSONObject();
		Ontology ontology = null;
		String message;

		try{
			ontology = manager.createOntology(fileInputStream);
			persisted = manager.storeOntology(ontology);
		} catch(MatontoOntologyException ex) {
		    message = ex.getMessage();
            LOG.error("Exception occurred while uploading ontology: " + message, ex);
			json.put("error", "Exception occurred while uploading ontology: " + message);
		} finally {	
			IOUtils.closeQuietly(fileInputStream);
		}
		
		if(persisted) {
		    OntologyId oid = ontology.getOntologyId();
		    json.put("ontology id", oid.getOntologyIdentifier().stringValue());
		}
		
		json.put("result", persisted);

		return Response.status(200).entity(json.toString()).build();
	}
	
	
	
	/*
	 * Returns JSON-formated ontology with requested ontology ID
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
			return Response.status(400).entity("OntologyID is empty").build();
		
		if (rdfFormat == null || rdfFormat.length() == 0)
			return Response.status(400).entity("Output format is empty").build();
		
		JSONObject json = new JSONObject();
		Optional<Ontology> optOntology = Optional.empty();
		String message = null;
        json.put("ontology id", ontologyIdStr.trim());
        
		try {
		    optOntology = getOntology(ontologyIdStr.trim());
        } catch(MatontoOntologyException ex) {
            message = ex.getMessage();
            LOG.error("Exception occurred while retrieving ontology with ontology id " + ontologyIdStr + ": " + message, ex);
        } 
		
		if(optOntology.isPresent()) {
			OutputStream outputStream = null;
			
			if(rdfFormat.equalsIgnoreCase("rdf/xml"))
				outputStream = optOntology.get().asRdfXml();
			
			else if(rdfFormat.equalsIgnoreCase("owl/xml"))
				outputStream = optOntology.get().asOwlXml();
			
			else if(rdfFormat.equalsIgnoreCase("turtle"))
				outputStream = optOntology.get().asTurtle();
			
			else if(rdfFormat.equalsIgnoreCase("jsonld"))
                outputStream = optOntology.get().asJsonLD();
            
            else 
                return Response.status(400).entity("Output format is invalid").build();
		
			String content = "";
			if(outputStream != null)
				content = outputStream.toString();
				
			IOUtils.closeQuietly(outputStream);	
				
			json.put("document format", rdfFormat);
            json.put("ontology", content);
			
		} else if(message == null) {
            json.put("error", "OntologyId doesn't exist.");
		} else {
            json.put("error", "Exception occurred while retrieving ontology: " + message);
		}
		
	  return Response.status(200).entity(json.toString()).build();
	}
	
	
	/*
	 * Downloads ontology with requested ontology ID to a file with given a file name 
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
			return Response.status(400).entity("OntologyID is empty").build();
		
		if (rdfFormat == null || rdfFormat.length() == 0)
			return Response.status(400).entity("Output format is empty").build();
	
        Optional<Ontology> optOntology = Optional.empty();
        
        try {
            optOntology = getOntology(ontologyIdStr.trim());
        } catch(MatontoOntologyException ex) {
            LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
        } 
        
		OutputStream outputStream = null;
		StreamingOutput stream = null;
		
		if(optOntology.isPresent()) {
			
			if(rdfFormat.equalsIgnoreCase("rdf/xml"))
				outputStream = optOntology.get().asRdfXml();
			
			else if(rdfFormat.equalsIgnoreCase("owl/xml"))
				outputStream = optOntology.get().asOwlXml();
			
			else if(rdfFormat.equalsIgnoreCase("turtle"))
				outputStream = optOntology.get().asTurtle();
			
			else if(rdfFormat.equalsIgnoreCase("jsonld"))
                outputStream = optOntology.get().asJsonLD();
            
            else 
                return Response.status(400).entity("Output format is invalid").build();
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
			      writer.write("Error - OntologyId doesn't exist.");
			      writer.flush();
			      writer.close();
			    }
			};
		}
		
		IOUtils.closeQuietly(outputStream);	
		
		  
		return Response.ok(stream).build();
	}
	
	
	/*
	 * Delete ontology with requested ontology ID from the server
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
		String message = null;
		try{
	        Resource resource = null;	        
	        if(isBNodeString(ontologyIdStr.trim()))
	            resource = factory.createBNode(ontologyIdStr.trim());
	        else 
	            resource = factory.createIRI(ontologyIdStr.trim());
	        
		    deleted = manager.deleteOntology(resource);
		} catch(MatontoOntologyException ex) {
		    message = ex.getMessage();
		    LOG.error("Exception occurred while deleting ontology: " + message, ex);
            json.put("error", "Exception occurred while deleting ontology: " + message);
		} 

		json.put("result", deleted);

		return Response.ok(json.toString()).build();
	}
	
	
	/*
     * Returns JSON-formated annotation properties in the ontology with requested ontology ID
     */
    @GET
    @Path("/getAllIRIs")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getIRIsInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr) 
    {          
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
        
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return Response.status(400).entity("OntologyID is empty").build();
        
        JSONArray array = new JSONArray();
        
        JSONObject annotations = new JSONObject();
        annotations.put("annotation properties", iriListToJsonArray(getAnnotationIRIs(ontologyIdStr)));
        array.add(annotations);
        
        JSONObject classes = new JSONObject();
        classes.put("classes", iriListToJsonArray(getClassIRIs(ontologyIdStr)));
        array.add(classes);
        
        JSONObject datatypes = new JSONObject();
        datatypes.put("datatypes", iriListToJsonArray(getDatatypeIRIs(ontologyIdStr)));
        array.add(datatypes);
        
        JSONObject objectProperties = new JSONObject();
        objectProperties.put("object properties", iriListToJsonArray(getObjectPropertyIRIs(ontologyIdStr)));
        array.add(objectProperties);
        
        JSONObject dataProperties = new JSONObject();
        dataProperties.put("data properties", iriListToJsonArray(getDataPropertyIRIs(ontologyIdStr)));
        array.add(dataProperties);
        
        JSONObject namedIndividuals = new JSONObject();
        namedIndividuals.put("named individuals", iriListToJsonArray(getNamedIndividualIRIs(ontologyIdStr)));
        array.add(namedIndividuals);
            
        return Response.status(200).entity(array.toString()).build();
    }
    
	
	/*
     * Returns JSON-formated annotation properties in the ontology with requested ontology ID
     */
	@GET
    @Path("/getAnnotations")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAnnotationsInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr) 
    {          
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
        
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return Response.status(400).entity("OntologyID is empty").build();     
        
        JSONObject json = iriListToJsonArray(getAnnotationIRIs(ontologyIdStr));
            
        return Response.status(200).entity(json.toString()).build();
    }
    
    
    /*
    * Returns JSON-formated classes in the ontology with requested ontology ID
    */
    @GET
    @Path("/getClasses")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getClassesInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr) 
    {          
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
   
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return Response.status(400).entity("OntologyID is empty").build();
       
        JSONObject json = iriListToJsonArray(getClassIRIs(ontologyIdStr));
           
        return Response.status(200).entity(json.toString()).build();
    }
    
    
    /*
    * Returns JSON-formated datatypes in the ontology with requested ontology ID
    */
    @GET
    @Path("/getDatatypes")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDatatypesInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr) 
    {          
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
   
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return Response.status(400).entity("OntologyID is empty").build();
       
        JSONObject json = iriListToJsonArray(getDatatypeIRIs(ontologyIdStr));
           
        return Response.status(200).entity(json.toString()).build();
    }
    
    
    /*
    * Returns JSON-formated object properties in the ontology with requested ontology ID
    */
    @GET
    @Path("/getObjectProperties")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getObjectPropertiesInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr) 
    {          
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
   
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return Response.status(400).entity("OntologyID is empty").build();
       
        JSONObject json = iriListToJsonArray(getObjectPropertyIRIs(ontologyIdStr));
           
        return Response.status(200).entity(json.toString()).build();
    }
    
    
    /*
    * Returns JSON-formated data properties in the ontology with requested ontology ID
    */
    @GET
    @Path("/getDataProperties")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDataPropertiesInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr) 
    {          
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
   
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return Response.status(400).entity("OntologyID is empty").build();
       
        JSONObject json = iriListToJsonArray(getDataPropertyIRIs(ontologyIdStr));
           
        return Response.status(200).entity(json.toString()).build();
    }
    
    
    /*
    * Returns JSON-formated named individuals in the ontology with requested ontology ID
    */
    @GET
    @Path("/getNamedIndividuals")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getNamedIndividualsInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr) 
    {          
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
   
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return Response.status(400).entity("OntologyID is empty").build();
       
        JSONObject json = iriListToJsonArray(getNamedIndividualIRIs(ontologyIdStr));
           
        return Response.status(200).entity(json.toString()).build();
    }
    
    
    
    private List<IRI> getAnnotationIRIs (@Nonnull String ontologyIdStr) 
    {
        Optional<Ontology> optOntology = Optional.empty();
        List<IRI> iris = new ArrayList<>();
        try {
            optOntology = getOntology(ontologyIdStr);
        } catch(MatontoOntologyException ex) {
            LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
        }    
    
        Set<Annotation> annotations = new HashSet<>();

        if(optOntology.isPresent()) {
            try{
                annotations = optOntology.get().getAllAnnotations();
            } catch(MatontoOntologyException ex) {
                LOG.error("Exception occurred while parsing annotations: " + ex.getMessage(), ex);
            } 
        }
    
        if(!annotations.isEmpty()) 
           annotations.forEach(annotation -> iris.add(annotation.getProperty().getIRI())); 
        
        return iris;
    }
    
    private List<IRI> getClassIRIs (@Nonnull String ontologyIdStr) 
    {   
        Optional<Ontology> optOntology = Optional.empty();
        List<IRI> iris = new ArrayList<>();
        try {
            optOntology = getOntology(ontologyIdStr);
        } catch(MatontoOntologyException ex) {
            LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
        } 
        
        Set<OClass> oClasses = new HashSet<>();
        
        if(optOntology.isPresent()) {
            try{
                oClasses = optOntology.get().getAllClasses();
            } catch(MatontoOntologyException ex) {
                LOG.error("Exception occurred while parsing annotations: " + ex.getMessage(), ex);
            } 
        }
        
        if(!oClasses.isEmpty()) 
            oClasses.forEach(oClass -> iris.add(oClass.getIRI()));
        
        return iris;
    }
    
    private List<IRI> getDatatypeIRIs (@Nonnull String ontologyIdStr) 
    {   
        Optional<Ontology> optOntology = Optional.empty();
        List<IRI> iris = new ArrayList<>();
        try {
            optOntology = getOntology(ontologyIdStr);
        } catch(MatontoOntologyException ex) {
            LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
        } 
        
        Set<Datatype> datatypes = new HashSet<>();
        
        if(optOntology.isPresent()) {
            try{
                datatypes = optOntology.get().getAllDatatypes();
            } catch(MatontoOntologyException ex) {
                LOG.error("Exception occurred while parsing annotations: " + ex.getMessage(), ex);
            } 
        }
        
        if(!datatypes.isEmpty()) 
            datatypes.forEach(datatype -> iris.add(datatype.getIRI()));
        
        return iris;
    }
    
    private List<IRI> getObjectPropertyIRIs (@Nonnull String ontologyIdStr) 
    {   
        Optional<Ontology> optOntology = Optional.empty();
        List<IRI> iris = new ArrayList<>();
        try {
            optOntology = getOntology(ontologyIdStr);
        } catch(MatontoOntologyException ex) {
            LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
        } 
        
        Set<ObjectProperty> objectProperties = new HashSet<>();
        
        if(optOntology.isPresent()) {
            try{
                objectProperties = optOntology.get().getAllObjectProperties();
            } catch(MatontoOntologyException ex) {
                LOG.error("Exception occurred while parsing annotations: " + ex.getMessage(), ex);
            } 
        }
        
        if(!objectProperties.isEmpty()) 
            objectProperties.forEach(objectProperty -> iris.add(objectProperty.getIRI()));
        
        return iris;
    }
    
    private List<IRI> getDataPropertyIRIs (@Nonnull String ontologyIdStr) 
    {   
        List<IRI> iris = new ArrayList<>();
        Optional<Ontology> optOntology = Optional.empty();
        
        try {
            optOntology = getOntology(ontologyIdStr);
        } catch(MatontoOntologyException ex) {
            LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
        } 
        
        Set<DataProperty> dataProperties = new HashSet<>();
        
        if(optOntology.isPresent()) {
            try{
                dataProperties = optOntology.get().getAllDataProperties();
            } catch(MatontoOntologyException ex) {
                LOG.error("Exception occurred while parsing annotations: " + ex.getMessage(), ex);
            } 
        }
        
        if(!dataProperties.isEmpty()) 
            dataProperties.forEach(dataProperty -> iris.add(dataProperty.getIRI()));
        
        return iris;
    }
    
    private List<IRI> getNamedIndividualIRIs (@Nonnull String ontologyIdStr) 
    {   
        List<IRI> iris = new ArrayList<>();
        Optional<Ontology> optOntology = Optional.empty();
        
        try {
            optOntology = getOntology(ontologyIdStr);
        } catch(MatontoOntologyException ex) {
            LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
        } 
        
        Set<Individual> individuals = new HashSet<>();
        
        if(optOntology.isPresent()) {
            try{
                individuals = optOntology.get().getAllIndividuals();
            } catch(MatontoOntologyException ex) {
                LOG.error("Exception occurred while parsing annotations: " + ex.getMessage(), ex);
            } 
        }
        
        if(!individuals.isEmpty())
            for(Individual individual : individuals) {
                if(individual instanceof NamedIndividual)
                    iris.add(((NamedIndividual)individual).getIRI());
            }
            
        return iris;
    }
    
    
    private JSONObject iriListToJson(@Nonnull List<IRI> iris)
    {
        if(iris.isEmpty())
            return new JSONObject();
        
        JSONObject json = new JSONObject();
        iris.forEach(iri -> json.put(iri.stringValue(), iri.getLocalName()));       
        return json;
    }
    
    private JSONObject iriListToJsonArray(@Nonnull List<IRI> iris)
    {
        if(iris.isEmpty())
            return new JSONObject();
        
        Map<String, ArrayList<String>> iriMap = new HashMap<>();
        for(IRI iri : iris) {
            if(iriMap.isEmpty() || !iriMap.containsKey(iri.getNamespace())) {
                ArrayList<String> localnames = new ArrayList<>();
                localnames.add(iri.getLocalName());
                iriMap.put(iri.getNamespace(), localnames);
            } else if(!iriMap.get(iri.getNamespace()).contains(iri.getLocalName())){
                iriMap.get(iri.getNamespace()).add(iri.getLocalName());
            }
        }
        
        JSONObject json = new JSONObject();
        
        for(String key : iriMap.keySet()) {
            JSONArray jsonArray = new JSONArray();
            jsonArray.addAll(iriMap.get(key));
            json.put(key, jsonArray);
        }
        
        return json;
    }
    
    private Optional<Ontology> getOntology(@Nonnull String ontologyIdStr) throws MatontoOntologyException
    {
        Resource resource = null;
        String id = ontologyIdStr.trim();
        if(isBNodeString(id))
            resource = factory.createBNode(id);
        else 
            resource = factory.createIRI(id);
        
        return manager.retrieveOntology(resource);
    }
    
    private boolean isBNodeString(String string) 
    {
        return string.matches("^_:.*$");     
    }
	
}

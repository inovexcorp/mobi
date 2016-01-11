package org.matonto.ontology.rest;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
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
	private static Map<OntologyId, Ontology> retrievedOntologies = new HashMap<OntologyId, Ontology>();
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

        Optional<Ontology> optOntology;

        if(!ontologyRegistry.isEmpty()) {
            for(OntologyId oid : ontologyRegistry.keySet()) {
                try {
                    optOntology = getOntology(oid.toString());
                    
                    if(optOntology.isPresent())
                        jsonArray.add(optOntology.get().asJsonLD().toString());
                    
                } catch(MatontoOntologyException ex) {
                    JSONObject json = new JSONObject();
                    json.put("Error in retrieving ontology with ontologyId " + oid, ex.getMessage());
                    jsonArray.add(json);              
                }
             
            }
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
	public Response uploadFile(
							@FormDataParam("file") InputStream fileInputStream,
							@FormDataParam("ontologyIdStr") String ontologyIdStr)
	{	     
        if(manager == null)
            return Response.status(500).entity("Ontology manager is null").build();
        
		if (ontologyIdStr == null || ontologyIdStr.length() == 0)
			return Response.status(400).entity("OntologyID is empty").build();
		
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
		
		try {
		    optOntology = getOntology(ontologyIdStr);
        } catch(MatontoOntologyException ex) {
            message = ex.getMessage();
            LOG.error("Exception occurred while retrieving ontology: " + message, ex);
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
            json.put("ontology id", ontologyIdStr);
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
            optOntology = getOntology(ontologyIdStr);
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
		String message;
		try{
			IRI iri = manager.createOntologyIRI(ontologyIdStr);
			OntologyId ontologyId = manager.createOntologyId(iri);
			deleted = manager.deleteOntology(ontologyId);
			
			if(retrievedOntologies.containsKey(ontologyId))  
			    retrievedOntologies.remove(ontologyId);
			
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
        annotations.put("annotation properties", getAnnotationIRIs(ontologyIdStr));
        array.add(annotations);
        
        JSONObject classes = new JSONObject();
        classes.put("classes", getClassIRIs(ontologyIdStr));
        array.add(classes);
        
        JSONObject datatypes = new JSONObject();
        datatypes.put("datatypes", getDatatypeIRIs(ontologyIdStr));
        array.add(datatypes);
        
        JSONObject objectProperties = new JSONObject();
        objectProperties.put("object properties", getObjectPropertyIRIs(ontologyIdStr));
        array.add(objectProperties);
        
        JSONObject dataProperties = new JSONObject();
        dataProperties.put("data properties", getDataPropertyIRIs(ontologyIdStr));
        array.add(dataProperties);
        
        JSONObject namedIndividuals = new JSONObject();
        namedIndividuals.put("named individuals", getNamedIndividualIRIs(ontologyIdStr));
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
        
        JSONObject json = new JSONObject();
        json = getAnnotationIRIs(ontologyIdStr);
            
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
       
        JSONObject json = new JSONObject();
        json = getClassIRIs(ontologyIdStr);
           
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
       
        JSONObject json = new JSONObject();
        json = getDatatypeIRIs(ontologyIdStr);
           
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
       
        JSONObject json = new JSONObject();
        json = getObjectPropertyIRIs(ontologyIdStr);
           
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
       
        JSONObject json = new JSONObject();
        json = getDataPropertyIRIs(ontologyIdStr);
           
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
       
        JSONObject json = new JSONObject();
        json = getNamedIndividualIRIs(ontologyIdStr);
           
        return Response.status(200).entity(json.toString()).build();
    }
    
    
    
    private JSONObject getAnnotationIRIs (@Nonnull String ontologyIdStr) 
    {
        JSONObject json = new JSONObject();
        Optional<Ontology> optOntology = Optional.empty();
    
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
    
        if(!annotations.isEmpty()) {
            Map<String, ArrayList<String>> propertyMap = new HashMap<String, ArrayList<String>>();
            for(Annotation annotation : annotations) {
                String namespace = annotation.getProperty().getIRI().getNamespace();
                String localName = annotation.getProperty().getIRI().getLocalName();
                if(propertyMap.isEmpty() || !propertyMap.containsKey(namespace)) {
                    ArrayList<String> lnArray = new ArrayList<String>();
                    lnArray.add(localName);
                    propertyMap.put(namespace, lnArray);
                }
                
                else {
                    ArrayList<String> lnArray = propertyMap.get(namespace);
                    if(!lnArray.contains(localName)) {
                        lnArray.add(localName);
                        propertyMap.put(namespace, lnArray);
                    }
                }             
            }
        
            json = mapToJson(propertyMap);
        }
   
        else {
            json.put("error", "OntologyId doesn't exist.");
        }
        
        return json;
    }
    
    private JSONObject getClassIRIs (@Nonnull String ontologyIdStr) 
    {   
        JSONObject json = new JSONObject();
        Optional<Ontology> optOntology = Optional.empty();
        
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
        
        if(!oClasses.isEmpty()) {
            Map<String, ArrayList<String>> oClassMap = new HashMap<String, ArrayList<String>>();
            for(OClass oClass : oClasses) {
                String namespace = oClass.getIRI().getNamespace();
                String localName = oClass.getIRI().getLocalName();
                if(oClassMap.isEmpty() || !oClassMap.containsKey(namespace)) {
                    ArrayList<String> lnArray = new ArrayList<String>();
                    lnArray.add(localName);
                    oClassMap.put(namespace, lnArray);
                }
                
                else {
                    ArrayList<String> lnArray = oClassMap.get(namespace);
                    if(!lnArray.contains(localName)) {
                        lnArray.add(localName);
                        oClassMap.put(namespace, lnArray);
                    }
                }             
            }
            json = mapToJson(oClassMap);
        }
       
        else {
            json.put("error", "OntologyId doesn't exist.");
        }
        
        return json;
    }
    
    private JSONObject getDatatypeIRIs (@Nonnull String ontologyIdStr) 
    {   
        JSONObject json = new JSONObject();
        Optional<Ontology> optOntology = Optional.empty();
        
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
        
        if(!datatypes.isEmpty()) {
            Map<String, ArrayList<String>> datatypeMap = new HashMap<String, ArrayList<String>>();
            for(Datatype datatype : datatypes) {
                String namespace = datatype.getIRI().getNamespace();
                String localName = datatype.getIRI().getLocalName();
                if(datatypeMap.isEmpty() || !datatypeMap.containsKey(namespace)) {
                    ArrayList<String> lnArray = new ArrayList<String>();
                    lnArray.add(localName);
                    datatypeMap.put(namespace, lnArray);
                }
                
                else {
                    ArrayList<String> lnArray = datatypeMap.get(namespace);
                    if(!lnArray.contains(localName)) {
                        lnArray.add(localName);
                        datatypeMap.put(namespace, lnArray);
                    }
                }             
            }
            json = mapToJson(datatypeMap);
        }
       
        else {
            json.put("error", "OntologyId doesn't exist.");
        }
        
        return json;
    }
    
    private JSONObject getObjectPropertyIRIs (@Nonnull String ontologyIdStr) 
    {   
        JSONObject json = new JSONObject();
        Optional<Ontology> optOntology = Optional.empty();
        
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
        
        if(!objectProperties.isEmpty()) {
            Map<String, ArrayList<String>> propertyMap = new HashMap<String, ArrayList<String>>();
            for(ObjectProperty property : objectProperties) {
                String namespace = property.getIRI().getNamespace();
                String localName = property.getIRI().getLocalName();
                if(propertyMap.isEmpty() || !propertyMap.containsKey(namespace)) {
                    ArrayList<String> lnArray = new ArrayList<String>();
                    lnArray.add(localName);
                    propertyMap.put(namespace, lnArray);
                }
                
                else {
                    ArrayList<String> lnArray = propertyMap.get(namespace);
                    if(!lnArray.contains(localName)) {
                        lnArray.add(localName);
                        propertyMap.put(namespace, lnArray);
                    }
                }             
            }
            json = mapToJson(propertyMap);
        }
       
        else {
            json.put("error", "OntologyId doesn't exist.");
        }
        
        return json;
    }
    
    private JSONObject getDataPropertyIRIs (@Nonnull String ontologyIdStr) 
    {   
        JSONObject json = new JSONObject();
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
        
        if(!dataProperties.isEmpty()) {
            Map<String, ArrayList<String>> propertyMap = new HashMap<String, ArrayList<String>>();
            for(DataProperty property : dataProperties) {
                String namespace = property.getIRI().getNamespace();
                String localName = property.getIRI().getLocalName();
                if(propertyMap.isEmpty() || !propertyMap.containsKey(namespace)) {
                    ArrayList<String> lnArray = new ArrayList<String>();
                    lnArray.add(localName);
                    propertyMap.put(namespace, lnArray);
                }
                
                else {
                    ArrayList<String> lnArray = propertyMap.get(namespace);
                    if(!lnArray.contains(localName)) {
                        lnArray.add(localName);
                        propertyMap.put(namespace, lnArray);
                    }
                }             
            }
            json = mapToJson(propertyMap);
        }
       
        else {
            json.put("error", "OntologyId doesn't exist.");
        }
        
        return json;
    }
    
    private JSONObject getNamedIndividualIRIs (@Nonnull String ontologyIdStr) 
    {   
        JSONObject json = new JSONObject();
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
        
        if(!individuals.isEmpty()) {
            Map<String, ArrayList<String>> individualMap = new HashMap<String, ArrayList<String>>();
            for(Individual individual : individuals) {
                if(individual instanceof NamedIndividual) {
                    String namespace = ((NamedIndividual)individual).getIRI().getNamespace();
                    String localName = ((NamedIndividual)individual).getIRI().getLocalName();
                    if(individualMap.isEmpty() || !individualMap.containsKey(namespace)) {
                        ArrayList<String> lnArray = new ArrayList<String>();
                        lnArray.add(localName);
                        individualMap.put(namespace, lnArray);
                    }
                    
                    else {
                        ArrayList<String> lnArray = individualMap.get(namespace);
                        if(!lnArray.contains(localName)) {
                            lnArray.add(localName);
                            individualMap.put(namespace, lnArray);
                        }
                    }
                }
            }
            json = mapToJson(individualMap);
        }
       
        else {
            json.put("error", "OntologyId doesn't exist.");
        }
        
        return json;
    }
    
    
    private JSONObject mapToJson(@Nonnull Map<String, ArrayList<String>> mapObject)
    {
        JSONObject json = new JSONObject();

        for(String key : mapObject.keySet()) {
            JSONArray jsonArray = new JSONArray();
            jsonArray.addAll(mapObject.get(key));
            json.put(key, jsonArray);
        }
        
        return json;
    }
    
    private Optional<Ontology> getOntology(@Nonnull String ontologyIdStr) throws MatontoOntologyException
    {
        Ontology ontology = null;
        
        if(retrievedOntologies.containsKey(ontologyIdStr)) {
            return Optional.of(retrievedOntologies.get(ontologyIdStr));
        }
        
        else{
            Optional<Ontology> optOntology = Optional.empty();
            IRI iri = manager.createOntologyIRI(ontologyIdStr);
            OntologyId ontologyId = manager.createOntologyId(iri);
            optOntology = manager.retrieveOntology(ontologyId);
        
            if(optOntology.isPresent())
                retrievedOntologies.put(ontologyId, ontology);
              
            return optOntology;
        }
    }
	
}

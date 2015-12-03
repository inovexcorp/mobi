package org.matonto.ontology.core.impl.owlapi;

import static org.junit.Assert.*;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URL;
import java.util.Set;

import org.apache.commons.io.IOUtils;
import org.junit.Rule;
import org.junit.Test;
import org.matonto.ontology.core.api.OntologyManager;
import org.openrdf.model.Model;
import org.openrdf.model.Resource;
import org.openrdf.model.URI;
import org.openrdf.model.impl.URIImpl;

public class SimpleOntologyTest 
{

	@Rule
    public ResourceFile bookRes = new ResourceFile("/Book.owl");
	
	@Rule
    public ResourceFile travelRes = new ResourceFile("/travel.owl");
	
	@Rule
    public ResourceFile ttlRes = new ResourceFile("/matonto-release-2014.ttl");
    
	static OntologyManager manager = new SimpleOntologyManager();
    
	
	
    @Test
    public void importFileTest() throws IOException
    {
    	SimpleOntology so1 = new SimpleOntology();
    	so1.importOntology(bookRes.getFile(), manager.createOntologyId(bookRes.getContextId()));
    	SimpleOntology so2 = new SimpleOntology();
    	so2.importOntology(travelRes.getFile(), manager.createOntologyId(travelRes.getContextId()));
    	SimpleOntology so3 = new SimpleOntology();
    	so3.importOntology(ttlRes.getFile(), manager.createOntologyId(ttlRes.getContextId()));
    	OutputStream os1 = null;
    	OutputStream os2 = null;
    	OutputStream os3 = null;
    	OutputStream os4 = null;
    	OutputStream os5 = null;
    	OutputStream os6 = null;
    	OutputStream os7 = null;
    	OutputStream os8 = null;
    	OutputStream os9 = null;
    	os1 = so1.asOwlXml();
//    	os2 = so1.asRdfXml();
    	os3 = so1.asTurtle();
    	os4 = so2.asOwlXml();
    	os5 = so2.asRdfXml();
    	os6 = so2.asTurtle();
    	os7 = so3.asOwlXml();
    	os8 = so3.asRdfXml();
    	os9 = so3.asTurtle();
    	
    	
    	assertNotNull(os1);
//    	assertNotNull(os2);
    	assertNotNull(os3);
    	assertNotNull(os4);
    	assertNotNull(os5);
    	assertNotNull(os6);
    	assertNotNull(os7);
    	assertNotNull(os8);
    	assertNotNull(os9);
    	
    	IOUtils.closeQuietly(os1);
    	IOUtils.closeQuietly(os2);
    	IOUtils.closeQuietly(os3);
    	IOUtils.closeQuietly(os4);
    	IOUtils.closeQuietly(os5);
    	IOUtils.closeQuietly(os6);
    	IOUtils.closeQuietly(os7);
    	IOUtils.closeQuietly(os8);
    	IOUtils.closeQuietly(os9);    	
    }
    
    @Test
    public void importInputStreamTest() throws IOException
    {
    	SimpleOntology so1 = new SimpleOntology();
    	so1.importOntology(bookRes.getInputStream(), manager.createOntologyId(bookRes.getContextId()));
    	SimpleOntology so2 = new SimpleOntology();
    	so2.importOntology(travelRes.getInputStream(), manager.createOntologyId(travelRes.getContextId()));
    	SimpleOntology so3 = new SimpleOntology();
    	so3.importOntology(ttlRes.getInputStream(), manager.createOntologyId(ttlRes.getContextId()));
    	OutputStream os1 = null;
    	OutputStream os2 = null;
    	OutputStream os3 = null;
    	OutputStream os4 = null;
    	OutputStream os5 = null;
    	OutputStream os6 = null;
    	OutputStream os7 = null;
    	OutputStream os8 = null;
    	OutputStream os9 = null;
    	os1 = so1.asOwlXml();
//    	os2 = so1.asRdfXml();
    	os3 = so1.asTurtle();
    	os4 = so2.asOwlXml();
    	os5 = so2.asRdfXml();
    	os6 = so2.asTurtle();
    	os7 = so3.asOwlXml();
    	os8 = so3.asRdfXml();
    	os9 = so3.asTurtle();
    	
    	assertNotNull(os1);
//    	assertNotNull(os2);
    	assertNotNull(os3);
    	assertNotNull(os4);
    	assertNotNull(os5);
    	assertNotNull(os6);
    	assertNotNull(os7);
    	assertNotNull(os8);
    	assertNotNull(os9);
    	
    	IOUtils.closeQuietly(os1);
    	IOUtils.closeQuietly(os2);
    	IOUtils.closeQuietly(os3);
    	IOUtils.closeQuietly(os4);
    	IOUtils.closeQuietly(os5);
    	IOUtils.closeQuietly(os6);
    	IOUtils.closeQuietly(os7);
    	IOUtils.closeQuietly(os8);
    	IOUtils.closeQuietly(os9);  
    }
    
    @Test
    public void importURLTest() throws IOException
    {
    	SimpleOntology so1 = new SimpleOntology();
    	so1.importOntology(bookRes.getURL(), manager.createOntologyId(bookRes.getContextId()));
    	SimpleOntology so2 = new SimpleOntology();
    	URI contextId = new URIImpl("http://protege.cim3.net/file/pub/ontologies/travel#travel");
    	so2.importOntology(new URL("http://protege.cim3.net/file/pub/ontologies/travel/travel.owl"), manager.createOntologyId(contextId));
    	SimpleOntology so3 = new SimpleOntology();
    	so3.importOntology(ttlRes.getURL(), manager.createOntologyId(ttlRes.getContextId()));
    	OutputStream os1 = null;
    	OutputStream os2 = null;
    	OutputStream os3 = null;
    	OutputStream os4 = null;
    	OutputStream os5 = null;
    	OutputStream os6 = null;
    	OutputStream os7 = null;
    	OutputStream os8 = null;
    	OutputStream os9 = null;
    	os1 = so1.asOwlXml();
//    	os2 = so1.asRdfXml();
    	os3 = so1.asTurtle();
    	os4 = so2.asOwlXml();
    	os5 = so2.asRdfXml();
    	os6 = so2.asTurtle();
    	os7 = so3.asOwlXml();
    	os8 = so3.asRdfXml();
    	os9 = so3.asTurtle();
    	
    	assertNotNull(os1);
//    	assertNotNull(os2);
    	assertNotNull(os3);
    	assertNotNull(os4);
    	assertNotNull(os5);
    	assertNotNull(os6);
    	assertNotNull(os7);
    	assertNotNull(os8);
    	assertNotNull(os9);
    	
    	IOUtils.closeQuietly(os1);
    	IOUtils.closeQuietly(os2);
    	IOUtils.closeQuietly(os3);
    	IOUtils.closeQuietly(os4);
    	IOUtils.closeQuietly(os5);
    	IOUtils.closeQuietly(os6);
    	IOUtils.closeQuietly(os7);
    	IOUtils.closeQuietly(os8);
    	IOUtils.closeQuietly(os9);  
    }
    
    
    @Test
    public void asModelTest() throws IOException
    {
    	SimpleOntology so1 = new SimpleOntology();
    	so1.importOntology(bookRes.getFile(), manager.createOntologyId(bookRes.getContextId()));
//    	Model model1 = so1.asModel();
//    	Set<Resource> resources1 = model1.contexts();
    	SimpleOntology so2 = new SimpleOntology();
    	so2.importOntology(travelRes.getFile(), manager.createOntologyId(travelRes.getContextId()));
    	Model model2 = so2.asModel();
    	Set<Resource> resources2 = model2.contexts();
    	SimpleOntology so3 = new SimpleOntology();
    	so3.importOntology(ttlRes.getFile(), manager.createOntologyId(ttlRes.getContextId()));
    	Model model3 = so3.asModel();
    	Set<Resource> resources3 = model3.contexts();
    	SimpleOntology so4 = new SimpleOntology();
    	Model model4 = so4.asModel();
    	Set<Resource> resources4 = model4.contexts();
    	
//    	assertFalse(resources1.isEmpty());
    	assertFalse(resources2.isEmpty());
    	assertFalse(resources3.isEmpty());
//    	assertTrue(resources4.isEmpty());
    }
    
//    @Test
//    public void printOntologyTest() throws IOException
//    {
//    	SimpleOntology ontology = new SimpleOntology(bookRes.getFile(), bookRes.getContextId());
//    	System.out.println("---------------------------------------------------------------");
//    	System.out.println("---------------------------------------------------------------");
//    	System.out.println("------------------------ As Turtule ---------------------------");
//    	System.out.println(ontology.asTurtle());
//    	System.out.println("---------------------------------------------------------------");
//    	System.out.println("---------------------------------------------------------------");
//    	System.out.println("------------------------ As Owl/Xml ---------------------------");
//    	System.out.println(ontology.asOwlXml());
//    	System.out.println("---------------------------------------------------------------");
//    	System.out.println("---------------------------------------------------------------");
//    	System.out.println("------------------------ As Rdf/Xml ---------------------------");
//    	System.out.println(ontology.asRdfXml());
//    }
    
    
}

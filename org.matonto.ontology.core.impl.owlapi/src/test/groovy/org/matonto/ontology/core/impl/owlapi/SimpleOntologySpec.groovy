package org.matonto.ontology.core.impl.owlapi
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;

import spock.lang.Shared
import spock.lang.Specification

class SimpleOntologySpec extends Specification {


    @Shared
    def manager = new SimpleOntologyManager();
    
//    @Share
//    def factory = SimpleValueFactory.getInstance();
//
//	@Shared
//	def file = new File("src/test/resources/travel.owl")
//
//	@Shared
//	def url = new URL("http://protege.cim3.net/file/pub/ontologies/travel/travel.owl")
//
//    @Shared
//    def fileIri = manager.createOntologyIRI("http://www.matonto.org/samples#travel.owl")
//
//    @Shared
//    def fileOntologyId = manager.createOntologyId(fileIri)
//
//    @Shared
//    def urlIri = manager.createOntologyIRI("http://protege.cim3.net/file/pub/ontologies/travel/travel.owl")
//
//    @Shared
//    def urlOntologyId = manager.createOntologyId(urlIri)
//
//
//    /* OntologyId creation test */
//    def"File OntologyId creation"() {
//        setup:
//        def id = "http://www.matonto.org/samples#travel.owl"
//
//        expect:
//        fileOntologyId.toString() == id
//    }
//
//    def"URL OntologyId creation"() {
//        setup:
//        def id = "http://protege.cim3.net/file/pub/ontologies/travel/travel.owl"
//
//        expect:
//        urlOntologyId.toString() == id
//    }
//
//
//	/* Constructors Tests */
//    def "constructor with File param"() {
//    	setup:
//    	def simpleOntology = new SimpleOntology(file, fileOntologyId)
//
//    	expect:
//    	simpleOntology instanceof SimpleOntology
//    }
//
//    def "constructor with InputStream param"() {
//    	setup:
//    	def inputStream = new FileInputStream(file)
//    	def simpleOntology = new SimpleOntology(inputStream, fileOntologyId)
//
//    	expect:
//    	simpleOntology instanceof SimpleOntology
//    }
//
//
//    def "ontologyId equals file iri string"() {
//        setup:
//        def ontology = new SimpleOntology(file, fileOntologyId)
//        def id = "http://www.matonto.org/samples#travel.owl"
//
//        expect:
//        ontology.getOntologyId().toString() == id
//    }
//
//
//	def "ontologyId equals url string"() {
//		setup:
//		def ontology = new SimpleOntology(url.openStream(), urlOntologyId)
//		def id = "http://protege.cim3.net/file/pub/ontologies/travel/travel.owl"
//
//        expect:
//        ontology.getOntologyId().toString() == id
//    }
//
//
//	/* Equal and hashCode Tests */
//	def "ontology1 equals ontology2"() {
//		setup:
//		def ontology1 = new SimpleOntology(file, fileOntologyId)
//		def ontology2 = new SimpleOntology(file, fileOntologyId)
//
//        expect:
//        ontology1 == ontology2
//    }
//
//    def "ontology3 equals ontology4"() {
//		setup:
//		def ontology3 = new SimpleOntology(url.openStream(), urlOntologyId)
//		def ontology4 = new SimpleOntology(url.openStream(), urlOntologyId)
//
//        expect:
//        ontology3 == ontology4
//    }
//
//    def "ontology1 not equal ontology3"() {
//		setup:
//		def ontology1 = new SimpleOntology(file, fileOntologyId)
//		def ontology3= new SimpleOntology(url.openStream(), urlOntologyId)
//
//        expect:
//        ontology1 != ontology3
//    }
//
//    def "ontology1 hashCode equals ontology2 hashCode"() {
//		setup:
//		def ontology1 = new SimpleOntology(file, fileOntologyId)
//		def ontology2 = new SimpleOntology(file, fileOntologyId)
//
//        expect:
//        ontology1.hashCode() == ontology2.hashCode()
//    }
//
//    def "ontology1 hashCode not equal ontology3 hashCode"() {
//		setup:
//		def ontology1 = new SimpleOntology(file, fileOntologyId)
//		def ontology3 = new SimpleOntology(url.openStream(), urlOntologyId)
//
//        expect:
//        ontology1.hashCode() != ontology3.hashCode()
//    }
//
//
//	/* asModel Tests */
//    def "SimpleOntology with File input as openrdf.sesame.Model object"() {
//		setup:
//		def ontology = new SimpleOntology(file, fileOntologyId)
//
//        expect:
//        ontology.asModel() instanceof org.openrdf.model.Model
//    }
//
//	def "SimpleOntology with url input as openrdf.sesame.Model object"() {
//		setup:
//		def ontology = new SimpleOntology(url.openStream(), urlOntologyId)
//
//        expect:
//        ontology.asModel() instanceof org.openrdf.model.Model
//    }
//
//    def "SimpleOntology with inputstream input as openrdf.sesame.Model object"() {
//		setup:
//		def inputStream = new FileInputStream(file)
//		def ontology = new SimpleOntology(inputStream, fileOntologyId)
//        expect:
//        ontology.asModel() instanceof org.openrdf.model.Model
//    }
//
}
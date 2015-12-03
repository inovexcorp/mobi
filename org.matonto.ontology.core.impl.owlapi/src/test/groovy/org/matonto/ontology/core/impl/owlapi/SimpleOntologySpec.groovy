package org.matonto.ontology.core.impl.owlapi

import java.io.File
import java.io.InputStream
import java.io.FileInputStream
import java.net.URL
import org.semanticweb.owlapi.model.IRI
import org.semanticweb.owlapi.model.OWLOntology
import org.semanticweb.owlapi.model.OWLOntologyManager
import org.openrdf.model.Model
import org.openrdf.model.impl.URIImpl
import spock.lang.Shared
import spock.lang.Specification

class SimpleOntologySpec extends Specification {

	@Shared
	def file = new File("src/test/resources/travel.owl")

	@Shared
	def url = new URL("http://protege.cim3.net/file/pub/ontologies/travel/travel.owl")

    @Shared
    def fileId = new URIImpl("http://www.matonto.org/samples#travel.owl");

    @Shared
    def urlId = new URIImpl("http://protege.cim3.net/file/pub/ontologies/travel/travel.owl");

    @Shared
    def manager = new SimpleOntologyManager();

    @Shared
    def fileOntologyId = manager.createOntologyId(fileId);

    @Shared
    def urlOntologyId = manager.createOntologyId(urlId);


    /* OntologyId creation test */
    def"File OntologyId creation"() {
        setup:
        def id = "http://www.matonto.org/samples#travel.owl"

        expect:
        fileOntologyId.toString() == id
    }

    def"URL OntologyId creation"() {
        setup:
        def id = "http://protege.cim3.net/file/pub/ontologies/travel/travel.owl"

        expect:
        urlOntologyId.toString() == id
    }


	/* Constructors Tests */
	def "default constructor"() {
        expect:
        new SimpleOntology() instanceof SimpleOntology
    }

    def "constructor with File param"() {
    	setup:
    	def simpleOntology = new SimpleOntology(file, fileOntologyId)

    	expect:
    	simpleOntology instanceof SimpleOntology
    }

    def "constructor with URL param"() {
    	setup:
    	def simpleOntology = new SimpleOntology(url, urlOntologyId)

    	expect:
    	simpleOntology instanceof SimpleOntology
    }


    def "constructor with InputStream param"() {
    	setup:
    	def inputStream = new FileInputStream(file)
    	def simpleOntology = new SimpleOntology(inputStream, fileOntologyId)

    	expect:
    	simpleOntology instanceof SimpleOntology
    }


    def "ontologyId equals url string"() {
        setup:
        def ontology = new SimpleOntology(file, fileOntologyId)
        def id = "http://www.matonto.org/samples#travel.owl"

        expect:
        ontology.getOntologyId().toString() == id
    }


	def "ontologyId equals url string"() {
		setup:
		def ontology = new SimpleOntology(url, urlOntologyId)
		def id = "http://protege.cim3.net/file/pub/ontologies/travel/travel.owl"
        expect:
        ontology.getOntologyId().toString() == id
    }


	/* Equal and hashCode Tests */
	def "ontology1 equals ontology2"() {
		setup:
		def ontology1 = new SimpleOntology(file, fileOntologyId)
		def ontology2 = new SimpleOntology(file, fileOntologyId)
        expect:
        ontology1 == ontology2
    }

    def "ontology3 equals ontology4"() {
		setup:
		def ontology3 = new SimpleOntology(url, urlOntologyId)
		def ontology4 = new SimpleOntology(url, urlOntologyId)
        expect:
        ontology3 == ontology4
    }

    def "ontology1 not equal ontology3"() {
		setup:
		def ontology1 = new SimpleOntology(file, fileOntologyId)
		def ontology3= new SimpleOntology(url, urlOntologyId)
        expect:
        ontology1 != ontology3
    }

    def "ontology1 hashCode equals ontology2 hashCode"() {
		setup:
		def ontology1 = new SimpleOntology(file, fileOntologyId)
		def ontology2 = new SimpleOntology(file, fileOntologyId)
        expect:
        ontology1.hashCode() == ontology2.hashCode()
    }

    def "ontology1 hashCode not equal ontology3 hashCode"() {
		setup:
		def ontology1 = new SimpleOntology(file, fileOntologyId)
		def ontology3 = new SimpleOntology(url, urlOntologyId)
        expect:
        ontology1.hashCode() != ontology3.hashCode()
    }


	/* asModel Tests */
	def "Empty SimpleOntology as openrdf.sesame.Model object"() {
		setup:
		def ontology = new SimpleOntology()
        expect:
        ontology.asModel() instanceof org.openrdf.model.Model
    }

    def "SimpleOntology with File input as openrdf.sesame.Model object"() {
		setup:
		def ontology = new SimpleOntology(file, fileOntologyId)
        expect:
        ontology.asModel() instanceof org.openrdf.model.Model
    }

	def "SimpleOntology with url input as openrdf.sesame.Model object"() {
		setup:
		def ontology = new SimpleOntology(url, urlOntologyId)
        expect:
        ontology.asModel() instanceof org.openrdf.model.Model
    }

    def "SimpleOntology with inputstream input as openrdf.sesame.Model object"() {
		setup:
		def inputStream = new FileInputStream(file)
		def ontology = new SimpleOntology(inputStream, fileOntologyId)
        expect:
        ontology.asModel() instanceof org.openrdf.model.Model
    }

}
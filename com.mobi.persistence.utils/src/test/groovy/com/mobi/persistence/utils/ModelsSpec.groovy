/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
package com.mobi.persistence.utils

import com.mobi.exception.MobiException
import org.eclipse.rdf4j.model.*
import org.eclipse.rdf4j.rio.RDFParseException
import spock.lang.Specification

import java.util.stream.Stream

class ModelsSpec extends Specification{

    def model1 = Mock(Model)
    def model2 = Mock(Model)
    def model3 = Mock(Model)
    def model4 = Mock(Model)
    def model5 = Mock(Model)

    def stmtOIRI = Mock(Statement)
    def stmtOLit = Mock(Statement)
    def stmtSBNode = Mock(Statement)

    def subIRI = Mock(IRI)
    def subBNode = Mock(BNode)
    def predIRI = Mock(IRI)
    def objIRI = Mock(IRI)
    def objLit = Mock(Literal)

    def subIRI2 = Mock(IRI)
    def predIRI2 = Mock(IRI)
    def objIRI2 = Mock(IRI)

    def sub = "http://test.com/sub"
    def pred = "http://test.com/pred"
    def obj ="http://test.com/obj"

    def setup() {
        subIRI.stringValue() >> sub
        subIRI.toString() >> sub

        subBNode.stringValue() >> "1234"
        subBNode.toString() >> "1234"
        subBNode.getID() >> "1234"

        predIRI.stringValue() >> pred
        predIRI.toString() >> pred

        objIRI.stringValue() >> obj
        objIRI.toString() >> obj

        objLit.stringValue() >> "test"
        objLit.toString() >> "test"

        stmtSBNode.getSubject() >> subBNode

        stmtOIRI.getSubject() >> subIRI
        stmtOIRI.getPredicate() >> predIRI
        stmtOIRI.getObject() >> objIRI

        stmtOLit.getObject() >> objLit

        model1.stream() >> Stream.of(stmtOIRI)
        model2.stream() >> Stream.of(stmtOLit)
        model3.stream() >> Stream.of(stmtOIRI, stmtOLit)
        model4.stream() >> Stream.of(stmtSBNode)
        model5.stream() >> Stream.empty()

        model1.filter(null, predIRI, objIRI) >> model1
        model1.filter(subIRI, predIRI, null) >> model1
        model1.filter(null, predIRI, objIRI2) >> model5
        model1.filter(null, predIRI2, objIRI) >> model5
        model1.filter(subIRI, predIRI2, null) >> model5
        model1.filter(subIRI2, predIRI, null) >> model5

        model1.size() >> 1
        model5.size() >> 0

    }

    def "createModel for Trig format returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/testData.trig")

        when:
        def parsedModel = Models.createModel(input)

        then:
        assert parsedModel.size() == 7;
    }

    def "createModel with preferredExtension for Trig format returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/testData.trig")
            when:
        def parsedModel = Models.createModel("trig", input)

        then:
        assert parsedModel.getRdfFormatName() == "TriG"
    }

    def "createModel with preferredExtension for Trig format Zipped returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/testData.trig.zip")
            when:
        def parsedModel = Models.createModel("zip", input)

        then:
        assert parsedModel.getRdfFormatName() == "TriG"
    }

    def "createModel with invalid extension for Trig format returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/testData.trig")

        when:
        def parsedModel = Models.createModel('invalid', input)

        then:
        assert parsedModel.getRdfFormatName() == "TriG"
    }

    def "createModel for OWL format returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/bfo.owl")

        when:
        def parsedModel = Models.createModel(input)

        then:
        assert parsedModel.size() == 1221;
    }

    def "createModel with preferredExtension for OWL format returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/bfo.owl")

        when:
        def parsedModel = Models.createModel("owl", input)

        then:
        assert parsedModel.getRdfFormatName() == "RDF/XML"
    }

    def "createModel for invalid format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/invalid.owl")

        when:
        Models.createModel(input)

        then:
        thrown(IllegalArgumentException.class)
    }

    def "createModel for rdf star ttls format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/star.ttls")

        when:
        Models.createModel(input)

        then:
        thrown(IllegalArgumentException.class)
    }

    def "createModel for rdf star ttl format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/star.ttl")

        when:
        Models.createModel(input)

        then:
        thrown(IllegalArgumentException.class)
    }

    def "createModel for rdf star trig format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/star.trig")

        when:
        Models.createModel(input)

        then:
        thrown(IllegalArgumentException.class)
    }

    def "createModel for rdf star trigs format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/star.trigs")

        when:
        Models.createModel(input)

        then:
        thrown(IllegalArgumentException.class)
    }

    def "createModel for invalid language tags throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/invalidlanguage.owl")

        when:
        Models.createModel(input)

        then:
        thrown(IllegalArgumentException.class)
    }

    def "createModel with invalid extension for OWL format returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/bfo.owl")

        when:
        def parsedModel = Models.createModel('invalid', input)

        then:
        assert parsedModel.getRdfFormatName() == "RDF/XML"
    }

    def "createModel with a valid compressed (.zip) file format returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/bfo.owl.zip")

        when:
        def parsedModel = Models.createModel('zip', input)

        then:
        assert parsedModel.getRdfFormatName() == "RDF/XML"
    }

    def "createModel with a valid compressed (ext.gzip) file format returns correct data"() {
        setup:
        def input = getClass().getResourceAsStream("/bfo.owl.gz")

        when:
        def parsedModel = Models.createModel('owl.gz', input)

        then:
        assert parsedModel.getRdfFormatName() == "RDF/XML"
    }

    def "createModel with extension for invalid format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/invalid.owl")
    
        when:
        Models.createModel('owl', input)

        then:
        thrown(RDFParseException.class)
    }

    def "createModel with invalid extension for invalid format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/invalid.owl")
    
        when:
        Models.createModel('invalid', input)

        then:
        thrown(RDFParseException.class)
    }

    def "createModel with an invalid compressed (.zip) file format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/invalid.txt.zip")
    
        when:
        Models.createModel('zip', input)

        then:
        thrown(RDFParseException.class)
    }

    def "createModel with multiple compressed file (.zip) throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/Archive.zip")
    
        when:
        Models.createModel('.zip', input)

        then:
        thrown(MobiException)
    }

    def "createModel with an invalid compressed (.gzip) file format throws an Exception"() {
        setup:
        def input = getClass().getResourceAsStream("/invalid.owl.gz")
    
        when:
        Models.createModel('gz', input)

        then:
        thrown(RDFParseException.class)
    }
}

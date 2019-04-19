/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.BNode
import com.mobi.rdf.api.IRI
import com.mobi.rdf.api.Literal
import com.mobi.rdf.api.Model
import com.mobi.rdf.api.Statement
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

    def "objectString returns object string from only statement in model"(){
        when:
        def objString = Models.objectString(model1).get()

        then:
        objIRI.toString() == objString
    }

    def "object returns only object(IRI) in model"(){
        when:
        def result = Models.object(model1).get()

        then:
        objIRI == result
    }

    def "object returns only object(Literal) in model"(){
        when:
        def result = Models.object(model2).get()

        then:
        objLit == result
    }

    def "objectIRI returns only object IRI in model"(){
        when:
        def result = Models.objectIRI(model1).get()

        then:
        objIRI == result
    }

    def "objectResource returns only object Resource in model"(){
        when:
        def result = Models.objectResource(model1).get()

        then:
        objIRI == result
    }

    def "objectValue returns only object IRI in model"(){
        when:
        def result = Models.objectLiteral(model3).get()

        then:
        objLit == result
    }

    def "predicate returns only predicate in model"(){
        when:
        def result = Models.predicate(model1).get()

        then:
        predIRI == result
    }

    def "subject returns only subject (IRI) in model"(){
        when:
        def result = Models.subject(model1).get()

        then:
        subIRI == result
    }

    def "subject returns only subject (BNode) in model"(){
        when:
        def result = Models.subject(model4).get()

        then:
        subBNode == result
    }

    def "subjectBNode returns only subject BNode in model"(){
        when:
        def result = Models.subjectBNode(model4).get()

        then:
        subBNode == result
    }

    def "subjectIRI returns only subject (IRI) in model"(){
        when:
        def result = Models.subjectIRI(model1).get()

        then:
        subIRI == result
    }

    def "findFirstSubject returns the subject (IRI) when provided a matching predicate and object"(){
        when:
        def result = Models.findFirstSubject(model1, predIRI, objIRI).get()

        then:
        subIRI == result
    }

    def "findFirstSubject returns an empty optional when provided a matching predicate and non matching object"(){
        when:
        def result = Models.findFirstSubject(model1, predIRI, objIRI2).isPresent()

        then:
        !result
    }

    def "findFirstSubject returns an empty optional when provided a non matching predicate and matching object"(){
        when:
        def result = Models.findFirstSubject(model1, predIRI2, objIRI).isPresent()

        then:
        !result
    }

    def "findFirstObject returns the object (IRI) when provided a matching subject and predicate"(){
        when:
        def result = Models.findFirstObject(model1, subIRI, predIRI).get()

        then:
        objIRI == result
    }

    def "findFirstObject returns an empty optional when provided a matching subject and non matching predicate"(){
        when:
        def result = Models.findFirstObject(model1, subIRI, predIRI2).isPresent()

        then:
        !result
    }

    def "findFirstObject returns an empty optional when provided a non matching subject and matching predicate"(){
        when:
        def result = Models.findFirstObject(model1, subIRI2, predIRI).isPresent()

        then:
        !result
    }
}

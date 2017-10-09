package com.mobi.rdf.core.utils

import com.mobi.rdf.api.BNode
import com.mobi.rdf.api.IRI
import com.mobi.rdf.api.Literal
import com.mobi.rdf.core.impl.sesame.SimpleBNode
import com.mobi.rdf.core.impl.sesame.SimpleIRI
import com.mobi.rdf.core.impl.sesame.SimpleLiteral
import org.openrdf.model.ValueFactory
import org.openrdf.model.impl.SimpleValueFactory
import spock.lang.Specification

class ValuesSpec extends Specification {

    private static final ValueFactory SESAME_VF = SimpleValueFactory.getInstance();

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    def "sesameResource(IRI) returns a Sesame IRI"() {
        setup:
        def resource = new SimpleIRI("http://test.com")
        def sesameResource = Values.sesameResource(resource)

        expect:
        sesameResource instanceof org.openrdf.model.IRI
    }

    def "sesameResource(BNode) returns a Sesame BNode"() {
        setup:
        def resource = new SimpleBNode("http://test.com")
        def sesameResource = Values.sesameResource(resource)

        expect:
        sesameResource instanceof org.openrdf.model.BNode
    }

    def "sesameResource(null) returns null"() {
        setup:
        def sesameResource = Values.sesameResource(null)

        expect:
        sesameResource == null
    }

    def "mobiResource(IRI) returns a Mobi IRI"() {
        setup:
        def resource = SESAME_VF.createIRI("http://test.com")
        def mobiResource = Values.mobiResource(resource)

        expect:
        mobiResource instanceof IRI
    }

    def "mobiResource(BNode) returns a Mobi BNode"() {
        setup:
        def resource = SESAME_VF.createBNode("http://test.com")
        def mobiResource = Values.mobiResource(resource)

        expect:
        mobiResource instanceof BNode
    }

    def "mobiResource(null) returns null"() {
        setup:
        def mobiResource = Values.mobiResource(null)

        expect:
        mobiResource == null
    }

    def "sesameIRI(IRI) returns a Sesame IRI"() {
        setup:
        def iri = new SimpleIRI("http://test.com")
        def sesameIRI = Values.sesameIRI(iri)

        expect:
        sesameIRI instanceof org.openrdf.model.IRI
    }

    def "sesameIRI(null) returns null"() {
        setup:
        def sesameIRI = Values.sesameIRI(null)

        expect:
        sesameIRI == null
    }

    def "mobiIRI(IRI) returns a Mobi IRI"() {
        setup:
        def iri = SESAME_VF.createIRI("http://test.com")
        def mobiIRI = Values.mobiIRI(iri)

        expect:
        mobiIRI instanceof IRI
    }

    def "mobiIRI(null) returns null"() {
        setup:
        def mobiIRI = Values.mobiIRI(null)

        expect:
        mobiIRI == null
    }

    def "sesameValue(IRI) returns a Sesame IRI"() {
        setup:
        def value = new SimpleIRI("http://test.com")
        def sesameValue = Values.sesameValue(value)

        expect:
        sesameValue instanceof org.openrdf.model.IRI
    }

    def "sesameValue(BNode) returns a Sesame BNode"() {
        setup:
        def value = new SimpleBNode("http://test.com")
        def sesameValue = Values.sesameValue(value)

        expect:
        sesameValue instanceof org.openrdf.model.BNode
    }

    def "sesameValue(Literal) returns a Sesame Literal"() {
        setup:
        def value = new SimpleLiteral("Mobi")
        def sesameValue = Values.sesameValue(value)

        expect:
        sesameValue instanceof org.openrdf.model.Literal
    }

    def "sesameValue(null) returns a Sesame Literal"() {
        setup:
        def sesameValue = Values.sesameValue(null)

        expect:
        sesameValue == null
    }

    def "mobiValue(IRI) returns a Mobi IRI"() {
        setup:
        def value = SESAME_VF.createIRI("http://test.com")
        def mobiValue = Values.mobiValue(value)

        expect:
        mobiValue instanceof IRI
    }

    def "mobiValue(BNode) returns a Mobi BNode"() {
        setup:
        def value = SESAME_VF.createBNode("http://test.com")
        def mobiValue = Values.mobiValue(value)

        expect:
        mobiValue instanceof BNode
    }

    def "mobiValue(Literal) returns a Mobi Literal"() {
        setup:
        def value = SESAME_VF.createLiteral("Mobi")
        def mobiValue = Values.mobiValue(value)

        expect:
        mobiValue instanceof Literal
    }

    def "mobiValue(null) returns a Mobi Literal"() {
        setup:
        def mobiValue = Values.mobiValue(null)

        expect:
        mobiValue == null
    }

    def "sesameResources(c) returns a Sesame Resource[]"() {
        setup:
        def resource = new SimpleIRI("http://test.com")
        def sesameResources = Values.sesameResources(resource)

        expect:
        sesameResources.length == 1
        sesameResources[0] instanceof org.openrdf.model.IRI
    }

    def "sesameResources(c1, c2) returns a Sesame Resource[]"() {
        setup:
        def resource1 = new SimpleIRI("http://test.com")
        def resource2 = new SimpleIRI("http://test.com")
        def sesameResources = Values.sesameResources(resource1, resource2)

        expect:
        sesameResources.length == 2
        sesameResources[0] instanceof org.openrdf.model.IRI
        sesameResources[1] instanceof org.openrdf.model.IRI
    }

    def "sesameResources() returns empty Resource[]"() {
        setup:
        def sesameResources = Values.sesameResources()

        expect:
        sesameResources.length == 0
    }


    def "sesameResources(null) returns null"() {
        setup:
        def sesameResources = Values.sesameResources(null)

        expect:
        sesameResources == null
    }
}

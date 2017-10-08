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
package com.mobi.rdf.core.impl.sesame

import com.mobi.rdf.api.ValueFactory
import org.openrdf.model.vocabulary.XMLSchema
import spock.lang.Shared
import spock.lang.Specification

class SimpleStatementSpec extends Specification {

    @Shared
    ValueFactory MATONTO_VF = SimpleValueFactory.getInstance()

    @Shared
    def subjects = [
            new SimpleIRI("http://test.com/1"),
            new SimpleIRI("http://test.com/1"),
            new SimpleIRI("http://test.com/1"),
            new SimpleIRI("http://test.com/1"),
            new SimpleIRI("http://test.com/1"),
            new SimpleBNode("_:matonto/1"),
    ]

    @Shared
    def predicates = [
            new SimpleIRI("http://test.com/pred1"),
            new SimpleIRI("http://test.com/pred1"),
            new SimpleIRI("http://test.com/pred1"),
            new SimpleIRI("http://test.com/pred1"),
            new SimpleIRI("http://test.com/pred1"),
            new SimpleIRI("http://test.com/pred1"),
    ]

    @Shared
    def objects = [
            new SimpleLiteral("MatOnto"),
            new SimpleLiteral("true", MATONTO_VF.createIRI(XMLSchema.BOOLEAN.stringValue())),
            new SimpleLiteral("MatOnto", "en"),
            new SimpleIRI("http://test.com/obj1"),
            new SimpleBNode("_:matonto/1"),
            new SimpleLiteral("MatOnto"),
    ]

    @Shared
    def contexts = [
            new SimpleIRI("http://test.com/context1"),
            new SimpleIRI("http://test.com/context2"),
            new SimpleIRI("http://test.com/context1"),
            new SimpleIRI("http://test.com/context1"),
            new SimpleIRI("http://test.com/context1"),
            new SimpleIRI("http://test.com/context1"),
    ]

    def "getSubject works with #sub, #pred, #obj"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj)

        expect:
        stmt.getSubject() == sub

        where:
        sub << subjects
        pred << predicates
        obj << objects
    }

    def "getPredicate works with #sub, #pred, #obj"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj)

        expect:
        stmt.getPredicate() == pred

        where:
        sub << subjects
        pred << predicates
        obj << objects
    }

    def "getObject works with #sub, #pred, #obj"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj)

        expect:
        stmt.getObject() == obj

        where:
        sub << subjects
        pred << predicates
        obj << objects
    }

    def "getObject.stringValue works with #sub, #pred, #obj"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj)

        expect:
        stmt.getObject().stringValue() == obj.stringValue()

        where:
        sub << subjects
        pred << predicates
        obj << objects
    }

    def "getContext is empty when not provided with #sub, #pred, #obj"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj)

        expect:
        stmt.getContext() == Optional.empty()

        where:
        sub << subjects
        pred << predicates
        obj << objects
    }

    def "getSubject works with #sub, #pred, #obj, #context"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj, context)

        expect:
        stmt.getSubject() == sub

        where:
        sub << subjects
        pred << predicates
        obj << objects
        context << contexts
    }

    def "getPredicate works with #sub, #pred, #obj, #context"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj, context)

        expect:
        stmt.getPredicate() == pred

        where:
        sub << subjects
        pred << predicates
        obj << objects
        context << contexts
    }

    def "getObject works with #sub, #pred, #obj, #context"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj, context)

        expect:
        stmt.getObject() == obj

        where:
        sub << subjects
        pred << predicates
        obj << objects
        context << contexts
    }

    def "getContext is not empty with #sub, #pred, #obj, #context"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj, context)

        expect:
        stmt.getContext() != Optional.empty()

        where:
        sub << subjects
        pred << predicates
        obj << objects
        context << contexts
    }

    def "getContext is empty with #sub, #pred, #obj, null"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj, null)

        expect:
        stmt.getContext() == Optional.empty()

        where:
        sub << subjects[0]
        pred << predicates[0]
        obj << objects[0]
    }

    def "getContext works with #sub, #pred, #obj, #context"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj, context)

        expect:
        stmt.getContext().get() == context

        where:
        sub << subjects
        pred << predicates
        obj << objects
        context << contexts
    }

    def "stmt equals stmt with #sub, #pred, #obj"() {
        setup:
        def stmt1 = new SimpleStatement(sub, pred, obj)
        def stmt2 = new SimpleStatement(sub, pred, obj)

        expect:
        stmt1.equals(stmt2)

        where:
        sub << subjects
        pred << predicates
        obj << objects
    }

    def "stmt equals stmt with #sub, #pred, #obj, #context"() {
        setup:
        def stmt1 = new SimpleStatement(sub, pred, obj, context)
        def stmt2 = new SimpleStatement(sub, pred, obj, context)

        expect:
        stmt1.equals(stmt2)

        where:
        sub << subjects
        pred << predicates
        obj << objects
        context << contexts
    }

    def "stmt1 does no equal stmt2"() {
        setup:
        def stmt1 = new SimpleStatement(subjects[0], predicates[0], objects[0])
        def stmt2 = new SimpleStatement(subjects[0], predicates[0], objects[1])

        expect:
        !stmt1.equals(stmt2)
    }

    def "stmt1 does no equal stmt2 with context"() {
        setup:
        def stmt1 = new SimpleStatement(sub1, pred1, obj1, context1)
        def stmt2 = new SimpleStatement(sub2, pred2, obj2, context2)

        expect:
        !stmt1.equals(stmt2)

        where:
        sub1 | pred1 | obj1 | context1 | sub2 | pred2 | obj2 | context2
        subjects[0] | predicates[0] | objects[0] | contexts[0] | subjects[0] | predicates[0] | objects[0] | null
        subjects[0] | predicates[0] | objects[0] | contexts[0] | subjects[0] | predicates[0] | objects[0] | contexts[1]
    }

    def "hashCode works"() {
        setup:
        def stmt1 = new SimpleStatement(sub, pred, obj)
        def stmt2 = new SimpleStatement(sub, pred, obj)

        expect:
        stmt1.hashCode() == stmt2.hashCode()

        where:
        sub << subjects
        pred << predicates
        obj << objects
    }

    def "hashCode works with contexts"() {
        setup:
        def stmt1 = new SimpleStatement(sub, pred, obj, context)
        def stmt2 = new SimpleStatement(sub, pred, obj, context)

        expect:
        stmt1.hashCode() == stmt2.hashCode()

        where:
        sub << subjects
        pred << predicates
        obj << objects
        context << contexts
    }

    def "toString works"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj)

        expect:
        stmt.toString() == "($sub, $pred, $obj)".toString()

        where:
        sub << subjects
        pred << predicates
        obj << objects
    }

    def "toString works with context"() {
        setup:
        def stmt = new SimpleStatement(sub, pred, obj, context)

        expect:
        stmt.toString() == "($sub, $pred, $obj, $context)".toString()

        where:
        sub << subjects
        pred << predicates
        obj << objects
        context << contexts
    }
}

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

import spock.lang.Shared
import spock.lang.Specification

class SimpleBNodeSpec extends Specification {

    @Shared
    def bnodes = [
            "_:matonto/bnode/",
            "urn:matonto/bnode/",
            "_:matonto/bno de/",
            "http://matonto/bnode/",
            "http://matonto/bnode#Name"
    ]

    def "id of #bnodeString is #bnodeString"() {
        setup:
        def bnode = new SimpleBNode(bnodeString)

        expect:
        bnode.getID() == bnodeString

        where:
        bnodeString << bnodes
    }

    def "hashcode of #bnodeString is hashcode of String representation"() {
        setup:
        def bnode = new SimpleBNode(bnodeString)

        expect:
        bnode.hashCode() == bnodeString.hashCode()

        where:
        bnodeString << bnodes
    }

    def "#bnodeString equals #bnodeString"() {
        setup:
        def bnode1 = new SimpleBNode(bnodeString)
        def bnode2 = new SimpleBNode(bnodeString)

        expect:
        bnode1.equals(bnode2)

        where:
        bnodeString << bnodes
    }

    def "toString of #bnodeString is #bnodeString"() {
        setup:
        def bnode = new SimpleBNode(bnodeString)

        expect:
        bnode.toString() == bnodeString

        where:
        bnodeString << bnodes
    }

    def "stringValue of #bnodeString is #bnodeString"() {
        setup:
        def bnode = new SimpleBNode(bnodeString)

        expect:
        bnode.stringValue() == bnodeString

        where:
        bnodeString << bnodes
    }

    def "#bnodeString1 does not equal #bnodeString2"() {
        setup:
        def bnode1 = new SimpleBNode(bnodeString1)
        def bnode2 = new SimpleBNode(bnodeString2)

        expect:
        !bnode1.equals(bnode2)

        where:
        bnodeString1 | bnodeString2
        "_:matonto/bnode/" | "urn:matonto/bnode/"
        "_:matonto/bn ode/" | "urn:matonto/bnode/"
    }
}

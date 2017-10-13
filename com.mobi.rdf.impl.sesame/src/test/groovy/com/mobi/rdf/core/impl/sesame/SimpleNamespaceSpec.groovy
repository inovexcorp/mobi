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

class SimpleNamespaceSpec extends Specification {

    @Shared
    def prefixes = [
            "http://test.com/",
            "http://test.com#",
            "http://test.com/",
            "",
            ""
    ]

    @Shared
    def names = [
            "Class",
            "Class",
            "",
            "test",
            ""
    ]

    def "prefix #prefix is #prefix"() {
        setup:
        def ns = new SimpleNamespace(prefix, name)

        expect:
        ns.getPrefix() == prefix

        where:
        prefix << prefixes
        name << names
    }

    def "name #name is #name"() {
        setup:
        def ns = new SimpleNamespace(prefix, name)

        expect:
        ns.getName() == name

        where:
        prefix << prefixes
        name << names
    }

    def "#namespace1 equals #namespace1"() {
        setup:
        def ns1 = new SimpleNamespace(prefix, name)
        def ns2 = new SimpleNamespace(prefix, name)

        expect:
        ns1.equals(ns2)

        where:
        prefix << prefixes
        name << names
    }

    def "#namespace1 does not equal #namespace2"() {
        setup:
        def ns1 = new SimpleNamespace(prefix1, name1)
        def ns2 = new SimpleNamespace(prefix2, name2)

        expect:
        !ns1.equals(ns2)

        where:
        namespace1 | prefix1 | name1 | namespace2 | prefix2 | name2
        "http://test.com/test" | "http://test.com/" | "test" | "http://test.com/test1" | "http://test.com/" | "test1"
        "http://test.com/test" | "http://test.com/" | "test" | "http://test1.com/test" | "http://test1.com/" | "test"
        "test" | "" | "test" | "test1" | "" | "test1"
        "http://test.com/" | "http://test.com/" | "" | "http://test1.com/" | "http://test1.com/" | ""
    }

    def "hashCode of #namespace1 equals #namespace1"() {
        setup:
        def ns1 = new SimpleNamespace(prefix, name)
        def ns2 = new SimpleNamespace(prefix, name)

        expect:
        ns1.hashCode() == ns2.hashCode()

        where:
        prefix << prefixes
        name << names
    }
}

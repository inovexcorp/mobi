package org.matonto.rdf.orm.conversion.impl;

/*-
 * #%L
 * RDF ORM
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

import junit.framework.TestCase;
import org.junit.Test;
import org.matonto.rdf.api.IRI;

public class IRIValueConverterTest extends ValueConverterTestCase<IRI> {

    public IRIValueConverterTest() {
        super(new IRIValueConverter(), IRI.class);
    }

    @Test
    public void simpleTest() {
        IRI test = valueFactory.createIRI("http://test.com/test");
        TestCase.assertEquals(test,
                valueConverter.convertValue(valueConverter.convertType(test, null), null, IRI.class));
    }

}

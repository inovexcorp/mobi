package com.mobi.rdf.orm.conversion.impl;

/*-
 * #%L
 * RDF ORM
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import org.eclipse.rdf4j.model.Literal;

public class LiteralValueConverterTest extends ValueConverterTestCase<Literal> {

    public LiteralValueConverterTest() {
        super(new LiteralValueConverter(), Literal.class);
    }

    @Test
    public void simpleTest() {
        Literal test = valueFactory.createLiteral(true);
        TestCase.assertEquals(test,
                valueConverter.convertValue(valueConverter.convertType(test, null), null, Literal.class));
    }

}

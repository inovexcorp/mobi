package com.mobi.rdf.core.impl.sesame;

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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;

import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import org.junit.Test;
import org.openrdf.model.impl.LinkedHashModel;

public class SesameModelWrapperTest {

    @Test
    public void testEquals() {
        IRI s = new SimpleIRI("http://test.com/s");
        IRI p = new SimpleIRI("http://test.com/p");
        IRI o = new SimpleIRI("http://test.com/o");
        Literal o2 = new SimpleLiteral("Mobi");
        BNode b = new SimpleBNode("_:mobi1");
        BNode b2 = new SimpleBNode("_:mobi2");
        IRI c1 = new SimpleIRI("http://test.com/c1");

        SesameModelWrapper model1 = new SesameModelWrapper(new LinkedHashModel());
        SesameModelWrapper model2 = new SesameModelWrapper(new LinkedHashModel());
        SesameModelWrapper model3 = new SesameModelWrapper(new LinkedHashModel());
        SesameModelWrapper model4 = new SesameModelWrapper(new LinkedHashModel());
        SesameModelWrapper model5 = new SesameModelWrapper(new LinkedHashModel());
        SesameModelWrapper model6 = new SesameModelWrapper(new LinkedHashModel());
        SesameModelWrapper model7 = new SesameModelWrapper(new LinkedHashModel());
        SesameModelWrapper model8 = new SesameModelWrapper(new LinkedHashModel());

        model1.add(s, p, o);
        model2.add(s, p, o);

        model3.add(s, p, o);
        model3.add(s, p, o, c1);
        model4.add(s, p, o);
        model4.add(s, p, o, c1);

        model5.add(s, p, o);
        model5.add(s, p, b);
        model5.add(b, p, o2);
        model6.add(s, p, o);
        model6.add(s, p, b);
        model6.add(b, p, o2);

        model7.add(s, p, b);
        model7.add(b, p, o2);
        model8.add(s, p, b2);
        model8.add(b2, p, o2);

        assertEquals(model1, model2);
        assertEquals(model3, model4);
        assertNotEquals(model1, model3);
        assertEquals(model5, model6);
        assertEquals(model7, model8);
    }
}

package org.matonto.rdf.core.impl.sesame;

import org.junit.Test;
import org.matonto.rdf.core.api.BNode;
import org.matonto.rdf.core.api.IRI;
import org.matonto.rdf.core.api.Literal;
import org.openrdf.model.impl.LinkedHashModel;

import static org.junit.Assert.*;

public class SesameModelWrapperTest {

    @Test
    public void testEquals() {
        IRI s = new SimpleIRI("http://test.com/s");
        IRI p = new SimpleIRI("http://test.com/p");
        IRI o = new SimpleIRI("http://test.com/o");
        Literal o2 = new SimpleLiteral("MatOnto");
        BNode b = new SimpleBNode("_:matonto1");
        BNode b2 = new SimpleBNode("_:matonto2");
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

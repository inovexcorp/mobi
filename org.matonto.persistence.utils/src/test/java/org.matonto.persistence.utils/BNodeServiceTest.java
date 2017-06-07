package org.matonto.persistence.utils;

import org.junit.Before;
import org.junit.Test;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;

public class BNodeServiceTest {

    private BNodeService service;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();

    @Before
    public void setUp() throws Exception {
        service = new BNodeService();
        service.setModelFactory(mf);
        service.setValueFactory(vf);
    }

    @Test
    public void testSkolemizeBNode() {

    }
}

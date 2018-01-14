package com.mobi.document.translator.impl.xml;

import com.mobi.document.translator.expression.DefaultIriExpressionProcessor;
import com.mobi.document.translator.expression.IriExpressionProcessor;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

import static org.junit.Assert.*;

@RunWith(MockitoJUnitRunner.class)
public class XmlStackingSemanticTranslatorTest extends OrmEnabledTestCase {

    private static final String ONT_URI = "urn://test.ontology";

    private final File simpleTestFile = new File("src/test/resources/test.xml");

    private XmlStackingSemanticTranslator xmlStackingSemanticTranslator;

    @Before
    public void initTranslator() {
        xmlStackingSemanticTranslator = new XmlStackingSemanticTranslator();
        injectOrmFactoryReferencesIntoService(xmlStackingSemanticTranslator);
        xmlStackingSemanticTranslator.setValueFactory(VALUE_FACTORY);
        xmlStackingSemanticTranslator.setModelFactory(MODEL_FACTORY);
        xmlStackingSemanticTranslator.setOrmFactoryRegistry(ORM_FACTORY_REGISTRY);
        IriExpressionProcessor processor = new DefaultIriExpressionProcessor();
        ((DefaultIriExpressionProcessor)processor).setValueFactory(VALUE_FACTORY);
        xmlStackingSemanticTranslator.setExpressionProcessor(processor);
    }

    @Test
    public void simpleTest() throws Exception {
        ExtractedOntology ont = getRequiredOrmFactory(ExtractedOntology.class).createNew(VALUE_FACTORY.createIRI(ONT_URI));
        try (InputStream is = new FileInputStream(simpleTestFile)) {
            final Model results = xmlStackingSemanticTranslator.translate(is, "simpleTest.xml", ont);
            assertNotNull(results);
            assertFalse(results.isEmpty());
            assertFalse(ont.getModel().isEmpty());

            System.out.println("Model: \n");
            ont.getModel().forEach(System.out::println);

            System.out.println("\nIndividuals: \n");
            results.forEach(System.out::println);
        }
    }

}

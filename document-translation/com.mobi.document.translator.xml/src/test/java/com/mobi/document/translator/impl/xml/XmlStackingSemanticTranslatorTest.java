package com.mobi.document.translator.impl.xml;

import com.mobi.document.translator.AbstractSemanticTranslator;
import com.mobi.document.translator.expression.DefaultIriExpressionProcessor;
import com.mobi.document.translator.expression.IriExpressionProcessor;
import com.mobi.document.translator.ontology.*;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.orm.OrmFactory;
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
        ((DefaultIriExpressionProcessor) processor).setValueFactory(VALUE_FACTORY);
        xmlStackingSemanticTranslator.setExpressionProcessor(processor);
    }

    @Test
    public void simpleTest() throws Exception {
        ExtractedOntology ont = getRequiredOrmFactory(ExtractedOntology.class)
                .createNew(VALUE_FACTORY.createIRI(ONT_URI));
        try (InputStream is = new FileInputStream(simpleTestFile)) {
            final Model results = xmlStackingSemanticTranslator.translate(is, "simpleTest.xml", ont);

            validateSimpleExtractedOntology(ont);
            validateSimpleResults(results, ont);

            System.out.println("Model: \n");
            ont.getModel().forEach(System.out::println);

            System.out.println("\nIndividuals: \n");
            results.forEach(System.out::println);
        }
    }

    private void validateSimpleResults(Model results, ExtractedOntology ont) {
        assertNotNull(results);
        assertFalse(results.isEmpty());
        Model comments = results.filter(null,
                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"), null);
        assertEquals(3, comments.size());
        long rootCount = comments.stream().map(Statement::getSubject).map(Resource::stringValue)
                .filter(val -> val.contains("root")).count();
        assertEquals(2, rootCount);
    }

    private void validateSimpleExtractedOntology(ExtractedOntology ont) throws Exception {
        assertFalse(ont.getModel().isEmpty());

        final OrmFactory<ExtractedClass> classOrmFactory
                = getRequiredOrmFactory(ExtractedClass.class);
        final OrmFactory<ExtractedDatatypeProperty> datatypePropertyOrmFactory
                = getRequiredOrmFactory(ExtractedDatatypeProperty.class);
        final OrmFactory<ExtractedObjectProperty> objectPropertyOrmFactory
                = getRequiredOrmFactory(ExtractedObjectProperty.class);


        assertEquals(3, classOrmFactory.getAllExisting(ont.getModel()).size());
        ExtractedClass objChild = classOrmFactory.getExisting(
                VALUE_FACTORY.createIRI("urn://test.ontology#obj_child"), ont.getModel())
                .orElseThrow(() -> new Exception("Required obj_child class not defined"));
        ExtractedClass object = classOrmFactory.getExisting(
                VALUE_FACTORY.createIRI("urn://test.ontology#object"), ont.getModel())
                .orElseThrow(() -> new Exception("Required object class not defined"));
        ExtractedClass root = classOrmFactory.getExisting(
                VALUE_FACTORY.createIRI("urn://test.ontology#root"), ont.getModel())
                .orElseThrow(() -> new Exception("Required root class not defined"));

        long rootDatatypeProps = datatypePropertyOrmFactory.streamExisting(ont.getModel())
                .filter(prop -> isOfDomain(prop, (IRI) root.getResource()))
                .count();
        assertEquals(3, rootDatatypeProps);
        long rootObjProps = objectPropertyOrmFactory.streamExisting(ont.getModel())
                .filter(prop -> isOfDomain(prop, (IRI) root.getResource()))
                .count();
        assertEquals(1, rootObjProps);
        long objDatatypeProps = datatypePropertyOrmFactory.streamExisting(ont.getModel())
                .filter(prop -> isOfDomain(prop, (IRI) object.getResource()))
                .count();
        assertEquals(2, objDatatypeProps);
        long objObjProps = objectPropertyOrmFactory.streamExisting(ont.getModel())
                .filter(prop -> isOfDomain(prop, (IRI) object.getResource()))
                .count();
        assertEquals(1, objObjProps);
    }

    private boolean isOfDomain(ExtractedProperty prop, IRI targetClass) {
        return prop.getProperty(VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#domain"))
                .orElseThrow(() -> new RuntimeException("Required domain property not found"))
                .equals(targetClass);
    }

}

package com.mobi.meaning.extraction.expression;

import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.expression.context.ClassIriExpressionContext;
import com.mobi.meaning.extraction.expression.context.impl.DefaultClassIriExpressionContext;
import com.mobi.meaning.extraction.expression.context.impl.DefaultPropertyIriExpressionContext;
import com.mobi.meaning.extraction.expression.context.PropertyIriExpressionContext;
import com.mobi.meaning.extraction.ontology.*;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import com.mobi.rdf.core.impl.sesame.ValueFactoryService;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.*;
import com.mobi.rdf.orm.impl.ThingFactory;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

@RunWith(MockitoJUnitRunner.class)
public class DefaultIriExpressionProcessorTest {

    private static final String ONT_URI = "urn://mobi.com/ontologies/testExtraction";

    private static final ThingFactory TF = new ThingFactory();

    private static final ModelFactory MF = new LinkedHashModelFactoryService();

    private static final ValueFactory VF = new ValueFactoryService();

    private static final ExtractedOntologyFactory EXTRACTED_ONTOLOGY_FACTORY = new ExtractedOntologyFactory();
    private static final ExtractedClassFactory EXTRACTED_CLASS_FACTORY = new ExtractedClassFactory();
    private static final ExtractedDatatypePropertyFactory EXTRACTED_DATATYPE_PROPERTY_FACTORY = new ExtractedDatatypePropertyFactory();
    private static final ExtractedObjectPropertyFactory EXTRACTED_OBJECT_PROPERTY_FACTORY = new ExtractedObjectPropertyFactory();

    @BeforeClass
    public static void beforeClass() {
        final ValueConverterRegistry valueConverterRegistry = new DefaultValueConverterRegistry();
        valueConverterRegistry.registerValueConverter(new BigIntegerValueConverter());
        valueConverterRegistry.registerValueConverter(new BooleanValueConverter());
        valueConverterRegistry.registerValueConverter(new CalendarValueConverter());
        valueConverterRegistry.registerValueConverter(new DateValueConverter());
        valueConverterRegistry.registerValueConverter(new DoubleValueConverter());
        valueConverterRegistry.registerValueConverter(new FloatValueConverter());
        valueConverterRegistry.registerValueConverter(new IntegerValueConverter());
        valueConverterRegistry.registerValueConverter(new IRIValueConverter());
        valueConverterRegistry.registerValueConverter(new LiteralValueConverter());
        valueConverterRegistry.registerValueConverter(new LongValueConverter());
        valueConverterRegistry.registerValueConverter(new ResourceValueConverter());
        valueConverterRegistry.registerValueConverter(new ShortValueConverter());
        valueConverterRegistry.registerValueConverter(new StringValueConverter());
        valueConverterRegistry.registerValueConverter(new ValueValueConverter());

        EXTRACTED_OBJECT_PROPERTY_FACTORY.setModelFactory(MF);
        EXTRACTED_OBJECT_PROPERTY_FACTORY.setValueConverterRegistry(valueConverterRegistry);
        EXTRACTED_OBJECT_PROPERTY_FACTORY.setValueFactory(VF);

        EXTRACTED_DATATYPE_PROPERTY_FACTORY.setModelFactory(MF);
        EXTRACTED_DATATYPE_PROPERTY_FACTORY.setValueConverterRegistry(valueConverterRegistry);
        EXTRACTED_DATATYPE_PROPERTY_FACTORY.setValueFactory(VF);

        EXTRACTED_ONTOLOGY_FACTORY.setModelFactory(MF);
        EXTRACTED_ONTOLOGY_FACTORY.setValueConverterRegistry(valueConverterRegistry);
        EXTRACTED_ONTOLOGY_FACTORY.setValueFactory(VF);

        EXTRACTED_CLASS_FACTORY.setModelFactory(MF);
        EXTRACTED_CLASS_FACTORY.setValueConverterRegistry(valueConverterRegistry);
        EXTRACTED_CLASS_FACTORY.setValueFactory(VF);

        TF.setModelFactory(MF);
        TF.setValueFactory(new ValueFactoryService());
        TF.setValueConverterRegistry(valueConverterRegistry);
        valueConverterRegistry.registerValueConverter(TF);
        valueConverterRegistry.registerValueConverter(EXTRACTED_OBJECT_PROPERTY_FACTORY);
        valueConverterRegistry.registerValueConverter(EXTRACTED_DATATYPE_PROPERTY_FACTORY);
        valueConverterRegistry.registerValueConverter(EXTRACTED_ONTOLOGY_FACTORY);
        valueConverterRegistry.registerValueConverter(EXTRACTED_CLASS_FACTORY);
    }

    @Test
    public void testClassIriExpression() throws Exception {
        DefaultIriExpressionProcessor processor = new DefaultIriExpressionProcessor();
        processor.setValueFactory(VF);
        ExtractedOntology ont = EXTRACTED_ONTOLOGY_FACTORY.createNew(VF.createIRI("urn://sample.ontology"));
        ClassIriExpressionContext context = new DefaultClassIriExpressionContext(ont, "test-ontology",
                "simple-test-ontology-for-iri-expressions");
        IRI result = processor.processExpression("getOntologyIri().concat('#').concat(getName()).concat('/').concat(getAddress())", context);
        Assert.assertEquals("urn://sample.ontology#test-ontology/simple-test-ontology-for-iri-expressions", result.stringValue());
    }

    @Test
    public void testPropertyIriExpression() throws Exception {
        DefaultIriExpressionProcessor processor = new DefaultIriExpressionProcessor();
        processor.setValueFactory(VF);
        ExtractedOntology ont = EXTRACTED_ONTOLOGY_FACTORY.createNew(VF.createIRI("urn://sample.ontology"));
        PropertyIriExpressionContext context = new DefaultPropertyIriExpressionContext(ont, "test-ontology",
                "simple-test-ontology-for-iri-expressions", VF.createIRI("urn://domain"), VF.createIRI("urn://range"));
        IRI result = processor.processExpression("getOntologyIri().concat('#').concat(getName()).concat('/').concat(getAddress())", context);
        Assert.assertEquals("urn://sample.ontology#test-ontology/simple-test-ontology-for-iri-expressions", result.stringValue());
        Assert.assertEquals("urn://domain", processor.processExpression("getDomain()", context).stringValue());
        Assert.assertEquals("urn://range", processor.processExpression("getRange()", context).stringValue());

        try {
            processor.processExpression("getNoSuchMethod()", context);
            Assert.fail("Exception should have been thrown when hitting a non-existent method");
        } catch (MeaningExtractionException e) {
            Assert.assertFalse(e.getMessage().isEmpty());
            Assert.assertNotNull(e.getCause());
        }
    }


}

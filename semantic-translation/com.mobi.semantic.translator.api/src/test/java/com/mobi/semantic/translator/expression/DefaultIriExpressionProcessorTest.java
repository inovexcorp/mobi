package com.mobi.semantic.translator.expression;

/*-
 * #%L
 * meaning.extraction.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import com.mobi.rdf.core.impl.sesame.ValueFactoryService;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.BigIntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.BooleanValueConverter;
import com.mobi.rdf.orm.conversion.impl.CalendarValueConverter;
import com.mobi.rdf.orm.conversion.impl.DateValueConverter;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.LongValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import com.mobi.rdf.orm.impl.ThingFactory;
import com.mobi.semantic.translator.SemanticTranslationException;
import com.mobi.semantic.translator.expression.context.ClassIriExpressionContext;
import com.mobi.semantic.translator.expression.context.PropertyIriExpressionContext;
import com.mobi.semantic.translator.expression.context.impl.DefaultClassIriExpressionContext;
import com.mobi.semantic.translator.expression.context.impl.DefaultPropertyIriExpressionContext;
import com.mobi.semantic.translator.ontology.ExtractedClassFactory;
import com.mobi.semantic.translator.ontology.ExtractedDatatypePropertyFactory;
import com.mobi.semantic.translator.ontology.ExtractedObjectPropertyFactory;
import com.mobi.semantic.translator.ontology.ExtractedOntology;
import com.mobi.semantic.translator.ontology.ExtractedOntologyFactory;
import org.junit.Assert;
import org.junit.Before;
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

    private DefaultIriExpressionProcessor processor;

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

    @Before
    public void initProcessor() {
        this.processor = new DefaultIriExpressionProcessor();
        this.processor.setValueFactory(VF);
    }

    @Test
    public void testClassIriExpression() throws Exception {
        ExtractedOntology ont = EXTRACTED_ONTOLOGY_FACTORY.createNew(VF.createIRI(ONT_URI));
        ClassIriExpressionContext context = new DefaultClassIriExpressionContext(ont, "test-ontology",
                "simple-test-ontology-for-iri-expressions");
        IRI result = processor.processExpression("getOntologyIri().concat('#').concat(getName()).concat('/').concat(getComment())", context);
        Assert.assertEquals(ONT_URI + "#test-ontology/simple-test-ontology-for-iri-expressions", result.stringValue());
    }

    @Test
    public void testPropertyIriExpression() throws Exception {
        ExtractedOntology ont = EXTRACTED_ONTOLOGY_FACTORY.createNew(VF.createIRI(ONT_URI));
        PropertyIriExpressionContext context = new DefaultPropertyIriExpressionContext(ont, "test-ontology",
                "simple-test-ontology-for-iri-expressions", VF.createIRI("urn://domain"), VF.createIRI("urn://range"));
        IRI result = processor.processExpression("getOntologyIri().concat('#').concat(getName()).concat('/').concat(getComment())", context);
        Assert.assertEquals(ONT_URI + "#test-ontology/simple-test-ontology-for-iri-expressions", result.stringValue());
        Assert.assertEquals("urn://domain", processor.processExpression("getDomain()", context).stringValue());
        Assert.assertEquals("urn://range", processor.processExpression("getRange()", context).stringValue());
    }

    @Test
    public void testBadExpression() throws Exception {
        ExtractedOntology ont = EXTRACTED_ONTOLOGY_FACTORY.createNew(VF.createIRI(ONT_URI));
        PropertyIriExpressionContext context = new DefaultPropertyIriExpressionContext(ont, "test-ontology",
                "simple-test-ontology-for-iri-expressions", VF.createIRI("urn://domain"), VF.createIRI("urn://range"));
        try {
            processor.processExpression("getNoSuchMethod()", context);
            Assert.fail("Exception should have been thrown when hitting a non-existent method");
        } catch (SemanticTranslationException e) {
            Assert.assertFalse(e.getMessage().isEmpty());
            Assert.assertNotNull(e.getCause());
        }
    }
}
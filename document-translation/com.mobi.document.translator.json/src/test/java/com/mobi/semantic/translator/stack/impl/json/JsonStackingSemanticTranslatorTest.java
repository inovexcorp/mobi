package com.mobi.semantic.translator.stack.impl.json;

        /*-
         * #%L
 * meaning.extraction.json
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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import com.mobi.rdf.core.impl.sesame.ValueFactoryService;
import com.mobi.rdf.orm.OrmFactory;
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
import com.mobi.rdf.orm.impl.OrmFactoryRegistryImpl;
import com.mobi.rdf.orm.impl.ThingFactory;
import com.mobi.semantic.translator.expression.DefaultIriExpressionProcessor;
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

import java.lang.reflect.Method;
import java.nio.file.Paths;

@RunWith(MockitoJUnitRunner.class)
public class JsonStackingSemanticTranslatorTest {

    private static final String ONT_URI = "urn://mobi.com/ontologies/testExtraction";

    private static final ThingFactory TF = new ThingFactory();

    private static final ModelFactory MF = new LinkedHashModelFactoryService();

    private static final ValueFactory VF = new ValueFactoryService();

    private static final OrmFactoryRegistryImpl OFR = new OrmFactoryRegistryImpl();

    private static final ExtractedOntologyFactory EXTRACTED_ONTOLOGY_FACTORY = new ExtractedOntologyFactory();
    private static final ExtractedClassFactory EXTRACTED_CLASS_FACTORY = new ExtractedClassFactory();
    private static final ExtractedDatatypePropertyFactory EXTRACTED_DATATYPE_PROPERTY_FACTORY =
            new ExtractedDatatypePropertyFactory();
    private static final ExtractedObjectPropertyFactory EXTRACTED_OBJECT_PROPERTY_FACTORY =
            new ExtractedObjectPropertyFactory();

    @BeforeClass
    public static void beforeClass() throws Exception {
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
        registerOrmFactory(EXTRACTED_CLASS_FACTORY);
        registerOrmFactory(EXTRACTED_ONTOLOGY_FACTORY);
        registerOrmFactory(EXTRACTED_DATATYPE_PROPERTY_FACTORY);
        registerOrmFactory(EXTRACTED_OBJECT_PROPERTY_FACTORY);

    }

    private JsonStackingSemanticTranslator extractor;

    private ExtractedOntology ontology;

    private static void registerOrmFactory(OrmFactory<?> factory) throws Exception {
        Method m = OFR.getClass().getDeclaredMethod("addFactory", OrmFactory.class);
        m.setAccessible(true);
        m.invoke(OFR, factory);
    }

    @Before
    public void initExtractor() {
        this.extractor = new JsonStackingSemanticTranslator();
        this.ontology = EXTRACTED_ONTOLOGY_FACTORY.createNew(VF.createIRI(ONT_URI));
        DefaultIriExpressionProcessor proc = new DefaultIriExpressionProcessor();
        proc.setValueFactory(VF);
        this.extractor.setExpressionProcessor(proc);
        this.extractor.setOrmFactoryRegistry(OFR);
        this.extractor.setValueFactory(VF);
        this.extractor.setModelFactory(MF);
    }

    @Test
    public void basicTest() throws Exception {
        final Model output = this.extractor.translate(Paths.get("src/test/resources/test.json"), this.ontology);
        //this.ontology.getModel().forEach(System.out::println);
        //System.out.println("\n\n\n");
        //output.forEach(System.out::println);
        Assert.assertNotNull(output);
        Assert.assertFalse(output.isEmpty());


        Assert.assertEquals(8,
                EXTRACTED_DATATYPE_PROPERTY_FACTORY.getAllExisting(ontology.getModel()).size());
        Assert.assertEquals(4,
                EXTRACTED_OBJECT_PROPERTY_FACTORY.getAllExisting(ontology.getModel()).size());
    }

    @Test
    public void twoDimensionalArraysTest() throws Exception {
        //TODO - Work with 2D Arrays...
        final Model output = this.extractor.translate(
                Paths.get("src/test/resources/test2dArrays.json"), this.ontology);
        //this.ontology.getModel().forEach(System.out::println);
        //System.out.println("\n\n\n");
        //output.forEach(System.out::println);
        Assert.assertNotNull(output);
        Assert.assertFalse(output.isEmpty());

    }
}
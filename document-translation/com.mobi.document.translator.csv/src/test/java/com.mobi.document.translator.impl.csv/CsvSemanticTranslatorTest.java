package com.mobi.document.translator.impl.csv;

/*-
 * #%L
 * com.mobi.document.translator.xml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;

import com.mobi.document.translator.expression.DefaultIriExpressionProcessor;
import com.mobi.document.translator.expression.IriExpressionProcessor;
import com.mobi.document.translator.ontology.ExtractedClass;
import com.mobi.document.translator.ontology.ExtractedDatatypeProperty;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Value;
import org.junit.Before;
import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Collection;

public class CsvSemanticTranslatorTest extends OrmEnabledTestCase {

    private static final String ONT_URI = "urn://test.ontology";

    private final File simpleTestFile = new File("src/test/resources/100_Sales_Records.csv");

    private CsvSemanticTranslator csvTranslator;


    @Before
    public void initTranslator() {
        csvTranslator = new CsvSemanticTranslator();
        injectOrmFactoryReferencesIntoService(csvTranslator);
        csvTranslator.setOrmFactoryRegistry(ORM_FACTORY_REGISTRY);
        IriExpressionProcessor processor = new DefaultIriExpressionProcessor();
        csvTranslator.setExpressionProcessor(processor);
    }

    @Test
    public void simpleTest() throws Exception {
        mockScanner("10");
        ExtractedOntology ont = getRequiredOrmFactory(ExtractedOntology.class)
                .createNew(VALUE_FACTORY.createIRI(ONT_URI));
        try {
            final Model results = csvTranslator.translate(Paths.get(simpleTestFile.toURI()), ont);

            validateSimpleExtractedOntology(ont);
            validateSimpleResults(results, ont);

        } catch (Exception e){
            System.out.println("Test failed due to" + e.getClass().getCanonicalName());
        }
    }

    private void validateSimpleResults(Model results, ExtractedOntology ont) {
        assertNotNull(results);
        assertFalse(results.isEmpty());
        Model comments = results.filter(null,
                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"), null);
        assertEquals(14, comments.size());
    }

    private void validateSimpleExtractedOntology(ExtractedOntology ont) throws Exception {
        assertFalse(ont.getModel().isEmpty());

        IRI classIRI = null;
        final OrmFactory<ExtractedClass> classOrmFactory = getRequiredOrmFactory(ExtractedClass.class);
        final OrmFactory<ExtractedDatatypeProperty> datatypePropertyOrmFactory = getRequiredOrmFactory(ExtractedDatatypeProperty.class);

        assertEquals(1, classOrmFactory.getAllExisting(ont.getModel()).size());
        assertEquals(15, datatypePropertyOrmFactory.getAllExisting(ont.getModel()).size());

        Collection<ExtractedClass> classes = classOrmFactory.getAllExisting(ont.getModel());
        for (ExtractedClass topClass: classes) {
            classIRI = VALUE_FACTORY.createIRI("urn://test.ontology#100_Sales_Records");
        }

        Collection<ExtractedDatatypeProperty> properties = datatypePropertyOrmFactory.getAllExisting(ont.getModel());
        for (ExtractedDatatypeProperty property: properties) {
            assertEquals(true, hasDomain(property, classIRI));
            assertEquals(true, hasRange(property));
        }
    }

    private boolean hasDomain(ExtractedDatatypeProperty prop, IRI targetClass) {
        return prop.getProperty(VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#domain"))
                .orElseThrow(() -> new RuntimeException("Required domain property not found"))
                .equals(targetClass);
    }

    private boolean hasRange(ExtractedDatatypeProperty prop) {
         Value value = prop.getProperty(VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#range"))
                .orElseThrow(() -> new RuntimeException("Required range property not found"));

         if (value != null) {
             return true;
         } else { return false; }
    }

    private void mockScanner(String integer) {
        String number = integer;
        InputStream in =  new ByteArrayInputStream(number.getBytes());
        System.setIn(in);
    }
}

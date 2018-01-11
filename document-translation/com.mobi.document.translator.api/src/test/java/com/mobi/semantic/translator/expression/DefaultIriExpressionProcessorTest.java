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
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.semantic.translator.SemanticTranslationException;
import com.mobi.semantic.translator.expression.context.ClassIriExpressionContext;
import com.mobi.semantic.translator.expression.context.PropertyIriExpressionContext;
import com.mobi.semantic.translator.expression.context.impl.DefaultClassIriExpressionContext;
import com.mobi.semantic.translator.expression.context.impl.DefaultPropertyIriExpressionContext;
import com.mobi.semantic.translator.ontology.ExtractedOntology;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

@RunWith(MockitoJUnitRunner.class)
public class DefaultIriExpressionProcessorTest extends OrmEnabledTestCase {

    private static final String ONT_URI = "urn://mobi.com/ontologies/testExtraction";

    private DefaultIriExpressionProcessor processor;

    @Before
    public void initProcessor() {
        this.processor = new DefaultIriExpressionProcessor();
        this.processor.setValueFactory(VALUE_FACTORY);
    }

    @Test
    public void testClassIriExpression() throws Exception {
        ExtractedOntology ont = getRequiredOrmFactory(ExtractedOntology.class).createNew(VALUE_FACTORY.createIRI(ONT_URI));
        ClassIriExpressionContext context = new DefaultClassIriExpressionContext(ont, "test-ontology",
                "simple-test-ontology-for-iri-expressions");
        String expression = "getOntologyIri().concat('#').concat(getName()).concat('/').concat(getComment())";
        IRI result = processor.processExpression(expression, context);
        Assert.assertEquals(ONT_URI + "#test-ontology/simple-test-ontology-for-iri-expressions",
                result.stringValue());
    }

    @Test
    public void testPropertyIriExpression() throws Exception {
        ExtractedOntology ont = getRequiredOrmFactory(ExtractedOntology.class).createNew(VALUE_FACTORY.createIRI(ONT_URI));
        PropertyIriExpressionContext context =
                new DefaultPropertyIriExpressionContext(ont, "test-ontology",
                        "simple-test-ontology-for-iri-expressions", VALUE_FACTORY.createIRI("urn://domain"),
                        VALUE_FACTORY.createIRI("urn://range"));
        String expression = "getOntologyIri().concat('#').concat(getName()).concat('/').concat(getComment())";
        IRI result = processor.processExpression(expression, context);
        Assert.assertEquals(ONT_URI + "#test-ontology/simple-test-ontology-for-iri-expressions",
                result.stringValue());
        Assert.assertEquals("urn://domain", processor.processExpression("getDomain()",
                context).stringValue());
        Assert.assertEquals("urn://range", processor.processExpression("getRange()",
                context).stringValue());
    }

    @Test
    public void testBadExpression() throws Exception {
        ExtractedOntology ont = getRequiredOrmFactory(ExtractedOntology.class).createNew(VALUE_FACTORY.createIRI(ONT_URI));
        PropertyIriExpressionContext context = new DefaultPropertyIriExpressionContext(ont, "test-ontology",
                "simple-test-ontology-for-iri-expressions", VALUE_FACTORY.createIRI("urn://domain"),
                VALUE_FACTORY.createIRI("urn://range"));
        try {
            processor.processExpression("getNoSuchMethod()", context);
            Assert.fail("Exception should have been thrown when hitting a non-existent method");
        } catch (SemanticTranslationException e) {
            Assert.assertFalse(e.getMessage().isEmpty());
            Assert.assertNotNull(e.getCause());
        }
    }
}
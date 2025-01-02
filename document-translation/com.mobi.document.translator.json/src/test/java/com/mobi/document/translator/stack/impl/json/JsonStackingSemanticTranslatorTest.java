package com.mobi.document.translator.stack.impl.json;

/*-
 * #%L
 * meaning.extraction.json
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.document.translator.expression.DefaultIriExpressionProcessor;
import com.mobi.document.translator.ontology.ExtractedDatatypeProperty;
import com.mobi.document.translator.ontology.ExtractedObjectProperty;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.eclipse.rdf4j.model.Model;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.nio.file.Paths;

public class JsonStackingSemanticTranslatorTest extends OrmEnabledTestCase {

    private static final String ONT_URI = "urn://mobi.com/ontologies/testExtraction";

    private JsonStackingSemanticTranslator extractor;

    private ExtractedOntology ontology;

    @Before
    public void initExtractor() {
        this.extractor = new JsonStackingSemanticTranslator();
        injectOrmFactoryReferencesIntoService(this.extractor);
        DefaultIriExpressionProcessor proc = new DefaultIriExpressionProcessor();
        this.extractor.setExpressionProcessor(proc);
        this.extractor.setOrmFactoryRegistry(ORM_FACTORY_REGISTRY);
    }

    @Before
    public void initOnt() {
        this.ontology = getRequiredOrmFactory(ExtractedOntology.class).createNew(VALUE_FACTORY.createIRI(ONT_URI));
    }

    @Test
    public void basicTest() throws Exception {
        final Model output = this.extractor.translate(Paths.get("src/test/resources/test.json"), this.ontology);
        this.ontology.getModel().forEach(System.out::println);
        System.out.println("\n\n\n");
        output.forEach(System.out::println);
        Assert.assertNotNull(output);
        Assert.assertFalse(output.isEmpty());
        Assert.assertEquals(8,
                getRequiredOrmFactory(ExtractedDatatypeProperty.class).getAllExisting(ontology.getModel()).size());
        Assert.assertEquals(4,
                getRequiredOrmFactory(ExtractedObjectProperty.class).getAllExisting(ontology.getModel()).size());
    }

    @Test
    public void twoDimensionalArraysTest() throws Exception {
        //TODO - Work with 2D Arrays... Ensure changes behave consistently.
        final Model output = this.extractor.translate(
                Paths.get("src/test/resources/test2dArrays.json"), this.ontology);
        Assert.assertNotNull(output);
        Assert.assertFalse(output.isEmpty());

    }
}

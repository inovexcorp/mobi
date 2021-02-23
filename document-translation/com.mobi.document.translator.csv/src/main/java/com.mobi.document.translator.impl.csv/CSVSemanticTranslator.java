package com.mobi.document.translator.impl.csv;

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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.document.translator.AbstractSemanticTranslator;
import com.mobi.document.translator.expression.context.impl.DefaultClassIriExpressionContext;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.expression.IriExpressionProcessor;
import com.mobi.document.translator.ontology.ExtractedClass;
import com.mobi.document.translator.ontology.ExtractedDatatypeProperty;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStreamReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import org.apache.commons.io.FilenameUtils;
import java.util.Map;
import java.util.Optional;

@Component(immediate = true, provide = {SemanticTranslator.class})
public class CSVSemanticTranslator extends AbstractSemanticTranslator {

    private static final Logger LOG = LoggerFactory.getLogger(CSVSemanticTranslator.class);
    private FilenameUtils Util =  new FilenameUtils();

    private static final String DEFAULT_CLASS_IRI_EXPRESSION = "getOntologyIri().concat('#').concat(getName())";
    private static final String DEFAULT_PROPERTY_IRI_EXPRESSION = "getOntologyIri().concat('#_').concat(getName())";



    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        super.modelFactory = modelFactory;
    }

    public CSVSemanticTranslator() { super("csv", ".csv"); }

    @Override
    public Model translate(Path rawFile, ExtractedOntology managedOntology) throws SemanticTranslationException {
        final Model result = modelFactory.createModel();

        try (final InputStream is = new FileInputStream(rawFile.toFile())) {
            String className = Util.removeExtension(rawFile.getFileName().toString());
            final IRI ClassIRI = generateClassIri(managedOntology, className, className);
            result.add(ClassIRI, getRdfType(), ClassIRI.get);

            return translate(is, rawFile.toAbsolutePath().toString(), managedOntology);
        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading specified file to extract meaning", e);
        }
    }

    @Override
    public Model translate(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology) throws SemanticTranslationException {


        try {
            String[] values;
            CSVReader reader = new CSVReaderBuilder(new InputStreamReader(dataStream)).withMultilineLimit(1).build();

            String[] headers = reader.readNext();

            for (String header: headers){


            }

        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading incoming stream to extract meaning from "
                    + entityIdentifier, e);
        }
        return result;
    }

    protected IRI generateClassIri(final ExtractedOntology managedOntology, final String name, final String address)
            throws SemanticTranslationException {
        final String expression = managedOntology.getSpelClassUri().orElse(DEFAULT_CLASS_IRI_EXPRESSION);
        return this.expressionProcessor.processExpression(expression,
                new DefaultClassIriExpressionContext(managedOntology, name, address));
    }

}

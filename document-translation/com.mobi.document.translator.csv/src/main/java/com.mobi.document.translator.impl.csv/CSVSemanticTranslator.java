package com.mobi.document.translator.impl.csv;

/*-
 * #%L
 * meaning.extraction.csv
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
import com.mobi.document.translator.expression.context.impl.DefaultPropertyIriExpressionContext;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.ontology.ExtractedClass;
import com.mobi.document.translator.ontology.ExtractedDatatypeProperty;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.rdf.orm.Thing;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStreamReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import org.apache.commons.io.FilenameUtils;


@Component(immediate = true, provide = {SemanticTranslator.class, DefaultClassIriExpressionContext.class, DefaultPropertyIriExpressionContext.class})
public class CSVSemanticTranslator extends AbstractSemanticTranslator {

    private static final Logger LOG = LoggerFactory.getLogger(CSVSemanticTranslator.class);
    private FilenameUtils Util = new FilenameUtils();

    private static final String DEFAULT_CLASS_IRI_EXPRESSION = "getOntologyIri().concat('#').concat(getName())";
    private static final String DEFAULT_PROPERTY_IRI_EXPRESSION = "getOntologyIri().concat('#_').concat(getName())";

    final Model result = modelFactory.createModel();
    private IRI classIRI;


    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        super.modelFactory = modelFactory;
    }

    @Reference
    public void setOrmFactoryRegistry(OrmFactoryRegistry ormFactoryRegistry) {
        super.ormFactoryRegistry = ormFactoryRegistry;
    }

    private <X extends Thing> OrmFactory<X> factory(Class<X> clazz) throws SemanticTranslationException {
        return ormFactoryRegistry.getFactoryOfType(clazz)
                .orElseThrow(() -> new SemanticTranslationException("ORM services not initialized correctly!"));
    }

    public CSVSemanticTranslator() {
        super("csv", ".csv");
    }

    @Override
    public Model translate(Path rawFile, ExtractedOntology managedOntology) throws SemanticTranslationException {

        try (final InputStream is = new FileInputStream(rawFile.toFile())) {

            String className = Util.removeExtension(rawFile.getFileName().toString());
//            classIRI = generateClassIri(managedOntology, className);
//            final ExtractedClass classInstance = getOrCreateClass(managedOntology, classIRI, className);
//
//            result.add(classIRI, getRdfType(), classInstance.getResource());

            return translate(is, rawFile.toAbsolutePath().toString(), managedOntology);
        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading specified file to extract meaning", e);
        }
    }

    @Override
    public Model translate(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology) throws SemanticTranslationException {
        try {

            CSVReader reader = new CSVReaderBuilder(new InputStreamReader(dataStream)).withMultilineLimit(1).build();
            String[] headers = reader.readNext();

            for (String header : headers) {
//                addDatatypeProperty(managedOntology, header, valueFactory.createLiteral(header));
            }

        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading incoming stream to extract meaning from "
                    + entityIdentifier, e);
        }

        return result;
    }

//    protected IRI generateClassIri(final ExtractedOntology managedOntology, final String name)
//            throws SemanticTranslationException {
//        final String expression = managedOntology.getSpelClassUri().orElse(DEFAULT_CLASS_IRI_EXPRESSION);
//        return this.expressionProcessor.processExpression(expression,
//                new DefaultClassIriExpressionContext(managedOntology, name, name + "instance."));
//    }

    protected ExtractedClass getOrCreateClass(ExtractedOntology managedOntology, IRI classIri, String name)
            throws SemanticTranslationException {
        OrmFactory<ExtractedClass> factory = factory(ExtractedClass.class);
        ExtractedClass extractedClass = factory.getExisting(classIri, managedOntology.getModel())
                .orElseGet(() -> {
                    LOG.debug("Creating new class {}", classIri);
                    ExtractedClass clazz = factory.createNew(classIri, managedOntology.getModel());
                    clazz.addProperty(valueFactory.createLiteral(name), getLabelIri());
                    return clazz;
                });
        return extractedClass;
    }
}

//    private void addDatatypeProperty(final ExtractedOntology managedOntology, final String propertyName, final Value value)
//            throws SemanticTranslationException {
//
//        getOrCreateDatatypeProperty(managedOntology, classIRI, getDatatypeRange(), propertyName);
////        item.getProperties().add((IRI) datatypeProperty.getResource(), value);
//    }
//
//    private void getOrCreateDatatypeProperty(ExtractedOntology managedOntology, IRI domain, IRI range, String name)
//            throws SemanticTranslationException {
//        getOrCreateProperty(managedOntology, domain, range, name);
//    }
//
//    private void getOrCreateProperty(ExtractedOntology managedOntology, IRI domain, IRI range, String name) throws SemanticTranslationException {
//        final OrmFactory<ExtractedDatatypeProperty> factory = factory(ExtractedDatatypeProperty.class);
//        final String expression = managedOntology.getSpelPropertyUri().orElse(DEFAULT_PROPERTY_IRI_EXPRESSION);
//        final IRI iri = this.expressionProcessor.processExpression(expression,
//                new DefaultPropertyIriExpressionContext(managedOntology, name, name + " instance", domain, range));
//
//        final ExtractedDatatypeProperty prop = factory.getExisting(iri, managedOntology.getModel())
//                .orElseGet(() -> {
//                    LOG.debug("Creating new property {}", iri);
//                    ExtractedDatatypeProperty val = factory.createNew(iri, managedOntology.getModel());
//                    val.addProperty(valueFactory.createLiteral(name), getLabelIri());
//                    return val;
//                });
//        // Add domain/range/comment.
//        prop.addProperty(domain, getDomainIri());
//        prop.addProperty(range, getRangeIri());
//        prop.addProperty(valueFactory.createLiteral(name + " instance"), getCommentIri());
//
//        result.add(iri, getRdfType(), prop.getResource());
//    }
//
//    private IRI getDatatypeRange() throws SemanticTranslationException {
//        return xsdString();
//    }
//}

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
import com.mobi.document.translator.expression.IriExpressionProcessor;
import com.mobi.document.translator.expression.context.impl.DefaultClassIriExpressionContext;
import com.mobi.document.translator.expression.context.impl.DefaultInstanceIriExpressionContext;
import com.mobi.document.translator.expression.context.impl.DefaultPropertyIriExpressionContext;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.ontology.ExtractedClass;
import com.mobi.document.translator.ontology.ExtractedDatatypeProperty;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.commons.io.FilenameUtils;

import java.io.*;
import java.net.URLEncoder;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;


@Component(immediate = true, provide = {SemanticTranslator.class})
public class CsvSemanticTranslator extends AbstractSemanticTranslator {

    private static final Logger LOG = LoggerFactory.getLogger(CsvSemanticTranslator.class);
    private FilenameUtils util = new FilenameUtils();

    private static final String ONTOLOGY_IRI = "getOntologyIri()";
    private static final String DEFAULT_ONTOLOGY_TITLE = "CSV Extracted Ontology";
    private static final String DEFAULT_CLASS_IRI_EXPRESSION = "getOntologyIri().concat('#').concat(getName())";
    private static final String DEFAULT_PROPERTY_IRI_EXPRESSION = "getOntologyIri().concat('#_').concat(getName())";
    private static final String DEFAULT_INSTANCE_IRI_EXPRESSION = "classIri().replace('#','/').concat('/').concat(uuid())";

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        super.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        super.modelFactory = modelFactory;
    }

    @Reference
    public void setOrmFactoryRegistry(OrmFactoryRegistry ormFactoryRegistry) {
        super.ormFactoryRegistry = ormFactoryRegistry;
    }

    @Reference
    public void setExpressionProcessor(IriExpressionProcessor expressionProcessor) {
        super.expressionProcessor = expressionProcessor;
    }

    private <X extends Thing> OrmFactory<X> factory(Class<X> clazz) throws SemanticTranslationException {
        return ormFactoryRegistry.getFactoryOfType(clazz)
                .orElseThrow(() -> new SemanticTranslationException("ORM services not initialized correctly!"));
    }

    private IRI classIRI;
    private Model result;
    private int desiredRows = 10;
    private ExtractedClass classInstance;
    private ArrayList<IRI> propertyIRIs;

    public CsvSemanticTranslator() {
        super("csv", ".csv");
        LOG.debug("The number of rows parsed to determine range datatype has been set to the default of 10.");
    }

    @Override
    public Model translate(Path rawFile, ExtractedOntology managedOntology) throws SemanticTranslationException {
        final Model result = modelFactory.createModel();
        this.propertyIRIs = new ArrayList<>();
        this.result = result;
        int size = (int)rawFile.toFile().length();

        try (final BufferedInputStream is = new BufferedInputStream(new FileInputStream(rawFile.toFile()))) {
            is.mark(size + 1);
            generateOntologyTitle(managedOntology);
            String className = util.removeExtension(rawFile.getFileName().toString());
            classIRI = generateClassIri(managedOntology, className);
            classInstance = getOrCreateClass(managedOntology, classIRI, className);

            result.add(classIRI, getRdfType(), classInstance.getResource());

            return translate(is, rawFile.toAbsolutePath().toString(), managedOntology);
        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading specified file to extract meaning", e);
        }
    }

    @Override
    public Model translate(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology)
            throws SemanticTranslationException {

        try (CSVReader reader = new CSVReader(new InputStreamReader(dataStream));) {
            String[] headers = reader.readNext();
            Map<String, CsvRangeItem> properties = new LinkedHashMap<>();

            for (String header : headers) {
                properties.put(header, new CsvRangeItem());
            }

            setPropertyRanges(reader, properties);

            for (Map.Entry<String, CsvRangeItem> property : properties.entrySet()) {
                IRI range = getPropertyRange(property.getValue());
                addDatatypeProperty(managedOntology, property.getKey(), range);
            }

            dataStream.reset();
            generateClassInstances(dataStream, managedOntology);

        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading incoming stream to extract meaning from "
                    + entityIdentifier, e);
        }

        return result;
    }

    protected IRI generateClassIri(final ExtractedOntology managedOntology, final String name)
            throws SemanticTranslationException {
        final String expression = managedOntology.getSpelClassUri().orElse(DEFAULT_CLASS_IRI_EXPRESSION);
        return this.expressionProcessor.processExpression(expression,
                new DefaultClassIriExpressionContext(managedOntology, name, name + " class"));
    }

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

    private void generateOntologyTitle(ExtractedOntology ontology) throws SemanticTranslationException {
        final OrmFactory<ExtractedOntology> factory = factory(ExtractedOntology.class);
        IRI ontIRI = this.expressionProcessor.processExpression(ONTOLOGY_IRI,
                new DefaultClassIriExpressionContext(ontology, DEFAULT_ONTOLOGY_TITLE, DEFAULT_ONTOLOGY_TITLE + " ontology"));

        ExtractedOntology holisticOntology = factory.getExisting(ontIRI, ontology.getModel())
                .orElseGet(() -> {
                    return null;
                });
        holisticOntology.addProperty(valueFactory.createLiteral(DEFAULT_ONTOLOGY_TITLE), getLabelIri());
    }

    private void addDatatypeProperty(final ExtractedOntology managedOntology, final String propertyName, final IRI range)
            throws SemanticTranslationException {
        getOrCreateDatatypeProperty(managedOntology, classIRI, range, propertyName);
    }

    private void getOrCreateDatatypeProperty(ExtractedOntology managedOntology, IRI domain, IRI range, String name)
            throws SemanticTranslationException {
        try {
            getOrCreateProperty(managedOntology, domain, range, name);
        } catch (UnsupportedEncodingException e) {
            LOG.error("Error encoding property name");
        }
    }

    private void getOrCreateProperty(ExtractedOntology managedOntology, IRI domain, IRI range, String name)
            throws SemanticTranslationException, UnsupportedEncodingException {
        final OrmFactory<ExtractedDatatypeProperty> factory = factory(ExtractedDatatypeProperty.class);
        final String expression = managedOntology.getSpelPropertyUri().orElse(DEFAULT_PROPERTY_IRI_EXPRESSION);

        final IRI iri = this.expressionProcessor.processExpression(expression,
                new DefaultPropertyIriExpressionContext(managedOntology, URLEncoder.encode(name, "utf-8"),
                        name + " property", domain, range));

        final ExtractedDatatypeProperty prop = factory.getExisting(iri, managedOntology.getModel())
                .orElseGet(() -> {
                    LOG.debug("Creating new property {}", iri);
                    ExtractedDatatypeProperty val = factory.createNew(iri, managedOntology.getModel());
                    val.addProperty(valueFactory.createLiteral(name), getLabelIri());
                    return val;
                });
        // Add property iri to arraylist for later use
        propertyIRIs.add(iri);
        // Add domain/range/comment.
        prop.addProperty(domain, getDomainIri());
        prop.addProperty(range, getRangeIri());
        prop.addProperty(valueFactory.createLiteral(name + " property"), getCommentIri());

        result.add(iri, getRdfType(), prop.getResource());
    }

    private void setPropertyRanges(CSVReader reader, Map<String, CsvRangeItem> properties)
            throws SemanticTranslationException {
        try {
            for (int count = 0; count < desiredRows; count++) {
                int index = 0;
                String[] row = reader.readNext();
                for (Map.Entry<String, CsvRangeItem> property : properties.entrySet()) {
                    property.getValue().checkTokenType(row[index]);
                    index++;
                }
            }
        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading type of datatype property");
        } catch (NullPointerException n) {
            throw new SemanticTranslationException("Cannot parse more rows than in file");
        }
    }

    private IRI getPropertyRange(CsvRangeItem property) {
        String mostCommon = "";
        IRI datatype;

        mostCommon = property.getRangeType();

        switch (mostCommon) {
            case "integer":
                datatype = xsdInt();
                break;
            case "boolean":
                datatype = xsdBoolean();
                break;
            case "double":
                datatype = xsdFloat();
                break;
            default:
                datatype = xsdString();
                break;
        }
        return datatype;
    }

    private void generateClassInstances(InputStream stream, ExtractedOntology managedOntology)
            throws SemanticTranslationException {
        CSVReader instances = new CSVReaderBuilder(new InputStreamReader(stream)).withSkipLines(1).build();

        try {
            String[] nextLine;
            while ((nextLine = instances.readNext()) != null) {
                int index = 0;
                final IRI instance = generateInstanceIri(classInstance, managedOntology);
                // Create instance.
                result.add(instance, getRdfType(), classInstance.getResource());
                result.add(instance, getCommentIri() ,valueFactory.createLiteral("Class Instance"));
                // Add properties.
                for (IRI property: propertyIRIs) {
                    result.add(instance, property, valueFactory.createLiteral(nextLine[index]));
                    index++;
                }
            }
        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading type of datatype property");
        }

    }

    private IRI generateInstanceIri(ExtractedClass instanceClass, ExtractedOntology managedOntology)
            throws SemanticTranslationException {
        final String expression = instanceClass.getSpelInstanceUri().orElse(DEFAULT_INSTANCE_IRI_EXPRESSION);
        return this.expressionProcessor.processExpression(expression,
                new DefaultInstanceIriExpressionContext(managedOntology, classInstance,null, this.valueFactory));
    }

    public void setDesiredRows(int desiredRows) {
        LOG.debug("The number of rows parsed to determine range datatype has been set to the default of {}", desiredRows);
        this.desiredRows = desiredRows;
    }
}

package com.mobi.meaning.extraction.json;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.expression.DefaultIriExpressionProcessor;
import com.mobi.meaning.extraction.ontology.ExtractedClass;
import com.mobi.meaning.extraction.ontology.ExtractedDatatypeProperty;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.meaning.extraction.stack.AbstractStackingMeaningExtractor;
import com.mobi.meaning.extraction.stack.StackingMeaningExtractor;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;

@Component
public class JsonStackingMeaningExtractor extends AbstractStackingMeaningExtractor<JsonStackItem> implements StackingMeaningExtractor<JsonStackItem> {

    private static final Logger LOG = LoggerFactory.getLogger(JsonStackingMeaningExtractor.class);

    private static final JsonFactory JSON_FACTORY = new JsonFactory();

    @Override
    public Model extractMeaning(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology) throws MeaningExtractionException {
        final Model result = modelFactory.createModel();
        try (final JsonParser jsonParser = JSON_FACTORY.createParser(dataStream)) {
            JsonToken token = null;
            while ((token = jsonParser.nextToken()) != null) {
                parseToken(result, managedOntology, token, jsonParser);
            }
        } catch (JsonParseException e) {
            throw new MeaningExtractionException("Issue parsing JSON from incoming data, on entity: "
                    + entityIdentifier, e);
        } catch (IOException e) {
            throw new MeaningExtractionException("Issue reading incoming stream to extract meaning from "
                    + entityIdentifier, e);
        }
        return result;
    }

    public void parseToken(Model result, ExtractedOntology managedOntology, JsonToken token, JsonParser jsonParser) throws IOException, MeaningExtractionException {
        final String currentName = jsonParser.getCurrentName();
        final String address = getCurrentLocation();
        final JsonStackItem top = peekStack().orElse(null);
        switch (token) {
            case END_OBJECT:
                final JsonStackItem endItem = popStack().orElseThrow(() -> new MeaningExtractionException("Got a null object from the stack on an object end!"));
                final ExtractedClass extractedClass = getOrCreateClass(managedOntology, endItem.getClassIri(), endItem.getIdentifier(), address);
                //TODO - create instance!
                createInstance(result, managedOntology, endItem, extractedClass);
                break;
            case START_ARRAY:
                //TODO
                break;
            case END_ARRAY:
                //TODO
                break;
            case START_OBJECT:
                JsonStackItem item = pushStack(new JsonStackItem(jsonParser.getCurrentName() != null ? jsonParser.getCurrentName() : "root", top == null));
                item.setClassIri(generateClassIri(managedOntology, item.getIdentifier(), getCurrentLocation()));
                break;
            // Property identified
            case VALUE_TRUE:
                break;
            case VALUE_FALSE:
                break;
            case VALUE_NUMBER_FLOAT:
                if (top == null) {
                    //TODO
                } else {
                    ExtractedDatatypeProperty datatypeProperty = getOrCreateDatatypeProperty(managedOntology, top.getClassIri(), xsdFloat(), top.getIdentifier(), getCurrentLocation());
                    top.getProperties().add((IRI) datatypeProperty.getResource(), valueFactory.createLiteral(jsonParser.getValueAsDouble()));
                }
                break;
            case VALUE_NUMBER_INT:
                if (top == null) {
                    //TODO
                } else {
                    ExtractedDatatypeProperty datatypeProperty = getOrCreateDatatypeProperty(managedOntology, top.getClassIri(), xsdInt(), top.getIdentifier(), getCurrentLocation());
                    top.getProperties().add((IRI) datatypeProperty.getResource(), valueFactory.createLiteral(jsonParser.getValueAsInt()));
                }
                break;
            case VALUE_STRING:
                if (top == null) {
                    //TODO
                } else {
                    ExtractedDatatypeProperty datatypeProperty = getOrCreateDatatypeProperty(managedOntology, top.getClassIri(), xsdString(), top.getIdentifier(), getCurrentLocation());
                    top.getProperties().add((IRI) datatypeProperty.getResource(), valueFactory.createLiteral(jsonParser.getValueAsString()));
                }
                break;
            case VALUE_NULL:
                //TODO
                break;
            case VALUE_EMBEDDED_OBJECT:
                //TODO
                break;
            case NOT_AVAILABLE:
            default:
        }
    }

    private IRI xsdString = null;

    private IRI xsdString() {
        if (xsdString == null) {
            xsdString = valueFactory.createIRI("http://www.w3.org/2001/XMLSchema#", "string");
        }
        return xsdString;
    }

    private IRI xsdInt = null;

    private IRI xsdInt() {
        if (xsdInt == null) {
            xsdInt = valueFactory.createIRI("http://www.w3.org/2001/XMLSchema#", "int");
        }
        return xsdInt;
    }

    private IRI xsdFloat = null;

    private IRI xsdFloat() {
        if (xsdFloat == null) {
            xsdFloat = valueFactory.createIRI("http://www.w3.org/2001/XMLSchema#", "float");
        }
        return xsdFloat;
    }

    @Reference
    @Override
    public void setValueFactory(ValueFactory valueFactory) {
        super.setValueFactory(valueFactory);
    }

    @Reference
    @Override
    public void setModelFactory(ModelFactory modelFactory) {
        super.setModelFactory(modelFactory);
    }
}

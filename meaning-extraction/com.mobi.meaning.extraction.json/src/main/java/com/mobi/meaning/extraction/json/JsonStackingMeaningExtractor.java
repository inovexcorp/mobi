package com.mobi.meaning.extraction.json;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.ontology.ExtractedClass;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.meaning.extraction.stack.AbstractStackingMeaningExtractor;
import com.mobi.meaning.extraction.stack.StackingMeaningExtractor;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;

import java.io.IOException;
import java.io.InputStream;

@Component
public class JsonStackingMeaningExtractor extends AbstractStackingMeaningExtractor<JsonStackItem> implements StackingMeaningExtractor<JsonStackItem> {

    private static final JsonFactory JSON_FACTORY = new JsonFactory();

    @Override
    public Model extractMeaning(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology) throws MeaningExtractionException {
        try (final JsonParser jsonParser = JSON_FACTORY.createParser(dataStream)) {
            JsonToken token = null;
            while ((token = jsonParser.nextToken()) != null) {
                parseToken(managedOntology, token, jsonParser);
            }
        } catch (JsonParseException e) {
            throw new MeaningExtractionException("Issue parsing JSON from incoming data, on entity: "
                    + entityIdentifier, e);
        } catch (IOException e) {
            throw new MeaningExtractionException("Issue reading incoming stream to extract meaning from "
                    + entityIdentifier, e);
        }
        return null;
    }

    public void parseToken(ExtractedOntology managedOntology, JsonToken token, JsonParser jsonParser) throws IOException, MeaningExtractionException {
        final String currentName = jsonParser.getCurrentName();
        final String address = getCurrentLocation();
        final JsonStackItem top = peekStack().orElse(null);
        switch (token) {
            case END_OBJECT:
                final JsonStackItem endItem = popStack().orElseThrow(() -> new MeaningExtractionException("Got a null object from the stack on an object end!"));
                final ExtractedClass extractedClass = getOrCreateClass(managedOntology, endItem.getClassIri(), endItem.getIdentifier(), address);
                //TODO - create instance!
                break;
            case START_ARRAY:
                //TODO
                break;
            case END_ARRAY:
                //TODO
                break;
            case START_OBJECT:
                JsonStackItem item = pushStack(new JsonStackItem(jsonParser.getCurrentName() != null ? jsonParser.getCurrentName() : "root", top == null));
                String currentLoc = getCurrentLocation();
                item.setClassIri(generateClassIri(managedOntology, item.getIdentifier(), getCurrentLocation()));
                break;
            // Property identified
            case VALUE_TRUE:
                break;
            case VALUE_FALSE:
                break;
            case VALUE_NUMBER_FLOAT:
                break;
            case VALUE_NUMBER_INT:
                break;
            case VALUE_STRING:

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

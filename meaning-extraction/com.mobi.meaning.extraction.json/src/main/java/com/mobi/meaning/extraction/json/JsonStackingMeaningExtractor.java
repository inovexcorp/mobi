package com.mobi.meaning.extraction.json;

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
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.expression.IriExpressionProcessor;
import com.mobi.meaning.extraction.ontology.ExtractedClass;
import com.mobi.meaning.extraction.ontology.ExtractedDatatypeProperty;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.meaning.extraction.stack.AbstractStackingMeaningExtractor;
import com.mobi.meaning.extraction.stack.StackingMeaningExtractor;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

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
        final String address = getCurrentLocation();
        final Optional<JsonStackItem> top = peekStack();
        final String jsonCurrentName = jsonParser.getCurrentName();
        switch (token) {
            case END_OBJECT:
                LOG.debug("Ending {}", getCurrentLocation());
                final JsonStackItem endItem = popStack().orElseThrow(() -> new MeaningExtractionException("Got a null object from the stack on an object end!"));
                final ExtractedClass extractedClass = getOrCreateClass(managedOntology, endItem.getClassIri(), endItem.getIdentifier(), address);
                createInstance(result, managedOntology, endItem, extractedClass, peekStack());
                break;
            case START_ARRAY:
//                JsonStackItem startArr = pushStack(new JsonStackItem(jsonCurrentName != null ? jsonCurrentName : "rootArray", top.isPresent()));
//                startArr.setArray(true);
//                if(top.isPresent()){
//                    startArr.setClassIri(top.get().getClassIri());
//                }else{
//                    //TODO
//                }
                break;
            case END_ARRAY:
//                final JsonStackItem endArr = popStack().orElseThrow(() -> new MeaningExtractionException("Got a null object from the stack on an array end!"));
//                if (!endArr.isArray()) {
//                    throw new MeaningExtractionException("Mismatch on start/end array!");
//                }
                break;
            case START_OBJECT:
                JsonStackItem item = pushStack(new JsonStackItem(
                        jsonParser.getCurrentName() != null ? jsonParser.getCurrentName() : top.isPresent() ? "unknown" : "root",
                        !top.isPresent()));
                item.setClassIri(generateClassIri(managedOntology, item.getIdentifier(), getCurrentLocation()));
                LOG.debug("Starting object {}", getCurrentLocation());
                break;
            // Property identified
            case VALUE_TRUE:
            case VALUE_FALSE:
                if (top.isPresent()) {
                    addDatatypeProperty(managedOntology, top.get(), valueFactory.createLiteral(jsonParser.getValueAsBoolean()), xsdBoolean());
                }
                break;
            case VALUE_NUMBER_FLOAT:
                if (top.isPresent()) {
                    addDatatypeProperty(managedOntology, top.get(), valueFactory.createLiteral(jsonParser.getValueAsDouble()), xsdFloat());
                }
                break;
            case VALUE_NUMBER_INT:
                if (top.isPresent()) {
                    addDatatypeProperty(managedOntology, top.get(), valueFactory.createLiteral(jsonParser.getValueAsInt()), xsdInt());
                }
                break;
            case VALUE_STRING:
                if (top.isPresent()) {
                    addDatatypeProperty(managedOntology, top.get(), valueFactory.createLiteral(jsonParser.getValueAsString()), xsdString());
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
                break;
        }
    }

    private void addDatatypeProperty(ExtractedOntology managedOntology, JsonStackItem item, Value value, IRI range)
            throws MeaningExtractionException {
        ExtractedDatatypeProperty datatypeProperty = getOrCreateDatatypeProperty(managedOntology, item.getClassIri(),
                range, item.getIdentifier(), getCurrentLocation());
        item.getProperties().add((IRI) datatypeProperty.getResource(), value);
    }


    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        super.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        super.modelFactory = modelFactory;
    }

    @Reference
    public void setExpressionProcessor(IriExpressionProcessor expressionProcessor) {
        super.expressionProcessor = expressionProcessor;
    }

    @Reference
    public void setOrmFactoryRegistry(OrmFactoryRegistry ormFactoryRegistry) {
        super.ormFactoryRegistry = ormFactoryRegistry;
    }
}

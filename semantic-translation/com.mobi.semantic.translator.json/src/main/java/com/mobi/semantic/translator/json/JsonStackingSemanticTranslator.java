package com.mobi.semantic.translator.json;

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
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.semantic.translator.SemanticTranslationException;
import com.mobi.semantic.translator.expression.IriExpressionProcessor;
import com.mobi.semantic.translator.ontology.ExtractedClass;
import com.mobi.semantic.translator.ontology.ExtractedDatatypeProperty;
import com.mobi.semantic.translator.ontology.ExtractedOntology;
import com.mobi.semantic.translator.stack.AbstractStackingSemanticTranslator;
import com.mobi.semantic.translator.stack.StackingSemanticTranslator;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

@Component
public class JsonStackingSemanticTranslator extends AbstractStackingSemanticTranslator<JsonStackItem> implements StackingSemanticTranslator<JsonStackItem> {

    private static final Logger LOG = LoggerFactory.getLogger(JsonStackingSemanticTranslator.class);

    private static final JsonFactory JSON_FACTORY = new JsonFactory();

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

    @Override
    public Model translate(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology) throws SemanticTranslationException {
        final Model result = modelFactory.createModel();
        try (final JsonParser jsonParser = JSON_FACTORY.createParser(dataStream)) {
            JsonToken token = null;
            while ((token = jsonParser.nextToken()) != null) {
                parseToken(result, managedOntology, token, jsonParser);
            }
        } catch (JsonParseException e) {
            throw new SemanticTranslationException("Issue parsing JSON from incoming data, on entity: "
                    + entityIdentifier, e);
        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading incoming stream to extract meaning from "
                    + entityIdentifier, e);
        }
        return result;
    }

    private String currentName(final String jsonCurrentName) {
        String name = null;
        if (StringUtils.isNotBlank(jsonCurrentName)) {
            name = jsonCurrentName;
        } else {
            name = peekStack().map(item -> item.isArray() ? item.getIdentifier() : "root").orElse("root");
        }
        return name;
    }

    private Optional<JsonStackItem> peekForLastNonArray() {
        return getStack().stream().filter(item -> !item.isArray()).findFirst();
    }

    private void parseToken(Model result, ExtractedOntology managedOntology, JsonToken token, JsonParser jsonParser) throws IOException, SemanticTranslationException {
        final Optional<JsonStackItem> top = peekStack();
        final Optional<JsonStackItem> nonArrayTop = peekForLastNonArray();
        final String jsonCurrentName = jsonParser.getCurrentName();
        switch (token) {
            case END_OBJECT:
                LOG.debug("Ending {}", getCurrentLocation());
                final JsonStackItem endItem = popStack().orElseThrow(() -> new SemanticTranslationException("Got a null object from the stack on an object end!"));
                final ExtractedClass extractedClass = getOrCreateClass(managedOntology, endItem.getClassIri(), endItem.getIdentifier(), getCurrentLocation());
                createInstance(result, managedOntology, endItem, extractedClass, peekForLastNonArray());
                break;
            case START_ARRAY:
                JsonStackItem startArr = pushStack(new JsonStackItem(jsonCurrentName != null ? jsonCurrentName : "rootArray", top.isPresent()));
                startArr.setArray(true);
                break;
            case END_ARRAY:
                final JsonStackItem endArr = popStack().orElseThrow(() -> new SemanticTranslationException("Got a null object from the stack on an array end!"));
                if (!endArr.isArray()) {
                    throw new SemanticTranslationException("Mismatch on start/end array!");
                }
                break;
            case START_OBJECT:
                JsonStackItem item = pushStack(new JsonStackItem(
                        currentName(jsonCurrentName),
                        !top.isPresent()));
                item.setClassIri(generateClassIri(managedOntology, item.getIdentifier(), getCurrentLocation()));
                LOG.debug("Starting object {}", getCurrentLocation());
                break;
            // Property identified
            case VALUE_TRUE:
            case VALUE_FALSE:
                if (top.isPresent()) {
                    addDatatypeProperty(managedOntology, getPropertyName(jsonCurrentName), top.get(), valueFactory.createLiteral(jsonParser.getValueAsBoolean()),
                            xsdBoolean());
                }
                break;
            case VALUE_NUMBER_FLOAT:
                if (top.isPresent()) {
                    addDatatypeProperty(managedOntology, getPropertyName(jsonCurrentName), top.get(), valueFactory.createLiteral(jsonParser.getValueAsDouble()),
                            xsdFloat());
                }
                break;
            case VALUE_NUMBER_INT:
                if (top.isPresent()) {
                    addDatatypeProperty(managedOntology, getPropertyName(jsonCurrentName), top.get(), valueFactory.createLiteral(jsonParser.getValueAsInt()),
                            xsdInt());
                }
                break;
            case VALUE_STRING:
                if (top.isPresent()) {
                    addDatatypeProperty(managedOntology, getPropertyName(jsonCurrentName), top.get(), valueFactory.createLiteral(jsonParser.getValueAsString()),
                            xsdString());
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

    private String getPropertyName(String currentName) throws SemanticTranslationException {
        if (StringUtils.isNotBlank(currentName)) {
            return currentName;
        } else {
            return peekStack().orElseThrow(() -> new SemanticTranslationException("DatatypeProperty discovered without a corresponding name"))
                    .getIdentifier();
        }
    }

    private IRI getDatatypeDomain(JsonStackItem item) throws SemanticTranslationException {
        return item.isArray() ? peekForLastNonArray()
                .orElseThrow(() -> new SemanticTranslationException("DatatypeProperty discovered without a corresponding class")).getClassIri()
                : item.getClassIri();
    }

    private void addDatatypeProperty(ExtractedOntology managedOntology, String propertyName, JsonStackItem item, Value value, IRI range)
            throws SemanticTranslationException {
        ExtractedDatatypeProperty datatypeProperty = getOrCreateDatatypeProperty(managedOntology,
                getDatatypeDomain(item), range, propertyName, getCurrentLocation());
        item.getProperties().add((IRI) datatypeProperty.getResource(), value);
    }
}

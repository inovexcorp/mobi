package com.mobi.document.translator.expression.context.impl;

/*-
 * #%L
 * meaning.extraction.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import com.mobi.document.translator.expression.context.InstanceIriExpressionContext;
import com.mobi.document.translator.ontology.ExtractedClass;
import com.mobi.document.translator.ontology.ExtractedOntology;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.springframework.util.MultiValueMap;

import java.util.Optional;
import java.util.UUID;

/**
 * The default implementation of the {@link InstanceIriExpressionContext}.
 */
public class DefaultInstanceIriExpressionContext extends AbstractIriExpressionContext implements InstanceIriExpressionContext {

    private final ExtractedClass instanceClass;

    private final MultiValueMap<IRI, Value> properties;

    private final ValueFactory valueFactory = new ValidatingValueFactory();

    public DefaultInstanceIriExpressionContext(ExtractedOntology managedOntology, ExtractedClass instanceClass,
                                               MultiValueMap<IRI, Value> properties, ValueFactory valueFactory) {
        super(managedOntology);
        this.instanceClass = instanceClass;
        this.properties = properties;
    }

    @Override
    public String classIri() {
        return instanceClass.getResource().stringValue();
    }

    @Override
    public Optional<String> propertyValue(String predicate) {
        IRI predicateIri = valueFactory.createIRI(predicate);
        return properties.containsKey(predicateIri)
                ? Optional.ofNullable(properties.getFirst(predicateIri).stringValue())
                : Optional.empty();
    }

    @Override
    public String propertyValueOrUUID(String predicate) {
        return propertyValue(predicate).orElse(UUID.randomUUID().toString());
    }
}

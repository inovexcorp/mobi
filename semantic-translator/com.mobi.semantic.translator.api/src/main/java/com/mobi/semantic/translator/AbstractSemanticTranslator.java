package com.mobi.semantic.translator;

/*-
 * #%L
 * semantic.translator.api
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

import com.mobi.semantic.translator.expression.IriExpressionProcessor;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;

/**
 * This abstract base for the {@link SemanticTranslator} interface provides hooks to provide some base functionality to
 * avoid having to write the same boilerplate code in each implementation.
 */
public abstract class AbstractSemanticTranslator implements SemanticTranslator {

    private static final String XSD_PREFIX = "http://www.w3.org/2001/XMLSchema#";

    protected ValueFactory valueFactory;

    protected ModelFactory modelFactory;

    protected IriExpressionProcessor expressionProcessor;

    protected OrmFactoryRegistry ormFactoryRegistry;

    private IRI xsdString = null;

    private IRI xsdInt = null;

    private IRI xsdFloat = null;

    private IRI xsdBoolean = null;

    protected IRI xsdString() {
        if (xsdString == null) {
            xsdString = valueFactory.createIRI(XSD_PREFIX, "string");
        }
        return xsdString;
    }


    protected IRI xsdInt() {
        if (xsdInt == null) {
            xsdInt = valueFactory.createIRI(XSD_PREFIX, "int");
        }
        return xsdInt;
    }


    protected IRI xsdFloat() {
        if (xsdFloat == null) {
            xsdFloat = valueFactory.createIRI(XSD_PREFIX, "float");
        }
        return xsdFloat;
    }


    protected IRI xsdBoolean() {
        if (xsdBoolean == null) {
            xsdBoolean = valueFactory.createIRI(XSD_PREFIX, "boolean");
        }
        return xsdBoolean;
    }

}

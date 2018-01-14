package com.mobi.document.translator;

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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.document.translator.expression.IriExpressionProcessor;

/**
 * This abstract base for the {@link SemanticTranslator} interface provides hooks to provide some base functionality to
 * avoid having to write the same boilerplate code in each implementation.
 */
public abstract class AbstractSemanticTranslator implements SemanticTranslator {

    private static final String XSD_PREFIX = "http://www.w3.org/2001/XMLSchema#";

    private static final String RDFS_PREFIX = "http://www.w3.org/2000/01/rdf-schema#";

    private static final String RDF_PREFIX = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";

    protected ValueFactory valueFactory;

    protected ModelFactory modelFactory;

    protected IriExpressionProcessor expressionProcessor;

    protected OrmFactoryRegistry ormFactoryRegistry;

    private IRI xsdString = null;

    private IRI xsdInt = null;

    private IRI xsdFloat = null;

    private IRI xsdBoolean = null;

    private IRI domainIri = null;

    private IRI rangeIri = null;

    private IRI labelIri = null;

    private IRI commentIri = null;

    private IRI rdfType = null;

    protected final String[] supportedTypes;

    protected AbstractSemanticTranslator(String... supportedTypes) {
        this.supportedTypes = supportedTypes;
    }

    @Override
    public String[] getSupportedTypes() {
        return supportedTypes;
    }

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

    protected IRI getDomainIri() {
        if (domainIri == null) {
            domainIri = valueFactory.createIRI(RDFS_PREFIX, "domain");
        }
        return domainIri;
    }

    protected IRI getRangeIri() {
        if (rangeIri == null) {
            rangeIri = valueFactory.createIRI(RDFS_PREFIX, "range");
        }
        return rangeIri;
    }

    protected IRI getLabelIri() {
        if (labelIri == null) {
            labelIri = valueFactory.createIRI(RDFS_PREFIX, "label");
        }
        return labelIri;
    }

    protected IRI getCommentIri() {
        if (commentIri == null) {
            commentIri = valueFactory.createIRI(RDFS_PREFIX, "comment");
        }
        return commentIri;
    }

    protected IRI getRdfType() {
        if (rdfType == null) {
            rdfType = valueFactory.createIRI(RDF_PREFIX, "type");
        }
        return rdfType;
    }

}

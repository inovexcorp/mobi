package com.mobi.semantic.translator.stack;

/*-
 * #%L
 * meaning.extraction.api
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

import com.mobi.rdf.api.Model;
import com.mobi.semantic.translator.SemanticTranslationException;
import com.mobi.semantic.translator.ontology.ExtractedOntology;

import java.io.InputStream;
import java.nio.file.Path;

public class ExampleStackingSemanticTranslator extends AbstractStackingSemanticTranslator<ExampleStackItem> {

    @Override
    public Model translate(Path rawFile, ExtractedOntology managedOntology) throws SemanticTranslationException {
        throw new SemanticTranslationException("Not implemented in this test object");
    }

    @Override
    public Model translate(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology)
            throws SemanticTranslationException {
        throw new SemanticTranslationException("Not implemented in this test object");
    }
}
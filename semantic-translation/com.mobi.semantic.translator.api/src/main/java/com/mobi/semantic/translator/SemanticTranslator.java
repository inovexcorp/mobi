package com.mobi.semantic.translator;

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
import com.mobi.semantic.translator.ontology.ExtractedOntology;

import java.io.InputStream;
import java.nio.file.Path;

/**
 * This interface describes an object that will take a given file and produce semantic data representing the content.
 * The core concept behind this interface is to leverage the structure of the file (think XML or JSON) to infer an
 * ontology and generate data representing the content of the file in the ontology that is generated.  This interface
 * supports both pointing to the raw file on the file system (assuming the name of the file is the ID of the entity
 * being modeled), and reading the raw content via an {@link InputStream}.
 */
public interface SemanticTranslator {

    /**
     * Read the raw file from the file system and populate the provided ORM based {@link ExtractedOntology} object
     * with the inferred structures from the file.
     *
     * @param rawFile         The {@link Path} to the file on the file system
     * @param managedOntology The {@link ExtractedOntology} structure to populate with the inferred ontological structures
     * @return  {@link Model} containing the data representing in the content represented by the managed ontology
     * @throws SemanticTranslationException If there is an issue translating the data in the specified file
     */
    Model translate(Path rawFile, ExtractedOntology managedOntology) throws SemanticTranslationException;

    /**
     * Read the incoming {@link InputStream} and populate the provided ORM based {@link ExtractedOntology} object
     * with the inferred structures from the content structure.
     *
     * @param dataStream       The incoming {@link InputStream} containing the data you want to translate
     * @param entityIdentifier The unique identifier for the entity the content represents
     * @param managedOntology  The {@link ExtractedOntology} structure to populate with the inferred ontological structures
     * @return The {@link Model} containing the data representing in the content represented by the managed ontology
     * @throws SemanticTranslationException If there is an issue translating the content
     */
    Model translate(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology) throws SemanticTranslationException;


}

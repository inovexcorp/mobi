package com.mobi.owlapi.utils;

/*-
 * #%L
 * com.mobi.owlapi.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.rio.ParserConfig;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.ParseErrorLogger;
import org.obolibrary.obo2owl.OWLAPIObo2Owl;
import org.obolibrary.oboformat.model.OBODoc;
import org.obolibrary.oboformat.parser.OBOFormatParser;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLOntologyManagerFactory;
import org.semanticweb.owlapi.model.OWLRuntimeException;
import org.semanticweb.owlapi.model.OntologyConfigurator;
import org.semanticweb.owlapi.rio.RioFunctionalSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioManchesterSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioOWLRDFParser;
import org.semanticweb.owlapi.rio.RioOWLXMLParserFactory;
import org.semanticweb.owlapi.rio.RioRenderer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Set;

public class OwlApiUtils {

    private static Set<OWLOntologyManagerFactory> managerFactories = Collections.singleton(new OWLManagerSilent());

    /**
     * Attempts to parse a {@link InputStream} using a Functional Syntax Parser. Stores the file as Turtle in a
     * temporary file to be consumed.
     * 
     * @param rdfData the {@link InputStream} to parse.
     * @return A {@link Path} to the converted file.
     * @throws IOException When an error occurs processing the {@link InputStream} 
     */
    public static Path parseFunctional(InputStream rdfData) throws IOException {
        Path path = Files.createTempFile(null, null);
        parseFunctional(rdfData, RDFFormat.TURTLE.getDefaultMIMEType(), path);
        return path;
    }

    /**
     * Attempts to parse a {@link InputStream} using a Functional Syntax Parser. Stores the file as the
     * provided serialization in a temporary file to be consumed.
     * 
     * @param rdfData the {@link InputStream} to parse.
     * @param mimeType the MimeType associated with the {@link RDFFormat} to store the file in.
     * @param path the {@link Path} to store the file.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    public static void parseFunctional(InputStream rdfData, String mimeType, Path path) throws IOException {
        RDFParser parser = new RioFunctionalSyntaxParserFactory().getParser();
        ((RioOWLRDFParser) parser).setOntologyManagerFactories(managerFactories);

        writeDataToFile(rdfData, getFormatFromMime(mimeType), path, parser);
    }

    /**
     * Attempts to parse a {@link InputStream} using a Manchester Syntax Parser. Stores the file as Turtle in a
     * temporary file to be consumed.
     *
     * @param rdfData the {@link InputStream} to parse.
     * @return A {@link Path} to the converted file.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    public static Path parseManchester(InputStream rdfData) throws IOException {
        Path path = Files.createTempFile(null, null);
        parseManchester(rdfData, RDFFormat.TURTLE.getDefaultMIMEType(), path);
        return path;
    }

    /**
     * Attempts to parse a {@link InputStream} using a Manchester Syntax Parser. Stores the file as the
     * provided serialization in a temporary file to be consumed.
     *
     * @param rdfData the {@link InputStream} to parse.
     * @param mimeType the MimeType associated with the {@link RDFFormat} to store the file in.
     * @param path the {@link Path} to store the file.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    public static void parseManchester(InputStream rdfData, String mimeType, Path path)
            throws IOException {
        RDFParser parser = new RioManchesterSyntaxParserFactory().getParser();
        ((RioOWLRDFParser) parser).setOntologyManagerFactories(managerFactories);

        writeDataToFile(rdfData, getFormatFromMime(mimeType), path, parser);
    }

    /**
     * Attempts to parse a {@link InputStream} using an OWLXML Syntax Parser. Stores the file as Turtle in a
     * temporary file to be consumed.
     *
     * @param rdfData the {@link InputStream} to parse.
     * @return A {@link Path} to the converted file.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    public static Path parseOWLXML(InputStream rdfData) throws IOException {
        Path path = Files.createTempFile(null, null);
        parseOWLXML(rdfData, RDFFormat.TURTLE.getDefaultMIMEType(), path);
        return path;
    }

    /**
     * Attempts to parse a {@link InputStream} using an OWLXML Syntax Parser. Stores the file as the
     * provided serialization in a temporary file to be consumed.
     *
     * @param rdfData the {@link InputStream} to parse.
     * @param mimeType the MimeType associated with the {@link RDFFormat} to store the file in.
     * @param path the {@link Path} to store the file.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    public static void parseOWLXML(InputStream rdfData, String mimeType, Path path) throws IOException {
        RDFParser parser = new RioOWLXMLParserFactory().getParser();
        ((RioOWLRDFParser) parser).setOntologyManagerFactories(managerFactories);

        writeDataToFile(rdfData, getFormatFromMime(mimeType), path, parser);
    }

    private static void writeDataToFile(InputStream rdfData, RDFFormat destFormat, Path path,
                                       RDFParser parser) throws IOException {
        RDFWriter rdfWriter = Rio.createWriter(destFormat, Files.newOutputStream(path));
        parser.setRDFHandler(rdfWriter);
        parser.setParseErrorListener(new ParseErrorLogger());
        parser.setParserConfig(new ParserConfig());
        parser.parse(rdfData, "");
    }

    /**
     * Attempts to parse a {@link InputStream} using an OBO Syntax Parser. Stores the file as Turtle in a
     * temporary file to be consumed.
     *
     * @param rdfData the {@link InputStream} to parse.
     * @return A {@link Path} to the converted file.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    public static Path parseOBO(InputStream rdfData) throws IOException {
        Path path = Files.createTempFile(null, null);
        parseOBO(rdfData, RDFFormat.TURTLE.getDefaultMIMEType(), path);
        return path;
    }

    /**
     * Attempts to parse a {@link InputStream} using an OBO Syntax Parser. Stores the file as the
     * provided serialization in a temporary file to be consumed.
     *
     * @param rdfData the {@link InputStream} to parse.
     * @param mimeType the MimeType associated with the {@link RDFFormat} to store the file in.
     * @param path the {@link Path} to store the file.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    public static void parseOBO(InputStream rdfData, String mimeType, Path path) throws IOException {
        OBOFormatParser parser = new OBOFormatParser();
        OBODoc obodoc;

        // Parse into an OBODoc
        try (InputStreamReader isReader = new InputStreamReader(rdfData, StandardCharsets.UTF_8);
             BufferedReader bufferedReader = new BufferedReader(isReader)) {
            parser.setReader(new BufferedReader(bufferedReader));
            obodoc = new OBODoc();
            parser.parseOBODoc(obodoc);
        }

        // Convert to an OWLOntology
        OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
        manager.setOntologyConfigurator(new OntologyConfigurator());
        OWLAPIObo2Owl bridge = new OWLAPIObo2Owl(manager);
        OWLOntology ontology;
        try {
            ontology = bridge.convert(obodoc);
        } catch (OWLOntologyCreationException e) {
            throw new OWLRuntimeException(e);
        }

        RDFWriter rdfWriter = Rio.createWriter(getFormatFromMime(mimeType), Files.newOutputStream(path));
        OWLDocumentFormat format = ontology.getFormat();
        format.setAddMissingTypes(false);
        RioRenderer renderer = new RioRenderer(ontology, rdfWriter, format);
        renderer.render();
    }
    
    private static RDFFormat getFormatFromMime(String mimeType) {
        return Rio.getParserFormatForMIMEType(mimeType)
                .orElseThrow(() -> new IllegalArgumentException("Invalid MimeType for RDFFormat: " + mimeType));
    } 
}

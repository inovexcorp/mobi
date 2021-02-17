package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import com.mobi.exception.MobiException;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.UnsupportedRDFormatException;
import org.obolibrary.obo2owl.OWLAPIObo2Owl;
import org.obolibrary.oboformat.model.OBODoc;
import org.obolibrary.oboformat.parser.OBOFormatParser;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OntologyConfigurator;
import org.semanticweb.owlapi.rio.RioRenderer;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static java.util.Arrays.asList;

/**
 * Utility class for handling InputStreams of RDF and creating files.
 */
public class RDFFiles {

    /**
     * Writes the provided InputStream to a temporary file.
     *
     * @param inputStream The InputStream to write to a temporary file.
     * @return A temporary {@link File} of the provided InputStream.
     */
    public static File writeStreamToTempFile(InputStream inputStream) {
        try {
            Path tmpFile = Files.createTempFile(null, null);
            OutputStream outStream = Files.newOutputStream(tmpFile);

            byte[] buffer = new byte[8 * 1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outStream.write(buffer, 0, bytesRead);
            }
            IOUtils.closeQuietly(inputStream);
            IOUtils.closeQuietly(outStream);
            return tmpFile.toFile();
        } catch (IOException | NullPointerException e) {
            throw new MobiException("Could not write stream to temp file.", e);
        }
    }

    /**
     * Parses the provided temporary file into the desired RDFFormat. Uses default set of RDFFormat parsers against the
     * tempFile. If defaults cannot parse, uses the optionally provided RDFParsers. Upon completion, the provided
     * temporary file is deleted.
     *
     * @param tempFile The temporary {@link File} to parse into a file of the specified format.
     * @param destFormat The {@link RDFFormat} to parse the temporary file into.
     * @param parsers The optional list of additional parsers to use when default formats cannot parse.
     * @return An {@link Optional} of the resulting file. If unsuccessful, returns empty Optional.
     */
    public static Optional<File> parseFileToFileFormat(File tempFile, RDFFormat destFormat, RDFParser... parsers) {
        try {
            Set<RDFFormat> formats = new HashSet<>(asList(RDFFormat.JSONLD, RDFFormat.TRIG, RDFFormat.TURTLE,
                    RDFFormat.RDFJSON, RDFFormat.RDFXML, RDFFormat.NTRIPLES, RDFFormat.NQUADS));
            String tmpDir = System.getProperty("java.io.tmpdir");
            Path path = Paths.get(tmpDir + File.separator + UUID.randomUUID() + "." +
                    destFormat.getDefaultFileExtension());
            for (RDFFormat format : formats) {
                RDFParser rdfParser = Rio.createParser(format);
                boolean success = tryParse(tempFile, rdfParser, destFormat, path);
                if (success) {
                    return Optional.of(path.toFile());
                }
            }
            for (RDFParser rdfParser : parsers) {
                boolean success = tryParse(tempFile, rdfParser, destFormat, path);
                if (success) {
                    return Optional.of(path.toFile());
                }
            }
            if (tryParseObo(tempFile, destFormat, path)) {
                return Optional.of(path.toFile());
            }
            return Optional.empty();
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Attempts to parse the provided temporary file with the given RDFFormat.
     *
     * @param tempFile The temporary {@link File} to parse.
     * @param rdfParser The {@link RDFParser} to attempt the parse with.
     * @param destFormat The desired {@link RDFFormat} of the destination file.
     * @param path The {@link Path} to write the destination file to.
     * @return A boolean indicating the success of the parse operation.
     */
    private static boolean tryParse(File tempFile, RDFParser rdfParser, RDFFormat destFormat, Path path) {
        try {
            Path filePath = Files.createFile(path);
            RDFWriter rdfWriter = Rio.createWriter(destFormat, Files.newOutputStream(filePath));
            rdfParser.setRDFHandler(rdfWriter);
            rdfParser.parse(new FileInputStream(tempFile), "");
            return true;
        } catch (Exception e) {
            try {
                Files.delete(path);
            } catch (IOException ex) {
                throw new MobiException("Could not delete file " + path.toString(), ex);
            }
            return false;
        }
    }

    /**
     * Attempts to parse as OBO. Not performant as it loads file into memory.
     *
     * @param tempFile The temporary {@link File} to parse.
     * @param destFormat The desired {@link RDFFormat} of the destination file.
     * @param path The {@link Path} to write the destination file to.
     * @return A boolean indicating the success of the parse operation.
     */
    private static boolean tryParseObo(File tempFile, RDFFormat destFormat, Path path) {
        OBOFormatParser parser = new OBOFormatParser();
        OBODoc obodoc;
        // Parse into an OBODoc
        try (InputStreamReader isReader = new InputStreamReader(new FileInputStream(tempFile));
             BufferedReader bufferedReader = new BufferedReader(isReader)) {
            parser.setReader(new BufferedReader(bufferedReader));
            obodoc = new OBODoc();
            parser.parseOBODoc(obodoc);

            // Convert to an OWLOntology
            OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
            manager.setOntologyConfigurator(new OntologyConfigurator());
            OWLAPIObo2Owl bridge = new OWLAPIObo2Owl(manager);
            OWLOntology ontology = bridge.convert(obodoc);
            OWLDocumentFormat format = ontology.getFormat();
            format.setAddMissingTypes(false);

            Path filePath = Files.createFile(path);
            RDFWriter rdfWriter = Rio.createWriter(destFormat, Files.newOutputStream(filePath));
            RioRenderer renderer = new RioRenderer(ontology, rdfWriter, format);
            renderer.render();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

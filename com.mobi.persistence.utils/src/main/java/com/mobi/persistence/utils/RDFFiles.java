package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import com.mobi.owlapi.utils.OwlApiUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.RDFParserRegistry;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.GZIPInputStream;
import java.util.zip.ZipInputStream;

/**
 * Utility class for handling InputStreams of RDF and creating files.
 */
public class RDFFiles {
    public static final RDFFormat OWL_XML =
            new RDFFormat("OWL/XML Syntax", List.of("application/owl+xml"), StandardCharsets.UTF_8,
                    List.of("owx", "owl"), RDFFormat.SUPPORTS_NAMESPACES, RDFFormat.NO_CONTEXTS, RDFFormat.NO_RDF_STAR);

    public static final RDFFormat MANCHESTER_OWL = new RDFFormat(
            "Manchester OWL Syntax", List.of("text/owl-manchester"), StandardCharsets.UTF_8,
            List.of("omn"), RDFFormat.SUPPORTS_NAMESPACES, RDFFormat.NO_CONTEXTS, RDFFormat.NO_RDF_STAR);

    public static final RDFFormat OWL_FUNCTIONAL = new RDFFormat(
            "OWL Functional Syntax", List.of("text/owl-functional"), StandardCharsets.UTF_8,
            List.of("ofn"), RDFFormat.SUPPORTS_NAMESPACES, RDFFormat.NO_CONTEXTS, RDFFormat.NO_RDF_STAR);

    public static final RDFFormat OBO = new RDFFormat(
            "Open Biological and Biomedical Ontologies", List.of(""), StandardCharsets.UTF_8,
            List.of("obo"), RDFFormat.SUPPORTS_NAMESPACES, RDFFormat.NO_CONTEXTS, RDFFormat.NO_RDF_STAR);

    private static final List<RDFFormat> owlFormats = List.of(OWL_XML, MANCHESTER_OWL, OWL_FUNCTIONAL, OBO);

    /**
     * Writes the provided InputStream to a temporary file.
     *
     * @param inputStream The InputStream to write to a temporary file.
     * @return A temporary {@link File} of the provided InputStream.
     */
    public static File writeStreamToTempFile(InputStream inputStream, RDFFormat format) {
        try {
            Path tmpFile = Files.createTempFile(null, "." + format.getDefaultFileExtension());
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
     * @return An {@link Optional} of the resulting file. If unsuccessful, returns empty Optional.
     */
    public static File parseFileToFileFormat(File tempFile, RDFFormat destFormat) throws RDFParseException {
        try {
            String tmpDir = System.getProperty("java.io.tmpdir");
            Path path = Paths.get(tmpDir + File.separator + UUID.randomUUID() + "."
                    + destFormat.getDefaultFileExtension());
            RDFFormat sourceFormat = getFormatForFileName(tempFile.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Could not retrieve RDFFormat for file name "
                            + tempFile.getName()));

            ParsedFile parsedFile = new ParsedFile();
            boolean success;
            if (owlFormats.contains(sourceFormat)) {
                success = parseOWLFormats(sourceFormat, destFormat, tempFile, path, parsedFile);
            } else {
                RDFParser rdfParser = Rio.createParser(sourceFormat);
                success = tryParse(tempFile, rdfParser, destFormat, path, parsedFile);
            }
            if (!success && sourceFormat.equals(RDFFiles.OWL_XML)) {
                RDFParser rdfParser = Rio.createParser(RDFFormat.RDFXML);
                success = tryParse(tempFile, rdfParser, destFormat, path, parsedFile);
            }
            if (success) {
                return path.toFile();
            }
            Optional<RDFParseException> exception = parsedFile.getRdfParseException();
            if (exception.isPresent()) {
                throw exception.get();
            } else {
                throw new IllegalStateException("Could not parse file.");
            }
        } finally {
            tempFile.delete();
        }
    }

    private static boolean parseOWLFormats(RDFFormat sourceFormat, RDFFormat destFormat, File tempFile, Path path,
                                           ParsedFile parsedFile) {
        try {
            int i = owlFormats.indexOf(sourceFormat);
            if (i == 0) {
                OwlApiUtils.parseOWLXML(getInputStream(tempFile), destFormat.getDefaultMIMEType(), path);
            } else if (i == 1) {
                OwlApiUtils.parseManchester(getInputStream(tempFile), destFormat.getDefaultMIMEType(), path);
            } else if (i == 2) {
                OwlApiUtils.parseFunctional(getInputStream(tempFile), destFormat.getDefaultMIMEType(), path);
            } else if (i == 3) {
                OwlApiUtils.parseOBO(getInputStream(tempFile), destFormat.getDefaultMIMEType(), path);
            } else {
                throw new IllegalStateException("Unexpected value: " + sourceFormat.getName());
            }
            return true;
        } catch (Exception e) {
            if (!sourceFormat.equals(RDFFiles.OWL_XML)) {
                tempFile.delete();
            }
            parsedFile.addFormatToError(sourceFormat.getName(), e.getMessage());
            return false;
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
    private static boolean tryParse(File tempFile, RDFParser rdfParser, RDFFormat destFormat, Path path,
                                    ParsedFile parsedFile) {
        try {
            if (Files.exists(path)) {
                Files.delete(path);
            }
            Path filePath = Files.createFile(path);
            RDFWriter rdfWriter = Rio.createWriter(destFormat, Files.newOutputStream(filePath));
            rdfParser.setRDFHandler(rdfWriter);
            rdfParser.parse(getInputStream(tempFile), "");
            return true;
        } catch (Exception e) {
            try {
                parsedFile.addFormatToError(rdfParser.getRDFFormat().getName(), e.getMessage());
                Files.delete(path);
            } catch (IOException ex) {
                throw new MobiException("Could not delete file " + path, ex);
            }
            return false;
        }
    }

    /**
     * Checks to see if a file is an OWL file format.
     * @param file The file to test
     * @return boolean true if owl format, false otherwise
     */
    public static boolean isOwlFile(File file) {
        RDFFormat format = getFormatForFileName(file.getName())
                .orElseThrow(() -> new IllegalArgumentException("Could not retrieve RDFFormat for file name "
                        + file.getName()));
        return owlFormats.contains(format);
    }

    /**
     * Retrieves the extension of a file. If the file is a zip/gz, retrieves the combined extension (i.e., ttl.gz).
     *
     * @param fileName The string representation of a file name
     * @return The extension of a file
     */
    public static String getFileExtension(String fileName) {
        if (StringUtils.isEmpty(fileName)) {
            throw new IllegalArgumentException("Filename must not be empty");
        }
        String fileExtension = FilenameUtils.getExtension(fileName);
        if (fileExtension.equals("gz") || fileExtension.endsWith("zip")) {
            String fileExtensionNoCompress = FilenameUtils.getExtension(FilenameUtils.removeExtension(fileName));
            if (fileExtensionNoCompress.equals("tar")) {
                throw new IllegalArgumentException("File must not be a tar");
            }
            fileExtension = fileExtensionNoCompress + "." + fileExtension;
        }
        return fileExtension;
    }

    /**
     * Retrieves the {@link RDFFormat} associated with the given file name
     * @param fileName The name of the file
     * @return An {@link Optional} of the {@link RDFFormat} if found
     */
    public static Optional<RDFFormat> getFormatForFileName(String fileName) {
        return RDFFormat.matchFileName(fileName, getFormats());
    }

    /**
     * Retrieves the {@link RDFFormat} associated with the given mime type
     * @param mimeType The name of the file
     * @return An {@link Optional} of the {@link RDFFormat} if found
     */
    public static Optional<RDFFormat> getFormatForMIMEType(String mimeType) {
        return RDFFormat.matchMIMEType(mimeType, getFormats());
    }

    private static boolean isGzip(File file) {
        try {
            RandomAccessFile raf = new RandomAccessFile(file, "r");
            int magic = raf.read() & 0xff | (raf.read() << 8) & 0xff00;
            raf.close();
            return magic == GZIPInputStream.GZIP_MAGIC;
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean isZip(File file) throws IOException {
        return new ZipInputStream(new FileInputStream(file)).getNextEntry() != null;
    }

    private static List<RDFFormat> getFormats() {
        List<RDFFormat> formats = new ArrayList<>(owlFormats);
        formats.addAll(RDFParserRegistry.getInstance().getKeys());
        return formats;
    }

    private static InputStream getInputStream(File file) {
        try {
            InputStream inputStream;
            if (isZip(file)) {
                inputStream = new ZipInputStream(new FileInputStream(file));
                ((ZipInputStream) inputStream).getNextEntry();
            } else if (isGzip(file)) {
                inputStream = new GZIPInputStream(new FileInputStream(file));
            } else {
                inputStream = new FileInputStream(file);
            }
            return inputStream;
        } catch (IOException e) {
            file.delete();
            throw new IllegalStateException("Could not open file " + file.getName());
        }
    }
}

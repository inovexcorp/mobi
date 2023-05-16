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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.junit.Test;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

public class RDFFilesTest {

    @Test
    public void writeSteamToTempFileTest() throws Exception {
        Path file = Paths.get("src","test", "resources", "dcterms.ttl");
        try (InputStream is = Files.newInputStream(file); InputStream is2 = Files.newInputStream(file)) {
            File serializedFile = RDFFiles.writeStreamToTempFile(is, RDFFormat.TURTLE);
            assertTrue(IOUtils.contentEquals(is2, Files.newInputStream(Paths.get(serializedFile.getPath()))));
            assertEquals("ttl", RDFFiles.getFileExtension(serializedFile.getPath()));
            serializedFile.delete();
        }

    }

    @Test
    public void parseFileToFormatTest() throws Exception {
        Path tempFilePath = Files.createTempFile(null, ".ttl");
        Path file = Paths.get("src","test", "resources", "dcterms.ttl");
        Files.copy(file, tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        File tempFile = tempFilePath.toFile();
        File serializedFile = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML);
        assertEquals(RDFFormat.RDFXML, RDFFiles.getFormatForFileName(serializedFile.getName()).get());
        assertFalse(tempFile.exists());
        serializedFile.delete();
    }

    @Test
    public void parseFileToFormatRDFXMLTest() throws Exception {
        Path tempFilePath = Files.createTempFile(null, ".ttl");
        Path file = Paths.get("src","test", "resources", "dcterms.ttl");
        Files.copy(file, tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        File tempFile = tempFilePath.toFile();
        File serializedFile = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML);
        assertEquals(RDFFormat.RDFXML, RDFFiles.getFormatForFileName(serializedFile.getName()).get());
        assertFalse(tempFile.exists());
        serializedFile.delete();
    }

    @Test
    public void parseFileToFormatFromOwltoRDFXMlTest() throws Exception {
        Path tempFilePath = Files.createTempFile(null, ".owl");
        Path file = Paths.get("src","test", "resources", "bfo.owl");
        Files.copy(file, tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        File tempFile = tempFilePath.toFile();
        File serializedFile = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML);
        assertEquals(RDFFormat.RDFXML, RDFFiles.getFormatForFileName(serializedFile.getName()).get());
        assertFalse(tempFile.exists());
        serializedFile.delete();
    }

    @Test
    public void parseFileToFormatFromOwl2toRDFXMlTest() throws Exception {
        Path tempFilePath = Files.createTempFile(null, ".owl");
        Path file = Paths.get("src","test", "resources", "unresolvableImport.owl");
        Files.copy(file, tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        File tempFile = tempFilePath.toFile();
        File serializedFile = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML);
        assertEquals(RDFFormat.RDFXML, RDFFiles.getFormatForFileName(serializedFile.getName()).get());
        assertFalse(tempFile.exists());
        serializedFile.delete();
    }

    @Test
    public void parseFileToFormatFromOBOtoRDFXMlTest() throws Exception {
        Path tempFilePath = Files.createTempFile(null, ".obo");
        Path file = Paths.get("src","test", "resources", "bfo.obo");
        Files.copy(file, tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        File tempFile = tempFilePath.toFile();
        File serializedFile = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML);
        assertEquals(RDFFormat.RDFXML, RDFFiles.getFormatForFileName(serializedFile.getName()).get());
        assertFalse(tempFile.exists());
        serializedFile.delete();
    }

    @Test
    public void parseFileToFormatFromOMNtoRDFXMlTest() throws Exception {
        Path tempFilePath = Files.createTempFile(null, ".omn");
        Path file = Paths.get("src","test", "resources", "manchester.omn");
        Files.copy(file, tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        File tempFile = tempFilePath.toFile();
        File serializedFile = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML);
        assertEquals(RDFFormat.RDFXML, RDFFiles.getFormatForFileName(serializedFile.getName()).get());
        assertFalse(tempFile.exists());
        serializedFile.delete();
    }

    @Test
    public void parseFileToFormatFromOFNtoRDFXMlTest() throws Exception {
        Path tempFilePath = Files.createTempFile(null, ".ofn");
        Path file = Paths.get("src","test", "resources", "functional.ofn");
        Files.copy(file, tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        File tempFile = tempFilePath.toFile();
        File serializedFile = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML);
        assertEquals(RDFFormat.RDFXML, RDFFiles.getFormatForFileName(serializedFile.getName()).get());
        assertFalse(tempFile.exists());
        serializedFile.delete();
    }

    @Test
    public void parseFileToFormatFromOWXtoRDFXMlTest() throws Exception {
        Path tempFilePath = Files.createTempFile(null, ".owx");
        Path file = Paths.get("src","test", "resources", "test.owx");
        Files.copy(file, tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        File tempFile = tempFilePath.toFile();
        File serializedFile = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML);
        assertEquals(RDFFormat.RDFXML, RDFFiles.getFormatForFileName(serializedFile.getName()).get());
        assertFalse(tempFile.exists());
        serializedFile.delete();
    }

    @Test
    public void isOwlFormatTtlTest() {
        File file = Paths.get("src","test", "resources", "dcterms.ttl").toFile();
        assertFalse(RDFFiles.isOwlFile(file));
    }

    @Test
    public void isOwlFormatOwlTest() {
        // OWL is handled by RDF4j
        File file = Paths.get("src","test", "resources", "bfo.owl").toFile();
        assertTrue(RDFFiles.isOwlFile(file));
    }

    @Test
    public void isOwlFormatOwxTest() {
        File file = Paths.get("src","test", "resources", "test.owx").toFile();
        assertTrue(RDFFiles.isOwlFile(file));
    }

    @Test
    public void isOwlFormatOfnTest() {
        File file = Paths.get("src","test", "resources", "functional.ofn").toFile();
        assertTrue(RDFFiles.isOwlFile(file));
    }

    @Test
    public void isOwlFormatOmnTest() {
        File file = Paths.get("src","test", "resources", "manchester.omn").toFile();
        assertTrue(RDFFiles.isOwlFile(file));
    }

    @Test
    public void isOwlFormatOboTest() {
        File file = Paths.get("src","test", "resources", "bfo.obo").toFile();
        assertTrue(RDFFiles.isOwlFile(file));
    }

    @Test
    public void getFileExtensionTest() {
        String ext = RDFFiles.getFileExtension("testFile.ttl");
        assertEquals("ttl", ext);
    }

    @Test
    public void getFileExtensionGzipTest() {
        String ext = RDFFiles.getFileExtension("testFile.ttl.gzip");
        assertEquals("ttl.gzip", ext);
    }

    @Test
    public void getFileExtensionGzTest() {
        String ext = RDFFiles.getFileExtension("testFile.ttl.gz");
        assertEquals("ttl.gz", ext);
    }

    @Test
    public void getFileExtensionZipTest() {
        String ext = RDFFiles.getFileExtension("testFile.ttl.zip");
        assertEquals("ttl.zip", ext);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getFileExtensionNullTest() {
        RDFFiles.getFileExtension(null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getFileExtensionEmptyTest() {
        RDFFiles.getFileExtension("");
    }

    @Test(expected = IllegalArgumentException.class)
    public void getFileExtensionTarTest() {
        RDFFiles.getFileExtension("filename.tar.gz");
    }
}

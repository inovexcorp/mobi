package com.mobi.persistence.utils

import com.mobi.exception.MobiException
import org.eclipse.rdf4j.rio.RDFFormat
import spock.lang.Specification

class RDFFilesSpec extends Specification {

    def "writeStreamToTempFile creates a temporary file"() {
        when:
        def input = getClass().getResourceAsStream("/bfo.owl")
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        tempFile.deleteOnExit()

        then:
        assert tempFile.exists()
    }

    def "writeStreamToTempFile throws exception with empty steam"() {
        when:
        def input;

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
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        tempFile.deleteOnExit()

        then:
        thrown(MobiException.class)
    }

    def "parseFileToFileFormat creates a TTL file and deletes tempFile"() {
        when:
        def input = getClass().getResourceAsStream("/bfo.owl")
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        Optional<File> file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.TURTLE)
        tempFile.deleteOnExit()

        then:
        assert !tempFile.exists()
        assert file.isPresent()
        assert file.get().exists()
        assert file.get().getName().endsWith(".ttl")
        file.get().delete()
    }

    def "parseFileToFileFormat creates a TRIG file and deletes tempFile"() {
        when:
        def input = getClass().getResourceAsStream("/bfo.owl")
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        Optional<File> file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.TRIG)
        tempFile.deleteOnExit()

        then:
        assert !tempFile.exists()
        assert file.isPresent()
        assert file.get().exists()
        assert file.get().getName().endsWith(".trig")
        file.get().delete()
    }

    def "parseFileToFileFormat creates a JSONLD file and deletes tempFile"() {
        when:
        def input = getClass().getResourceAsStream("/bfo.owl")
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        Optional<File> file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.JSONLD)
        tempFile.deleteOnExit()

        then:
        assert !tempFile.exists()
        assert file.isPresent()
        assert file.get().exists()
        assert file.get().getName().endsWith(".jsonld")
        file.get().delete()
    }

    def "parseFileToFileFormat creates a NQUADS file and deletes tempFile"() {
        when:
        def input = getClass().getResourceAsStream("/bfo.owl")
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        Optional<File> file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.NQUADS)
        tempFile.deleteOnExit()

        then:
        assert !tempFile.exists()
        assert file.isPresent()
        assert file.get().exists()
        assert file.get().getName().endsWith(".nq")
        file.get().delete()
    }

    def "parseFileToFileFormat creates a N3 file and deletes tempFile"() {
        when:
        def input = getClass().getResourceAsStream("/bfo.owl")
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        Optional<File> file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.N3)
        tempFile.deleteOnExit()

        then:
        assert !tempFile.exists()
        assert file.isPresent()
        assert file.get().exists()
        assert file.get().getName().endsWith(".n3")
        file.get().delete()
    }

    def "parseFileToFileFormat creates a RDFXML file and deletes tempFile"() {
        when:
        def input = getClass().getResourceAsStream("/bfo.owl")
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        Optional<File> file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML)
        tempFile.deleteOnExit()

        then:
        assert !tempFile.exists()
        assert file.isPresent()
        assert file.get().exists()
        assert file.get().getName().endsWith(".rdf")
        file.get().delete()
    }

    def "parseFileToFileFormat attempts to parse an OBO file into a RDFXML file and deletes tempFile"() {
        when:
        def input = getClass().getResourceAsStream("/bfo.obo")
        File tempFile = RDFFiles.writeStreamToTempFile(input)
        Optional<File> file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML)
        tempFile.deleteOnExit()

        then:
        assert !tempFile.exists()
        assert file.isPresent()
        assert file.get().exists()
        assert file.get().getName().endsWith(".rdf")
        file.get().delete()
    }

    def "parseFileToFileFormat returns an empty optional and deletes tempFile when invalid RDF"() {
        when:
        File tempFile = RDFFiles.writeStreamToTempFile(new ByteArrayInputStream("THIS IS NOT RDF".getBytes()))
        Optional<File> file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.RDFXML)
        tempFile.deleteOnExit()

        then:
        assert !tempFile.exists()
        assert !file.isPresent()
    }
}

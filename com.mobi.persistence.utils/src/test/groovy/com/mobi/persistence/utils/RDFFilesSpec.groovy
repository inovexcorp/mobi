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

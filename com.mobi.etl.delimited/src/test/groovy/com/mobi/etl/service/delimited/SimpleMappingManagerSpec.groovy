/*-
 * #%L
 * com.mobi.etl.delimited
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
package com.mobi.etl.service.delimited

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService

import com.mobi.catalog.api.BranchManager
import com.mobi.catalog.api.CommitManager
import com.mobi.catalog.api.CompiledResourceManager
import com.mobi.catalog.api.RecordManager
import com.mobi.catalog.config.CatalogConfigProvider
import com.mobi.etl.api.delimited.MappingId
import com.mobi.etl.api.delimited.MappingWrapper
import com.mobi.etl.api.ontologies.delimited.Mapping
import com.mobi.exception.MobiException
import org.eclipse.rdf4j.model.Model
import org.eclipse.rdf4j.rio.RDFFormat
import org.eclipse.rdf4j.rio.Rio
import spock.lang.Specification

import java.nio.file.Paths

class SimpleMappingManagerSpec extends Specification {

    def service = new SimpleMappingManager()
    def vf = getValueFactory()

    def configProvider = Mock(CatalogConfigProvider)
    def recordManager = Mock(RecordManager)
    def branchManager = Mock(BranchManager)
    def commitManager = Mock(CommitManager)
    def compiledResourceManager = Mock(CompiledResourceManager)
    def model = Mock(Model)
    def mappingWrapper = Mock(MappingWrapper)
    def mappingId = Mock(MappingId)
    def mapping = Mock(Mapping)

    def mappingIRI = vf.createIRI("http://test.com/mapping")

    def setup() {
        injectOrmFactoryReferencesIntoService(service)
        service.configProvider = configProvider
        service.recordManager = recordManager
        service.branchManager = branchManager
        service.commitManager = commitManager
        service.compiledResourceManager = compiledResourceManager

        mappingWrapper.getId() >> mappingId
        mappingWrapper.getMapping() >> mapping
        mappingWrapper.getClassMappings() >> []
        mappingWrapper.getModel() >> model

        mapping.getModel() >> model

        mappingId.getMappingIdentifier() >> mappingIRI
    }

    def "Create a Mapping using a valid File"() {
        setup:
        def mappingStream = getClass().getClassLoader().getResourceAsStream("newestMapping.ttl")
        def mappingFile = Paths.get(getClass().getClassLoader().getResource("newestMapping.ttl").toURI()).toFile()
        def versionedMappingStream = getClass().getClassLoader().getResourceAsStream("newestVersionedMapping.jsonld")
        def versionedMappingFile = Paths.get(getClass().getClassLoader().getResource("newestVersionedMapping.jsonld")
                .toURI()).toFile()

        def expectedModel = Rio.parse(mappingStream, "", RDFFormat.TURTLE)
        def expectedVersionedModel = Rio.parse(versionedMappingStream, "", RDFFormat.JSONLD)

        when:
        def actualMapping = service.createMapping(mappingFile)
        def actualVersionedMapping = service.createMapping(versionedMappingFile)

        then:
        actualMapping.getModel() == expectedModel
        actualVersionedMapping.getModel() == expectedVersionedModel
    }

    def "Create a Mapping using a valid InputStream"() {
        setup:
        def model = Rio.parse(getClass().getClassLoader()
                .getResourceAsStream("newestMapping.ttl"), "", RDFFormat.TURTLE)
        def versionedModel = Rio.parse(getClass().getClassLoader()
                .getResourceAsStream("newestVersionedMapping.jsonld"), "", RDFFormat.JSONLD)

        when:
        def mapping = service.createMapping(getClass().getClassLoader()
                .getResourceAsStream("newestMapping.ttl"), RDFFormat.TURTLE)
        def versionedMapping = service.createMapping(getClass().getClassLoader()
                .getResourceAsStream("newestVersionedMapping.jsonld"), RDFFormat.JSONLD)

        then:
        mapping.getModel() == model
        versionedMapping.getModel() == versionedModel
    }

    def "Create a Mapping using a valid JSON-LD String"() {
        setup:
        def mappingStream = getClass().getClassLoader().getResourceAsStream("newestMapping.jsonld")
        def mappingFile = Paths.get(getClass().getClassLoader().getResource("newestMapping.jsonld").toURI()).toFile()
        def versionedMappingStream = getClass().getClassLoader().getResourceAsStream("newestVersionedMapping.jsonld")
        def versionedMappingFile = Paths.get(getClass().getClassLoader().getResource("newestVersionedMapping.jsonld")
                .toURI()).toFile()

        def expectedModel = Rio.parse(mappingStream, "", RDFFormat.JSONLD)
        def expectedVersionedModel = Rio.parse(versionedMappingStream, "", RDFFormat.JSONLD)

        when:
        def actualMapping = service.createMapping(mappingFile.getText("UTF-8"))
        def actualVersionedMapping = service.createMapping(versionedMappingFile.getText("UTF-8"))

        then:
        actualMapping.getModel() == expectedModel
        actualVersionedMapping.getModel() == expectedVersionedModel
    }

    def "Throw an exception when Mapping is invalid"() {
        when:
        service.createMapping(getClass().getClassLoader()
                .getResourceAsStream("invalidMapping.ttl"), RDFFormat.TURTLE)

        then:
        thrown(MobiException)
    }
}

package com.mobi.etl.api.ontologies.delimited

import com.mobi.rdf.orm.conversion.ValueConverterRegistry
import com.mobi.rdf.orm.conversion.impl.*
import com.mobi.rdf.orm.impl.ThingFactory
import org.eclipse.rdf4j.model.Model
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory
import org.eclipse.rdf4j.rio.RDFFormat
import org.eclipse.rdf4j.rio.Rio
import spock.lang.Specification

class DelimitedOntologySpec extends Specification {

    def vf = new ValidatingValueFactory()
    def classFactory = new ClassMappingFactory()
    def dataMappingFactory = new DataMappingFactory()
    def objectMappingFactory = new ObjectMappingFactory()
    def propertyMappingFactory = new PropertyMappingFactory()
    def thingFactory = new ThingFactory()
    def classMapping

    ValueConverterRegistry vcr = new DefaultValueConverterRegistry();

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

    def setup() {
        classFactory.valueConverterRegistry = vcr
        dataMappingFactory.valueConverterRegistry = vcr
        objectMappingFactory.valueConverterRegistry = vcr
        propertyMappingFactory.valueConverterRegistry = vcr

        vcr.registerValueConverter(classFactory)
        vcr.registerValueConverter(dataMappingFactory)
        vcr.registerValueConverter(objectMappingFactory)
        vcr.registerValueConverter(propertyMappingFactory)
        vcr.registerValueConverter(thingFactory)
        vcr.registerValueConverter(new ResourceValueConverter())
        vcr.registerValueConverter(new IRIValueConverter())
        vcr.registerValueConverter(new DoubleValueConverter())
        vcr.registerValueConverter(new IntegerValueConverter())
        vcr.registerValueConverter(new FloatValueConverter())
        vcr.registerValueConverter(new ShortValueConverter())
        vcr.registerValueConverter(new StringValueConverter())
        vcr.registerValueConverter(new ValueValueConverter())

        InputStream mappingFile = this.getClass().getResourceAsStream('/newestMapping.ttl');
        Model mapping = Rio.parse(mappingFile, "", RDFFormat.TURTLE)
        classMapping = classFactory.getExisting(vf.createIRI("http://mobi.com/mappings/demo/Material"), mapping, vf, vcr).get()
    }

    def "ClassMapping has the correct prefix"() {
        def prefixes = classMapping.getHasPrefix()

        expect:
        prefixes != null
        prefixes.size() == 1
        prefixes[0] == "http://mobi.com/data/uhtc/material/"
    }

    def "ClassMapping has the correct DataProperties"() {
        Set<DataMapping> dataProps = classMapping.getDataProperty()

        expect:
        dataProps != null
        dataProps.size() == 3
        dataProps.each { dataMapping ->
            dataMapping.getHasProperty_resource().each { resource ->
                switch (resource.stringValue()) {
                    case "http://mobi.com/ontologies/uhtc/formula":
                        assert dataMapping.getColumnIndex()[0] == 1
                        break
                    case "http://mobi.com/ontologies/uhtc/density":
                        assert dataMapping.getColumnIndex()[0] == 6
                        break
                    case "http://mobi.com/ontologies/uhtc/latticeParameter":
                        assert dataMapping.getColumnIndex()[0] == 3
                        break
                    default:
                        throw new IllegalStateException()
                }
            }
        }
    }

    def "ClassMapping has the correct ObjectProperties"() {
        Set<ObjectMapping> objectProps = classMapping.getObjectProperty()

        expect:
        objectProps != null
        objectProps.size() == 1
        objectProps[0].getHasProperty_resource().each { resource -> resource.stringValue() == "http://mobi.com/ontologies/uhtc/crystalStructure" }
        objectProps[0].getClassMapping_resource().each { resource -> resource.stringValue() == "http://mobi.com/mappings/demo/CrystalStructure" }
    }
}

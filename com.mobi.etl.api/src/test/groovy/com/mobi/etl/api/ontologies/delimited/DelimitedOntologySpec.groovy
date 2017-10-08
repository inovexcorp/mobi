package com.mobi.etl.api.ontologies.delimited

import com.mobi.rdf.api.Model
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory
import com.mobi.rdf.core.utils.Values
import com.mobi.rdf.orm.conversion.ValueConverterRegistry
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter
import com.mobi.rdf.orm.conversion.impl.StringValueConverter
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter
import com.mobi.rdf.orm.conversion.impl.*
import com.mobi.rdf.orm.impl.ThingFactory
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification

class DelimitedOntologySpec extends Specification {

    def vf = SimpleValueFactory.getInstance()
    def mf = LinkedHashModelFactory.getInstance()
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
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
        classFactory.setModelFactory(mf)
        classFactory.setValueFactory(vf)
        classFactory.setValueConverterRegistry(vcr)
        dataMappingFactory.setValueFactory(vf)
        dataMappingFactory.setModelFactory(mf)
        dataMappingFactory.setValueConverterRegistry(vcr)
        objectMappingFactory.setModelFactory(mf)
        objectMappingFactory.setValueFactory(vf)
        objectMappingFactory.setValueConverterRegistry(vcr)
        propertyMappingFactory.setModelFactory(mf)
        propertyMappingFactory.setValueFactory(vf)
        propertyMappingFactory.setValueConverterRegistry(vcr)

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

        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream()
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE))
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

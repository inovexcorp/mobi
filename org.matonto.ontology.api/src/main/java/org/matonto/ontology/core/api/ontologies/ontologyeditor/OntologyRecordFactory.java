
package org.matonto.ontology.core.api.ontologies.ontologyeditor;

/*-
 * #%L
 * org.matonto.ontology.api
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

import java.util.HashSet;
import java.util.Set;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.catalog.api.ontologies.mcat.MCAT_Thing;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.AbstractOrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;


/**
 * This {@link org.matonto.rdf.orm.OrmFactory} implementation will construct OntologyRecord objects.  It will be published as an OSGi service.  See http://matonto.org/ontologies/ontology-editor#OntologyRecord for more information.
 * 
 */
@Component(provide = {
    org.matonto.rdf.orm.OrmFactory.class,
    org.matonto.rdf.orm.conversion.ValueConverter.class,
    OntologyRecordFactory.class
})
public class OntologyRecordFactory
    extends AbstractOrmFactory<OntologyRecord>
{


    public OntologyRecordFactory() {
        super(OntologyRecord.class, OntologyRecordImpl.class);
    }

    @Override
    public OntologyRecord getExisting(Resource resource, Model model, ValueFactory valueFactory, ValueConverterRegistry valueConverterRegistry) {
        return new OntologyRecordImpl(resource, model, valueFactory, valueConverterRegistry);
    }

    @Override
    public IRI getTypeIRI() {
        return valueFactory.createIRI(OntologyRecord.TYPE);
    }

    @Override
    public Set<IRI> getParentTypeIRIs() {
        final Set<IRI> set = new HashSet<IRI>();
        set.add(valueFactory.createIRI(VersionedRDFRecord.TYPE));
        set.add(valueFactory.createIRI(MCAT_Thing.TYPE));
        set.add(valueFactory.createIRI(Thing.TYPE));
        set.add(valueFactory.createIRI(VersionedRecord.TYPE));
        set.add(valueFactory.createIRI(Record.TYPE));
        set.add(valueFactory.createIRI(OntologyEditor_Thing.TYPE));
        return set;
    }

    @Override
    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Override
    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Override
    @Reference
    public void setValueConverterRegistry(ValueConverterRegistry valueConverterRegistry) {
        this.valueConverterRegistry = valueConverterRegistry;
    }

}

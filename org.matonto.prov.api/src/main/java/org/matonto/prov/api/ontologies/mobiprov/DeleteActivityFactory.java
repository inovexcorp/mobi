
package org.matonto.prov.api.ontologies.mobiprov;

/*-
 * #%L
 * org.matonto.prov.api
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
import java.util.Optional;
import java.util.Set;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.ontologies.provo.Activity;
import org.matonto.ontologies.provo._Thing;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.AbstractOrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;


/**
 * This {@link org.matonto.rdf.orm.OrmFactory} implementation will construct DeleteActivity objects.  It will be published as an OSGi service.  See http://matonto.org/ontologies/prov#DeleteActivity for more information.
 * 
 */
@Component(provide = {
    org.matonto.rdf.orm.OrmFactory.class,
    org.matonto.rdf.orm.conversion.ValueConverter.class,
    DeleteActivityFactory.class
})
public class DeleteActivityFactory
    extends AbstractOrmFactory<DeleteActivity>
{


    public DeleteActivityFactory() {
        super(DeleteActivity.class, DeleteActivityImpl.class);
    }

    @Override
    public Optional<DeleteActivity> getExisting(Resource resource, Model model, ValueFactory valueFactory, ValueConverterRegistry valueConverterRegistry) {
        return (model.filter(resource, valueFactory.createIRI(RDF_TYPE_IRI), this.getTypeIRI()).isEmpty()?Optional.empty():Optional.of(new DeleteActivityImpl(resource, model, valueFactory, valueConverterRegistry)));
    }

    @Override
    public IRI getTypeIRI() {
        return valueFactory.createIRI(DeleteActivity.TYPE);
    }

    @Override
    public Set<IRI> getParentTypeIRIs() {
        final Set<IRI> set = new HashSet<IRI>();
        set.add(valueFactory.createIRI(Activity.TYPE));
        set.add(valueFactory.createIRI(_Thing.TYPE));
        set.add(valueFactory.createIRI(Thing.TYPE));
        set.add(valueFactory.createIRI(MobiProv_Thing.TYPE));
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

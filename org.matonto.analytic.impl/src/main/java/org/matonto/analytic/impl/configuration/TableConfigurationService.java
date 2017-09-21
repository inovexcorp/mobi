package org.matonto.analytic.impl.configuration;

/*-
 * #%L
 * org.matonto.analytic.impl
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.analytic.api.configuration.BaseConfigurationService;
import org.matonto.analytic.api.configuration.ConfigurationService;
import org.matonto.analytic.api.jaxb.TableDetails;
import org.matonto.analytic.ontologies.analytic.TableConfiguration;
import org.matonto.analytic.ontologies.analytic.TableConfigurationFactory;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.impl.ThingFactory;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        provide = { ConfigurationService.class, TableConfigurationService.class }
)
public class TableConfigurationService extends BaseConfigurationService<TableConfiguration> {
    @Reference
    protected void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    protected void setTableConfigurationFactory(TableConfigurationFactory ormFactory) {
        this.ormFactory = ormFactory;
    }

    @Reference
    protected void setDatasetRecordFactory(DatasetRecordFactory datasetRecordFactory) {
        this.datasetRecordFactory = datasetRecordFactory;
    }

    @Override
    public String getTypeIRI() {
        return TableConfiguration.TYPE;
    }

    @Override
    public TableConfiguration create(String json) {
        TableDetails details = unmarshal(json, TableDetails.class);
        TableConfiguration configuration = super.create(json);
        configuration.setRow(vf.createIRI(details.getRow()));
        configuration.setColumn(details.getColumns().stream().map(vf::createIRI).collect(Collectors.toSet()));
        return configuration;
    }
}

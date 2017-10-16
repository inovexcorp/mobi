package com.mobi.analytic.impl.configuration;

/*-
 * #%L
 * com.mobi.analytic.impl
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
import com.mobi.analytic.api.configuration.BaseConfigurationService;
import com.mobi.analytic.api.configuration.ConfigurationService;
import com.mobi.analytic.ontologies.analytic.Configuration;
import com.mobi.analytic.ontologies.analytic.ConfigurationFactory;
import com.mobi.dataset.ontology.dataset.DatasetRecordFactory;
import com.mobi.rdf.api.ValueFactory;

@Component(
        immediate = true,
        provide = { ConfigurationService.class, SimpleConfigurationService.class }
)
public class SimpleConfigurationService extends BaseConfigurationService<Configuration> {
    @Reference
    protected void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    protected void setConfigurationFactory(ConfigurationFactory ormFactory) {
        this.ormFactory = ormFactory;
    }

    @Reference void setDatasetRecordFactory(DatasetRecordFactory datasetRecordFactory) {
        this.datasetRecordFactory = datasetRecordFactory;
    }

    @Override
    public String getTypeIRI() {
        return Configuration.TYPE;
    }
}

package com.mobi.etl.service.workflows.routefactories;

/*-
 * #%L
 * com.mobi.etl.workflows
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
import org.apache.camel.CamelContext;
import org.apache.camel.Endpoint;
import org.apache.camel.component.timer.TimerComponent;
import org.apache.camel.component.timer.TimerEndpoint;
import com.mobi.etl.api.ontologies.etl.DataSource;
import com.mobi.etl.api.workflows.DataSourceRouteFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

@Component(immediate = true)
public class SimpleDataSourceRouteFactory implements DataSourceRouteFactory<DataSource> {

    private ValueFactory vf;
    private CamelContext context;

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setContext(CamelContext context) {
        this.context = context;
    }

    @Override
    public Class<DataSource> getType() {
        return DataSource.class;
    }

    @Override
    public Resource getTypeIRI() {
        return vf.createIRI(DataSource.TYPE);
    }

    @Override
    public Endpoint getEndpoint(DataSource dataSource) {
        TimerComponent comp = new TimerComponent();
        TimerEndpoint endpoint = new TimerEndpoint("timer://foo?period=60s", comp, "foo");
        endpoint.setCamelContext(context);
        return endpoint;
    }
}

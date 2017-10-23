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
import com.mobi.etl.api.ontologies.etl.Destination;
import com.mobi.etl.api.workflows.DestinationRouteFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import org.apache.camel.CamelContext;
import org.apache.camel.Endpoint;
import org.apache.camel.component.log.LogComponent;
import org.apache.camel.component.log.LogEndpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(immediate = true)
public class SimpleDestinationRouteFactory implements DestinationRouteFactory<Destination> {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleDestinationRouteFactory.class);
    private ValueFactory vf;
    private CamelContext context;

    @Reference
    void setContext(CamelContext context) {
        this.context = context;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public Class<Destination> getType() {
        return Destination.class;
    }

    @Override
    public Resource getTypeIRI() {
        return vf.createIRI(Destination.TYPE);
    }

    @Override
    public Endpoint getEndpoint(Destination destination) {
        LogComponent comp = new LogComponent();
        LogEndpoint endpoint = new LogEndpoint("log:com.mobi.etl.service.workflows.routefactories", comp,
                exchange -> LOG.info("Destination received message"));
        endpoint.setCamelContext(context);
        return endpoint;
    }
}

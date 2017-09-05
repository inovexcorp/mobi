package org.matonto.etl.service.workflows;

/*-
 * #%L
 * org.matonto.etl.workflows
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
import org.apache.camel.Processor;
import org.apache.camel.builder.RouteBuilder;
import org.matonto.etl.api.ontologies.etl.Workflow;
import org.matonto.etl.api.workflows.WorkflowConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class WorkflowConverterImpl implements WorkflowConverter {
    private static final Logger LOG = LoggerFactory.getLogger(WorkflowConverterImpl.class);

    @Override
    public RouteBuilder convert(Workflow workflow) {
        Processor processor = exchange -> LOG.debug("Called with exchange: " + exchange);
        return new RouteBuilder() {
            @Override
            public void configure() throws Exception {
                from("direct:a").routeId("foo").process(processor);
            }
        };
    }
}

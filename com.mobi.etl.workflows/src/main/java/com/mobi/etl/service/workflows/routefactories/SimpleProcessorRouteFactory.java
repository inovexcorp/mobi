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
import com.mobi.etl.api.ontologies.etl.Processor;
import com.mobi.etl.api.workflows.ProcessorRouteFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import org.apache.camel.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.stream.Collectors;

@Component(immediate = true)
public class SimpleProcessorRouteFactory implements ProcessorRouteFactory<Processor> {
    private static final Logger LOG = LoggerFactory.getLogger(SimpleProcessorRouteFactory.class);
    private ValueFactory vf;

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public Class<Processor> getType() {
        return Processor.class;
    }

    @Override
    public Resource getTypeIRI() {
        return vf.createIRI(Processor.TYPE);
    }

    @Override
    public org.apache.camel.Processor getProcessor(Processor processor) {
        return exchange -> {
            Message in = exchange.getIn();
            Map<String, Object> headers = in.getHeaders();
            LOG.info("Processor received message: " + in.getBody());
            LOG.info("Message headers:\n" + String.join("\n", headers.keySet().stream()
                    .map(key -> "\t" + key + " - " + headers.get(key))
                    .collect(Collectors.toSet())));
        };
    }
}

package com.mobi.etl.service.workflows;

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

import com.mobi.etl.api.ontologies.etl.Workflow;
import com.mobi.rest.util.RestUtils;
import org.apache.camel.CamelContext;
import org.apache.camel.core.osgi.OsgiDefaultCamelContext;
import org.apache.camel.core.osgi.OsgiServiceRegistry;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;

import java.util.Hashtable;

public class MobiCamelContext extends OsgiDefaultCamelContext {

    private ServiceRegistration<?> registration;
    private Workflow workflow;

    public MobiCamelContext(BundleContext bundleContext, Workflow workflow) throws Exception {
        super(bundleContext, new OsgiServiceRegistry(bundleContext));
        this.workflow = workflow;
        this.setName(RestUtils.encode(workflow.getResource().stringValue()));
        registration = bundleContext.registerService(new String[] {MobiCamelContext.class.getName(), CamelContext.class.getName()}, this, new Hashtable<>());
        this.start();
    }

    public void remove() throws Exception {
        this.shutdown();
        registration.unregister();
        registration = null;
    }

    public Workflow getWorkflow() {
        return workflow;
    }
}

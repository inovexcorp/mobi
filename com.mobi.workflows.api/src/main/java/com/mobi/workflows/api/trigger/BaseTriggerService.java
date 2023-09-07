package com.mobi.workflows.api.trigger;

/*-
 * #%L
 * com.mobi.workflows.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.workflows.api.WorkflowsTopics;
import com.mobi.workflows.api.ontologies.workflows.Trigger;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

public abstract class BaseTriggerService<T extends Trigger> implements TriggerService<T> {
    private final Logger log = LoggerFactory.getLogger(BaseTriggerService.class);
    protected Resource triggerId;
    protected Resource workflowId;

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    protected EventAdmin eventAdmin;

    protected void startService(Map<String, Object> properties) {
        this.workflowId = vf.createIRI(properties.get("workflowId").toString());
        this.triggerId = vf.createIRI(properties.get("triggerId").toString());
    }

    @Override
    public void trigger() {
        if (eventAdmin != null) {
            log.debug("Posting Event to start Workflow " + workflowId);
            Map<String, Object> eventProps = new HashMap<>();
            eventProps.put(WorkflowsTopics.START_PROPERTY_WORKFLOW, workflowId);
            eventProps.put(WorkflowsTopics.START_PROPERTY_TRIGGER, triggerId);
            Event event = new Event(WorkflowsTopics.TOPIC_START, eventProps);
            eventAdmin.postEvent(event);
            log.debug("Posted Event to start Workflow " + workflowId);
        }
    }
}

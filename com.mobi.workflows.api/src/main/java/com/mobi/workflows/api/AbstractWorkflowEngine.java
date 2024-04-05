package com.mobi.workflows.api;

/*-
 * #%L
 * com.mobi.workflows.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.ontologies.provo.Activity;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

public abstract class AbstractWorkflowEngine implements WorkflowEngine {

    private final Logger log = LoggerFactory.getLogger(AbstractWorkflowEngine.class);

    @Reference
    public ProvenanceService provService;

    protected EventAdmin eventAdmin;

    protected void finalizeActivity(Activity activity) {
        activity.addEndedAtTime(OffsetDateTime.now());
    }

    protected void removeActivity(Activity activity) {
        if (activity != null) {
            provService.deleteActivity(activity.getResource());
        }
    }

    protected void endExecutionActivity(WorkflowExecutionActivity executionActivity, BinaryFile logs,
                                        boolean succeeded) {
        if (logs != null) {
            executionActivity.addLogs(logs);
        }
        executionActivity.setSucceeded(succeeded);
        finalizeActivity(executionActivity);
        provService.updateActivity(executionActivity);
        // Notify of activity end
        Map<String, Object> eventProps = new HashMap<>();
        eventProps.put(WorkflowsTopics.ACTIVITY_PROPERTY_ACTIVITY, executionActivity.getResource());
        Event event = new Event(WorkflowsTopics.TOPIC_ACTIVITY_END, eventProps);
        eventAdmin.postEvent(event);
    }

    protected static LocalDateTime verifyStartDate(LocalDateTime priorValue, LocalDateTime newValue) {
        if (priorValue == null && newValue != null) {
            return newValue;
        } else if (priorValue != null && newValue != null) {
            if (newValue.isBefore(priorValue)) {
                return newValue;
            }
        }
        return priorValue;
    }

    protected static LocalDateTime verifyStopDate(LocalDateTime priorValue, LocalDateTime newValue) {
        if (priorValue == null && newValue != null) {
            return newValue;
        } else if (priorValue != null && newValue != null) {
            if (newValue.isAfter(priorValue)) {
                return newValue;
            }
        }
        return priorValue;
    }
}

package com.mobi.workflows.api;

/*-
 * #%L
 * com.mobi.workflows.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import com.mobi.sse.SSEUtils;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.EventAdmin;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadPoolExecutor;

public abstract class AbstractWorkflowEngine implements WorkflowEngine {
    @Reference
    public ProvenanceService provService;

    protected final ValueFactory vf = new ValidatingValueFactory();
    protected static final List<Resource> executingWorkflows = new ArrayList<>();
    protected static ThreadPoolExecutor threadPool;
    protected static final String LOG_FILE_NAMESPACE = "https://mobi.solutions/workflows/log-files/";
    protected static final String ACTION_EXECUTION_NAMESPACE = "https://mobi.solutions/workflows/ActionExecution/";

    protected EventAdmin eventAdmin;

    /**
     * Retrieves the engine's list of currently executing workflows.
     *
     * @return An array of {@link Resource} that represent the workflow id of the executing workflows.
     */
    public List<Resource> getExecutingWorkflows() {
        return executingWorkflows;
    }

    @Override
    public void endExecutionActivity(WorkflowExecutionActivity executionActivity, BinaryFile logs,
                                     boolean succeeded) {
        if (logs != null) {
            executionActivity.addLogs(logs);
        }
        executionActivity.setSucceeded(succeeded);
        executionActivity.addEndedAtTime(OffsetDateTime.now());
        provService.updateActivity(executionActivity);
        // Notify of activity end
        SSEUtils.postEvent(eventAdmin, WorkflowsTopics.TOPIC_ACTIVITY_END,
                executionActivity.getModel().filter(executionActivity.getResource(), null, null));
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

    protected void removeActivity(Activity activity) {
        if (activity != null) {
            provService.deleteActivity(activity.getResource());
        }
    }
}

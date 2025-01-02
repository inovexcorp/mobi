/*-
 * #%L
 * com.mobi.web
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
import { WorkflowStatus } from './workflow-status.type';

/**
 * Interface representing a workflow object.
 */
export interface WorkflowSchema {
    /**
     * The unique identifier (IRI) of the record.
     * */
    iri: string;
    /**
     * The title or name of the workflow.
     */
    title: string;
    /**
     * The date and time when the workflow was issued.
     */
    issued: Date;
    /**
     * The date and time when the workflow was modified.
     */
    modified: Date;
    /**
     * Workflow description.
     */
    description: string;
    /**
     * Workflow Active status.
     */
    active: boolean;
    /**
     * The unique identifier (IRI) of the Workflow.
     */
    workflowIRI: string;
    /**
     * The unique identifier (IRI) of the workflow executor
     */
    executorIri?: string;
    /**
     * The ID of last execution
     */
    executionId?: string;
    /**
     * The username of the last user who executed the Workflow.
     */
    executorUsername?: string;
    /**
     * The Name of  the last user who executed the Workflow.
     */
    executorDisplayName?: string;
    /**
     * The start Date and time of the latest execution of the Workflow
     */
    startTime?: Date;
    /**
     * The End Date and time of the latest execution of the Workflow
     */
    endTime?: Date;
    /**
     * Indicates whether the workflow Succeeded or not.
     */
    succeeded?: string;
    /**
     * The status of the Workflow (failure|started|success|never_run)
     */
    status?: WorkflowStatus;
    /**
     * The unique identifier (IRI) of the master branch
     */
    master?: string;
    /**
     * A boolean value reflecting whether the current user can modify the master branch. 
     * Not returned from the REST endpoint.
     */
    canModifyMasterBranch?: boolean;
    /**
     * A boolean value reflecting whether the current user can delete the workflow. 
     * Not returned from the REST endpoint.
     */
    canDeleteWorkflow?: boolean;
}

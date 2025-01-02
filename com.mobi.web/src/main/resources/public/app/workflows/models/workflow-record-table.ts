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
import { WorkflowSchema } from './workflow-record.interface';
/**
 * Interface representing a workflow table record.
 */
interface WorkflowDataRow {
    /**
     * Whether the workflow is checked in the Landing page
     */
    checked?: boolean;
    /**
     * The Record
     * */
    record: WorkflowSchema;
    /**
     * The status of the Workflow (Running|Succeeded|Failed)
     */
    statusDisplay: string;
    /**
     * The Name of the last user who executed the Workflow.
     */
    executorDisplay: string;
    /**
     * The ID of last execution
     */
    executionIdDisplay: string;
    /**
     * The start Date and time of the latest execution of the Workflow
     */
    startTimeDisplay: string;
    /**
     * The End Date and time of the latest execution of the Workflow
     */
    runningTimeDisplay: string;
}
//https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
export type { WorkflowDataRow };

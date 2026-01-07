package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;

@Command(scope = "mobi", name = "restore", description = "Restores Mobi backup and will handle migration if versions "
        + "differ")
@Service
public class Restore implements Action {

    @Reference
    private RestoreService restoreService;

    // Command Parameters
    @Argument(name = "BackupFile", description = "The Mobi backup to restore", required = true)
    @Completion(FileCompleter.class)
    public String backupFilePath = null;

    @Option(name = "-b", aliases = "--batchSize", description = "The number representing the triple transaction size "
            + "for importing.")
    private long batchSize = 10000;

    // Implementation

    /**
     * Execute Restore.
     * Steps:
     * - Unzip backup zip file
     * - Read Manifest File
     * - ConfigRestoreOperationHandler
     * - PreRestoreOperationHandler
     * - Clear All Repos
     * - Restore Repos
     * - PostRestoreOperationHandler
     * - Clear temp restore folder
     * - Restart XACMLPolicyManager bundle - recreate policies that were deleted
     * - Restarting all services
     *
     * @return Object
     * @throws Exception An error occurs
     */
    @Override
    public Object execute() throws Exception {
        restoreService.execute(backupFilePath, batchSize);
        return null;
    }
}

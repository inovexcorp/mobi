package com.mobi.persistence.cli;

/*-
 * #%L
 * com.mobi.persistence.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.mobi.repository.config.RepositoryConfig;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.table.ShellTable;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.config.RepositoryConfig;

@Command(scope = "mobi", name = "repository-list", description = "Lists the currently managed repositories.")
@Service
public class RepositoryList implements Action {

    @Reference
    private RepositoryManager repositoryManager;

    public void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    public void unsetRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = null;
    }

    @Override
    public Object execute() throws Exception {

        ShellTable table = new ShellTable();
        table.column("ID");
        table.column("Title");
        table.emptyTableText("No Repositories");

        if (repositoryManager != null) {
            repositoryManager.getAllRepositories().forEach((repoID, repo) -> {
                RepositoryConfig config = repo.getConfig();
                table.addRow().addContent(config.id(), config.title());
            });
        }

        table.print(System.out);
        return null;
    }
}

package org.matonto.persistence.cli;

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.table.ShellTable;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.config.RepositoryConfig;

@Command(scope = "matonto", name = "repository-list", description = "Lists the currently managed repositories.")
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

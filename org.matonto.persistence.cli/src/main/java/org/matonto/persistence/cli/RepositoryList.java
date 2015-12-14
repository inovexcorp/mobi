package org.matonto.persistence.cli;

import aQute.bnd.annotation.component.Reference;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.table.ShellTable;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.config.RepositoryConfig;

import java.util.Set;

@Command(scope = "matonto", name = "repository-list", description = "Lists the currently managed repositories.")
@Service
public class RepositoryList implements Action {

    private RepositoryManager repositoryManager;

    @Reference
    public void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Override
    public Object execute() throws Exception {

        ShellTable table = new ShellTable();
        table.column("ID");
        table.column("Title");
        table.emptyTableText("No Repositories");

        Set<String> repos = repositoryManager.getAllRepositories().keySet();

        repositoryManager.getAllRepositories().forEach((repoID, repo) -> {
            RepositoryConfig config = repo.getConfig();
            table.addRow().addContent(config.id(), config.title());
        });

        table.print(System.out);
        return null;
    }
}

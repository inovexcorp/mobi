package org.matonto.sparql.cli;

/*-
 * #%L
 * org.matonto.sparql.cli
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

import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.table.ShellTable;
import org.matonto.exception.MatOntoException;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.Value;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

@Command(scope = "mobi", name = "query", description = "Queries a repository")
@Service
public class Query implements Action {

    // Service References

    @Reference
    private RepositoryManager repoManager;

    public void setRepoManager(RepositoryManager repoManager) {
        this.repoManager = repoManager;
    }

    // Command Parameters

    @Option(name = "-r", aliases = "--repository", description = "The id of the repository that data will be queried")
    private String repositoryParam = null;

    @Option(name = "-f", aliases = "--query-file", description = "The input query file")
    private String queryFileParam = null;

    @Argument(name = "Query", description = "The SPARQL query (ignored if query file provided)")
    private String queryParam = null;

    // Implementation

    @Override
    public Object execute() throws Exception {
        // Get Query String
        String queryString;
        if (queryFileParam != null) {
            try {
                queryString = new String(Files.readAllBytes(Paths.get(queryFileParam)));
            } catch (IOException e) {
                throw new MatOntoException(e);
            }
        } else {
            queryString = queryParam;
        }

        // Get Repo
        if (StringUtils.isEmpty(repositoryParam)) {
            repositoryParam = "system";
        }

        Optional<Repository> repoOpt = repoManager.getRepository(repositoryParam);

        if (!repoOpt.isPresent()) {
            System.out.println("ERROR: Repository not found.");
            return null;
        }

        // Execute Query
        executeQuery(repoOpt.get(), queryString);
        
        return null;
    }

    private void executeQuery(Repository repository, String queryString) {
        try(RepositoryConnection conn = repository.getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            TupleQueryResult result = query.evaluate();

            List<String> bindingNames = result.getBindingNames();

            ShellTable table = new ShellTable();
            bindingNames.forEach(table::column);
            table.emptyTableText("\n");

            String[] content = new String[bindingNames.size()];

            result.forEach(bindings -> {
                IntStream.range(0, bindingNames.size()).forEach(index
                        -> buildRow(index, bindings.getValue(bindingNames.get(index)), content));

                table.addRow().addContent(content);
            });

            table.print(System.out);
        }
    }

    private void buildRow(final int index, final Optional<Value> valueOpt, final String[] content) {
        final String value = valueOpt.isPresent() ? valueOpt.get().stringValue() : "";
        content[index] = value;
    }
}

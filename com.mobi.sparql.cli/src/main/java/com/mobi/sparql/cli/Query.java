package com.mobi.sparql.cli;

/*-
 * #%L
 * com.mobi.sparql.cli
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

import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.StatementIterable;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.GraphQueryResult;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.Value;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.table.ShellTable;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.parser.ParsedGraphQuery;
import org.eclipse.rdf4j.query.parser.ParsedOperation;
import org.eclipse.rdf4j.query.parser.ParsedQuery;
import org.eclipse.rdf4j.query.parser.ParsedTupleQuery;
import org.eclipse.rdf4j.query.parser.QueryParserUtil;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.IntStream;

@Command(scope = "mobi", name = "query", description = "Queries a repository")
@Service
public class Query implements Action {

    protected static final Map<String, RDFFormat> formats;

    static {
        formats = new HashMap<>();
        formats.put("ttl", RDFFormat.TURTLE);
        formats.put("trig", RDFFormat.TRIG);
        formats.put("trix", RDFFormat.TRIX);
        formats.put("rdf/xml", RDFFormat.RDFXML);
        formats.put("jsonld", RDFFormat.JSONLD);
        formats.put("n3", RDFFormat.N3);
        formats.put("nquads", RDFFormat.NQUADS);
        formats.put("ntriples", RDFFormat.NTRIPLES);
    }

    // Service References

    @Reference
    private RepositoryManager repoManager;

    @Reference
    private SesameTransformer transformer;

    public void setRepoManager(RepositoryManager repoManager) {
        this.repoManager = repoManager;
    }

    public void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    // Command Parameters

    @Option(name = "-r", aliases = "--repository", description = "The id of the repository that data will be queried")
    private String repositoryParam = null;

    @Option(name = "-f", aliases = "--query-file", description = "The input query file")
    private String queryFileParam = null;

    @Argument(name = "Query", description = "The SPARQL query (ignored if query file provided). NOTE: Any % symbols as"
            + " a result of URL encoding must be escaped.")
    private String queryParam = null;

    @Option(name = "-t", aliases = "--format", description = "The output format (ttl, trig, trix, rdf/xml, jsonld, "
            + "n3, nquads, ntriples)")
    private String formatParam = null;

    // Implementation

    @Override
    public Object execute() throws Exception {
        // Get Query String
        String queryString;
        if (queryFileParam != null) {
            try {
                queryString = new String(Files.readAllBytes(Paths.get(queryFileParam)));
            } catch (IOException e) {
                throw new MobiException(e);
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

        // Parse Query
        ParsedOperation parsedOperation = QueryParserUtil.parseOperation(QueryLanguage.SPARQL, queryString, null);

        // Execute Query
        if (parsedOperation instanceof ParsedQuery) {
            if (parsedOperation instanceof ParsedTupleQuery) {
                executeTupleQuery(repoOpt.get(), queryString);
            } else if (parsedOperation instanceof ParsedGraphQuery) {
                executeGraphQuery(repoOpt.get(), queryString);
            } else {
                System.out.println("Query type not supported.");
            }
        } else {
            System.out.println("Update queries not supported.");
        }

        return null;
    }

    private void executeTupleQuery(Repository repository, String queryString) {
        long connTime = 0;
        long prepTime = 0;
        long execTime = 0;
        long printTime = 0;
        StopWatch watch = new StopWatch();
        watch.start();

        try (RepositoryConnection conn = repository.getConnection()) {
            watch.stop();
            connTime = watch.getTime();
            watch.reset();

            watch.start();
            TupleQuery query = conn.prepareTupleQuery(queryString);
            watch.stop();
            prepTime = watch.getTime();
            watch.reset();
            watch.start();
            TupleQueryResult result = query.evaluateAndReturn();
            watch.stop();
            execTime = watch.getTime();
            watch.reset();
            watch.start();

            List<String> bindingNames = result.getBindingNames();

            ShellTable table = new ShellTable();
            bindingNames.forEach(table::column);
            table.emptyTableText("\n");

            String[] content = new String[bindingNames.size()];

            result.forEach(bindings -> {
                IntStream.range(0, bindingNames.size()).forEach(index -> {
                    Optional<Value> valueOpt = bindings.getValue(bindingNames.get(index));
                    String value = valueOpt.isPresent() ? valueOpt.get().stringValue() : "";
                    content[index] = value;
                });

                table.addRow().addContent(content);
            });
            watch.stop();
            printTime = watch.getTime();
            watch.reset();

            table.print(System.out);
        }
        System.out.println("Conn time : " + connTime);
        System.out.println("Prep time : " + prepTime);
        System.out.println("Exec time : " + execTime);
        System.out.println("Print time: " + printTime);
    }

    private void executeGraphQuery(Repository repository, String queryString) {
        try (RepositoryConnection conn = repository.getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(queryString);
            GraphQueryResult result = query.evaluate();

            OutputStream out = System.out;
            RDFFormat format = getFormat();

            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, out));
            Rio.write(new StatementIterable(result, transformer), rdfWriter);
        }
    }

    private RDFFormat getFormat() {
        if (formatParam != null && formats.containsKey(formatParam)) {
            return formats.get(formatParam);
        } else {
            return RDFFormat.TRIG;
        }
    }
}

package com.mobi.sparql.cli;

/*-
 * #%L
 * com.mobi.sparql.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.builder.Difference;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.StatementIterable;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.sparql.cli.rdf4j.queryrenderer.MobiSPARQLQueryRenderer;
import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.apache.karaf.shell.support.table.ShellTable;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.Update;
import org.eclipse.rdf4j.query.algebra.Clear;
import org.eclipse.rdf4j.query.algebra.DeleteData;
import org.eclipse.rdf4j.query.algebra.InsertData;
import org.eclipse.rdf4j.query.algebra.Modify;
import org.eclipse.rdf4j.query.algebra.MultiProjection;
import org.eclipse.rdf4j.query.algebra.TupleExpr;
import org.eclipse.rdf4j.query.algebra.UpdateExpr;
import org.eclipse.rdf4j.query.parser.ParsedGraphQuery;
import org.eclipse.rdf4j.query.parser.ParsedOperation;
import org.eclipse.rdf4j.query.parser.ParsedQuery;
import org.eclipse.rdf4j.query.parser.ParsedTupleQuery;
import org.eclipse.rdf4j.query.parser.ParsedUpdate;
import org.eclipse.rdf4j.query.parser.QueryParserUtil;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

@Command(scope = "mobi", name = "query", description = "Queries a repository. Update queries have the potential to "
        + "affect system logic. Please use the --dry-run option to preview the results of all update queries before "
        + "they are run.")
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

    final ModelFactory mf = new DynamicModelFactory();
    final ValueFactory vf = new ValidatingValueFactory();

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
    @Completion(FileCompleter.class)
    private String queryFileParam = null;

    @Option(name = "-d", aliases = "--dry-run", description = "Run UPDATE query as a dry run to see what will change. "
            + "No results will be added/removed")
    private boolean dryRunParam;

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

        Optional<OsgiRepository> repoOpt = repoManager.getRepository(repositoryParam);
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
            if (parsedOperation instanceof ParsedUpdate) {
                if (dryRunParam) {
                    executeDryRunUpdate((ParsedUpdate) parsedOperation, repoOpt.get());
                } else {
                    executeUpdate(repoOpt.get(), queryString);
                }
            } else {
                System.out.println("Query type not supported.");
            }
        }

        return null;
    }

    void executeDryRunUpdate(ParsedUpdate parsedUpdate, OsgiRepository repository) throws Exception {
        Difference updateStatements = getUpdateStatements(parsedUpdate, repository);
        printResultTables(updateStatements.getAdditions(), updateStatements.getDeletions());
    }

    public Difference getUpdateStatements(ParsedUpdate parsedUpdate, OsgiRepository repository) throws Exception {
        List<UpdateExpr> updateExprs = parsedUpdate.getUpdateExprs();

        Model statementsToInsert = mf.createEmptyModel();
        Model statementsToDelete = mf.createEmptyModel();
        for (UpdateExpr queryAlgebra : updateExprs) {
            if (queryAlgebra instanceof Modify) {
                Modify modify = (Modify) queryAlgebra;
                TupleExpr where = modify.getWhereExpr();
                RewriteUpdateVisitor visitor = new RewriteUpdateVisitor(where);
                populateModifyStatements(modify.getInsertExpr(), statementsToInsert, visitor, repository);
                populateModifyStatements(modify.getDeleteExpr(), statementsToDelete, visitor, repository);
            } else if (queryAlgebra instanceof InsertData) {
                InsertData insertData = (InsertData) queryAlgebra;
                RewriteUpdateVisitor visitor = new RewriteUpdateVisitor();
                insertData.visit(visitor);
                populateUpdateStatements(visitor, repository, statementsToInsert, UpdateType.MODIFY_DATA);
            } else if (queryAlgebra instanceof DeleteData) {
                DeleteData deleteData = (DeleteData) queryAlgebra;
                RewriteUpdateVisitor visitor = new RewriteUpdateVisitor();
                deleteData.visit(visitor);
                populateUpdateStatements(visitor, repository, statementsToDelete, UpdateType.MODIFY_DATA);
            } else if (queryAlgebra instanceof Clear) {
                Clear deleteData = (Clear) queryAlgebra;
                RewriteUpdateVisitor visitor = new RewriteUpdateVisitor();
                deleteData.visit(visitor);
                populateUpdateStatements(visitor, repository, statementsToDelete, UpdateType.CLEAR);
            }
        }
        return new Difference.Builder().additions(statementsToInsert).deletions(statementsToDelete).build();
    }

    private void populateUpdateStatements(RewriteUpdateVisitor visitor, OsgiRepository repository, Model statements,
                                              UpdateType updateType)
            throws Exception {
        MobiSPARQLQueryRenderer renderer = new MobiSPARQLQueryRenderer();
        Map<String, MultiProjection> contextToMultiProjection = visitor.getMultiProjections();
        for (String key : contextToMultiProjection.keySet()) {
            String constructModifyData = renderer.render(new ParsedGraphQuery(contextToMultiProjection.get(key)));
            try (RepositoryConnection conn = repository.getConnection()) {
                Pattern wherePattern = Pattern.compile("where", Pattern.CASE_INSENSITIVE);
                if (updateType.equals(UpdateType.MODIFY_DATA) && !wherePattern.matcher(constructModifyData).find()) {
                    constructModifyData = constructModifyData + "WHERE {}";
                }
                GraphQuery query = conn.prepareGraphQuery(constructModifyData);
                if (updateType.equals(UpdateType.CLEAR)) {
                    assert !key.isEmpty();
                }

                // Here we handle reconstructing the queries into a single model. An UPDATE query can be broken out into
                // many CONSTRUCT queries based on the INSERT/DELETE and if there are GRAPH clauses in the INSERT/DELETE
                // clauses. If there is a hardcoded graph name, then it is set as the key in the multivalued map. If
                // there is a variable for a graph, then additional triples are set specifying what subjects are in
                // that graph. This is used to build out a map of Subjects to Contexts so that when the results are all
                // combined, you can say which statements have a context associated with it in the INSERT/DELETE.
                Model results = QueryResults.asModel(query.evaluate(), mf);
                Model graphStatements = results.filter(null, vf.createIRI(RewriteUpdateVisitor.GRAPH_PREDICATE), null);
                int graphStatementsSize = graphStatements.size();
                Map<Resource, List<Resource>> subjectToContext = new HashMap<>();
                if (graphStatementsSize > 0) {
                    graphStatements.forEach(statement -> {
                        Resource context = (Resource) statement.getObject();
                        Resource subject = statement.getSubject();
                        List<Resource> contexts = subjectToContext.getOrDefault(subject, new ArrayList<>());
                        contexts.add(context);
                        subjectToContext.put(subject, contexts);
                    });
                }
                results.remove(null,  vf.createIRI(RewriteUpdateVisitor.GRAPH_PREDICATE), null);
                results.forEach(statement -> {
                    if (!key.isEmpty() && graphStatementsSize > 0) {
                        Resource[] contextArray = subjectToContext.get(statement.getSubject()).toArray(new Resource[0]);
                        statements.add(statement.getSubject(), statement.getPredicate(), statement.getObject(),
                                contextArray);
                    } else if (key.isEmpty()) {
                        statements.add(statement.getSubject(), statement.getPredicate(), statement.getObject());
                    } else {
                        statements.add(statement.getSubject(), statement.getPredicate(), statement.getObject(),
                                vf.createIRI(key));
                    }
                });
            }
        }
    }

    // For Insert and Delete queries
    private void populateModifyStatements(TupleExpr modifyExpr, Model statements, RewriteUpdateVisitor visitor,
                                          OsgiRepository repository) throws Exception {
        if (modifyExpr != null) {
            visitor.reset(false);
            modifyExpr.visit(visitor);
            populateUpdateStatements(visitor, repository, statements, UpdateType.MODIFY);
        }
    }

    private void executeTupleQuery(OsgiRepository repository, String queryString) {
        try (RepositoryConnection conn = repository.getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            TupleQueryResult result = query.evaluate();

            List<String> bindingNames = result.getBindingNames();

            ShellTable table = new ShellTable();
            bindingNames.forEach(table::column);
            table.emptyTableText("\n");

            String[] content = new String[bindingNames.size()];

            result.forEach(bindings -> {
                IntStream.range(0, bindingNames.size()).forEach(index -> {
                    Optional<Value> valueOpt = Optional.ofNullable(bindings.getValue(bindingNames.get(index)));
                    String value = valueOpt.isPresent() ? valueOpt.get().stringValue() : "";
                    content[index] = value;
                });

                table.addRow().addContent(content);
            });

            table.print(System.out);
        }
    }

    private void printResultTables(Iterable<Statement> statementsToInsert, Iterable<Statement> statementsToDelete) {
        System.out.println("\nAdditions: \n");
        printResultTable(statementsToInsert);
        System.out.println("\n\nDeletions: \n");
        printResultTable(statementsToDelete);
    }

    private void printResultTable(Iterable<Statement> statements) {
        ShellTable table = new ShellTable();
        table.column("s");
        table.column("p");
        table.column("o");
        table.column("graph");
        table.emptyTableText("\n");

        String[] addContent = new String[4];

        statements.forEach(statement -> {
            addContent[0] = statement.getSubject().stringValue();
            addContent[1] = statement.getPredicate().stringValue();
            addContent[2] = statement.getObject().stringValue();
            addContent[3] = Optional.ofNullable(statement.getContext()).isPresent()
                    ? statement.getContext().stringValue() : "";
            table.addRow().addContent(addContent);
        });

        table.print(System.out);
    }

    private void executeUpdate(OsgiRepository repository, String queryString) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Update query = conn.prepareUpdate(queryString);
            long startTime = System.currentTimeMillis();
            query.execute();
            System.out.println("Update query executed successfully in " + (System.currentTimeMillis() - startTime)
                    + " ms.");
        }
    }

    private void executeGraphQuery(OsgiRepository repository, String queryString) {
        try (RepositoryConnection conn = repository.getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(queryString);
            GraphQueryResult result = query.evaluate();

            OutputStream out = System.out;
            RDFFormat format = getFormat();

            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, out));
            Rio.write(new StatementIterable(result), rdfWriter);
        }
    }

    private RDFFormat getFormat() {
        if (formatParam != null && formats.containsKey(formatParam)) {
            return formats.get(formatParam);
        } else {
            return RDFFormat.TRIG;
        }
    }

    private enum UpdateType {
        MODIFY, MODIFY_DATA, CLEAR
    }
}

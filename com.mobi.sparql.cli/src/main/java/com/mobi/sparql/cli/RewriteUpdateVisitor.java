package com.mobi.sparql.cli;

/*-
 * #%L
 * com.mobi.sparql.cli
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

import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.algebra.Clear;
import org.eclipse.rdf4j.query.algebra.DeleteData;
import org.eclipse.rdf4j.query.algebra.Extension;
import org.eclipse.rdf4j.query.algebra.ExtensionElem;
import org.eclipse.rdf4j.query.algebra.InsertData;
import org.eclipse.rdf4j.query.algebra.Join;
import org.eclipse.rdf4j.query.algebra.MultiProjection;
import org.eclipse.rdf4j.query.algebra.ProjectionElem;
import org.eclipse.rdf4j.query.algebra.ProjectionElemList;
import org.eclipse.rdf4j.query.algebra.QueryRoot;
import org.eclipse.rdf4j.query.algebra.Reduced;
import org.eclipse.rdf4j.query.algebra.StatementPattern;
import org.eclipse.rdf4j.query.algebra.TupleExpr;
import org.eclipse.rdf4j.query.algebra.ValueConstant;
import org.eclipse.rdf4j.query.algebra.Var;
import org.eclipse.rdf4j.query.algebra.helpers.AbstractQueryModelVisitor;
import org.eclipse.rdf4j.query.parser.ParsedQuery;
import org.eclipse.rdf4j.query.parser.QueryParserUtil;
import org.eclipse.rdf4j.query.parser.QueryPrologLexer;
import org.eclipse.rdf4j.query.parser.sparql.SPARQLParser;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RewriteUpdateVisitor extends AbstractQueryModelVisitor<RuntimeException> {
    private final Map<String, MultiProjection> contextToConstructQuery = new HashMap<>();
    private TupleExpr whereClause = null;

    public static final String GRAPH_PREDICATE = "http://mobi.com/query/cli/update#graphPredicate";

    public RewriteUpdateVisitor() {
    }

    public RewriteUpdateVisitor(TupleExpr whereClause) {
        this.whereClause = whereClause;
    }

    /**
     * Retrieves the {@link Map} of {@link String} to {@link MultiProjection} representing a CONSTRUCT query.
     *
     * @return A {@link Map} of {@link String} to {@link MultiProjection} representing a CONSTRUCT query
     */
    public Map<String, MultiProjection> getMultiProjections() {
        return contextToConstructQuery;
    }

    /**
     * Resets the internal MultiProjection. If {@code clearWhereClause} is true, resets the WHERE clause in the
     * {@link Extension}. If false, keeps the WHERE clause, but resets {@link ExtensionElem}.
     *
     * @param clearWhereClause Resets the WHERE clause if true; otherwise keeps the clause
     */
    public void reset(boolean clearWhereClause) {
        if (clearWhereClause) {
            whereClause = null;
        }
        contextToConstructQuery.clear();
    }

    @Override
    public void meet(Join join) {
        handleJoinArg(join.getLeftArg());
        handleJoinArg(join.getRightArg());
    }

    private void handleJoinArg(TupleExpr joinArg) {
        if (joinArg instanceof Join) {
            this.meet((Join) joinArg);
        } else {
            meet((StatementPattern) joinArg);
        }
    }

    @Override
    public void meet(StatementPattern statementPattern) {
        String key = "";
        boolean addGraphAsOwnTriple = false;
        Var context = statementPattern.getContextVar();
        if (context != null) {
            if (context.getValue() != null) {
                key = context.getValue().stringValue();
            } else {
                // Workaround to insert the variable value for the graph as its own statement when reconstructed
                key = "?" + context.getName();
                addGraphAsOwnTriple = true;
            }
        }
        MultiProjection multiProjection = contextToConstructQuery.getOrDefault(key, createMultiProjection());
        ProjectionElemList elemList = new ProjectionElemList();
        elemList.addElement(getProjectionElem(statementPattern.getSubjectVar(), "subject", multiProjection));
        elemList.addElement(getProjectionElem(statementPattern.getPredicateVar(), "predicate", multiProjection));
        elemList.addElement(getProjectionElem(statementPattern.getObjectVar(), "object", multiProjection));
        multiProjection.addProjection(elemList);

        if (addGraphAsOwnTriple) {
            // CONSTRUCT queries in RDF4j do not allow for GRAPH clauses. As a workaround, we can set the subject of
            // the statement to point to what GRAPH it belongs to when a variable for a graph is used.
            // i.e, <urn:subject> <http://mobi.com/query/cli/update#graphPredicate> <urn:someGraph>
            // This can be used on the return to reconstruct the values in the table.

            ProjectionElemList contextElemList = new ProjectionElemList();
            contextElemList.addElement(getProjectionElem(statementPattern.getSubjectVar(), "subject", multiProjection));

            String uuid = "const_" + UUID.randomUUID();
            ProjectionElem elem = new ProjectionElem();
            elem.setSourceName(uuid);
            elem.setTargetName("predicate");
            contextElemList.addElement(elem);

            contextElemList.addElement(getProjectionElem(context, "object", multiProjection));
            multiProjection.addProjection(contextElemList);

            Extension ext = (Extension) multiProjection.getArg();
            ext.addElement(new ExtensionElem(
                    new ValueConstant(new ValidatingValueFactory().createIRI(GRAPH_PREDICATE)), uuid));
        }
        contextToConstructQuery.put(key, multiProjection);
    }

    private ProjectionElem getProjectionElem(Var var, String target, MultiProjection multiProjection) {
        ProjectionElem elem = new ProjectionElem();
        elem.setSourceName(var.getName());
        elem.setTargetName(target);
        addExtensionElemIfPresent(var, multiProjection);
        return elem;
    }

    private void addExtensionElemIfPresent(Var var, MultiProjection multiProjection) {
        if (var.hasValue()) {
            Extension ext = (Extension) multiProjection.getArg();
            // Causes duplicate extension elements when iterated over. Is this an issue?
            ext.addElement(new ExtensionElem(new ValueConstant(var.getValue()), var.getName()));
        }
    }

    @Override
    public void meet(InsertData insertData) {
        String dataBlock = insertData.getDataBlock();
        String[] justQueryNoProlog = QueryParserUtil.removeSPARQLQueryProlog(dataBlock).split("\n");
        String[] queryLines = dataBlock.split("\n");
        int prologLength = queryLines.length - justQueryNoProlog.length;

        // Sanity check. If there is no prolog, the lexer should only return one token. If it doesn't, prolog
        // identification failed which only happens when there is only one statement pattern and zero graph clauses. In
        // this scenario, true prolog length will be query line number minus one.
        if ((prologLength == 0) && (QueryPrologLexer.lex(dataBlock).size() > 1)) {
            prologLength = queryLines.length - 1;
        }

        List<String> queryPrefixes = Arrays.asList(Arrays.copyOfRange(queryLines, 0, prologLength));
        List<String> queryWithoutPrefixes = Arrays.asList(Arrays.copyOfRange(queryLines, prologLength,
                queryLines.length));
        String queryBase = String.join(" ", queryWithoutPrefixes);

        Pattern graphPattern = Pattern.compile("graph", Pattern.CASE_INSENSITIVE);
        Matcher graphClauseMatcher = Pattern.compile("(?i)graph[^>]*>").matcher(queryBase);
        String[] graphClauses = queryBase.split("(?i)graph[^>]*>");
        graphClauses = Arrays.stream(graphClauses).filter(el -> !el.trim().isEmpty()).toArray(String[]::new);

        for (String graphClause : graphClauses) {
            String query = graphPattern.matcher(queryBase).find()
                    ? String.join(" ", queryPrefixes) + " CONSTRUCT " + graphClause
                    : String.join(" ", queryPrefixes) + " CONSTRUCT { " + graphClause + " } ";
            Pattern wherePattern = Pattern.compile("where", Pattern.CASE_INSENSITIVE);
            if (!wherePattern.matcher(query).find()) {
                query = query + "WHERE {}";
            }
            ParsedQuery constructQuery = new SPARQLParser().parseQuery(query, null);
            TupleExpr expr = constructQuery.getTupleExpr();
            if (expr instanceof Reduced) {
                Reduced reduced = (Reduced) expr;
                String context = graphClauseMatcher.find()
                        ? graphClauseMatcher.group(0).substring(graphClauseMatcher.group(0).indexOf("<") + 1,
                        graphClauseMatcher.group(0).indexOf(">")) : "";
                contextToConstructQuery.put(context, new MultiProjection(reduced.getArg()));
            } else if (expr instanceof MultiProjection) {
                String context = graphClauseMatcher.find()
                        ? graphClauseMatcher.group(0).substring(graphClauseMatcher.group(0).indexOf("<") + 1,
                        graphClauseMatcher.group(0).indexOf(">")) : "";
                contextToConstructQuery.put(context, (MultiProjection) expr);
            } else if (expr instanceof QueryRoot) {
                TupleExpr innerExpr = ((QueryRoot) expr).getArg();
                if (innerExpr instanceof Reduced) {
                    Reduced reduced = (Reduced) innerExpr;
                    String context = graphClauseMatcher.find()
                            ? graphClauseMatcher.group(0).substring(graphClauseMatcher.group(0).indexOf("<") + 1,
                            graphClauseMatcher.group(0).indexOf(">")) : "";
                    contextToConstructQuery.put(context, new MultiProjection(reduced.getArg()));
                }
            }
        }
    }

    @Override
    public void meet(DeleteData deleteData) {
        String dataBlock = deleteData.getDataBlock();
        String[] justQueryNoProlog = QueryParserUtil.removeSPARQLQueryProlog(dataBlock).split("\n");
        String[] queryLines = dataBlock.split("\n");
        int prologLength = queryLines.length - justQueryNoProlog.length;

        // Sanity check. If there is no prolog, the lexer should only return one token. If it doesn't, prolog
        // identification failed which only happens when there is only one statement pattern and zero graph clauses. In
        // this scenario, true prolog length will be query line number minus one.
        if ((prologLength == 0) && (QueryPrologLexer.lex(dataBlock).size() > 1)) {
            prologLength = queryLines.length - 1;
        }
        List<String> queryPrefixes = Arrays.asList(Arrays.copyOfRange(queryLines, 0, prologLength));
        List<String> queryWithoutPrefixes = Arrays.asList(Arrays.copyOfRange(queryLines, prologLength,
                queryLines.length));
        String queryBase = String.join(" ", queryWithoutPrefixes);

        Pattern graphPattern = Pattern.compile("graph", Pattern.CASE_INSENSITIVE);
        Matcher graphClauseMatcher = Pattern.compile("(?i)graph[^>]*>").matcher(queryBase);
        String[] graphClauses = queryBase.split("(?i)graph[^>]*>");
        graphClauses = Arrays.stream(graphClauses).filter(el -> !el.trim().isEmpty()).toArray(String[]::new);

        for (String graphClause : graphClauses) {
            String query = graphPattern.matcher(queryBase).find()
                    ? String.join(" ", queryPrefixes) + " CONSTRUCT " + graphClause
                    : String.join(" ", queryPrefixes) + " CONSTRUCT { " + graphClause + " } ";
            Pattern wherePattern = Pattern.compile("where", Pattern.CASE_INSENSITIVE);
            if (!wherePattern.matcher(query).find()) {
                query = query + "WHERE {}";
            }
            ParsedQuery constructQuery = new SPARQLParser().parseQuery(query, null);
            TupleExpr expr = constructQuery.getTupleExpr();
            if (expr instanceof Reduced) {
                Reduced reduced = (Reduced) expr;
                String context = graphClauseMatcher.find()
                        ? graphClauseMatcher.group(0).substring(graphClauseMatcher.group(0).indexOf("<") + 1,
                        graphClauseMatcher.group(0).indexOf(">")) : "";
                contextToConstructQuery.put(context, new MultiProjection(reduced.getArg()));
            } else if (expr instanceof MultiProjection) {
                String context = graphClauseMatcher.find()
                        ? graphClauseMatcher.group(0).substring(graphClauseMatcher.group(0).indexOf("<") + 1,
                        graphClauseMatcher.group(0).indexOf(">")) : "";
                contextToConstructQuery.put(context, (MultiProjection) expr);
            } else if (expr instanceof QueryRoot) {
                TupleExpr innerExpr = ((QueryRoot) expr).getArg();
                if (innerExpr instanceof Reduced) {
                    Reduced reduced = (Reduced) innerExpr;
                    String context = graphClauseMatcher.find()
                            ? graphClauseMatcher.group(0).substring(graphClauseMatcher.group(0).indexOf("<") + 1,
                            graphClauseMatcher.group(0).indexOf(">")) : "";
                    contextToConstructQuery.put(context, new MultiProjection(reduced.getArg()));
                }
            }
        }
    }

    @Override
    public void meet(Clear clear) {
        String graph = clear.getGraph().getValue().stringValue();
        ParsedQuery constructQuery = new SPARQLParser().parseQuery("CONSTRUCT {?s ?p ?o} WHERE {GRAPH <"
                + graph + ">" + " {?s ?p ?o}}", null);
        TupleExpr expr = constructQuery.getTupleExpr();
        if (expr instanceof Reduced) {
            Reduced reduced = (Reduced) expr;
            contextToConstructQuery.put(graph, new MultiProjection(reduced.getArg()));
        } else if (expr instanceof MultiProjection) {
            contextToConstructQuery.put(graph, (MultiProjection) expr);
        } else if (expr instanceof QueryRoot) {
            TupleExpr innerExpr = ((QueryRoot) expr).getArg();
            if (innerExpr instanceof Reduced) {
                Reduced reduced = (Reduced) innerExpr;
                contextToConstructQuery.put(graph, new MultiProjection(reduced.getArg()));
            }
        }
    }

    private MultiProjection createMultiProjection() {
        return whereClause != null
                ? new MultiProjection(new Extension(whereClause)) : new MultiProjection(new Extension());
    }
}

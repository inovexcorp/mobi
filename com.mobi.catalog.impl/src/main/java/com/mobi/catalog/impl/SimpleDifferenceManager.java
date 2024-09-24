package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.google.common.collect.ListMultimap;
import com.google.common.collect.MultimapBuilder;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RevisionManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.PagedDifference;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.helpers.BasicParserSettings;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class SimpleDifferenceManager implements DifferenceManager {
    private static final Logger log = LoggerFactory.getLogger(SimpleDifferenceManager.class);
    private static final String GET_PAGED_CHANGES;
    private static final String GET_ADDITIONS_IN_COMMIT;
    private static final String GET_DELETIONS_IN_COMMIT;
    private static final String COMPARE_GRAPHS;

    static {
        try {
            GET_PAGED_CHANGES = IOUtils.toString(
                    Objects.requireNonNull(SimpleDifferenceManager.class
                            .getResourceAsStream("/difference/get-paged-changes.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ADDITIONS_IN_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleDifferenceManager.class
                            .getResourceAsStream("/difference/get-additions-in-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_DELETIONS_IN_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleDifferenceManager.class
                            .getResourceAsStream("/difference/get-deletions-in-commit.rq")),
                    StandardCharsets.UTF_8
            );
            COMPARE_GRAPHS = IOUtils.toString(
                    Objects.requireNonNull(SimpleDifferenceManager.class
                            .getResourceAsStream("/difference/compare-graphs.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    ThingManager thingManager;

    @Reference
    RevisionManager revisionManager;

    @Reference
    CommitManager commitManager;

    @Reference
    CompiledResourceManager compiledResourceManager;

    @Reference
    InProgressCommitFactory inProgressCommitFactory;

    @Reference
    CommitFactory commitFactory;

    @Override
    public Model applyDifference(Model base, Difference diff) {
        Model result = mf.createEmptyModel();
        result.addAll(base);
        result.addAll(diff.getAdditions());
        result.removeAll(diff.getDeletions());
        return result;
    }

    @Override
    public Model applyInProgressCommit(Resource inProgressCommitId, Model entity, RepositoryConnection conn) {
        thingManager.validateResource(inProgressCommitId, inProgressCommitFactory.getTypeIRI(), conn);
        return applyDifference(entity, getCommitDifference(inProgressCommitId, conn));
    }

    @Override
    public Difference getCommitDifference(Resource commitId, RepositoryConnection conn) {
        Revision revision = revisionManager.getDisplayRevisionFromCommitId(commitId, conn);

        Model addModel = mf.createEmptyModel();
        Model deleteModel = mf.createEmptyModel();

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

        conn.getStatements(null, null, null, additionsGraph).forEach(statement ->
                addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        conn.getStatements(null, null, null, deletionsGraph).forEach(statement ->
                deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));

        revision.getGraphRevision().forEach(graphRevision -> {
            Resource graph = graphRevision.getRevisionedGraph().orElseThrow(() ->
                    new IllegalStateException("GraphRevision missing Revisioned Graph."));
            IRI adds = graphRevision.getAdditions().orElseThrow(() ->
                    new IllegalStateException("Additions not set on Commit " + commitId));
            IRI dels = graphRevision.getDeletions().orElseThrow(() ->
                    new IllegalStateException("Deletions not set on Commit " + commitId));

            conn.getStatements(null, null, null, adds).forEach(statement ->
                    addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph));
            conn.getStatements(null, null, null, dels).forEach(statement ->
                    deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(),
                            graph));
        });

        return new Difference.Builder()
                .additions(addModel)
                .deletions(deleteModel)
                .build();
    }

    private Difference getCommitDifference(List<Resource> commits, RepositoryConnection conn) {
        Map<Statement, Integer> additions = new HashMap<>();
        Map<Statement, Integer> deletions = new HashMap<>();
        commits.forEach(commitId -> aggregateDifferences(additions, deletions, commitId, conn));

        Model additionsModel = mf.createEmptyModel();
        additionsModel.addAll(additions.keySet());
        Model deletionsModel = mf.createEmptyModel();
        deletionsModel.addAll(deletions.keySet());

        return new Difference.Builder()
                .additions(additionsModel)
                .deletions(deletionsModel)
                .build();
    }

    @Override
    public Difference getCommitDifferenceForSubject(Resource subjectId, Resource commitId, RepositoryConnection conn) {
        thingManager.validateResource(commitId, commitFactory.getTypeIRI(), conn);
        Revision revision = revisionManager.getDisplayRevisionFromCommitId(commitId, conn);

        Model addModel = mf.createEmptyModel();
        Model deleteModel = mf.createEmptyModel();

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

        conn.getStatements(subjectId, null, null, additionsGraph).forEach(statement ->
                addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        conn.getStatements(subjectId, null, null, deletionsGraph).forEach(statement ->
                deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));

        revision.getGraphRevision().forEach(graphRevision -> {
            Resource graph = graphRevision.getRevisionedGraph().orElseThrow(() ->
                    new IllegalStateException("GraphRevision missing Revisioned Graph."));
            IRI adds = graphRevision.getAdditions().orElseThrow(() ->
                    new IllegalStateException("Additions not set on Commit " + commitId));
            IRI dels = graphRevision.getDeletions().orElseThrow(() ->
                    new IllegalStateException("Deletions not set on Commit " + commitId));

            conn.getStatements(subjectId, null, null, adds).forEach(statement ->
                    addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph));
            conn.getStatements(subjectId, null, null, dels).forEach(statement ->
                    deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph));
        });

        return new Difference.Builder()
                .additions(addModel)
                .deletions(deleteModel)
                .build();
    }

    @Override
    public PagedDifference getCommitDifferencePaged(Resource commitId, int limit, int offset, RepositoryConnection conn) {
        thingManager.validateResource(commitId, commitFactory.getTypeIRI(), conn);
        Revision revision = revisionManager.getDisplayRevisionFromCommitId(commitId, conn);

        Model addModel = mf.createEmptyModel();
        Model deleteModel = mf.createEmptyModel();

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

        String queryString = GET_PAGED_CHANGES.replace("%ADDITIONS_GRAPH%", "<" + additionsGraph.stringValue() + ">");
        queryString = queryString.replace("%DELETIONS_GRAPH%", "<" + deletionsGraph.stringValue() + ">");
        // Query for limit plus 1 to see if more results exist
        queryString = queryString.replace("%LIMIT%", String.valueOf(limit + 1));
        queryString = queryString.replace("%OFFSET%", String.valueOf(offset));

        TupleQuery query = conn.prepareTupleQuery(queryString);

        Resource lastSubject = null;
        try (TupleQueryResult it = query.evaluate()) {
            while (it.hasNext()) {
                BindingSet bindingSet = it.next();
                if (bindingSet.hasBinding("additionsObj")) {
                    addModel.add(vf.createStatement(Bindings.requiredResource(bindingSet, "s"),
                            (IRI) Bindings.requiredResource(bindingSet, "additionsPred"),
                            bindingSet.getValue("additionsObj")));
                }
                if (bindingSet.hasBinding("deletionsObj")) {
                    deleteModel.add(vf.createStatement(Bindings.requiredResource(bindingSet, "s"),
                            (IRI) Bindings.requiredResource(bindingSet, "deletionsPred"),
                            bindingSet.getValue("deletionsObj")));
                }
                if (!it.hasNext()) {
                    // Keep track of last subject, so we can remove it (we queried for limit + 1 subjects)
                    lastSubject = Bindings.requiredResource(bindingSet, "s");
                }
            }
        }

        boolean hasMoreResults = false;

        Set<Resource> setOfSubjects = new HashSet<>();
        setOfSubjects.addAll(addModel.subjects());
        setOfSubjects.addAll(deleteModel.subjects());

        // Remove last subject if we retrieved more subjects than the limit
        if (setOfSubjects.size() > limit) {
            hasMoreResults = true;
            if (lastSubject != null) {
                addModel.remove(lastSubject, null, null);
                deleteModel.remove(lastSubject, null, null);
            }
        }

        return new PagedDifference(new Difference.Builder()
                .additions(addModel)
                .deletions(deleteModel)
                .build(), hasMoreResults);
    }

    @Override
    public PagedDifference getCommitDifferencePaged(List<Resource> commits, int limit, int offset,
                                                    RepositoryConnection conn) {
        Map<Statement, Integer> additions = new HashMap<>();
        Map<Statement, Integer> deletions = new HashMap<>();
        boolean hasMoreResults = false;

        commits.forEach(commitId -> aggregateDifferences(additions, deletions, commitId, conn));

        /* We are using Multimaps instead of regular maps because Multimaps represent a one key to many values
         relationship. In this case, one subject may have many statements. The reason that we do not just have a Model
         or Collection<Statement> as the value of a regular Map is that it would require us to look up the value in
         order to update it. Doing a lookup on a possibly enormous Map is very computationally expensive if done inside
         a loop. Using Multimap allows us to avoid a lookup and just add statements as values for a given subject
         without worrying about what is already there. */
        ListMultimap<String, Statement> addSubjMap = MultimapBuilder.hashKeys().arrayListValues().build();
        ListMultimap<String, Statement> addDelMap = MultimapBuilder.hashKeys().arrayListValues().build();

        TreeSet<String> subjects = new TreeSet<>();

        additions.forEach( (statement, integer) -> {
            String subj = statement.getSubject().stringValue();
            subjects.add(subj);
            addSubjMap.put(subj, statement);
        });

        deletions.forEach( (statement, integer) -> {
            String subj = statement.getSubject().stringValue();
            subjects.add(subj);
            addDelMap.put(subj, statement);
        });

        subjects.retainAll(subjects.stream()
                .skip(offset)
                .limit(limit + 1L)
                .collect(Collectors.toSet()));

        if (subjects.size() > limit) {
            hasMoreResults = true;
            subjects.remove(subjects.last());
        }

        addSubjMap.keySet().retainAll(subjects);
        addDelMap.keySet().retainAll(subjects);

        Model additionsModel = mf.createEmptyModel();
        additionsModel.addAll(addSubjMap.values());
        Model deletionsModel = mf.createEmptyModel();
        deletionsModel.addAll(addDelMap.values());

        return new PagedDifference(new Difference.Builder()
                .additions(additionsModel)
                .deletions(deletionsModel)
                .build(), hasMoreResults);
    }

    @Override
    public Set<Conflict> getConflicts(Resource sourceCommitId, Resource targetCommitId, RepositoryConnection conn) {
        final long start = System.currentTimeMillis();
        thingManager.validateResource(sourceCommitId, commitFactory.getTypeIRI(), conn);
        thingManager.validateResource(targetCommitId, commitFactory.getTypeIRI(), conn);

        List<Resource> sourceCommits = commitManager.getCommitChain(sourceCommitId, false, conn);
        List<Resource> targetCommits = commitManager.getCommitChain(targetCommitId, false, conn);
        sourceCommits.retainAll(targetCommits);
        Resource branchingId = sourceCommits.get(0);

        File sourceCompiled = compiledResourceManager.getCompiledResourceFile(sourceCommitId, RDFFormat.TURTLE, conn);
        File targetCompiled = compiledResourceManager.getCompiledResourceFile(targetCommitId, RDFFormat.TURTLE, conn);
        File branchingCompiled = compiledResourceManager.getCompiledResourceFile(branchingId, RDFFormat.TURTLE, conn);

        Resource sourceGraph = vf.createIRI(sourceCommitId.stringValue() + "/diff");
        Resource targetGraph = vf.createIRI(targetCommitId.stringValue() + "/diff");
        Resource branchingGraph = vf.createIRI( branchingId.stringValue()+ "/diff");
        try (RepositoryConnection diffConn = configProvider.getRepository().getConnection()) {
            diffConn.getParserConfig().set(BasicParserSettings.PRESERVE_BNODE_IDS, true);
            diffConn.begin();
            diffConn.add(sourceCompiled, RDFFormat.TURTLE, sourceGraph);
            diffConn.add(targetCompiled, RDFFormat.TURTLE, targetGraph);
            diffConn.add(branchingCompiled, RDFFormat.TURTLE, branchingGraph);

            Model sourceAdds = getDifferenceModel(sourceGraph, branchingGraph, diffConn);
            Model targetAdds = getDifferenceModel(targetGraph, branchingGraph, diffConn);

            Model sourceDels = getDifferenceModel(branchingGraph, sourceGraph, diffConn);
            Model targetDels = getDifferenceModel(branchingGraph, targetGraph, diffConn);

            Set<Resource> sourceAddSubjects = sourceAdds.subjects();
            Set<Resource> targetAddSubjects = targetAdds.subjects();

            Set<Conflict> result = new HashSet<>();
            Set<Statement> statementsToRemove = new HashSet<>();

            sourceAdds.subjects().forEach(subject -> {
                Model sourceAddSubjectStatements = sourceAdds.filter(subject, null, null);
                Model duplicateStatements = mf.createEmptyModel();
                sourceAddSubjectStatements.forEach(statement -> {
                    IRI pred = statement.getPredicate();
                    Value obj = statement.getObject();
                    if (targetAdds.contains(subject, pred, obj)) {
                        duplicateStatements.add(subject, pred, obj);
                    }
                });
                if (!duplicateStatements.isEmpty()) {
                    result.add(new Conflict.Builder((IRI) subject)
                            .leftDifference(new Difference.Builder()
                                    .additions(duplicateStatements).deletions(mf.createEmptyModel()).build())
                            .rightDifference(new Difference.Builder()
                                    .additions(duplicateStatements).deletions(mf.createEmptyModel()).build()).build());
                }
            });

            sourceDels.subjects().forEach(subject -> {
                Model sourceDelSubjectStatements = sourceDels.filter(subject, null, null);

                Model duplicateStatements = mf.createEmptyModel();
                // Check for modification in left and right
                // Also check for duplicates
                sourceDelSubjectStatements.forEach(statement -> {
                    IRI pred = statement.getPredicate();
                    Value obj = statement.getObject();

                    if (targetDels.contains(subject, pred, obj)
                            && sourceAdds.contains(subject, pred, null)
                            && targetAdds.contains(subject, pred, null)) {
                        result.add(createConflict(subject, pred, sourceAdds, sourceDels, targetAdds, targetDels));
                        statementsToRemove.add(statement);
                    } else if (targetDels.contains(subject, pred, obj)) {
                        duplicateStatements.add(subject, pred, obj);
                    }
                });

                if (!duplicateStatements.isEmpty()) {
                    result.add(new Conflict.Builder((IRI) subject)
                            .leftDifference(new Difference.Builder()
                                    .additions(mf.createEmptyModel()).deletions(duplicateStatements).build())
                            .rightDifference(new Difference.Builder()
                                    .additions(mf.createEmptyModel()).deletions(duplicateStatements).build()).build());
                }

                // Check for deletion in left and addition in right if there are common parents
                if (!sourceCommits.isEmpty()) {
                    Model targetSubjectAdd = targetAdds.filter(subject, null, null);
                    boolean sourceEntityDeleted = !sourceAddSubjects.contains(subject)
                            && sourceDelSubjectStatements.equals(getModelForSubject(subject, branchingGraph, diffConn));
                    boolean targetEntityDeleted = targetDels.containsAll(sourceDelSubjectStatements);

                    if (sourceEntityDeleted && !targetEntityDeleted && !targetSubjectAdd.isEmpty()) {
                        result.add(createConflict(subject, null, sourceAdds, sourceDels, targetAdds,
                                targetDels));
                        statementsToRemove.addAll(targetSubjectAdd);
                    }
                }
            });

            statementsToRemove.forEach(statement -> Stream.of(sourceAdds, sourceDels, targetAdds, targetDels)
                    .forEach(model -> model.remove(statement.getSubject(), statement.getPredicate(), null)));

            if (!sourceCommits.isEmpty()) {
                targetDels.subjects().forEach(subject -> {
                    // Check for deletion in right and addition in left if there are common parents
                    Model targetDelSubjectStatements = targetDels.filter(subject, null, null);
                    Model sourceSubjectAdd = sourceAdds.filter(subject, null, null);
                    boolean targetEntityDeleted = !targetAddSubjects.contains(subject)
                            && targetDelSubjectStatements.equals(getModelForSubject(subject, branchingGraph, diffConn));
                    boolean sourceEntityDeleted = sourceDels.containsAll(targetDelSubjectStatements);

                    if (targetEntityDeleted && !sourceEntityDeleted && !sourceSubjectAdd.isEmpty()) {
                        result.add(createConflict(subject, null, sourceAdds, sourceDels, targetAdds,
                                targetDels));
                    }
                });
            }
            diffConn.rollback();

            log.trace("getConflicts took {}ms", System.currentTimeMillis() - start);
            return result;
        } catch (IOException e) {
            throw new MobiException(e);
        } finally {
            sourceCompiled.delete();
            targetCompiled.delete();
            branchingCompiled.delete();
        }
    }

    private Model getDifferenceModel(Resource graph1, Resource graph2, RepositoryConnection conn) {
        GraphQuery sourceQuery = conn.prepareGraphQuery(COMPARE_GRAPHS);
        sourceQuery.setBinding("graph1", graph1);
        sourceQuery.setBinding("graph2", graph2);
        return QueryResults.asModel(sourceQuery.evaluate());
    }

    private Model getModelForSubject(Resource subject, Resource branchingGraph, RepositoryConnection conn) {
        Model model = mf.createEmptyModel();
        conn.getStatements(subject, null, null, branchingGraph)
                .forEach(statement ->
                        model.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        return model;
    }

    @Override
    public Difference getDiff(Model original, Model changed) {
        Model additions = mf.createEmptyModel();
        Model deletions = mf.createEmptyModel();

        original.forEach(statement -> {
            if (!changed.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())) {
                deletions.add(statement);
            }
        });

        changed.forEach(statement -> {
            if (!original.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())) {
                additions.add(statement);
            }
        });

        return new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build();
    }

    @Override
    public Difference getDifference(Resource sourceCommitId, Resource targetCommitId, RepositoryConnection conn) {
        return getCommitDifference(commitManager.getDifferenceChain(sourceCommitId, targetCommitId, true, conn),
                conn);
    }

    @Override
    public PagedDifference getCommitDifferencePaged(Resource sourceCommitId, Resource targetCommitId, int limit,
                                                    int offset, RepositoryConnection conn) {
        return getCommitDifferencePaged(commitManager.getDifferenceChain(sourceCommitId, targetCommitId, true, conn),
                limit, offset, conn);
    }

    /**
     * Updates the supplied Maps of addition and deletions statements with statements from the Revision associated with
     * the supplied Commit resource. Revision addition statements are added to the additions map if not present. If
     * present, the counter of the times the statement has been added is incremented. Revision deletion
     * statements are removed from the additions map if only one exists, if more than one exists the counter is
     * decremented, otherwise the statements are added to the deletions list.
     *
     * @param additions The Map of Statements added to update.
     * @param deletions The Map of Statements deleted to update.
     * @param commitId  The Resource identifying the Commit.
     * @param conn      The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Map<Statement, Integer> additions, Map<Statement, Integer> deletions,
                                      Resource commitId, RepositoryConnection conn) {
        getAdditions(commitId, conn).forEach(statement -> updateModels(statement, additions, deletions));
        getDeletions(commitId, conn).forEach(statement -> updateModels(statement, deletions, additions));
    }

    /**
     * Creates a conflict using the provided parameters as the data to construct it.
     *
     * @param subject        The Resource identifying the conflicted statement's subject.
     * @param predicate      The IRI identifying the conflicted statement's predicate.
     * @param left           The Model of the left item being compared.
     * @param leftDeletions  The Model of the deleted statements from the left Model.
     * @param right          The Model of the right item being compared.
     * @param rightDeletions The Model of the deleted statements from the right Model.
     * @return A Conflict created using all the provided data.
     */
    private Conflict createConflict(Resource subject, IRI predicate, Model left, Model leftDeletions,
                                    Model right, Model rightDeletions) {
        Difference.Builder leftDifference = new Difference.Builder();
        final Difference.Builder rightDifference = new Difference.Builder();

        Model leftAddModel = mf.createEmptyModel();
        leftAddModel.addAll(left.filter(subject, predicate, null));
        Model leftDelModel = mf.createEmptyModel();
        leftDelModel.addAll(leftDeletions.filter(subject, predicate, null));
        leftDifference
                .additions(leftAddModel)
                .deletions(leftDelModel);

        Model rightAddModel = mf.createEmptyModel();
        rightAddModel.addAll(right.filter(subject, predicate, null));
        Model rightDelModel = mf.createEmptyModel();
        rightDelModel.addAll(rightDeletions.filter(subject, predicate, null));
        rightDifference
                .additions(rightAddModel)
                .deletions(rightDelModel);

        return new Conflict.Builder(vf.createIRI(subject.stringValue()))
                .leftDifference(leftDifference.build())
                .rightDifference(rightDifference.build())
                .build();
    }

    /**
     * Retrieves the additions for provided commitId. Returns a {@link GraphQueryResult}, an iterator over the returned
     * statements.
     *
     * @param commitId The Resource of the Commit to query for additions.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getAdditions(Resource commitId, RepositoryConnection conn) {
        GraphQuery additionsQuery = conn.prepareGraphQuery(GET_ADDITIONS_IN_COMMIT
                .replace("%COMMITLIST%","<" + commitId.stringValue() + ">")
                .replace("%SUBJECTLIST%", ""));
        return additionsQuery.evaluate();
    }

    /**
     * Retrieves the deletions for provided commitId. Returns a {@link GraphQueryResult}, an iterator over the returned
     * statements.
     *
     * @param commitId The Resource of the Commit to query for additions.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getDeletions(Resource commitId, RepositoryConnection conn) {
        GraphQuery additionsQuery = conn.prepareGraphQuery(GET_DELETIONS_IN_COMMIT
                .replace("%COMMITLIST%","<" + commitId.stringValue() + ">")
                .replace("%SUBJECTLIST%", ""));
        return additionsQuery.evaluate();
    }

    /**
     * Remove the supplied triple from the mapToRemove if one instance of it exists, if more than one, decrement
     * counter. Otherwise, add the triple to mapToAdd. If one already exists in mapToAdd, increment counter.
     *
     * @param statement   The statement to process
     * @param mapToAdd    The Map of addition statements to track number of times a statement has been added and to add
     *                    the statement to if it does not exist in mapToRemove
     * @param mapToRemove The Map of deletion statements to track the number of times a statement has been removed and
     *                    to remove the statement from if it exists
     */
    private void updateModels(Statement statement, Map<Statement, Integer> mapToAdd, Map<Statement,
            Integer> mapToRemove) {
        if (mapToRemove.containsKey(statement)) {
            int count = mapToRemove.get(statement);
            if (count == 1) {
                mapToRemove.remove(statement);
            } else {
                mapToRemove.put(statement, count - 1);
            }
        } else if (mapToAdd.containsKey(statement)) {
            int count = mapToAdd.get(statement);
            mapToAdd.put(statement, count + 1);
        } else {
            mapToAdd.put(statement, 1);
        }
    }
}

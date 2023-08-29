package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BasicParserSettings;
import org.eclipse.rdf4j.rio.helpers.TurtleWriterSettings;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Component
public class SimpleCompiledResourceManager implements CompiledResourceManager {
    private static final Logger log = LoggerFactory.getLogger(SimpleCompiledResourceManager.class);
    private static final String GET_SUBJECTS_WITH_DELETIONS;
    private static final String GET_COMMITS_WITH_SUBJECT;
    private static final String GET_ADDITIONS_IN_COMMIT;
    private static final String GET_ADDITIONS_FROM_COIS;
    private static final String GET_FILTERED_ADDITIONS_SUBQUERY;
    private static final String GET_FILTERED_DELETIONS_SUBQUERY;

    static {
        try {
            GET_SUBJECTS_WITH_DELETIONS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/get-subjects-with-deletions.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMITS_WITH_SUBJECT = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/get-commits-with-subject.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ADDITIONS_IN_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/get-additions-in-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ADDITIONS_FROM_COIS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/get-additions-from-cois.rq")),
                    StandardCharsets.UTF_8
            );
            GET_FILTERED_ADDITIONS_SUBQUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/get-filtered-additions-subquery.rq")),
                    StandardCharsets.UTF_8
            );
            GET_FILTERED_DELETIONS_SUBQUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/get-filtered-deletions-subquery.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ModelFactory mf = new DynamicModelFactory();
    
    @Reference
    CatalogConfigProvider configProvider;
    
    @Reference
    ThingManager thingManager;
    
    @Reference
    CommitManager commitManager;

    @Reference
    CommitFactory commitFactory;

    @Override
    public Model getCompiledResource(Resource commitId, RepositoryConnection conn) {
        thingManager.validateResource(commitId, commitFactory.getTypeIRI(), conn);
        return getCompiledResource(commitManager.getCommitChain(commitId, true, conn), conn);
    }

    @Override
    public Model getCompiledResource(Resource versionedRDFRecordId, Resource branchId, Resource commitId,
                                     RepositoryConnection conn) {
        commitManager.validateCommitPath(configProvider.getLocalCatalogIRI(), versionedRDFRecordId, branchId, commitId,
                conn);
        return getCompiledResource(commitManager.getCommitChain(commitId, true, conn), conn);
    }

    @Override
    public Model getCompiledResource(List<Resource> commits, RepositoryConnection conn, Resource... subjectIds) {
        Model compiledResource = mf.createEmptyModel();
        if (commits.isEmpty()) {
            return compiledResource;
        }
        buildCompiledResource(commits, conn, compiledResource::add, subjectIds);
        return compiledResource;
    }

    @Override
    public File getCompiledResourceFile(Resource commitId, RDFFormat rdfFormat, RepositoryConnection conn) {
        return getCompiledResourceFile(commitManager.getCommitChain(commitId, true, conn), rdfFormat, conn);
    }

    protected Set<Resource> getCommitsWithSubjects(List<Resource> commits, RepositoryConnection conn,
                                                   Set<Resource> deletionSubjects, Resource... subjectIds) {

        Set<Resource> commitsOfInterest = new HashSet<>();
        if (!deletionSubjects.isEmpty()) {
            String query = replaceCommitList(GET_COMMITS_WITH_SUBJECT, commits);
            query = replaceSubjectList(query, "deletionSubject", "%SUBJECTLIST%", subjectIds);
            TupleQuery commitsQuery = conn.prepareTupleQuery(query);
            try (TupleQueryResult result = commitsQuery.evaluate()) {
                result.forEach(bindingSet ->
                        commitsOfInterest.add(Bindings.requiredResource(bindingSet, "commitOfInterest")));
            }
        }
        return commitsOfInterest;

    }

    protected Set<Resource> getDeletionSubjects(List<Resource> commits, RepositoryConnection conn,
                                                Resource... subjectIds) {
        Set<Resource> deletionSubjects = new HashSet<>();
        String query = replaceCommitList(GET_SUBJECTS_WITH_DELETIONS, commits);
        query = replaceSubjectList(query, "s", "%SUBJECTLIST%", subjectIds);
        TupleQuery subjectsQuery = conn.prepareTupleQuery(query);
        try (TupleQueryResult result = subjectsQuery.evaluate()) {
            result.forEach(bindings ->
                    deletionSubjects.add((Bindings.requiredResource(bindings, "s"))));
        }
        return deletionSubjects;
    }

    /**
     * Updates the supplied Maps of addition and deletions statements with statements from the additions/deletions
     * associated with the supplied Commit resource. These additions/deletions are filtered to only include statements
     * whose subjects are Subjects of Deletions from the provided List of Commits. Addition statements are added to the
     * additions map if not present. If present, the counter of the times the statement has been added is incremented.
     * Deletion statements are removed from the additions map if only one exists, if more than one exists the counter is
     * decremented, otherwise the statements are added to the deletions list.
     *
     * @param additions The Map of Statements added to update.
     * @param deletions The Map of Statements deleted to update.
     * @param commitId  The Resource identifying the Commit.
     * @param commits   The Set of Commit IRIs to filter the additions/deletions with.
     * @param conn      The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Map<Statement, Integer> additions, Map<Statement, Integer> deletions,
                                      Resource commitId, List<Resource> commits, RepositoryConnection conn) {
        getAdditions(commitId, commits, conn).forEach(statement -> updateModels(statement, additions, deletions));
        getDeletions(commitId, commits, conn).forEach(statement -> updateModels(statement, deletions, additions));
    }

    /**
     * Runs queries to calculate the compiled resource. Uses the provided {@link Consumer} to handle the resulting
     * {@link Statement} that gets generated as part of the compiled resource.
     *
     * @param commits The {@link List} of Commits {@link Resource}s.
     * @param conn The {@link RepositoryConnection} to use to query the repository.
     * @param consumer The {@link Consumer} to handle the generated {@link Statement}.
     * @param subjectIds Optional list of entity {@link Resource}s to filter the compiled resource by
     */
    private void buildCompiledResource(List<Resource> commits, RepositoryConnection conn,
                                       Consumer<Statement> consumer, Resource... subjectIds) {
        // Get all subjects in deletions graphs for provided commits
        Set<Resource> deletionSubjects = getDeletionSubjects(commits, conn, subjectIds);
        // Find all commits with the subjects in additions or deletions graphs
        // These are the commits of interest for comparing changes
        Set<Resource> commitsOfInterest = getCommitsWithSubjects(commits, conn, deletionSubjects, subjectIds);

        if (!deletionSubjects.isEmpty()) {
            // Write any addition statement in commitsOfInterest whose subject is NOT a deletionsSubject
            String additionsFromCoisQueryString = replaceCommitList(GET_ADDITIONS_FROM_COIS, commits);
            additionsFromCoisQueryString = replaceSubjectList(additionsFromCoisQueryString,
                    "deletionSubject", "%SUBJECTLIST%", subjectIds);
            additionsFromCoisQueryString = replaceSubjectList(additionsFromCoisQueryString,
                    "addSubject", "%SUBJECTLISTADD%", subjectIds);

            GraphQuery additionsInCOIQuery = conn.prepareGraphQuery(additionsFromCoisQueryString);
            try (GraphQueryResult result = additionsInCOIQuery.evaluate()) {
                result.forEach(statement -> {
                    if (!deletionSubjects.contains(statement.getSubject())) {
                        consumer.accept(statement);
                    }
                });
            }

            // Gather and write final statements from all subjects that have deletions
            Map<Statement, Integer> additions = new HashMap<>();
            Map<Statement, Integer> deletions = new HashMap<>();
            commits.forEach(commitId -> aggregateDifferences(additions, deletions, commitId, commits, conn));
            additions.keySet().forEach(consumer);
        }

        // Write any commit that has additions that do not contain any subject in a deletions graph
        List<Resource> commitsAdditionsOnly = commits.stream()
                .filter(commit -> !commitsOfInterest.contains(commit))
                .collect(Collectors.toList());
        if (!commitsAdditionsOnly.isEmpty()) {
            String additionInCommitQuery =  replaceCommitList(GET_ADDITIONS_IN_COMMIT, commitsAdditionsOnly);
            additionInCommitQuery = replaceSubjectList(additionInCommitQuery, "s", "%SUBJECTLIST%", subjectIds);
            GraphQuery additionsQuery = conn.prepareGraphQuery(additionInCommitQuery);
            try (GraphQueryResult result = additionsQuery.evaluate()) {
                result.forEach(consumer);
            }
        }
    }

    /**
     * Retrieves the additions for provided commitId whose subjects are filtered from the provided Commit List.
     * Returns a {@link GraphQueryResult}, an iterator over the returned statements.
     *
     * @param commitId The Resource of the Commit to query for additions.
     * @param commits  The Set of Commit IRIs used to filter the Resources to retrieve from the additions graph.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getAdditions(Resource commitId, List<Resource> commits, RepositoryConnection conn) {
        GraphQuery additionsQuery = conn.prepareGraphQuery(GET_FILTERED_ADDITIONS_SUBQUERY
                .replace("%COMMITLIST%","<" + StringUtils.join(commits, "> <") + ">")
                .replace("%THISCOMMIT%", "<" + commitId.stringValue() + ">"));
        return additionsQuery.evaluate();
    }

    private File getCompiledResourceFile(List<Resource> commits, RDFFormat rdfFormat, RepositoryConnection conn,
                                        Resource... subjectIds) {
        try {
            long writeTimeStart = System.currentTimeMillis();
            if (commits.isEmpty()) {
                throw new IllegalArgumentException("List of commits must contain at least one Resource");
            }
            String tmpDir = System.getProperty("java.io.tmpdir");
            Path tmpFile = Files.createFile(Paths.get(tmpDir + File.separator + UUID.randomUUID()));
            try (OutputStream outputStream = Files.newOutputStream(tmpFile)) {
                RDFWriter writer = Rio.createWriter(rdfFormat, outputStream);
                if (RDFFormat.TURTLE.equals(rdfFormat) || RDFFormat.TRIG.equals(rdfFormat)) {
                    writer.getWriterConfig().set(TurtleWriterSettings.ABBREVIATE_NUMBERS, false);
                }
                writer.getWriterConfig().set(BasicParserSettings.PRESERVE_BNODE_IDS, true);
                writer.startRDF();
                Consumer<Statement> consumer = statement ->
                        com.mobi.persistence.utils.rio.Rio.write(statement, writer);
                buildCompiledResource(commits, conn, consumer, subjectIds);
                writer.endRDF();
            }
            log.trace("Write statements to file in {} ms", System.currentTimeMillis() - writeTimeStart);
            return tmpFile.toFile();
        } catch (IOException e) {
            throw new MobiException("Error creating compiled resource file", e);
        }
    }

    /**
     * Retrieves the deletions for provided commitId whose subjects are filtered from the provided Commit List.
     * Returns a {@link GraphQueryResult}, an iterator over the returned statements.
     *
     * @param commitId The Resource of the Commit to query for additions.
     * @param commits  The Set of Commit IRIs used to filter the Resources to retrieve from the deletions graph.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getDeletions(Resource commitId, List<Resource> commits, RepositoryConnection conn) {
        GraphQuery deletionsQuery = conn.prepareGraphQuery(GET_FILTERED_DELETIONS_SUBQUERY
                .replace("%COMMITLIST%","<" + StringUtils.join(commits, "> <") + ">")
                .replace("%THISCOMMIT%", "<" + commitId.stringValue() + ">"));
        return deletionsQuery.evaluate();
    }

    private String replaceCommitList(String query, List<Resource> commits) {
        return query.replace("%COMMITLIST%", "<" + StringUtils.join(commits, "> <") + ">");
    }

    private String replaceSubjectList(String query, String binding, String target, Resource... subjectIds) {
        if (subjectIds.length > 0) {
            return query.replace(target,
                    "VALUES ?" + binding + " { <" + StringUtils.join(subjectIds, "> <") + "> }");
        } else {
            return query.replace(target, "");
        }
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

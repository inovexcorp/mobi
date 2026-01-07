package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.RevisionChain;
import com.mobi.catalog.api.RevisionManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
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
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;

@Component
public class SimpleCompiledResourceManager implements CompiledResourceManager {
    private static final Logger log = LoggerFactory.getLogger(SimpleCompiledResourceManager.class);
    private static final String COMMIT_BINDING = "commit";
    private static final String GET_HEAD_GRAPH;
    private static final String GET_SUBJECTS_WITH_DELETIONS;
    private static final String GET_REVISIONS_WITH_SUBJECT;
    private static final String GET_ADDITIONS_FROM_ROIS;
    private static final String GET_ADDITIONS_IN_REVISION;
    private static final String GET_FILTERED_ADDITIONS_SUBQUERY;
    private static final String GET_FILTERED_DELETIONS_SUBQUERY;
    private static final String SUBJECT_LIST = "%SUBJECTLIST%";
    private static final String REVISION_LIST = "%REVISIONLIST%";

    static {
        try {
            GET_SUBJECTS_WITH_DELETIONS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/compiled-resource/get-subjects-with-deletions.rq")),
                    StandardCharsets.UTF_8
            );
            GET_REVISIONS_WITH_SUBJECT = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/compiled-resource/get-commits-with-subject.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ADDITIONS_FROM_ROIS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/compiled-resource/get-additions-from-rois.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ADDITIONS_IN_REVISION = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/compiled-resource/get-additions-in-revision.rq")),
                    StandardCharsets.UTF_8
            );
            GET_FILTERED_ADDITIONS_SUBQUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/compiled-resource/get-filtered-additions-subquery.rq")),
                    StandardCharsets.UTF_8
            );
            GET_FILTERED_DELETIONS_SUBQUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/compiled-resource/get-filtered-deletions-subquery.rq")),
                    StandardCharsets.UTF_8
            );
            GET_HEAD_GRAPH = IOUtils.toString(
                    Objects.requireNonNull(SimpleCompiledResourceManager.class
                            .getResourceAsStream("/compiled-resource/get-head-graph-from-commit.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private final ModelFactory mf = new DynamicModelFactory();
    private final ValueFactory vf = new ValidatingValueFactory();
    
    @Reference
    CatalogConfigProvider configProvider;
    
    @Reference
    ThingManager thingManager;
    
    @Reference
    CommitManager commitManager;

    @Reference
    RevisionManager revisionManager;

    @Reference
    CommitFactory commitFactory;

    @Override
    public Model getCompiledResource(Resource commitId, RepositoryConnection conn, Resource... entityIds) {
        thingManager.validateResource(commitId, commitFactory.getTypeIRI(), conn);
        Model compiledResource = mf.createEmptyModel();
        buildCompiledResource(commitId, compiledResource::add, conn, entityIds);
        return compiledResource;
    }

    @Override
    public Model getCompiledResource(Resource versionedRDFRecordId, Resource branchId, Resource commitId,
                                     RepositoryConnection conn, Resource... entityIds) {
        commitManager.validateCommitPath(configProvider.getLocalCatalogIRI(), versionedRDFRecordId, branchId, commitId,
                conn);
        Model compiledResource = mf.createEmptyModel();
        buildCompiledResource(commitId, compiledResource::add, conn, entityIds);
        return compiledResource;
    }

    @Override
    public File getCompiledResourceFile(Resource commitId, RDFFormat rdfFormat, RepositoryConnection conn,
                                        Resource... entityIds) {
        try {
            long writeTimeStart = System.currentTimeMillis();

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
                buildCompiledResource(commitId, consumer, conn, entityIds);
                writer.endRDF();
            }
            log.trace("Write statements to file in {} ms", System.currentTimeMillis() - writeTimeStart);
            return tmpFile.toFile();
        } catch (IOException e) {
            throw new MobiException("Error creating compiled resource file", e);
        }
    }

    private void buildCompiledResource(Resource commitId, Consumer<Statement> consumer, RepositoryConnection conn,
                                       Resource... subjectIds) {
        RevisionChain revisionChain = revisionManager.getRevisionChain(commitId, conn);
        List<Resource> fullIRIs = revisionChain.fullIRIs();
        List<Resource> reverseIRIs = revisionChain.reverseIRIs();
        List<Resource> forwardIRIs = revisionChain.forwardIRIs();
        Resource headGraphIRI = getHeadGraph(commitId, conn);

        boolean isActive = conn.isActive();
        RepositoryConnection headGraphConn = getConnectionIfActive(isActive, conn);
        try {
            // Add temporary pointer to HEAD graph as a revision addition delta
            Resource tempResource = vf.createIRI("urn:tempRevision/" + UUID.randomUUID());
            headGraphConn.add(tempResource, vf.createIRI(Revision.additions_IRI), headGraphIRI);
            fullIRIs.add(0, tempResource);
            reverseIRIs.add(0, tempResource);

            // Get all subjects in deletions graphs for provided revisions
            Set<Resource> deletionSubjects = getDeletionSubjects(fullIRIs, headGraphConn, subjectIds);

            // Find all revisions with the subjects in additions or deletions graphs
            // These are the revisions of interest for comparing changes
            Set<Resource> revisionsOfInterest = getRevisionsWithDeletionSubjects(fullIRIs, headGraphConn,
                    deletionSubjects, subjectIds);

            if (!deletionSubjects.isEmpty()) {
                // Write any addition statement in revisionsOfInterest whose subject is NOT a deletionsSubject
                writeAdditions(consumer, subjectIds, revisionsOfInterest, headGraphConn, deletionSubjects);
                Resource tempGraph = vf.createIRI("urn:tempGraph/" + UUID.randomUUID());
                // Gather and write final statements from all subjects that have deletions
                prepareDeletionSubjects(reverseIRIs, fullIRIs, tempGraph, forwardIRIs, headGraphConn);
                writeDeletionSubjects(consumer, subjectIds, headGraphConn, tempGraph);
            }

            // Write any revision that has additions that do not contain any subject in a deletions graph
            writeOtherStatements(consumer, subjectIds, fullIRIs, revisionsOfInterest, headGraphConn);
        } finally {
            headGraphConn.rollback();
            if (isActive) {
                // Close temporary headGraphConn
                headGraphConn.close();
            }
        }
    }

    /**
     * Writes the other statements that are not revisions of interest to the specified consumer.
     *
     * @param consumer            The consumer function to accept the statements.
     * @param subjectIds          The array of subject IDs to filter the statements.
     * @param fullIRIs            The list of full IRIs to filter the statements.
     * @param revisionsOfInterest The set of revisions of interest to filter the statements.
     * @param headGraphConn       The repository connection to query the repository.
     */
    private void writeOtherStatements(Consumer<Statement> consumer, Resource[] subjectIds, List<Resource> fullIRIs,
                                      Set<Resource> revisionsOfInterest, RepositoryConnection headGraphConn) {
        List<Resource> revisionsAdditionsOnly = fullIRIs.stream()
                .filter(revision -> !revisionsOfInterest.contains(revision))
                .toList();
        if (!revisionsAdditionsOnly.isEmpty()) {
            String additionInRevisionQuery = replaceRevisionList(GET_ADDITIONS_IN_REVISION, revisionsAdditionsOnly);
            additionInRevisionQuery = replaceSubjectList(additionInRevisionQuery, "s", SUBJECT_LIST,
                    subjectIds);
            GraphQuery additionsQuery = headGraphConn.prepareGraphQuery(additionInRevisionQuery);
            try (GraphQueryResult result = additionsQuery.evaluate()) {
                result.forEach(consumer);
            }
        }
    }

    /**
     * Writes the deletion subjects to the provided consumer.
     * If subjectIds array is not empty, filters the statements by subjectIds.
     * Otherwise, retrieves all statements from the tempGraph using headGraphConn.
     *
     * @param consumer        The consumer function to accept the deletion subjects.
     * @param subjectIds      The array of subject IDs to filter the statements.
     * @param headGraphConn   The repository connection to query the repository.
     * @param tempGraph       The temporary graph to write the deletion subjects to.
     */
    private void writeDeletionSubjects(Consumer<Statement> consumer, Resource[] subjectIds,
                                       RepositoryConnection headGraphConn, Resource tempGraph) {
        if (subjectIds.length > 0) {
            Arrays.stream(subjectIds).forEach(subjectId -> {
                headGraphConn.getStatements(subjectId, null, null, tempGraph).forEach(st ->
                        consumer.accept(vf.createStatement(st.getSubject(), st.getPredicate(), st.getObject())));
            });
        } else {
            headGraphConn.getStatements(null, null, null, tempGraph).forEach(st ->
                    consumer.accept(vf.createStatement(st.getSubject(), st.getPredicate(), st.getObject())));
        }
    }

    /**
     * Writes the subjects that have deletions from the given revisions to a temporary graph.
     *
     * @param reverseIRIs   The list of reverseIRIs to filter the additions/deletions with.
     * @param fullIRIs      The list of fullIRIs to filter the additions/deletions with.
     * @param tempGraph     The temporary graph to write the subjects to.
     * @param forwardIRIs   The list of forwardIRIs to filter the additions/deletions with.
     * @param headGraphConn The head repository connection to query the repository.
     */
    private void prepareDeletionSubjects(List<Resource> reverseIRIs, List<Resource> fullIRIs,
                                         Resource tempGraph, List<Resource> forwardIRIs,
                                         RepositoryConnection headGraphConn) {
        // Use transaction compilation for reverse deltas
        reverseIRIs.forEach(revisionId ->
                aggregateDifferences(revisionId, fullIRIs, tempGraph, headGraphConn));
        // Use in memory compilation for forward deltas since they get aggregated into a single chain regardless
        // of forward branch structure. Prevents compilation issues when two branches add the same statement, then
        // one modifies, and they are merged together.
        // Gather and write final statements from all subjects that have deletions
        Map<Statement, Integer> additions = new HashMap<>();
        Map<Statement, Integer> deletions = new HashMap<>();
        forwardIRIs.forEach(revisionID ->
                aggregateDifferences(additions, deletions, revisionID, fullIRIs, headGraphConn));
        headGraphConn.remove(deletions.keySet(), tempGraph);
        headGraphConn.add(additions.keySet(), tempGraph);
    }

    /**
     * Writes the additions from the revisions of interest to the provided consumer.Filtered by subjectIds and exclusion
     * of deletion subjects.
     *
     * @param consumer             The consumer function to accept the additions.
     * @param subjectIds           The array of subject IDs to filter the additions.
     * @param revisionsOfInterest  The set of revisions of interest to filter the additions.
     * @param headGraphConn        The repository connection to query the repository.
     * @param deletionSubjects     The set of deletion subjects to exclude from the additions.
     */
    private void writeAdditions(Consumer<Statement> consumer, Resource[] subjectIds, Set<Resource> revisionsOfInterest,
                                RepositoryConnection headGraphConn, Set<Resource> deletionSubjects) {
        String additionsFromRoisQueryString = replaceRevisionList(GET_ADDITIONS_FROM_ROIS, revisionsOfInterest);
        additionsFromRoisQueryString = replaceSubjectList(additionsFromRoisQueryString,
                "deletionSubject", SUBJECT_LIST, subjectIds);
        additionsFromRoisQueryString = replaceSubjectList(additionsFromRoisQueryString,
                "addSubject", "%SUBJECTLISTADD%", subjectIds);

        GraphQuery additionsInRoiQuery = headGraphConn.prepareGraphQuery(additionsFromRoisQueryString);
        try (GraphQueryResult result = additionsInRoiQuery.evaluate()) {
            result.forEach(statement -> {
                if (!deletionSubjects.contains(statement.getSubject())) {
                    consumer.accept(statement);
                }
            });
        }
    }

    private RepositoryConnection getConnectionIfActive(boolean isActive, RepositoryConnection conn) {
        // Need a new RepositoryConnection to rollback changes to HEAD graph if connection is active
        RepositoryConnection headGraphConn = isActive ? configProvider.getRepository().getConnection() : conn;
        headGraphConn.begin();
        return headGraphConn;
    }

    private Resource getHeadGraph(Resource commitId, RepositoryConnection conn) {
        TupleQuery getHeadGraph = conn.prepareTupleQuery(GET_HEAD_GRAPH);
        getHeadGraph.setBinding(COMMIT_BINDING, commitId);
        try (TupleQueryResult result = getHeadGraph.evaluate()) {
            if (!result.hasNext()) {
                throw new IllegalStateException(commitId + " does not have an associated HEAD graph");
            }
            return Bindings.requiredResource(result.next(), "headGraph");
        }
    }

    protected Set<Resource> getDeletionSubjects(List<Resource> revisions, RepositoryConnection conn,
                                                Resource... subjectIds) {
        Set<Resource> deletionSubjects = new HashSet<>();
        String query = replaceRevisionList(GET_SUBJECTS_WITH_DELETIONS, revisions);
        query = replaceSubjectList(query, "s", SUBJECT_LIST, subjectIds);
        TupleQuery subjectsQuery = conn.prepareTupleQuery(query);
        try (TupleQueryResult result = subjectsQuery.evaluate()) {
            result.forEach(bindings ->
                    deletionSubjects.add((Bindings.requiredResource(bindings, "s"))));
        }
        return deletionSubjects;
    }

    private String replaceRevisionList(String query, Collection<Resource> revisions) {
        return query.replace(REVISION_LIST, "<" + StringUtils.join(revisions, "> <") + ">");
    }

    private String replaceSubjectList(String query, String binding, String target, Resource... subjectIds) {
        if (subjectIds.length > 0) {
            return query.replace(target,
                    "VALUES ?" + binding + " { <" + StringUtils.join(subjectIds, "> <") + "> }");
        } else {
            return query.replace(target, "");
        }
    }

    protected Set<Resource> getRevisionsWithDeletionSubjects(List<Resource> revisions, RepositoryConnection conn,
                                                             Set<Resource> deletionSubjects, Resource... subjectIds) {

        Set<Resource> revisionsOfInterest = new HashSet<>();
        if (!deletionSubjects.isEmpty()) {
            String query = replaceRevisionList(GET_REVISIONS_WITH_SUBJECT, revisions);
            query = replaceSubjectList(query, "deletionSubject", SUBJECT_LIST, subjectIds);
            TupleQuery revisionsQuery = conn.prepareTupleQuery(query);
            try (TupleQueryResult result = revisionsQuery.evaluate()) {
                result.forEach(bindingSet ->
                        revisionsOfInterest.add(Bindings.requiredResource(bindingSet, "revisionOfInterest")));
            }
        }
        return revisionsOfInterest;
    }

    /**
     * Retrieves the subjects of deletions in the revisions and applies them to a temporary graph to write out.
     *
     * @param revisionId The Resource identifying the Revision.
     * @param revisions  The Set of Revision IRIs to filter the additions/deletions with.
     * @param tempGraph  The temporary graph to write to
     * @param conn       The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Resource revisionId, List<Resource> revisions, Resource tempGraph,
                                      RepositoryConnection conn) {
        conn.add((Iterable<? extends Statement>) getAdditions(revisionId, revisions, conn), tempGraph);
        conn.remove((Iterable<? extends Statement>) getDeletions(revisionId, revisions, conn), tempGraph);
    }

    /**
     * Updates the supplied Maps of addition and deletions statements with statements from the additions/deletions
     * associated with the supplied Revision resource. These additions/deletions are filtered to only include statements
     * whose subjects are Subjects of Deletions from the provided List of Commits. Addition statements are added to the
     * additions map if not present. If present, the counter of the times the statement has been added is incremented.
     * Deletion statements are removed from the additions map if only one exists, if more than one exists the counter is
     * decremented, otherwise the statements are added to the deletions list.
     *
     * @param additions The Map of Statements added to update.
     * @param deletions The Map of Statements deleted to update.
     * @param revisionID  The Resource identifying the Revision.
     * @param revisions   The Set of Revision IRIs to filter the additions/deletions with.
     * @param conn      The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Map<Statement, Integer> additions, Map<Statement, Integer> deletions,
                                      Resource revisionID, List<Resource> revisions, RepositoryConnection conn) {
        getAdditions(revisionID, revisions, conn).forEach(statement -> updateModels(statement, additions, deletions));
        getDeletions(revisionID, revisions, conn).forEach(statement -> updateModels(statement, deletions, additions));
    }

    /**
     * Retrieves the additions for provided revisionId whose subjects are filtered from the provided Revision List.
     * Returns a {@link GraphQueryResult}, an iterator over the returned statements.
     *
     * @param revisionId The Resource of the Revision to query for additions.
     * @param revisions  The Set of Revision IRIs used to filter the Resources to retrieve from the additions graph.
     * @param conn       The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getAdditions(Resource revisionId, List<Resource> revisions, RepositoryConnection conn) {
        GraphQuery additionsQuery = conn.prepareGraphQuery(GET_FILTERED_ADDITIONS_SUBQUERY
                .replace(REVISION_LIST,"<" + StringUtils.join(revisions, "> <") + ">")
                .replace("%THISREVISION%", "<" + revisionId.stringValue() + ">"));
        return additionsQuery.evaluate();
    }

    /**
     * Retrieves the deletions for provided revisionId whose subjects are filtered from the provided Revision List.
     * Returns a {@link GraphQueryResult}, an iterator over the returned statements.
     *
     * @param revisionId The Resource of the Revision to query for additions.
     * @param revisions  The Set of Revision IRIs used to filter the Resources to retrieve from the deletions graph.
     * @param conn       The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getDeletions(Resource revisionId, List<Resource> revisions, RepositoryConnection conn) {
        GraphQuery deletionsQuery = conn.prepareGraphQuery(GET_FILTERED_DELETIONS_SUBQUERY
                .replace(REVISION_LIST,"<" + StringUtils.join(revisions, "> <") + ">")
                .replace("%THISREVISION%", "<" + revisionId.stringValue() + ">"));
        return deletionsQuery.evaluate();
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

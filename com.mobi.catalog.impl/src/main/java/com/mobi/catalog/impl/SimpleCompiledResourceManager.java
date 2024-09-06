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

import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;

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
        List<Revision> revisionList = revisionManager.getRevisionChain(commitId, conn);
        List<Resource> revisionIRIs = revisionList.stream()
                .map(Revision::getResource)
                .collect(Collectors.toCollection(ArrayList::new));
        Resource headGraphIRI = getHeadGraph(commitId, conn);

        RepositoryConnection headGraphConn;
        boolean isActive = conn.isActive();
        if (isActive) {
            // Need a new RepositoryConnection to rollback changes to HEAD graph if connection is active
            headGraphConn = configProvider.getRepository().getConnection();
        } else {
            headGraphConn = conn;
        }

        headGraphConn.begin();
        // Add temporary pointer to HEAD graph as a revision addition delta
        Resource tempResource = vf.createIRI("urn:tempRevision/" + UUID.randomUUID());
        headGraphConn.add(tempResource, vf.createIRI(Revision.additions_IRI), headGraphIRI);
        revisionIRIs.add(0, tempResource);

        // Get all subjects in deletions graphs for provided revisions
        Set<Resource> deletionSubjects = getDeletionSubjects(revisionIRIs, headGraphConn, subjectIds);
        // Find all revisions with the subjects in additions or deletions graphs
        // These are the revisions of interest for comparing changes
        Set<Resource> revisionsOfInterest = getRevisionsWithDeletionSubjects(revisionIRIs, headGraphConn,
                deletionSubjects, subjectIds);

        if (!deletionSubjects.isEmpty()) {
            // Write any addition statement in revisionsOfInterest whose subject is NOT a deletionsSubject
            String additionsFromRoisQueryString = replaceRevisionList(GET_ADDITIONS_FROM_ROIS, revisionsOfInterest);
            additionsFromRoisQueryString = replaceSubjectList(additionsFromRoisQueryString,
                    "deletionSubject", "%SUBJECTLIST%", subjectIds);
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

            // Gather and write final statements from all subjects that have deletions
            Resource tempGraph = vf.createIRI("urn:tempGraph/" + UUID.randomUUID());
            revisionIRIs.forEach(revisionId ->
                    aggregateDifferences(revisionId, revisionIRIs, tempGraph, headGraphConn));

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

        // Write any revision that has additions that do not contain any subject in a deletions graph
        List<Resource> revisionsAdditionsOnly = revisionIRIs.stream()
                .filter(revision -> !revisionsOfInterest.contains(revision))
                .toList();
        if (!revisionsAdditionsOnly.isEmpty()) {
            String additionInRevisionQuery =  replaceRevisionList(GET_ADDITIONS_IN_REVISION, revisionsAdditionsOnly);
            additionInRevisionQuery = replaceSubjectList(additionInRevisionQuery, "s", "%SUBJECTLIST%", subjectIds);
            GraphQuery additionsQuery = headGraphConn.prepareGraphQuery(additionInRevisionQuery);
            try (GraphQueryResult result = additionsQuery.evaluate()) {
                result.forEach(consumer);
            }
        }

        headGraphConn.rollback();

        if (isActive) {
            // Close temporary headGraphConn
            headGraphConn.close();
        }
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
        query = replaceSubjectList(query, "s", "%SUBJECTLIST%", subjectIds);
        TupleQuery subjectsQuery = conn.prepareTupleQuery(query);
        try (TupleQueryResult result = subjectsQuery.evaluate()) {
            result.forEach(bindings ->
                    deletionSubjects.add((Bindings.requiredResource(bindings, "s"))));
        }
        return deletionSubjects;
    }

    private String replaceRevisionList(String query, Collection<Resource> revisions) {
        return query.replace("%REVISIONLIST%", "<" + StringUtils.join(revisions, "> <") + ">");
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
            query = replaceSubjectList(query, "deletionSubject", "%SUBJECTLIST%", subjectIds);
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
                .replace("%REVISIONLIST%","<" + StringUtils.join(revisions, "> <") + ">")
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
                .replace("%REVISIONLIST%","<" + StringUtils.join(revisions, "> <") + ">")
                .replace("%THISREVISION%", "<" + revisionId.stringValue() + ">"));
        return deletionsQuery.evaluate();
    }
}

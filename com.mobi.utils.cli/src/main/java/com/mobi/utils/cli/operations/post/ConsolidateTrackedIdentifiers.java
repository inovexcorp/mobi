package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.utils.cli.Restore;
import com.mobi.utils.cli.api.EndRestoreException;
import com.mobi.utils.cli.api.PostRestoreOperation;
import com.mobi.utils.cli.utils.RestoreUtils;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * This Post Restore Operation converts any pre 4.x OntologyRecord ontologyIRI and ShapesGraphRecord shapesGraphIRI
 * predicates to the new trackedIdentifier predicate. This should only activate if the systemTemp repository, that is
 * only created if the backup is from a pre 4.x version, is active and injected. If there are any OntologyRecords and
 * ShapesGraphRecords that have the same value for ontologyIRI and shapesGraphIRI respectively, throws an
 * EndRestoreException to stop the entire restore process before it tries to migrate the versioned data to the
 * inversioning structure.
 */
@Component(
        service = { ConsolidateTrackedIdentifiers.class, PostRestoreOperation.class }
)
public class ConsolidateTrackedIdentifiers implements PostRestoreOperation {
    private final ValueFactory vf = new ValidatingValueFactory();
    private static final Logger LOGGER = LoggerFactory.getLogger(ConsolidateTrackedIdentifiers.class);

    private static final String FIND_DUPLICATE_IDENTIFIERS;
    private static final String CONSOLIDATE_IDENTIFIERS;
    private static final String ONTOLOGY_RECORD_BINDING = "ontologyRecord";
    private static final String SHAPES_RECORD_BINDING = "shapesRecord";
    private static final String ONTOLOGY_IRI_BINDING = "ontologyIRI";

    static {
        try {
            FIND_DUPLICATE_IDENTIFIERS = IOUtils.toString(
                    Objects.requireNonNull(Restore.class.getResourceAsStream("/findDuplicateIdentifiers.rq")),
                    StandardCharsets.UTF_8
            );
            CONSOLIDATE_IDENTIFIERS = IOUtils.toString(
                    Objects.requireNonNull(Restore.class.getResourceAsStream("/consolidateIdentifiers.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference(target = "(id=systemTemp)")
    protected OsgiRepository tempRepo;

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 1;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Version before 3.1 (inclusive)
        return VersionRange.createFromVersionSpec("(,3.1]");
    }

    @Override
    public void execute() {
        LOGGER.debug(getClass().getSimpleName() + " execute");
        try (RepositoryConnection conn = tempRepo.getConnection()) {
            LOGGER.debug("Searching for duplicate identifiers between OntologyRecords and ShapesGraphRecords");
            try (TupleQueryResult result = conn.prepareTupleQuery(FIND_DUPLICATE_IDENTIFIERS).evaluate()) {
                if (result.hasNext()) {
                    String records = result.stream()
                            .map(bindings -> {
                                IRI ontologyRecordIRI = vf.createIRI(
                                        Bindings.requiredResource(bindings, ONTOLOGY_RECORD_BINDING).stringValue());
                                IRI shapesRecordIRI = vf.createIRI(
                                        Bindings.requiredResource(bindings, SHAPES_RECORD_BINDING).stringValue());
                                IRI ontologyIRI = vf.createIRI(
                                        Bindings.requiredResource(bindings, ONTOLOGY_IRI_BINDING).stringValue());
                                return String.format("""
                                          - Identifier: %s
                                            - OntologyRecord: %s
                                            - ShapesGraphRecord: %s\
                                        """, ontologyIRI, ontologyRecordIRI, shapesRecordIRI);
                            }).collect(Collectors.joining("\n"));
                    String logMessage = "Found Ontology and Shapes Graph Record(s) with the same identifier. Please "
                            + "update the ontology IRI and shapes graph IRI respectively "
                            + "in each record in the source system, create a backup, and try the restore again.\n";
                    throw new EndRestoreException(logMessage + records);
                }
            }
            RestoreUtils.out("Consolidating OntologyRecord ontologyIRI and ShapesGraphRecord shapesGraphIRI "
                    + "predicates", LOGGER);
            conn.prepareUpdate(CONSOLIDATE_IDENTIFIERS).execute();
        }
    }
}

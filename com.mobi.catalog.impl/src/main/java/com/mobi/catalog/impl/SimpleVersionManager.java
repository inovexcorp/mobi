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

import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecordFactory;
import com.mobi.exception.MobiException;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;

@Component
public class SimpleVersionManager implements VersionManager {

    private static final String RECORD_BINDING = "record";
    private static final String GET_NEW_LATEST_VERSION;

    static {
        try {
            GET_NEW_LATEST_VERSION = IOUtils.toString(
                    Objects.requireNonNull(SimpleVersionManager.class
                            .getResourceAsStream("/version/get-new-latest-version.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    ThingManager thingManager;

    @Reference
    RecordManager recordManager;

    @Reference
    VersionedRecordFactory versionedRecordFactory;

    @Reference
    VersionFactory versionFactory;

    @Override
    public <T extends Version> void addVersion(Resource catalogId, Resource versionedRecordId, T version,
                                               RepositoryConnection conn) {
        VersionedRecord record = recordManager.getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
        if (ConnectionUtils.containsContext(conn, version.getResource())) {
            throw thingManager.throwAlreadyExists(version.getResource(), versionFactory);
        }
        record.setLatestVersion(version);
        Set<Version> versions = record.getVersion_resource().stream()
                .map(versionFactory::createNew)
                .collect(Collectors.toSet());
        versions.add(version);
        record.setVersion(versions);
        thingManager.updateObject(record, conn);
        thingManager.addObject(version, conn);
    }

    @Override
    public <T extends Version> T createVersion(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T version = factory.createNew(vf.createIRI(Catalogs.VERSION_NAMESPACE + UUID.randomUUID()));
        version.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
        if (description != null) {
            version.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
        }
        version.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        version.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));

        return version;
    }

    @Override
    public <T extends Version> Optional<T> getLatestVersion(Resource catalogId, Resource versionedRecordId,
                                                            OrmFactory<T> factory, RepositoryConnection conn) {
        VersionedRecord record = recordManager.getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
        return record.getLatestVersion_resource().flatMap(resource ->
                Optional.of(thingManager.getExpectedObject(resource, factory, conn)));
    }

    @Override
    public <T extends Version> T getVersion(Resource catalogId, Resource recordId, Resource versionId,
                                            OrmFactory<T> factory, RepositoryConnection conn) {
        validateVersion(catalogId, recordId, versionId, conn);
        return thingManager.getObject(versionId, factory, conn);
    }

    @Override
    public Set<Version> getVersions(Resource catalogId, Resource versionedRecordId, RepositoryConnection conn) {
        VersionedRecord record = recordManager.getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
        return record.getVersion_resource().stream()
                .map(resource -> thingManager.getExpectedObject(resource, versionFactory, conn))
                .collect(Collectors.toSet());
    }

    @Override
    public void removeVersion(Resource recordId, Resource versionId, RepositoryConnection conn) {
        Version version = thingManager.getObject(versionId, versionFactory, conn);
        removeVersion(recordId, version, conn);
    }

    @Override
    public void removeVersion(Resource catalogId, Resource versionedRecordId, Resource versionId,
                              RepositoryConnection conn) {
        Version version = getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
        removeVersion(versionedRecordId, version, conn);
    }

    @Override
    public void removeVersion(Resource recordId, Version version, RepositoryConnection conn) {
        thingManager.removeObjectWithRelationship(version.getResource(), recordId, VersionedRecord.version_IRI, conn);
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        if (ConnectionUtils.contains(conn, recordId, latestVersionIRI, version.getResource(), recordId)) {
            conn.remove(recordId, latestVersionIRI, version.getResource(), recordId);
            TupleQuery query = conn.prepareTupleQuery(GET_NEW_LATEST_VERSION);
            query.setBinding(RECORD_BINDING, recordId);
            TupleQueryResult result = query.evaluate();

            Optional<Binding> binding;
            if (result.hasNext()
                    && (binding = Optional.ofNullable(result.next().getBinding("version"))).isPresent()) {
                conn.add(recordId, latestVersionIRI, binding.get().getValue(), recordId);
            }
            result.close();
        }
        version.getVersionedDistribution_resource().forEach(resource -> thingManager.remove(resource, conn));
    }

    @Override
    public <T extends Version> void updateVersion(Resource catalogId, Resource versionedRecordId, T newVersion,
                                                  RepositoryConnection conn) {
        validateVersion(catalogId, versionedRecordId, newVersion.getResource(), conn);
        thingManager.updateObject(newVersion, conn);
    }

    @Override
    public void validateVersion(Resource catalogId, Resource recordId, Resource versionId, RepositoryConnection conn) {
        VersionedRecord record = recordManager.getRecord(catalogId, recordId, versionedRecordFactory, conn);
        Set<Resource> versionIRIs = record.getVersion_resource();
        if (!versionIRIs.contains(versionId)) {
            throw thingManager.throwDoesNotBelong(versionId, versionFactory, recordId, versionedRecordFactory);
        }
    }
}

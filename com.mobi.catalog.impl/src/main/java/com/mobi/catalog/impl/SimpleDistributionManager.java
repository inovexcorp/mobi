package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.DistributionManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.DistributionFactory;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionFactory;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.ConnectionUtils;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class SimpleDistributionManager implements DistributionManager {

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    ThingManager thingManager;

    @Reference
    RecordManager recordManager;

    @Reference
    VersionManager versionManager;

    @Reference
    UnversionedRecordFactory unversionedRecordFactory;

    @Reference
    DistributionFactory distributionFactory;

    @Reference
    VersionFactory versionFactory;

    @Override
    public void addUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                           Distribution distribution, RepositoryConnection conn) {
        UnversionedRecord record = recordManager.getRecord(catalogId, unversionedRecordId, unversionedRecordFactory,
                conn);
        if (ConnectionUtils.containsContext(conn, distribution.getResource())) {
            throw thingManager.throwAlreadyExists(distribution.getResource(), distributionFactory);
        }
        Set<Distribution> distributions = record.getUnversionedDistribution_resource().stream()
                .map(distributionFactory::createNew)
                .collect(Collectors.toSet());
        distributions.add(distribution);
        record.setUnversionedDistribution(distributions);
        thingManager.updateObject(record, conn);
        thingManager.addObject(distribution, conn);
    }

    @Override
    public void addVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                         Distribution distribution, RepositoryConnection conn) {
        Version version = versionManager.getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
        if (ConnectionUtils.containsContext(conn, distribution.getResource())) {
            throw thingManager.throwAlreadyExists(distribution.getResource(), distributionFactory);
        }
        Set<Distribution> distributions = version.getVersionedDistribution_resource().stream()
                .map(distributionFactory::createNew)
                .collect(Collectors.toSet());
        distributions.add(distribution);
        version.setVersionedDistribution(distributions);
        thingManager.updateObject(version, conn);
        thingManager.addObject(distribution, conn);
    }

    @Override
    public Distribution createDistribution(DistributionConfig config) {
        OffsetDateTime now = OffsetDateTime.now();

        Distribution distribution = distributionFactory.createNew(vf.createIRI(Catalogs.DISTRIBUTION_NAMESPACE
                + UUID.randomUUID()));
        distribution.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(_Thing.title_IRI));
        distribution.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        distribution.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
        if (config.getDescription() != null) {
            distribution.setProperty(vf.createLiteral(config.getDescription()),
                    vf.createIRI(_Thing.description_IRI));
        }
        if (config.getFormat() != null) {
            distribution.setProperty(vf.createLiteral(config.getFormat()), vf.createIRI(_Thing.format_IRI));
        }
        if (config.getAccessURL() != null) {
            distribution.setAccessURL(config.getAccessURL());
        }
        if (config.getDownloadURL() != null) {
            distribution.setDownloadURL(config.getDownloadURL());
        }

        return distribution;
    }

    @Override
    public Distribution getUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                                   RepositoryConnection conn) {
        validateUnversionedDistribution(catalogId, recordId, distributionId, conn);
        return thingManager.getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public Set<Distribution> getUnversionedDistributions(Resource catalogId, Resource unversionedRecordId,
                                                         RepositoryConnection conn) {
        UnversionedRecord record = recordManager.getRecord(catalogId, unversionedRecordId, unversionedRecordFactory,
                conn);
        return record.getUnversionedDistribution_resource().stream()
                .map(resource -> thingManager.getExpectedObject(resource, distributionFactory, conn))
                .collect(Collectors.toSet());
    }

    @Override
    public Distribution getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                                 Resource distributionId, RepositoryConnection conn) {
        validateVersionedDistribution(catalogId, recordId, versionId, distributionId, conn);
        return thingManager.getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public Set<Distribution> getVersionedDistributions(Resource catalogId, Resource versionedRecordId,
                                                       Resource versionId, RepositoryConnection conn) {
        Version version = versionManager.getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
        return version.getVersionedDistribution_resource().stream()
                .map(resource -> thingManager.getExpectedObject(resource, distributionFactory, conn))
                .collect(Collectors.toSet());
    }

    @Override
    public void removeUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                              Resource distributionId, RepositoryConnection conn) {
        Distribution distribution = getUnversionedDistribution(catalogId, unversionedRecordId, distributionId, conn);
        thingManager.removeObjectWithRelationship(distribution.getResource(), unversionedRecordId,
                UnversionedRecord.unversionedDistribution_IRI, conn);
    }

    @Override
    public void removeVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                            Resource distributionId, RepositoryConnection conn) {
        Distribution distribution = getVersionedDistribution(catalogId, versionedRecordId, versionId,
                distributionId, conn);
        thingManager.removeObjectWithRelationship(distribution.getResource(), versionId,
                Version.versionedDistribution_IRI, conn);
    }

    @Override
    public void updateUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                              Distribution newDistribution, RepositoryConnection conn) {
        validateUnversionedDistribution(catalogId, unversionedRecordId, newDistribution.getResource(), conn);
        thingManager.updateObject(newDistribution, conn);
    }

    @Override
    public void updateVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                            Distribution newDistribution, RepositoryConnection conn) {
        validateVersionedDistribution(catalogId, versionedRecordId, versionId, newDistribution.getResource(), conn);
        thingManager.updateObject(newDistribution, conn);
    }

    @Override
    public void validateUnversionedDistribution(Resource catalogId, Resource recordId,
                                                Resource distributionId, RepositoryConnection conn) {
        UnversionedRecord record = recordManager.getRecord(catalogId, recordId, unversionedRecordFactory, conn);
        Set<Resource> distributionIRIs = record.getUnversionedDistribution_resource();
        if (!distributionIRIs.contains(distributionId)) {
            throw thingManager.throwDoesNotBelong(distributionId, distributionFactory, recordId,
                    unversionedRecordFactory);
        }
    }

    @Override
    public void validateVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                              Resource distributionId, RepositoryConnection conn) {
        Version version = versionManager.getVersion(catalogId, recordId, versionId, versionFactory, conn);
        if (!version.getVersionedDistribution_resource().contains(distributionId)) {
            throw thingManager.throwDoesNotBelong(distributionId, distributionFactory, versionId, versionFactory);
        }
    }
}

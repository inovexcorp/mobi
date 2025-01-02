package com.mobi.etl.service.delimited;

/*-
 * #%L
 * com.mobi.etl.csv
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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.delimited.MappingId;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.ontologies.delimited.ClassMapping;
import com.mobi.etl.api.ontologies.delimited.ClassMappingFactory;
import com.mobi.etl.api.ontologies.delimited.Mapping;
import com.mobi.etl.api.ontologies.delimited.MappingFactory;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.etl.api.ontologies.delimited.MappingRecordFactory;
import com.mobi.etl.api.pagination.MappingPaginatedSearchParams;
import com.mobi.etl.api.pagination.MappingRecordSearchResults;
import com.mobi.exception.MobiException;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Optional;
import javax.annotation.Nonnull;

@Component
public class SimpleMappingManager implements MappingManager {

    public SimpleMappingManager() {}

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    RecordManager recordManager;

    @Reference
    BranchManager branchManager;

    @Reference
    CommitManager commitManager;

    @Reference
    CompiledResourceManager compiledResourceManager;

    @Reference
    MappingRecordFactory mappingRecordFactory;

    @Reference
    MappingFactory mappingFactory;

    @Reference
    ClassMappingFactory classMappingFactory;

    @Override
    public MappingId createMappingId(Resource id) {
        return new SimpleMappingId.Builder(vf).id(id).build();
    }

    @Override
    public MappingId createMappingId(IRI mappingIRI) {
        return new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build();
    }

    @Override
    public MappingId createMappingId(IRI mappingIRI, IRI versionIRI) {
        return new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI).build();
    }

    @Override
    public MappingWrapper createMapping(File mapping) throws IOException {
        RDFFormat mapFormat = Rio.getParserFormatForFileName(mapping.getName()).orElseThrow(() ->
                new IllegalArgumentException("File is not in a valid RDF format"));
        return createMapping(new FileInputStream(mapping), mapFormat);
    }

    @Override
    public MappingWrapper createMapping(String jsonld) throws IOException {
        return createMapping(new ByteArrayInputStream(jsonld.getBytes(StandardCharsets.UTF_8)), RDFFormat.JSONLD);
    }

    @Override
    public MappingWrapper createMapping(Model model) {
        return getWrapperFromModel(model);
    }

    @Override
    public MappingWrapper createMapping(InputStream in, RDFFormat format) throws IOException {
        return createMapping(Rio.parse(in, "", format));
    }

    @Override
    public PaginatedSearchResults<MappingRecord> getMappingRecords(MappingPaginatedSearchParams searchParams) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            PaginatedSearchResults<Record> results = recordManager.findRecord(configProvider.getLocalCatalogIRI(),
                    searchParams.build(), conn);
            return new MappingRecordSearchResults(results, mappingRecordFactory);
        }
    }

    @Override
    public Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch masterBranch = branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId, conn);
            return Optional.of(
                    getWrapperFromModel(compiledResourceManager.getCompiledResource(getHeadOfBranch(masterBranch),
                            conn)));
        }
    }

    @Override
    public Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Commit commit = commitManager.getHeadCommit(configProvider.getLocalCatalogIRI(), recordId, branchId, conn);
            return Optional.of(getWrapperFromModel(compiledResourceManager.getCompiledResource(commit.getResource(),
                    conn)));
        }
    }

    @Override
    public Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId, @Nonnull Resource branchId,
            @Nonnull Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return Optional.of(
                    getWrapperFromModel(compiledResourceManager.getCompiledResource(recordId, branchId, commitId,
                            conn)));
        }
    }

    private Resource getHeadOfBranch(Branch branch) {
        return branch.getHead_resource().orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + "has no head Commit set."));
    }

    private MappingWrapper getWrapperFromModel(Model model) {
        Collection<Mapping> mappings = mappingFactory.getAllExisting(model);
        if (mappings.size() != 1) {
            throw new MobiException("Input source must contain exactly one Mapping resource.");
        }

        Mapping mapping = mappings.iterator().next();
        Optional<IRI> versionIriOpt = mapping.getVersionIRI();
        SimpleMappingId.Builder builder = new SimpleMappingId.Builder(vf)
                .mappingIRI(vf.createIRI(mapping.getResource().stringValue()));
        versionIriOpt.ifPresent(builder::versionIRI);
        Collection<ClassMapping> classMappings = classMappingFactory.getAllExisting(model);
        return new SimpleMappingWrapper(builder.build(), mapping, classMappings, model);
    }
}

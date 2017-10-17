package com.mobi.etl.service.delimited;

/*-
 * #%L
 * com.mobi.etl.csv
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.etl.api.config.delimited.MappingRecordConfig;
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
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Collections;
import java.util.Optional;
import javax.annotation.Nonnull;

@Component
public class SimpleMappingManager implements MappingManager {
    private ValueFactory vf;
    private CatalogManager catalogManager;
    private MappingRecordFactory mappingRecordFactory;
    private MappingFactory mappingFactory;
    private ClassMappingFactory classMappingFactory;
    private SesameTransformer transformer;

    public SimpleMappingManager() {}

    @Reference
    protected void setValueFactory(final ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setMappingRecordFactory(MappingRecordFactory mappingRecordFactory) {
        this.mappingRecordFactory = mappingRecordFactory;
    }

    @Reference
    protected void setMappingFactory(MappingFactory mappingFactory) {
        this.mappingFactory = mappingFactory;
    }

    @Reference
    protected void setClassMappingFactory(ClassMappingFactory classMappingFactory) {
        this.classMappingFactory = classMappingFactory;
    }

    @Reference
    protected void setSesameTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public MappingRecord createMappingRecord(MappingRecordConfig config) {
        return catalogManager.createRecord(config, mappingRecordFactory);
    }

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
    public MappingWrapper createMapping(MappingId id) {
        Resource mappingResource = id.getMappingIRI().isPresent() ? id.getMappingIRI().get() :
                id.getMappingIdentifier();
        Mapping mapping = mappingFactory.createNew(mappingResource);

        Optional<IRI> versionIRI = id.getVersionIRI();
        versionIRI.ifPresent(mapping::setVersionIRI);

        return new SimpleMappingWrapper(id, mapping, Collections.emptySet(), mapping.getModel());
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
    public MappingWrapper createMapping(InputStream in, RDFFormat format) throws IOException {
        return getWrapperFromModel(transformer.mobiModel(Rio.parse(in, "", format)));
    }

    @Override
    public PaginatedSearchResults<MappingRecord> getMappingRecords(MappingPaginatedSearchParams searchParams) {
        PaginatedSearchResults<Record> results = catalogManager.findRecord(catalogManager.getLocalCatalogIRI(),
                searchParams.build());
        return new MappingRecordSearchResults(results, mappingRecordFactory);
    }

    @Override
    public Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId) {
        Branch masterBranch = catalogManager.getMasterBranch(catalogManager.getLocalCatalogIRI(), recordId);
        return Optional.of(getWrapperFromModel(catalogManager.getCompiledResource(getHeadOfBranch(masterBranch))));
    }

    @Override
    public Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        Commit commit = catalogManager.getHeadCommit(catalogManager.getLocalCatalogIRI(), recordId, branchId);
        return Optional.of(getWrapperFromModel(catalogManager.getCompiledResource(commit.getResource())));
    }

    @Override
    public Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId, @Nonnull Resource branchId,
            @Nonnull Resource commitId) {

        return Optional.of(getWrapperFromModel(catalogManager.getCompiledResource(recordId, branchId, commitId)));
    }

    @Override
    public MappingRecord deleteMapping(@Nonnull Resource recordId) throws MobiException {
        return catalogManager.removeRecord(catalogManager.getLocalCatalogIRI(), recordId, mappingRecordFactory);
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

package org.matonto.etl.service.delimited;

/*-
 * #%L
 * org.matonto.etl.csv
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
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.etl.api.config.delimited.MappingRecordConfig;
import org.matonto.etl.api.delimited.MappingId;
import org.matonto.etl.api.delimited.MappingManager;
import org.matonto.etl.api.delimited.MappingWrapper;
import org.matonto.etl.api.ontologies.delimited.ClassMapping;
import org.matonto.etl.api.ontologies.delimited.ClassMappingFactory;
import org.matonto.etl.api.ontologies.delimited.Mapping;
import org.matonto.etl.api.ontologies.delimited.MappingFactory;
import org.matonto.etl.api.ontologies.delimited.MappingRecord;
import org.matonto.etl.api.ontologies.delimited.MappingRecordFactory;
import org.matonto.etl.api.pagination.MappingPaginatedSearchParams;
import org.matonto.etl.api.pagination.MappingRecordSearchResults;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
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

@Component(name = SimpleMappingManager.COMPONENT_NAME)
public class SimpleMappingManager implements MappingManager {
    static final String COMPONENT_NAME = "org.matonto.etl.api.MappingManager";
    private ValueFactory vf;
    private CatalogManager catalogManager;
    private MappingRecordFactory mappingRecordFactory;
    private MappingFactory mappingFactory;
    private ClassMappingFactory classMappingFactory;
    private BranchFactory branchFactory;
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
    protected void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
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
        return getWrapperFromModel(transformer.matontoModel(Rio.parse(in, "", format)));
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
        return catalogManager.getBranch(catalogManager.getLocalCatalogIRI(), recordId, branchId, branchFactory)
                .flatMap(branch ->
                        Optional.of(getWrapperFromModel(catalogManager.getCompiledResource(getHeadOfBranch(branch)))));
    }

    @Override
    public Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                                    @Nonnull Resource commitId) {
        return catalogManager.getCommit(catalogManager.getLocalCatalogIRI(), recordId, branchId, commitId)
                .flatMap(commit -> Optional.of(getWrapperFromModel(catalogManager.getCompiledResource(commitId))));
    }

    @Override
    public void deleteMapping(@Nonnull Resource recordId) throws MatOntoException {
        catalogManager.removeRecord(catalogManager.getLocalCatalogIRI(), recordId);
    }

    private Resource getHeadOfBranch(Branch branch) {
        return branch.getHead_resource().orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + "has no head Commit set."));
    }

    private MappingWrapper getWrapperFromModel(Model model) {
        Collection<Mapping> mappings = mappingFactory.getAllExisting(model);
        if (mappings.size() != 1) {
            throw new MatOntoException("Input source must contain exactly one Mapping resource.");
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

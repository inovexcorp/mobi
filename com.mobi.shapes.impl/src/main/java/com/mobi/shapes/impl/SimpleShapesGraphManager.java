package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.shapes.api.ShapesGraph;
import com.mobi.shapes.api.ShapesGraphManager;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import javax.annotation.Nonnull;

@Component(
        service = { SimpleShapesGraphManager.class, ShapesGraphManager.class }
)
public class SimpleShapesGraphManager implements ShapesGraphManager {

    private static final String SHAPES_GRAPH_IRI = "shapesGraphIRI";
    private static final String CATALOG = "catalog";
    private static final String FIND_SHAPES_GRAPH;

    static {
        try {
            FIND_SHAPES_GRAPH = IOUtils.toString(
                    SimpleShapesGraphManager.class.getResourceAsStream("/find-shapes-graph.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    BranchManager branchManager;

    @Reference
    CommitManager commitManager;

    @Reference
    CompiledResourceManager compiledResourceManager;

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Override
    public boolean shapesGraphIriExists(Resource shapesGraphId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_SHAPES_GRAPH);
            query.setBinding(SHAPES_GRAPH_IRI, shapesGraphId);
            query.setBinding(CATALOG, configProvider.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            boolean exists = result.hasNext();
            result.close();
            return exists;
        }
    }

    @Override
    public Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch masterBranch = branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId, conn);
            return Optional.of(
                    getShapesGraphFromModel(compiledResourceManager.getCompiledResource(getHeadOfBranch(masterBranch),
                            conn)));
        }
    }

    @Override
    public Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Commit commit = commitManager.getHeadCommit(configProvider.getLocalCatalogIRI(), recordId, branchId, conn);
            return Optional.of(getShapesGraphFromModel(compiledResourceManager.getCompiledResource(commit.getResource(),
                    conn)));
        }
    }

    @Override
    public Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                                     @Nonnull Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return Optional.of(
                    getShapesGraphFromModel(compiledResourceManager.getCompiledResource(recordId, branchId, commitId,
                            conn)));
        }
    }

    @Override
    public Optional<ShapesGraph> retrieveShapesGraphByCommit(@Nonnull Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return Optional.of(getShapesGraphFromModel(compiledResourceManager.getCompiledResource(commitId, conn)));
        }
    }

    private Resource getHeadOfBranch(Branch branch) {
        return branch.getHead_resource().orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + "has no head Commit set."));
    }

    private ShapesGraph getShapesGraphFromModel(Model model) {
        return new SimpleShapesGraph(model, vf, mf);
    }
}

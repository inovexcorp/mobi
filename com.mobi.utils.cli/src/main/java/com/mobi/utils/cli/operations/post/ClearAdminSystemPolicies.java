package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.utils.cli.api.PostRestoreOperation;
import com.mobi.utils.cli.utils.PolicyFileUtils;
import com.mobi.vfs.api.VirtualFilesystem;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(
        service = { ClearAdminSystemPolicies.class, PostRestoreOperation.class }
)
public class ClearAdminSystemPolicies implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(ClearAdminSystemPolicies.class);
    private static final ValueFactory vf = new ValidatingValueFactory();
    private static final List<Resource> POLICES_TO_REMOVE;

    static {
        POLICES_TO_REMOVE = Stream.of(vf.createIRI("http://mobi.com/policies/system-repo-access"),
                        vf.createIRI("http://mobi.com/policies/all-access-versioned-rdf-record"),
                        vf.createIRI("http://mobi.com/policies/dataset-creation"),
                        vf.createIRI("http://mobi.com/policies/ontology-creation"),
                        vf.createIRI("http://mobi.com/policies/shapes-graph-record-creation"))
                .collect(Collectors.toUnmodifiableList());
    }

    @Reference
    protected CatalogConfigProvider config;

    @Reference
    protected VirtualFilesystem vfs;

    @Activate
    public void activate() {
        LOGGER.debug("{} activate", getClass().getSimpleName());
    }

    @Override
    public Integer getPriority() {
        return 105;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Up to version 1.20 (excluded). Reference: MP-2505
        return VersionRange.createFromVersionSpec("(0,1.20)");
    }

    @Override
    public void execute() {
        LOGGER.debug("{} execute", getClass().getSimpleName());
        LOGGER.debug("Remove old versions of admin policy and system repo query policy");
        // 1.20 changed admin policy and system repo query policy.
        // Need to remove old versions so update policy takes effect.
        try (RepositoryConnection conn = config.getRepository().getConnection()) {
            PolicyFileUtils.removePolicyFiles(conn, vfs, POLICES_TO_REMOVE, LOGGER);
        }
    }
}

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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
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

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Component(
        service = { ClearQuerySystemRepoPolicy.class, PostRestoreOperation.class }
)
public class ClearQuerySystemRepoPolicy implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(ClearQuerySystemRepoPolicy.class);
    private static final ValueFactory vf = new ValidatingValueFactory();
    private static final List<Resource> POLICES_TO_REMOVE;
    private static final String QUERY_SYSTEM_POLICY = "http://mobi.com/policies/system-repo-access";

    static {
        POLICES_TO_REMOVE = List.of(vf.createIRI(QUERY_SYSTEM_POLICY));
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
        return 106;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Up to version 4.1 (excluded). Reference: MP-3215
        return VersionRange.createFromVersionSpec("(0,4.1)");
    }

    @Override
    public void execute() {
        LOGGER.debug("{} execute", getClass().getSimpleName());
        LOGGER.debug("Remove old versions of system repo query policy");
        // 4.1 changed system repo query policy to use new ID and filename
        // Need to remove old versions so update policy takes effect.
        try (RepositoryConnection conn = config.getRepository().getConnection()) {
            PolicyFileUtils.removePolicyFiles(conn, vfs, POLICES_TO_REMOVE, LOGGER);
        }

        Path path = Paths.get(System.getProperty("karaf.etc") + File.separator + "policies"
                + File.separator + "systemPolicies" + File.separator
                + URLEncoder.encode(QUERY_SYSTEM_POLICY, StandardCharsets.UTF_8) + ".xml");
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }
}

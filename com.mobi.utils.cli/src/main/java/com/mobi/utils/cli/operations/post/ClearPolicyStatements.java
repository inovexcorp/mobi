package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.utils.cli.Restore;
import com.mobi.utils.cli.api.PostRestoreOperation;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

@Component(
        service = { ClearPolicyStatements.class, PostRestoreOperation.class }
)
public class ClearPolicyStatements implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(ClearPolicyStatements.class);
    private static final String CLEAR_POLICY_STATEMENTS;

    static {
        try {
            CLEAR_POLICY_STATEMENTS = IOUtils.toString(
                    Objects.requireNonNull(Restore.class.getResourceAsStream("/clearPolicyStatements.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    protected CatalogConfigProvider config;

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 110;
    }

    @Override
    public VersionRange getVersionRange () throws InvalidVersionSpecificationException {
        return VersionRange.createFromVersionSpec("(0.1,]");  // All Versions
    }

    @Override
    public void execute() {
        LOGGER.debug(getClass().getSimpleName() + " execute");
        try (RepositoryConnection conn = config.getRepository().getConnection()) {
            LOGGER.debug("Remove PolicyFile statements");
            conn.prepareUpdate(CLEAR_POLICY_STATEMENTS).execute();
        }
    }

}

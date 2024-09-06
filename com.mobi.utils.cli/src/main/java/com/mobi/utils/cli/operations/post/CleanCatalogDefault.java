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
import com.mobi.persistence.utils.Bindings;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.utils.cli.api.PostRestoreOperation;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component(
        service = { CleanCatalogDefault.class, PostRestoreOperation.class }
)
public class CleanCatalogDefault implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(CleanCatalogDefault.class);
    private static final String CLEAN_DANGLING_ADDITIONS_DELETIONS;
    private static final String CLEAR_INPROGRESS_COMMIT_NO_RECORD;
    private static final String CLEAR_INPROGRESS_COMMIT_NO_USER;
    private static final String SEARCH_STATE_INSTANCES_NO_USER;

    static {
        try {
            CLEAN_DANGLING_ADDITIONS_DELETIONS = IOUtils.toString(
                    CleanCatalogDefault.class.getResourceAsStream("/clearDanglingAdditionsDeletions.rq"),
                    StandardCharsets.UTF_8
            );
            CLEAR_INPROGRESS_COMMIT_NO_RECORD = IOUtils.toString(
                    CleanCatalogDefault.class.getResourceAsStream("/clearInProgressCommitNoRecord.rq"),
                    StandardCharsets.UTF_8
            );
            CLEAR_INPROGRESS_COMMIT_NO_USER = IOUtils.toString(
                    CleanCatalogDefault.class.getResourceAsStream("/clearInProgressCommitNoUser.rq"),
                    StandardCharsets.UTF_8
            );
            SEARCH_STATE_INSTANCES_NO_USER = IOUtils.toString(
                    CleanCatalogDefault.class.getResourceAsStream("/searchStateInstanceNoUser.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    protected CatalogConfigProvider config;

    @Reference
    protected StateManager stateManager;

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 100;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        return VersionRange.createFromVersionSpec("(0.1,]"); // Reference: MP-2491
    }

    @Override
    public void execute() {
        LOGGER.debug(getClass().getSimpleName() + " execute");
        try (RepositoryConnection conn = config.getRepository().getConnection()) {
            LOGGER.debug("Remove All In progress Commits where User doesn’t exist");
            conn.prepareUpdate(CLEAR_INPROGRESS_COMMIT_NO_USER).execute();

            LOGGER.debug("Remove In Progress Commits where Record doesn’t exist");
            conn.prepareUpdate(CLEAR_INPROGRESS_COMMIT_NO_RECORD).execute();

            LOGGER.debug("Remove Addition and Deletion Graphs with no Revision");
            conn.prepareUpdate(CLEAN_DANGLING_ADDITIONS_DELETIONS).execute();

            LOGGER.debug("Remove State instances where User does not exist");
            TupleQueryResult results = conn.prepareTupleQuery(SEARCH_STATE_INSTANCES_NO_USER).evaluate();
            results.forEach(bindingSet -> stateManager.deleteState(Bindings.requiredResource(bindingSet, "state")));
        }
    }

}

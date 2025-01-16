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

import com.mobi.exception.MobiException;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.utils.cli.api.PostRestoreOperation;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.query.Update;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

@Component(
        service = { UpdateDuplicateTimestamps.class, PostRestoreOperation.class }
)
public class UpdateDuplicateTimestamps implements PostRestoreOperation {

    private static final String UPDATE_TIMESTAMPS;

    @Reference(target = "(id=system)")
    OsgiRepository systemRepo;

    static {
        try {
            UPDATE_TIMESTAMPS = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/updateDuplicateTimestamps.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public void execute() {
        try (RepositoryConnection conn = systemRepo.getConnection()) {
            Update update = conn.prepareUpdate(UPDATE_TIMESTAMPS);
            update.execute();
        }

    }

    @Override
    public Integer getPriority() {
        return 999;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        return VersionRange.createFromVersionSpec("(1.0,)");
    }
}

package com.mobi.utils.cli.operations.config;

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

import com.mobi.exception.MobiException;
import com.mobi.utils.cli.api.ConfigRestoreOperation;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.osgi.service.component.annotations.Component;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Component(
        service = { Create3MigrationRepo.class, ConfigRestoreOperation.class }
)
public class Create3MigrationRepo implements ConfigRestoreOperation {

    @Override
    public List<String> getExcludedFiles() {
        return new ArrayList<>();
    }

    @Override
    public List<String> addConfig() {
        try {
            String tempConfig = "com.mobi.service.repository.native-systemTemp.cfg";
            InputStream stream = getClass().getResourceAsStream("/" + tempConfig);
            Files.copy(stream, Paths.get(System.getProperty("karaf.etc") + File.separator + tempConfig));
            return List.of(tempConfig);
        } catch (IOException e) {
            throw new MobiException("Could not copy temp repo config for 3.0 migration", e);
        }
    }

    @Override
    public Integer getPriority() {
        return 20;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        return VersionRange.createFromVersionSpec("(,4.0)");
    }
}

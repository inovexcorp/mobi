package com.mobi.utils.cli.operations.config;

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

import com.mobi.utils.cli.api.ConfigRestoreOperation;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Component(
        service = { Version4IgnoreLogging.class, ConfigRestoreOperation.class }
)
public class Version4IgnoreLogging implements ConfigRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(Version4IgnoreLogging.class);

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 10;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Version before 3.1 (inclusive)
        return VersionRange.createFromVersionSpec("(,3.1]");
    }

    @Override
    public List<String> getExcludedFiles() {
        LOGGER.debug(getClass().getSimpleName() + " getExcludedFiles");
        LOGGER.debug("4.0 Mobi version detected. Excluding logging file from backup.");
        return List.of("org.ops4j.pax.logging.cfg");
    }
}

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
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;

@Component(
        service = { Karaf42Upgrade.class, ConfigRestoreOperation.class }
)
public class Karaf42Upgrade implements ConfigRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(Karaf42Upgrade.class);

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
        // Versions up to 1.12 (included)
        return VersionRange.createFromVersionSpec("(,1.12]");
    }

    @Override
    public List<String> getExcludedFiles() {
        LOGGER.debug(getClass().getSimpleName() + " getExcludedFiles");
        LOGGER.debug("1.12 Mobi version detected. Blacklisting additional files from backup.");
        // Blacklist 1.12 default Karaf config files that have changed with Karaf 4.2.x upgrade
        // Blacklist also includes VFS config file with added directory property
        // Blacklist also includes PolicyCacheConfiguration config file for change between size to number of entries
        try {
            return IOUtils.readLines(Objects.requireNonNull(getClass().getResourceAsStream("/configBlacklist-1.12.txt")),
                    StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

}

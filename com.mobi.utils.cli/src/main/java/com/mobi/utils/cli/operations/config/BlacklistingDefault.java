package com.mobi.utils.cli.operations.config;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component(
        service = { BlacklistingDefault.class, ConfigRestoreOperation.class }
)
public class BlacklistingDefault implements ConfigRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(BlacklistingDefault.class);

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 1;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // All Versions of mobi
        return VersionRange.createFromVersionSpec("(0.1,]");
    }

    @Override
    public List<String> getExcludedFiles() {
        LOGGER.debug(getClass().getSimpleName() + " getExcludedFiles");
        LOGGER.debug("Version detected. Blacklisting default files from backup.");
        return IOUtils.readLines(getClass().getResourceAsStream("/configBlacklist.txt"),
                StandardCharsets.UTF_8);
    }

}
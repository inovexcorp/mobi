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
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(
        service = { Java8Upgrade.class, ConfigRestoreOperation.class }
)
public class Java8Upgrade implements ConfigRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(Java8Upgrade.class);

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 20;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Versions up to 1.19 (excluded)
        return VersionRange.createFromVersionSpec("(,1.19)");
    }

    @Override
    public List<String> getExcludedFiles() {
        LOGGER.debug(getClass().getSimpleName() + " getExcludedFiles");
        LOGGER.debug("Version lower than 1.19 detected. Blacklisting additional files from backup.");
        // Blacklist karaf jre.properties file due to javax.xml.bind version for Java 8 in > 1.19
        return Stream.of("jre.properties").collect(Collectors.toUnmodifiableList());
    }

}
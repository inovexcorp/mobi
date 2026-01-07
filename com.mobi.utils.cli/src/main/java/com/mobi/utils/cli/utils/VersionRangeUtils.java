package com.mobi.utils.cli.utils;

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

import com.mobi.exception.MobiException;
import com.mobi.utils.cli.api.RestoreOperation;
import org.apache.maven.artifact.versioning.ArtifactVersion;
import org.apache.maven.artifact.versioning.DefaultArtifactVersion;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class VersionRangeUtils {

    /**
     * Filter Restore Operations
     *
     * @param operationList List of Restore Operations, RestoreOperation specify the range for
     * which it should run with standard maven version range syntax
     * @param currentMobiVersion Current Version of Mobi Running
     * @return List of Restore Operations that has been filtered and sorted by priority
     */
    public static List<? extends RestoreOperation> filterRestoreOperations(List<? extends RestoreOperation> operationList, String currentMobiVersion) {
        ArtifactVersion version = new DefaultArtifactVersion(currentMobiVersion);
        return operationList.stream()
                .filter((RestoreOperation op) -> {
                    try {
                        return op.getVersionRange().containsVersion(version);
                    } catch (InvalidVersionSpecificationException e){
                        return false;
                    }
                })
                .sorted(Comparator.comparing(RestoreOperation::getPriority))
                .collect(Collectors.toList());
    }

    public static boolean isPre4Version(String currentMobiVersion) {
        try {
            return VersionRange.createFromVersionSpec("(,4.0)")
                    .containsVersion(new DefaultArtifactVersion(currentMobiVersion));
        } catch (InvalidVersionSpecificationException e) {
            throw new MobiException(e);
        }
    }
}

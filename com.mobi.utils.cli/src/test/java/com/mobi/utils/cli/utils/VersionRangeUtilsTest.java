package com.mobi.utils.cli.utils;

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

import com.mobi.utils.cli.CliTestUtils;
import com.mobi.utils.cli.api.ConfigRestoreOperation;
import com.mobi.utils.cli.api.RestoreOperation;
import com.mobi.utils.cli.utils.VersionRangeUtils;
import org.apache.maven.artifact.versioning.ArtifactVersion;
import org.apache.maven.artifact.versioning.DefaultArtifactVersion;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.junit.Assert;
import org.junit.Test;
import org.apache.maven.artifact.versioning.VersionRange;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;


public class VersionRangeUtilsTest {

    @Test
    public void createFromVersionSpecTest() throws InvalidVersionSpecificationException {
        ArtifactVersion version1 = new DefaultArtifactVersion("1");
        Assert.assertEquals(1, version1.getMajorVersion());
        Assert.assertEquals(0, version1.getMinorVersion());

        ArtifactVersion version18 = new DefaultArtifactVersion("1.18.1");
        Assert.assertEquals(1, version18.getMajorVersion());
        Assert.assertEquals(18, version18.getMinorVersion());

        ArtifactVersion version19 = new DefaultArtifactVersion("1.19");
        Assert.assertEquals(1, version19.getMajorVersion());
        Assert.assertEquals(19, version19.getMinorVersion());

        VersionRange versionRangeLess19 = VersionRange.createFromVersionSpec("[1.12,1.19)");
        Assert.assertFalse(versionRangeLess19.containsVersion(version1));
        Assert.assertTrue(versionRangeLess19.containsVersion(version18));
        Assert.assertFalse(versionRangeLess19.containsVersion(version19));

        VersionRange versionRangeLessEqual19 = VersionRange.createFromVersionSpec("[1.12,1.19]");
        Assert.assertFalse(versionRangeLessEqual19.containsVersion(version1));
        Assert.assertTrue(versionRangeLessEqual19.containsVersion(version18));
        Assert.assertTrue(versionRangeLessEqual19.containsVersion(version19));
    }

    @Test
    public void filterRestoreOperationsTest() {
        ConfigRestoreOperation op112 = (ConfigRestoreOperation) CliTestUtils.mockRestoreOperation(ConfigRestoreOperation.class, "(,1.12]", 1);
        ConfigRestoreOperation op119 = (ConfigRestoreOperation) CliTestUtils.mockRestoreOperation(ConfigRestoreOperation.class, "(,1.19)", 2);
        ConfigRestoreOperation op200 = (ConfigRestoreOperation) CliTestUtils.mockRestoreOperation(ConfigRestoreOperation.class, "(,2.0)", 3);

        List<RestoreOperation> inputOperations = Stream.of(op119, op200, op112)
                .collect(Collectors.toUnmodifiableList());

        List<RestoreOperation> filteredOperations1 = (List<RestoreOperation>) VersionRangeUtils.filterRestoreOperations(inputOperations, "1.12");
        Assert.assertEquals(CliTestUtils.ofRestoreOperation(op112, op119, op200), filteredOperations1);

        List<RestoreOperation> filteredOperations2 = (List<RestoreOperation>) VersionRangeUtils.filterRestoreOperations(inputOperations, "1.13");
        Assert.assertEquals(CliTestUtils.ofRestoreOperation(op119, op200), filteredOperations2);

        List<RestoreOperation> filteredOperations3 = (List<RestoreOperation>) VersionRangeUtils.filterRestoreOperations(inputOperations, "1.19");
        Assert.assertEquals(CliTestUtils.ofRestoreOperation(op200), filteredOperations3);
    }

}

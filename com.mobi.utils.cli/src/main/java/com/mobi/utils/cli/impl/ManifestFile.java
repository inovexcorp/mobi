package com.mobi.utils.cli.impl;

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

import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Class Represents Manifest File
 * {
 *     "version": "major.minor.patch-SNAPSHOT",
 *     "date": "2023-10-17T13:53:39.765912-04:00",
 *     "repositories":     {
 *         "ontologyCache": "repos/ontologyCache.zip",
 *         "system": "repos/system.zip",
 *         "prov": "repos/prov.zip"
 *     }
 * }
 */
public class ManifestFile {
    private String version;
    private String date;
    private JSONObject repositories;
    private Optional<String> error;

    public ManifestFile() {
       this.error = Optional.empty();
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public JSONObject getRepositories() {
        return repositories;
    }

    public void setRepositories(JSONObject repositories) {
        this.repositories = repositories;
    }

    public Optional<String> getError() {
        return error;
    }

    public void setError(Optional<String> error) {
        this.error = error;
    }

    public static ManifestFile fromJson(String jsonFilePath, List<String> supportedMobiVersions) {
        ManifestFile manifestFile = new ManifestFile();

        JSONObject manifest;
        try {
            String manifestStr = new String(Files.readAllBytes(Paths.get(jsonFilePath)));
            manifest = JSONObject.fromObject(manifestStr);
            if (manifest == null){
                manifestFile.setError(Optional.of("Manifest JSON is invalid"));
                return manifestFile;
            }
            JSONObject manifestRepos = manifest.optJSONObject("repositories");
            if (manifestRepos == null){
                manifestFile.setError(Optional.of("Manifest JSON is missing repositories"));
                return manifestFile;
            }
            manifestFile.setRepositories(manifestRepos);
        } catch (IOException e) {
            manifestFile.setError(Optional.of("Error loading manifest file: " + e.getMessage()));
            return manifestFile;
        }

        String date = manifest.optString("date");
        if (StringUtils.isNotEmpty(date)) {
            manifestFile.setDate(date);
        }

        String fullBackupVer = manifest.optString("version");
        if (StringUtils.isEmpty(fullBackupVer)) {
            manifestFile.setError(Optional.of("Manifest must contain the Mobi 'version' identifier of backup"));
            return manifestFile;
        }
        
        Pattern versionPattern = Pattern.compile("([0-9]+\\.[0-9]+)");
        Matcher matcher = versionPattern.matcher(fullBackupVer);
        if (!matcher.find()) {
            manifestFile.setError(Optional.of("Mobi version in manifest must match regex pattern [0-9]+\\\\.[0-9]+"));
            return manifestFile;
        }

        String backupVersion = matcher.group(1);
        if (!supportedMobiVersions.contains(backupVersion)) {
            manifestFile.setError(Optional.of("A valid version of Mobi is required (" + String.join(".*, ", supportedMobiVersions) + ".*)."));
            return manifestFile;
        }
        manifestFile.setVersion(backupVersion);

        return manifestFile;
    }
}

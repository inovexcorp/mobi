package com.mobi.utils.cli.utils;

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

import com.mobi.utils.cli.api.RestoreOperation;
import org.apache.commons.io.FilenameUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.osgi.framework.BundleContext;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.framework.ServiceReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class RestoreUtils {
    private static final Logger LOGGER = LoggerFactory.getLogger(RestoreUtils.class);

    /**
     * Unzip archive into temp directory
     *
     * @param filePath    file to unzip
     * @param destination directory
     * @throws IOException
     */
    public static void unzipFile(String filePath, String destination) throws IOException {
        File destDir = new File(destination);
        byte[] buffer = new byte[1024];
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(filePath))) {
            ZipEntry zipEntry = zis.getNextEntry();
            while (zipEntry != null) {
                File newFile;
                // For malformed zip files
                if (zipEntry.getName().contains("\\")) {
                    String[] pathParts = zipEntry.getName().split("\\\\");

                    String path = destination;
                    for (int i = 0; i < pathParts.length - 1; i++) {
                        path = path + File.separator + pathParts[i];
                        File directory = new File(path);
                        if (!directory.getParentFile().exists()) {
                            directory.getParentFile().mkdirs();
                        }
                        directory.mkdir();
                    }
                    newFile = new File(path + File.separator + pathParts[pathParts.length - 1]);
                } else {
                    // Normal processing
                    newFile = newFile(destDir, zipEntry);
                    if (zipEntry.isDirectory()) {
                        newFile.mkdirs();
                        zipEntry = zis.getNextEntry();
                        continue;
                    }
                    if (!newFile.getParentFile().exists()) {
                        newFile.getParentFile().mkdirs();
                    }
                }
                try (FileOutputStream fos = new FileOutputStream(newFile)) {
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        fos.write(buffer, 0, len);
                    }
                    zipEntry = zis.getNextEntry();
                }
                if (newFile.getAbsolutePath().endsWith("configurations.zip")
                        || newFile.getAbsolutePath().endsWith("policies.zip")
                        || newFile.getAbsolutePath().endsWith("data.zip")) {
                    unzipFile(newFile.getAbsolutePath(), newFile.getParentFile().getAbsolutePath()
                            + File.separator + FilenameUtils.removeExtension(newFile.getName()));
                } else if (newFile.getAbsolutePath().endsWith(".zip")) {
                    unzipFile(newFile.getAbsolutePath(), newFile.getParentFile().getAbsolutePath());
                }
            }
        }
    }

    /**
     * Create new file from ZipEntry
     * @param destinationDir
     * @param zipEntry
     * @return Created File Path
     * @throws IOException
     */
    public static File newFile(File destinationDir, ZipEntry zipEntry) throws IOException {
        File destFile = new File(destinationDir, zipEntry.getName());

        String destDirPath = destinationDir.getCanonicalPath();
        String destFilePath = destFile.getCanonicalPath();

        if (!destFilePath.startsWith(destDirPath + File.separator)) {
            throw new IOException("Entry is outside of the target dir: " + zipEntry.getName());
        }

        return destFile;
    }

    public static boolean containsSubPath(Path someRealPath, Path subPathToCheck) {
        return someRealPath.normalize()
                .toString()
                .contains(subPathToCheck.normalize()
                        .toString());
    }

    /**
     * Verify Services
     * @param bundleContext Context
     * @param services List of Services to verify that is running
     * @throws InvalidSyntaxException
     * @throws InterruptedException
     */
    public static void verifyServices(BundleContext bundleContext, List<String> services) throws InvalidSyntaxException, InterruptedException {
        // Verify services have started
        for (String service : services) {
            ServiceReference<?>[] refs = bundleContext.getAllServiceReferences(null, service);
            int count = 0;
            // retry every 10 seconds to find service
            while (refs == null && count < 2) {
                TimeUnit.SECONDS.sleep(10);
                refs = bundleContext.getAllServiceReferences(null, service);
                count++;
                LOGGER.debug(String.format("Retry finding service: %s", service));
            }
            if (refs == null) {
                LOGGER.debug("Could not find service " + service);
            }
        }
    }

    public static void out(String msg, Logger logger) {
        logger.info(msg);
        System.out.println(msg);
    }

    public static void error(String msg, Logger logger) {
        logger.error(msg);
        System.out.println(msg);
    }

    public static void error(String msg, Exception ex, Logger logger) {
        logger.error(msg, ex);
        System.out.println(msg);
    }

    public static void error(RestoreOperation operation, String msg, Exception ex, Logger logger) {
        logger.error(msg, ex);
        String versionRange;
        try {
            versionRange = operation.getVersionRange().toString();
        } catch (InvalidVersionSpecificationException e) {
            versionRange = "undefined";
        }
        System.out.println(String.format("\nERROR: Operation %s with priority %s for versions %s,"
                + " with exception:", operation.getClass(), operation.getPriority(), versionRange));
        ex.printStackTrace();
        System.out.println();
    }
}
